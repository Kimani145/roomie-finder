import { useEffect, useState, useCallback } from 'react'
import { fetchWithAuth } from '@/services/apiClient'
import { logger } from '@/utils/logger'

export interface RecommendedListingItem {
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

export interface RecommendedRoommateItem {
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

export function useRecommendations() {
  const [recommendedListings, setRecommendedListings] = useState<RecommendedListingItem[]>([])
  const [recommendedRoommates, setRecommendedRoommates] = useState<RecommendedRoommateItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true)
      const [listingsData, roommatesData] = await Promise.all([
        fetchWithAuth('/api/v1/recommendations/listings?limit=6').catch(() => ({ recommendations: [] })),
        fetchWithAuth('/api/v1/recommendations/roommates?limit=6').catch(() => ({ recommendations: [] })),
      ])
      setRecommendedListings(listingsData.recommendations ?? [])
      setRecommendedRoommates(roommatesData.recommendations ?? [])
    } catch (err) {
      logger.error('Failed to fetch recommendations:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  return {
    recommendedListings,
    recommendedRoommates,
    loading,
    refetch: fetchRecommendations,
  }
}
