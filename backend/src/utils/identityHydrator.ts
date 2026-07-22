import { adminDb } from '../config/firebase'

export interface UserIdentity {
  uid: string
  displayName: string
  email: string
  role: string
  photoURL?: string | null
  status: string
}

/**
 * High-performance batch utility to resolve a list of UIDs into rich UserIdentity objects.
 * Prevents N+1 database queries by deduplicating input UIDs and querying profiles/admins in parallel.
 */
export async function hydrateUserIdentities(
  uids: (string | undefined | null)[]
): Promise<Map<string, UserIdentity>> {
  const uniqueUids = Array.from(new Set(uids.filter((u): u is string => Boolean(u))))
  const identityMap = new Map<string, UserIdentity>()

  if (uniqueUids.length === 0) return identityMap

  await Promise.all(
    uniqueUids.map(async (uid) => {
      try {
        const profileDoc = await adminDb.collection('profiles').doc(uid).get()
        if (profileDoc.exists) {
          const data = profileDoc.data()!
          identityMap.set(uid, {
            uid,
            displayName: data.displayName || data.name || data.email?.split('@')[0] || `Student (${uid.slice(0, 5)})`,
            email: data.email || '',
            role: data.role || 'SEEKER',
            photoURL: data.photoURL || null,
            status: data.status || 'active',
          })
          return
        }

        const adminDoc = await adminDb.collection('admins').doc(uid).get()
        if (adminDoc.exists) {
          const data = adminDoc.data()!
          identityMap.set(uid, {
            uid,
            displayName: data.displayName || data.email?.split('@')[0] || `Admin (${uid.slice(0, 5)})`,
            email: data.email || '',
            role: data.systemRole || 'ADMIN',
            photoURL: data.photoURL || null,
            status: data.status || 'active',
          })
          return
        }

        identityMap.set(uid, {
          uid,
          displayName: `User (${uid.slice(0, 6)})`,
          email: '',
          role: 'USER',
          photoURL: null,
          status: 'unknown',
        })
      } catch {
        identityMap.set(uid, {
          uid,
          displayName: `User (${uid.slice(0, 6)})`,
          email: '',
          role: 'USER',
          photoURL: null,
          status: 'unknown',
        })
      }
    })
  )

  return identityMap
}
