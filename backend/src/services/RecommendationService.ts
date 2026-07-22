import { adminDb } from '../config/firebase'
import { logger } from '../utils/logger'

export interface RecommendationReason {
  label: string
  matched: boolean
}

export interface RecommendedListing {
  id: string
  title: string
  zone: string
  rentAmount: number
  roommateShare: number
  hostId: string
  images: string[]
  score: number
  reasons: string[]
}

export interface RecommendedRoommate {
  uid: string
  displayName: string
  photoURL?: string
  role: string
  courseYear?: string
  zones: string[]
  minBudget: number
  maxBudget: number
  score: number
  reasons: string[]
}

export class RecommendationService {
  async getRecommendedListings(userId: string, limit: number = 10): Promise<RecommendedListing[]> {
    try {
      const userDoc = await adminDb.collection('profiles').doc(userId).get()
      if (!userDoc.exists) return []

      const user = userDoc.data()!
      const userZones: string[] = user.zones || []
      const userMinBudget = user.minBudget || 0
      const userMaxBudget = user.maxBudget || 100000

      const listingsSnap = await adminDb
        .collection('listings')
        .where('status', '==', 'active')
        .limit(50)
        .get()

      const scoredListings: RecommendedListing[] = []

      for (const doc of listingsSnap.docs) {
        const data = doc.data()
        if (data.hostId === userId) continue // Don't recommend own listing

        let score = 50 // Base score
        const reasons: string[] = []

        // Budget Fit
        const rent = data.roommateShare || data.rentAmount || 0
        if (rent >= userMinBudget && rent <= userMaxBudget) {
          score += 25
          reasons.push(`Fits your budget (KSh ${rent.toLocaleString()})`)
        }

        // Zone Match
        if (userZones.includes(data.zone)) {
          score += 20
          reasons.push(`Located in preferred zone (${data.zone})`)
        }

        // Featured Boost
        if (data.isFeatured) {
          score += 5
          reasons.push('Featured listing')
        }

        scoredListings.push({
          id: doc.id,
          title: data.title || 'Accommodation Listing',
          zone: data.zone || 'Nairobi',
          rentAmount: data.rentAmount || rent,
          roommateShare: rent,
          hostId: data.hostId || '',
          images: data.images || data.photos || [],
          score: Math.min(100, score),
          reasons,
        })
      }

      return scoredListings.sort((a, b) => b.score - a.score).slice(0, limit)
    } catch (error) {
      logger.error('Error fetching recommended listings:', error)
      return []
    }
  }

  async getRecommendedRoommates(userId: string, limit: number = 10): Promise<RecommendedRoommate[]> {
    try {
      const userDoc = await adminDb.collection('profiles').doc(userId).get()
      if (!userDoc.exists) return []

      const user = userDoc.data()!
      const userZones: string[] = user.zones || []
      const userMinBudget = user.minBudget || 0
      const userMaxBudget = user.maxBudget || 100000
      const userLifestyle = user.lifestyle || {}

      const profilesSnap = await adminDb
        .collection('profiles')
        .where('status', '==', 'active')
        .limit(50)
        .get()

      const scoredRoommates: RecommendedRoommate[] = []

      for (const doc of profilesSnap.docs) {
        if (doc.id === userId) continue // Skip self

        const data = doc.data()
        let score = 50
        const reasons: string[] = []

        // Budget Overlap
        const candMin = data.minBudget || 0
        const candMax = data.maxBudget || 100000
        if (userMinBudget <= candMax && userMaxBudget >= candMin) {
          score += 20
          reasons.push('Overlapping budget preferences')
        }

        // Zone Match
        const candZones: string[] = data.zones || []
        const commonZones = userZones.filter((z) => candZones.includes(z))
        if (commonZones.length > 0) {
          score += 15
          reasons.push(`Shared preferred zone (${commonZones.join(', ')})`)
        }

        // Lifestyle Match
        const candLifestyle = data.lifestyle || {}
        if (userLifestyle.sleepTime && userLifestyle.sleepTime === candLifestyle.sleepTime) {
          score += 10
          reasons.push(`Similar sleep schedule (${userLifestyle.sleepTime})`)
        }

        if (userLifestyle.cleanlinessLevel && userLifestyle.cleanlinessLevel === candLifestyle.cleanlinessLevel) {
          score += 10
          reasons.push(`Cleanliness alignment (${userLifestyle.cleanlinessLevel})`)
        }

        if (userLifestyle.studyStyle && userLifestyle.studyStyle === candLifestyle.studyStyle) {
          score += 5
          reasons.push(`Study style match (${userLifestyle.studyStyle})`)
        }

        scoredRoommates.push({
          uid: doc.id,
          displayName: data.displayName || 'Roommate Candidate',
          photoURL: data.photoURL || undefined,
          role: data.role || 'SEEKER',
          courseYear: data.courseYear || undefined,
          zones: candZones,
          minBudget: candMin,
          maxBudget: candMax,
          score: Math.min(100, score),
          reasons,
        })
      }

      return scoredRoommates.sort((a, b) => b.score - a.score).slice(0, limit)
    } catch (error) {
      logger.error('Error fetching recommended roommates:', error)
      return []
    }
  }
}

export const recommendationService = new RecommendationService()
