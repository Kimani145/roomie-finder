import { adminDb } from '../config/firebase'
import { Listing } from '../domain/models'

export class ListingRepository {
  private collection = adminDb.collection('listings')

  async getById(id: string): Promise<Listing | null> {
    const doc = await this.collection.doc(id).get()
    if (!doc.exists) return null
    return Listing.fromFirestore(doc.id, doc.data())
  }

  async save(listing: Listing): Promise<void> {
    await this.collection.doc(listing.id).set(listing.toJSON(), { merge: true })
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete()
  }

  async getListingsByHost(hostId: string): Promise<Listing[]> {
    const snapshot = await this.collection.where('hostId', '==', hostId).get()
    return snapshot.docs.map(doc => Listing.fromFirestore(doc.id, doc.data()))
  }
}

export const listingRepository = new ListingRepository()
