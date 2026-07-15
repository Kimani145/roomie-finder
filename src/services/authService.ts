import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  sendEmailVerification,
  type User,
  type UserCredential,
  type Unsubscribe,
  type AuthError as FirebaseAuthError,
} from 'firebase/auth'
import { auth } from './firebase'
import { CommunicationService } from './communications/CommunicationService'
import { logger } from '@/utils/logger'


// ─── Allowed TUK Domains ──────────────────────────────────────────────────────
const ALLOWED_DOMAINS = ['students.tukenya.ac.ke', 'tukenya.ac.ke']

export function isValidTukEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return ALLOWED_DOMAINS.includes(domain)
}

// ─── Error Types ──────────────────────────────────────────────────────────────
export type AuthServiceError = {
  code: string
  message: string
}

function toAuthServiceError(error: unknown): AuthServiceError {
  const firebaseError = error as FirebaseAuthError
  if (firebaseError?.code) {
    return {
      code: firebaseError.code,
      message: firebaseError.message,
    }
  }

  return {
    code: 'auth/unknown',
    message: 'An unknown authentication error occurred.',
  }
}

async function ensurePersistence() {
  await setPersistence(auth, browserLocalPersistence)
}

async function triggerVerificationEmail(user: User): Promise<void> {
  const isEmulator = import.meta.env.VITE_USE_EMULATOR === 'true'
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID

  // Always invoke Firebase client method so that backend registers the verification intention
  await sendEmailVerification(user)

  if (isEmulator && projectId) {
    try {
      // Delay slightly for the emulator db to populate
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      const response = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/oobCodes`)
      if (response.ok) {
        const data = await response.json()
        const latestCode = data.oobCodes
          ?.filter((c: any) => c.email === user.email && c.requestType === 'VERIFY_EMAIL')
          ?.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))[0]

        if (latestCode?.oobLink) {
          const res = await CommunicationService.sendVerification(
            user.email!,
            undefined, // Verification uses direct link/OTP option
            latestCode.oobLink,
            user.displayName || undefined
          )
          if (!res.success) {
            logger.error('Failed to send verification email.')
          }
          return
        }
      }
    } catch (err) {
      logger.warn('Failed to intercept verification code from Firebase Auth Emulator.')
    }
  }

  // Production or fallback warning/audit
  await CommunicationService.sendSecurityAlert(
    user.email!,
    'A verification link has been sent to your institutional email to verify your Roomie Finder account. Please click the link to verify.',
    {
      browser: navigator.userAgent,
      device: navigator.platform || 'Web App',
    },
    user.displayName || undefined
  )
}

// ─── Register (with email verification) ───────────────────────────────────────
export async function registerUser(
  email: string,
  password: string
): Promise<User> {
  try {
    await ensurePersistence()
    const result: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
    // Send verification email immediately after registration
    await triggerVerificationEmail(result.user)
    return result.user
  } catch (error) {
    throw toAuthServiceError(error)
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function loginUser(
  email: string,
  password: string
): Promise<User> {
  try {
    await ensurePersistence()
    const result: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    )
    return result.user
  } catch (error) {
    throw toAuthServiceError(error)
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error) {
    throw toAuthServiceError(error)
  }
}

// ─── Resend Verification Email ────────────────────────────────────────────────
export async function resendVerificationEmail(user: User): Promise<void> {
  try {
    await triggerVerificationEmail(user)
  } catch (error) {
    throw toAuthServiceError(error)
  }
}

// ─── Reload User & Force Token Refresh ────────────────────────────────────────
/**
 * Firebase does NOT auto-update the auth object after email verification.
 * We must: 1) reload() to fetch latest server state, 2) getIdToken(true)
 * to force a token refresh so emailVerified propagates.
 */
export async function reloadAndRefreshUser(user: User): Promise<User> {
  try {
    await user.reload()
    await user.getIdToken(true) // force token refresh
    // Return the refreshed user from auth.currentUser
    return auth.currentUser!
  } catch (error) {
    throw toAuthServiceError(error)
  }
}

// ─── Auth State Listener ──────────────────────────────────────────────────────
export function onAuthStateChange(
  callback: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback)
}
