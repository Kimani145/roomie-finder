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
    await this.collection.doc(profile.uid).set(profile.toJSON(), { merge: true })
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
