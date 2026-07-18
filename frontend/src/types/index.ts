// ─── Zone Types ──────────────────────────────────────────────────────────────
export type Zone =
  | 'Ruiru'
  | 'Juja'
  | 'Kahawa'
  | 'Kahawa Sukari'
  | 'Thika'
  | 'Roysambu'
  | 'Kasarani'
  | 'South B'
  | 'Pangani'
  | 'Muthaiga'
  | 'Ngara'

// Convenience alias for TUK zones
export type TukZone = Zone

// ─── Marketplace Role Types ─────────────────────────────────────────────────
export type HousingRole = 'HOST' | 'SEEKER' | 'FLEX'

export const HOUSING_TYPES = [
  'Single Room',
  'Bedsitter',
  'Studio',
  'Double Room',
  '1 Bedroom',
  '2 Bedroom',
  '3 Bedroom',
] as const
export type HousingType = typeof HOUSING_TYPES[number]

// ─── Enum Types ───────────────────────────────────────────────────────────────
export type SleepTime = 'Early' | 'Late' | 'Flexible'
export type NoiseTolerance = 'Low' | 'Medium' | 'High'
export type GuestFrequency = 'Rare' | 'Sometimes' | 'Often'
export type CleanlinessLevel = 'Relaxed' | 'Moderate' | 'Strict'
export type StudyStyle = 'Silent' | 'Background noise ok'
export type RoomType = HousingType
export type Gender = 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say'

// ─── Account Lifecycle Status ─────────────────────────────────────────────────
// Single source of truth for account state. Replaces scattered boolean flags.
//
// Valid transitions:
//   email_unverified → active
//   active → warning → suspended → under_appeal → reinstated | banned
//   active → inactive | paused (legacy self-service states)
//   suspended → under_appeal → reinstated → active
//   suspended → banned (terminal for severe violations)
// ───────────────────────────────────────────────────────────────────────────────
export type AccountStatus =
  | 'email_unverified'
  | 'active'
  | 'inactive'          // legacy — kept for backward compat (user chose to deactivate)
  | 'paused'            // legacy — kept for backward compat (user chose to pause)
  | 'warning'
  | 'suspended'
  | 'under_appeal'
  | 'reinstated'
  | 'banned'

// ─── Administrator & System Identity ──────────────────────────────────────────
export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export interface AdminProfile {
  uid: string
  email: string
  systemRole: UserRole
  status: 'active' | 'disabled'
  invitedBy?: string
  invitedAt?: Date
  activatedAt?: Date
  twoFactorEnabled?: boolean
  lastActive?: Date
}

/**
 * @deprecated Use `AccountStatus` instead. Kept for backward compatibility
 * with existing code that references ProfileStatus.
 */
export type ProfileStatus = AccountStatus

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
  noPetsRequired: boolean
  mustHaveWiFi: boolean
  femaleOnly: boolean
  maleOnly: boolean
}

// ─── Core User Profile ────────────────────────────────────────────────────────
export interface UserProfile {
  uid: string
  displayName: string
  photoURL: string | null
  role: HousingRole
  gender: Gender
  age: number
  school: string
  courseYear: number

  // Budget
  minBudget: number
  maxBudget: number

  // Location (multi-zone — max 3)
  zones: TukZone[]
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
  bioQuote?: string
  moveInMonth?: string | null
  twoFactorEnabled?: boolean

  // Trust & Safety
  email?: string
  suspensionReason?: string
  suspensionDate?: string
}

// ─── Listings ─────────────────────────────────────────────────────────────────
export interface Listing {
  id: string
  hostId: string // References users/{uid}
  zone: TukZone
  housingType: HousingType
  rentTotal: number
  roommateShare: number
  amenities: string[]
  photos: string[]
  houseRules: {
    smokingAllowed: boolean
    petsAllowed: boolean
    guestPolicy: string
  }
  createdAt: string
  status: 'active' | 'paused' | 'filled'
  interestCount?: number
  viewCount?: number
}

// ─── Match Result ─────────────────────────────────────────────────────────────
export interface MatchResult {
  profile: UserProfile
  listing?: Listing
  compatibilityScore: number
  scoreBreakdown: ScoreBreakdown
  isExactMatch: boolean
}

export interface ScoreBreakdown {
  budgetOverlap: boolean
  zoneMatch: number
  zoneOverlapZones: TukZone[]
  sleepMatch: number
  cleanlinessMatch: number
  noiseMatch: number
  guestMatch: number
  studyMatch: number
  genderMatch: number
  smokingMatch: number
  alcoholMatch: number
  petsMatch: number
  smokingConflict: boolean
  alcoholConflict: boolean
  petsConflict: boolean
  totalScore: number
  matchedFactors: string[]
}

// ─── Discovery Filters ────────────────────────────────────────────────────────
export interface DiscoveryFilters {
  // Hard filters (server-side)
  zones: TukZone[] | null
  gender: Gender | null
  minBudget: number | null
  maxBudget: number | null
  courseYear: number | null
  moveInMonth: string | null

  // Soft filters (client-side)
  sleepTime: SleepTime | null
  cleanlinessLevel: CleanlinessLevel | null
  noiseTolerance: NoiseTolerance | null
  guestFrequency: GuestFrequency | null
  hideDealBreakerConflicts: boolean
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
  userA: string
  userB: string
  participants: [string, string]
  createdAt: Date
  status: 'pending' | 'matched' | 'archived'
  compatibilityVersion: number
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

// ─── Message Status & Lifecycle ───────────────────────────────────────────────
export type MessageStatus = 'LOCAL_PENDING' | 'SERVER_ACKNOWLEDGED' | 'FAILED'

export interface LocalMessage extends Message {
  status: MessageStatus
  tempId?: string
  failureReason?: string
}
