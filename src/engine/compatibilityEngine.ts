import type {
  UserProfile,
  DiscoveryFilters,
  MatchResult,
  ScoreBreakdown,
} from '@/types'

// ─── Scoring Weights ──────────────────────────────────────────────────────────
const SCORES = {
  ZONE_MATCH: 20,
  SLEEP_MATCH: 15,
  CLEANLINESS_MATCH: 20,
  NOISE_MATCH: 10,
  GUEST_MATCH: 10,
  STUDY_MATCH: 10,
  SMOKING_CONFLICT: -100, // eliminates candidate
  ALCOHOL_CONFLICT: -100, // eliminates candidate
} as const

// ─── Budget Overlap Check ─────────────────────────────────────────────────────
/**
 * Two budget ranges overlap when:
 *   userA.min <= userB.max  AND  userA.max >= userB.min
 */
export function budgetOverlaps(
  a: { min: number; max: number },
  b: { min: number; max: number }
): boolean {
  return a.min <= b.max && a.max >= b.min
}

// ─── Hard Constraint Check ────────────────────────────────────────────────────
/**
 * Returns true if the candidate is ELIMINATED by the viewer's deal breakers.
 */
export function isEliminated(
  viewer: UserProfile,
  candidate: UserProfile
): boolean {
  // Budget must overlap
  if (
    !budgetOverlaps(
      { min: viewer.minBudget, max: viewer.maxBudget },
      { min: candidate.minBudget, max: candidate.maxBudget }
    )
  ) {
    return true
  }

  // Smoking deal breaker
  if (viewer.dealBreakers.noSmokingRequired && candidate.lifestyle.smoking) {
    return true
  }

  // Alcohol deal breaker
  if (viewer.dealBreakers.noAlcoholRequired && candidate.lifestyle.alcohol) {
    return true
  }

  // Female-only requirement
  if (viewer.dealBreakers.femaleOnly && candidate.gender !== 'Female') {
    return true
  }

  // Male-only requirement
  if (viewer.dealBreakers.maleOnly && candidate.gender !== 'Male') {
    return true
  }

  // Candidate's own deal breakers against viewer
  if (candidate.dealBreakers.noSmokingRequired && viewer.lifestyle.smoking) {
    return true
  }
  if (candidate.dealBreakers.noAlcoholRequired && viewer.lifestyle.alcohol) {
    return true
  }
  if (candidate.dealBreakers.femaleOnly && viewer.gender !== 'Female') {
    return true
  }
  if (candidate.dealBreakers.maleOnly && viewer.gender !== 'Male') {
    return true
  }

  return false
}

// ─── Compatibility Score Calculator ──────────────────────────────────────────
export function calculateCompatibilityScore(
  viewer: UserProfile,
  candidate: UserProfile
): ScoreBreakdown {
  let total = 0

  const budgetOverlap = budgetOverlaps(
    { min: viewer.minBudget, max: viewer.maxBudget },
    { min: candidate.minBudget, max: candidate.maxBudget }
  )

  // Budget is mandatory — if no overlap score is 0
  if (!budgetOverlap) {
    return {
      budgetOverlap: false,
      zoneMatch: 0,
      sleepMatch: 0,
      cleanlinessMatch: 0,
      noiseMatch: 0,
      smokingConflict: false,
      alcoholConflict: false,
      totalScore: 0,
    }
  }

  // Smoking conflict check
  const smokingConflict =
    (viewer.dealBreakers.noSmokingRequired && candidate.lifestyle.smoking) ||
    (candidate.dealBreakers.noSmokingRequired && viewer.lifestyle.smoking)

  if (smokingConflict) {
    return {
      budgetOverlap: true,
      zoneMatch: 0,
      sleepMatch: 0,
      cleanlinessMatch: 0,
      noiseMatch: 0,
      smokingConflict: true,
      alcoholConflict: false,
      totalScore: SCORES.SMOKING_CONFLICT,
    }
  }

  // Alcohol conflict check
  const alcoholConflict =
    (viewer.dealBreakers.noAlcoholRequired && candidate.lifestyle.alcohol) ||
    (candidate.dealBreakers.noAlcoholRequired && viewer.lifestyle.alcohol)

  if (alcoholConflict) {
    return {
      budgetOverlap: true,
      zoneMatch: 0,
      sleepMatch: 0,
      cleanlinessMatch: 0,
      noiseMatch: 0,
      smokingConflict: false,
      alcoholConflict: true,
      totalScore: SCORES.ALCOHOL_CONFLICT,
    }
  }

  // Zone match
  const zoneMatch = viewer.zone === candidate.zone ? SCORES.ZONE_MATCH : 0
  total += zoneMatch

  // Sleep schedule match
  const sleepMatch =
    viewer.lifestyle.sleepTime === candidate.lifestyle.sleepTime ||
    viewer.lifestyle.sleepTime === 'Flexible' ||
    candidate.lifestyle.sleepTime === 'Flexible'
      ? SCORES.SLEEP_MATCH
      : 0
  total += sleepMatch

  // Cleanliness match
  const cleanlinessMatch =
    viewer.lifestyle.cleanlinessLevel === candidate.lifestyle.cleanlinessLevel
      ? SCORES.CLEANLINESS_MATCH
      : 0
  total += cleanlinessMatch

  // Noise tolerance match
  const noiseMatch =
    viewer.lifestyle.noiseTolerance === candidate.lifestyle.noiseTolerance
      ? SCORES.NOISE_MATCH
      : 0
  total += noiseMatch

  return {
    budgetOverlap: true,
    zoneMatch,
    sleepMatch,
    cleanlinessMatch,
    noiseMatch,
    smokingConflict: false,
    alcoholConflict: false,
    totalScore: total,
  }
}

// ─── Main Discovery Engine ────────────────────────────────────────────────────
/**
 * Takes a viewer's profile + a pool of candidates.
 * Eliminates hard constraint failures.
 * Scores and ranks remaining candidates.
 * Returns ranked MatchResult[].
 */
export function runDiscoveryEngine(
  viewer: UserProfile,
  candidates: UserProfile[]
): MatchResult[] {
  const results: MatchResult[] = []

  for (const candidate of candidates) {
    // Skip own profile
    if (candidate.uid === viewer.uid) continue

    // Skip inactive profiles
    if (candidate.status !== 'active') continue

    // Hard constraint elimination
    if (isEliminated(viewer, candidate)) continue

    const scoreBreakdown = calculateCompatibilityScore(viewer, candidate)

    // Eliminate negative scores (deal breaker conflicts)
    if (scoreBreakdown.totalScore < 0) continue

    results.push({
      profile: candidate,
      compatibilityScore: scoreBreakdown.totalScore,
      scoreBreakdown,
      isExactMatch: scoreBreakdown.totalScore >= 60,
    })
  }

  // Sort by compatibility DESC, then by lastActive DESC
  return results.sort((a, b) => {
    if (b.compatibilityScore !== a.compatibilityScore) {
      return b.compatibilityScore - a.compatibilityScore
    }
    return (
      new Date(b.profile.lastActive).getTime() -
      new Date(a.profile.lastActive).getTime()
    )
  })
}

// ─── Zero Results Fallback (Relax Filters) ────────────────────────────────────
/**
 * When no results are found with strict filters,
 * progressively relax soft filter constraints.
 */
export function runRelaxedDiscovery(
  viewer: UserProfile,
  candidates: UserProfile[],
  filters: DiscoveryFilters
): { results: MatchResult[]; relaxedFilters: Partial<DiscoveryFilters> } {
  // Try relaxing lifestyle filters one by one
  const relaxOrder: Array<keyof DiscoveryFilters> = [
    'noiseTolerance',
    'guestFrequency',
    'sleepTime',
    'cleanlinessLevel',
  ]

  let relaxedFilters: Partial<DiscoveryFilters> = {}
  let results: MatchResult[] = []

  for (const filterKey of relaxOrder) {
    relaxedFilters = { ...relaxedFilters, [filterKey]: null }
    const relaxedViewer = applyRelaxedProfile(viewer, relaxedFilters)
    results = runDiscoveryEngine(relaxedViewer, candidates)

    if (results.length > 0) break
  }

  return { results, relaxedFilters }
}

/**
 * Temporarily neutralises specific lifestyle preferences
 * so they don't affect scoring — used for relaxed discovery.
 */
function applyRelaxedProfile(
  viewer: UserProfile,
  relaxed: Partial<DiscoveryFilters>
): UserProfile {
  return {
    ...viewer,
    lifestyle: {
      ...viewer.lifestyle,
      ...(relaxed.sleepTime === null ? { sleepTime: 'Flexible' } : {}),
    },
  }
}

// ─── Compatibility Percentage ─────────────────────────────────────────────────
/** Maximum possible score when all soft criteria match */
const MAX_SCORE =
  SCORES.ZONE_MATCH +
  SCORES.SLEEP_MATCH +
  SCORES.CLEANLINESS_MATCH +
  SCORES.NOISE_MATCH +
  SCORES.GUEST_MATCH +
  SCORES.STUDY_MATCH

export function getCompatibilityPercentage(score: number): number {
  return Math.min(100, Math.round((score / MAX_SCORE) * 100))
}
