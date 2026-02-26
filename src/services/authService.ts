import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type User,
  type UserCredential,
  type Unsubscribe,
  type AuthError as FirebaseAuthError,
} from 'firebase/auth'
import { auth } from './firebase'

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
    return result.user
  } catch (error) {
    throw toAuthServiceError(error)
  }
}

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

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error) {
    throw toAuthServiceError(error)
  }
}

export function onAuthStateChange(
  callback: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback)
}
