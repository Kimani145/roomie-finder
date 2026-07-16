import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from './config'
import { TUK_ZONES } from '@/constants/zones'
import type { TukZone } from '@/types'

const ZONES_COLLECTION = 'zones'

interface ZoneDoc {
  name?: string
}

export async function fetchAvailableZones(): Promise<TukZone[]> {
  try {
    const q = query(collection(db, ZONES_COLLECTION), orderBy('name', 'asc'))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return TUK_ZONES
    }

    const zones = snapshot.docs
      .map((docRef) => (docRef.data() as ZoneDoc).name)
      .filter((zone): zone is TukZone => Boolean(zone && TUK_ZONES.includes(zone as TukZone)))

    return zones.length > 0 ? zones : TUK_ZONES
  } catch {
    return TUK_ZONES
  }
}
