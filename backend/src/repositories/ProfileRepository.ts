import { adminDb } from '../config/firebase'
import { Profile } from '../domain/models'

export class ProfileRepository {
  private collection = adminDb.collection('profiles')

  async getById(uid: string): Promise<Profile | null> {
    const doc = await this.collection.doc(uid).get()
    if (!doc.exists) return null
    return Profile.fromFirestore(doc.id, doc.data())
  }

  async save(profile: Profile): Promise<void> {
    const batch = adminDb.batch()

    const profileRef = this.collection.doc(profile.uid)
    const previewRef = adminDb.collection('profilePreviews').doc(profile.uid)
    const userRef = adminDb.collection('users').doc(profile.uid)

    const profileData = profile.toJSON()

    const previewPayload: Record<string, any> = {
      uid: profile.uid,
      displayName: profile.displayName || '',
      photoURL: profileData.photoURL || '',
      role: profile.role,
      zones: profileData.zones || [],
      ...(profileData.bioQuote ? { bioQuote: profileData.bioQuote } : {}),
    }

    batch.set(profileRef, profileData, { merge: true })
    batch.set(previewRef, previewPayload, { merge: true })
    batch.set(
      userRef,
      {
        role: profile.role,
        profileCompleted: true,
        updatedAt: new Date(),
      },
      { merge: true }
    )

    await batch.commit()
  }

  async delete(uid: string): Promise<void> {
    await this.collection.doc(uid).delete()
  }

  async getProfilesByStatus(status: string, limit: number = 50): Promise<Profile[]> {
    const snapshot = await this.collection
      .where('status', '==', status)
      .limit(limit)
      .get()
    return snapshot.docs.map(doc => Profile.fromFirestore(doc.id, doc.data()))
  }
}

export const profileRepository = new ProfileRepository()
