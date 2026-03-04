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
  console.info('[compatibilityEngine] Running calculation for candidate:', candidate.uid);
  let total = 0
  const matchedFactors: string[] = []

  const budgetOverlap = budgetOverlaps(
    { min: viewer.minBudget, max: viewer.maxBudget },
    { min: candidate.minBudget, max: candidate.maxBudget }
  )

  // Budget is mandatory — if no overlap score is 0
  if (!budgetOverlap) {
    return {
      budgetOverlap: false,
      zoneMatch: 0,
      zoneOverlapZones: [],
      sleepMatch: 0,
      cleanlinessMatch: 0,
      noiseMatch: 0,
      guestMatch: 0,
      studyMatch: 0,
      smokingConflict: false,
      alcoholConflict: false,
      totalScore: 0,
      matchedFactors: [],
    }
  }

  matchedFactors.push(
    `Budget overlap: ${Math.max(viewer.minBudget, candidate.minBudget)}-${Math.min(viewer.maxBudget, candidate.maxBudget)}`
  )

  // Smoking conflict check
  const smokingConflict =
    (viewer.dealBreakers.noSmokingRequired && candidate.lifestyle.smoking) ||
    (candidate.dealBreakers.noSmokingRequired && viewer.lifestyle.smoking)

  if (smokingConflict) {
    return {
      budgetOverlap: true,
      zoneMatch: 0,
      zoneOverlapZones: [],
      sleepMatch: 0,
      cleanlinessMatch: 0,
      noiseMatch: 0,
      guestMatch: 0,
      studyMatch: 0,
      smokingConflict: true,
      alcoholConflict: false,
      totalScore: SCORES.SMOKING_CONFLICT,
      matchedFactors,
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
      zoneOverlapZones: [],
      sleepMatch: 0,
      cleanlinessMatch: 0,
      noiseMatch: 0,
      guestMatch: 0,
      studyMatch: 0,
      smokingConflict: false,
      alcoholConflict: true,
      totalScore: SCORES.ALCOHOL_CONFLICT,
      matchedFactors,
    }
  }

  // Zone match — overlap between two zone arrays
  const zoneOverlapZones = viewer.zones.filter((z) => candidate.zones.includes(z))
  const zoneMatch = zoneOverlapZones.length > 0 ? SCORES.ZONE_MATCH : 0
  total += zoneMatch
  if (zoneOverlapZones.length > 0) {
    matchedFactors.push(`Zone overlap: ${zoneOverlapZones.join(', ')}`)
  }

  // Sleep schedule match
  const sleepMatch =
    viewer.lifestyle.sleepTime === candidate.lifestyle.sleepTime ||
    viewer.lifestyle.sleepTime === 'Flexible' ||
    candidate.lifestyle.sleepTime === 'Flexible'
      ? SCORES.SLEEP_MATCH
      : 0
  total += sleepMatch
  if (sleepMatch > 0) {
    matchedFactors.push(
      `Sleep schedule overlap: ${viewer.lifestyle.sleepTime}/${candidate.lifestyle.sleepTime}`
    )
  }

  // Cleanliness match
  const cleanlinessMatch =
    viewer.lifestyle.cleanlinessLevel === candidate.lifestyle.cleanlinessLevel
      ? SCORES.CLEANLINESS_MATCH
      : 0
  total += cleanlinessMatch
  if (cleanlinessMatch > 0) {
    matchedFactors.push(
      `Cleanliness alignment: ${candidate.lifestyle.cleanlinessLevel}`
    )
  }

  // Noise tolerance match
  const noiseMatch =
    viewer.lifestyle.noiseTolerance === candidate.lifestyle.noiseTolerance
      ? SCORES.NOISE_MATCH
      : 0
  total += noiseMatch

  if (noiseMatch > 0) {
    matchedFactors.push(
      `Noise tolerance match: ${candidate.lifestyle.noiseTolerance}`
    )
  }

  const guestMatch =
    viewer.lifestyle.guestFrequency === candidate.lifestyle.guestFrequency
      ? SCORES.GUEST_MATCH
      : 0
  total += guestMatch
  if (guestMatch > 0) {
    matchedFactors.push(
      `Guest frequency match: ${candidate.lifestyle.guestFrequency}`
    )
  }

  const studyMatch =
    viewer.lifestyle.studyStyle === candidate.lifestyle.studyStyle
      ? SCORES.STUDY_MATCH
      : 0
  total += studyMatch
  if (studyMatch > 0) {
    matchedFactors.push(`Study style match: ${candidate.lifestyle.studyStyle}`)
  }

  return {
    budgetOverlap: true,
    zoneMatch,
    zoneOverlapZones,
    sleepMatch,
    cleanlinessMatch,
    noiseMatch,
    guestMatch,
    studyMatch,
    smokingConflict: false,
    alcoholConflict: false,
    totalScore: total,
    matchedFactors,
  }
}

function hasDealBreakerConflict(viewer: UserProfile, candidate: UserProfile): boolean {
  return (
    (viewer.dealBreakers.noSmokingRequired && candidate.lifestyle.smoking) ||
    (viewer.dealBreakers.noAlcoholRequired && candidate.lifestyle.alcohol) ||
    (viewer.dealBreakers.femaleOnly && candidate.gender !== 'Female') ||
    (viewer.dealBreakers.maleOnly && candidate.gender !== 'Male') ||
    (candidate.dealBreakers.noSmokingRequired && viewer.lifestyle.smoking) ||
    (candidate.dealBreakers.noAlcoholRequired && viewer.lifestyle.alcohol) ||
    (candidate.dealBreakers.femaleOnly && viewer.gender !== 'Female') ||
    (candidate.dealBreakers.maleOnly && viewer.gender !== 'Male')
  )
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
  candidates: UserProfile[],
  filters?: DiscoveryFilters
): MatchResult[] {
  const results: MatchResult[] = []

  for (const candidate of candidates) {
    // Skip own profile
    if (candidate.uid === viewer.uid) continue

    // Skip inactive profiles
    if (candidate.status !== 'active') continue

    if (filters?.gender && candidate.gender !== filters.gender) continue
    if (filters?.courseYear && candidate.courseYear !== filters.courseYear) continue
    if (filters?.moveInMonth && candidate.moveInMonth !== filters.moveInMonth) continue

    const shouldHideConflict = filters?.hideDealBreakerConflicts !== false
    if (shouldHideConflict && hasDealBreakerConflict(viewer, candidate)) continue

    if (
      !budgetOverlaps(
        { min: viewer.minBudget, max: viewer.maxBudget },
        { min: candidate.minBudget, max: candidate.maxBudget }
      )
    ) {
      continue
    }

    const scoreBreakdown = calculateCompatibilityScore(viewer, candidate)

    // Eliminate negative scores (deal breaker conflicts)
    if (scoreBreakdown.totalScore < 0 && shouldHideConflict) continue

    if (filters?.sleepTime && candidate.lifestyle.sleepTime !== filters.sleepTime) {
      continue
    }
    if (
      filters?.cleanlinessLevel &&
      candidate.lifestyle.cleanlinessLevel !== filters.cleanlinessLevel
    ) {
      continue
    }
    if (
      filters?.noiseTolerance &&
      candidate.lifestyle.noiseTolerance !== filters.noiseTolerance
    ) {
      continue
    }
    if (
      filters?.guestFrequency &&
      candidate.lifestyle.guestFrequency !== filters.guestFrequency
    ) {
      continue
    }

    const normalizedScore = Math.max(0, scoreBreakdown.totalScore)

    results.push({
      profile: candidate,
      compatibilityScore: normalizedScore,
      scoreBreakdown,
      isExactMatch: normalizedScore >= 60,
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
    results = runDiscoveryEngine(relaxedViewer, candidates, {
      ...filters,
      ...relaxedFilters,
    })

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
