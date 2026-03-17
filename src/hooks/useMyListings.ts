import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { Listing } from '@/types'

function docToListing(data: Record<string, unknown>, id: string): Listing {
  const houseRules = (data.houseRules as Record<string, unknown>) ?? {}
  return {
    id,
    hostId: String(data.hostId ?? ''),
    zone: data.zone as Listing['zone'],
    housingType: data.housingType as Listing['housingType'],
    rentTotal: Number(data.rentTotal ?? 0),
    roommateShare: Number(data.roommateShare ?? 0),
    amenities: Array.isArray(data.amenities) ? (data.amenities as string[]) : [],
    photos: Array.isArray(data.photos) ? (data.photos as string[]) : [],
    houseRules: {
      smokingAllowed: !!houseRules.smokingAllowed,
      petsAllowed: !!houseRules.petsAllowed,
      guestPolicy: String(houseRules.guestPolicy ?? ''),
    },
    createdAt:
      typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    status: (data.status as Listing['status']) ?? 'active',
  }
}

export function useMyListings(uid: string | undefined) {
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setMyListings([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const q = query(collection(db, 'listings'), where('hostId', '==', uid))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listings: Listing[] = []
      snapshot.forEach((docSnap) => {
        listings.push(docToListing(docSnap.data(), docSnap.id))
      })
      setMyListings(listings)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [uid])

  return { myListings, isLoading }
}
