import { adminDb } from '../config/firebase'
import { Match } from '../domain/models'
import { FieldValue } from 'firebase-admin/firestore'

export class MatchRepository {
  private collection = adminDb.collection('matches')

  async getById(id: string): Promise<Match | null> {
    const doc = await this.collection.doc(id).get()
    if (!doc.exists) return null
    return Match.fromFirestore(doc.id, doc.data())
  }

  async save(match: Match): Promise<void> {
    await this.collection.doc(match.id).set(match.toJSON(), { merge: true })
  }

  async findExistingMatch(userA: string, userB: string): Promise<Match | null> {
    const sorted = [userA, userB].sort()
    const id = `${sorted[0]}_${sorted[1]}`
    return this.getById(id)
  }
}

export const matchRepository = new MatchRepository()
