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
import { logger } from '@/utils/logger'
import { fetchApi } from '@/services/apiClient'


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
  try {
    const response = await fetchApi('/auth/email-verification', {
      method: 'POST',
      body: JSON.stringify({ email: user.email }),
    })

    if (!response.success) {
      throw new Error(response.message || 'Unknown error')
    }
  } catch (err) {
    logger.error('Failed to trigger verification email via backend', err)
    // Fallback to client-side verification if backend fails
    await sendEmailVerification(user).catch((e) => {
      logger.error('Client-side fallback verification also failed', e)
    })
  }
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
