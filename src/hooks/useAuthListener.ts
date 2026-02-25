import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { getUserProfile } from '@/firebase/profiles'
import { useAuthStore } from '@/store/authStore'

/**
 * Listens to Firebase Auth state changes.
 *
 * Three outcomes:
 *   1. Firebase user + Firestore profile found  → setCurrentUser(profile)
 *   2. Firebase user + NO Firestore profile     → setNeedsOnboarding(true)
 *      (authenticated but onboarding incomplete — must not reach discovery)
 *   3. No Firebase user / error                 → clearAuth()
 */
export function useAuthListener() {
  const { setCurrentUser, setNeedsOnboarding, setLoading, clearAuth } =
    useAuthStore()

  useEffect(() => {
    setLoading(true)

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        clearAuth()
        return
      }

      try {
        const profile = await getUserProfile(firebaseUser.uid)

        if (profile) {
          // Full profile exists — user is ready for discovery
          setCurrentUser(profile)
        } else {
          // Auth session exists but no Firestore profile yet
          // Mark as needing onboarding — do NOT clear auth
          setNeedsOnboarding(true)
        }
      } catch (err) {
        console.error('Failed to load user profile:', err)
        clearAuth()
      }
    })

    return () => unsubscribe()
  }, [setCurrentUser, setNeedsOnboarding, setLoading, clearAuth])
}
