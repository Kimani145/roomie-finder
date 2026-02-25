// ─── Zone Types ──────────────────────────────────────────────────────────────
export type Zone = 'Ruiru' | 'Juja' | 'Kahawa' | 'Thika' | 'Roysambu' | 'Kasarani'

// ─── Enum Types ───────────────────────────────────────────────────────────────
export type SleepTime = 'Early' | 'Late' | 'Flexible'
export type NoiseTolerance = 'Low' | 'Medium' | 'High'
export type GuestFrequency = 'Rare' | 'Sometimes' | 'Often'
export type CleanlinessLevel = 'Relaxed' | 'Moderate' | 'Strict'
export type StudyStyle = 'Silent' | 'Background noise ok'
export type RoomType = 'Single Room' | 'Bedsitter' | '1 Bedroom' | 'Shared Hostel'
export type Gender = 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say'
export type ProfileStatus = 'active' | 'inactive' | 'paused'

// ─── Lifestyle Profile ────────────────────────────────────────────────────────
export interface LifestyleProfile {
  sleepTime: SleepTime
  noiseTolerance: NoiseTolerance
  guestFrequency: GuestFrequency
  cleanlinessLevel: CleanlinessLevel
  studyStyle: StudyStyle
  smoking: boolean
  alcohol: boolean
}

// ─── Deal Breakers (Hard Constraints) ────────────────────────────────────────
export interface DealBreakers {
  noSmokingRequired: boolean
  noAlcoholRequired: boolean
  mustHaveWiFi: boolean
  femaleOnly: boolean
  maleOnly: boolean
}

// ─── Core User Profile ────────────────────────────────────────────────────────
export interface UserProfile {
  uid: string
  displayName: string
  photoURL: string | null
  gender: Gender
  age: number
  school: string
  courseYear: number

  // Budget
  minBudget: number
  maxBudget: number

  // Location
  zone: Zone
  preferredRoomType: RoomType

  // Lifestyle
  lifestyle: LifestyleProfile

  // Hard Constraints
  dealBreakers: DealBreakers

  // Meta
  status: ProfileStatus
  lastActive: Date
  createdAt: Date
  bio: string
}

// ─── Match Result ─────────────────────────────────────────────────────────────
export interface MatchResult {
  profile: UserProfile
  compatibilityScore: number
  scoreBreakdown: ScoreBreakdown
  isExactMatch: boolean
}

export interface ScoreBreakdown {
  budgetOverlap: boolean
  zoneMatch: number
  sleepMatch: number
  cleanlinessMatch: number
  noiseMatch: number
  smokingConflict: boolean
  alcoholConflict: boolean
  totalScore: number
}

// ─── Discovery Filters ────────────────────────────────────────────────────────
export interface DiscoveryFilters {
  // Hard filters (server-side)
  zone: Zone | null
  gender: Gender | null
  minBudget: number | null
  maxBudget: number | null

  // Soft filters (client-side)
  sleepTime: SleepTime | null
  cleanlinessLevel: CleanlinessLevel | null
  noiseTolerance: NoiseTolerance | null
  guestFrequency: GuestFrequency | null
  noSmokingRequired: boolean
  noAlcoholRequired: boolean
}

// ─── Match / Like System ──────────────────────────────────────────────────────
export interface Like {
  fromUid: string
  toUid: string
  createdAt: Date
}

export interface Match {
  id: string
  participants: [string, string]
  createdAt: Date
  chatUnlocked: boolean
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export interface Message {
  id: string
  matchId: string
  senderUid: string
  text: string
  createdAt: Date
  read: boolean
}
