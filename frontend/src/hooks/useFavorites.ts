import { useEffect, useState, useCallback } from 'react'
import { fetchWithAuth } from '@/services/apiClient'
import { logger } from '@/utils/logger'
import toast from 'react-hot-toast'

export interface FavoriteItem {
  id: string
  targetType: 'listing' | 'profile'
  targetId: string
  createdAt?: string | null
  targetData?: Record<string, any>
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchWithAuth('/api/v1/favorites')
      setFavorites(data.favorites ?? [])
    } catch (err) {
      logger.error('Failed to fetch favorites:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const isFavorite = useCallback(
    (targetType: 'listing' | 'profile', targetId: string) => {
      return favorites.some((f) => f.targetType === targetType && f.targetId === targetId)
    },
    [favorites]
  )

  const toggleFavorite = async (targetType: 'listing' | 'profile', targetId: string) => {
    const currentlySaved = isFavorite(targetType, targetId)
    if (currentlySaved) {
      try {
        await fetchWithAuth(`/api/v1/favorites/${targetId}`, { method: 'DELETE' })
        setFavorites((prev) => prev.filter((f) => !(f.targetType === targetType && f.targetId === targetId)))
        toast.success(`Removed from saved ${targetType}s`)
      } catch (err) {
        logger.error('Failed to remove favorite:', err)
        toast.error('Failed to update wishlist')
      }
    } else {
      try {
        const data = await fetchWithAuth('/api/v1/favorites', {
          method: 'POST',
          body: JSON.stringify({ targetType, targetId }),
        })
        setFavorites((prev) => [
          ...prev,
          {
            id: data.favoriteId,
            targetType,
            targetId,
            createdAt: new Date().toISOString(),
          },
        ])
        toast.success(`Saved to your wishlist!`)
      } catch (err) {
        logger.error('Failed to add favorite:', err)
        toast.error('Failed to save item')
      }
    }
  }

  const removeFavorite = async (id: string) => {
    try {
      await fetchWithAuth(`/api/v1/favorites/${id}`, { method: 'DELETE' })
      setFavorites((prev) => prev.filter((f) => f.id !== id && f.targetId !== id))
      toast.success('Removed from wishlist')
    } catch (err) {
      logger.error('Failed to remove favorite:', err)
      toast.error('Failed to remove item')
    }
  }

  return {
    favorites,
    loading,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    refetch: fetchFavorites,
  }
}
