import type {
  UserProfile,
  DiscoveryFilters,
  MatchResult,
  ScoreBreakdown,
  Listing,
} from '@/types'

const SOCIAL_SCORES = {
  ZONE_MATCH: 20,
  SLEEP_MATCH: 15,
  CLEANLINESS_MATCH: 20,
  NOISE_MATCH: 10,
  GUEST_MATCH: 10,
  STUDY_MATCH: 10,
} as const

const HOUSING_SCORES = {
  BUDGET_FIT: 50,
  ZONE_MATCH: 30,
  RULE_COMPATIBILITY: 20,
} as const

const SOCIAL_MAX_SCORE =
  SOCIAL_SCORES.ZONE_MATCH +
  SOCIAL_SCORES.SLEEP_MATCH +
  SOCIAL_SCORES.CLEANLINESS_MATCH +
  SOCIAL_SCORES.NOISE_MATCH +
  SOCIAL_SCORES.GUEST_MATCH +
  SOCIAL_SCORES.STUDY_MATCH

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function toPercent(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0
  return clampScore((score / maxScore) * 100)
}

export function budgetOverlaps(
  a: { min: number; max: number },
  b: { min: number; max: number }
): boolean {
  return a.min <= b.max && a.max >= b.min
}

function listingBudgetFits(viewer: UserProfile, listing: Listing): boolean {
  return (
    listing.roommateShare >= viewer.minBudget &&
    listing.roommateShare <= viewer.maxBudget
  )
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

function calculateSocialScoreBreakdown(
  viewer: UserProfile,
  candidate: UserProfile
): ScoreBreakdown {
  let total = 0
  const matchedFactors: string[] = []

  const budgetOverlap = budgetOverlaps(
    { min: viewer.minBudget, max: viewer.maxBudget },
    { min: candidate.minBudget, max: candidate.maxBudget }
  )

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

  const smokingConflict =
    (viewer.dealBreakers.noSmokingRequired && candidate.lifestyle.smoking) ||
    (candidate.dealBreakers.noSmokingRequired && viewer.lifestyle.smoking)
  const alcoholConflict =
    (viewer.dealBreakers.noAlcoholRequired && candidate.lifestyle.alcohol) ||
    (candidate.dealBreakers.noAlcoholRequired && viewer.lifestyle.alcohol)

  if (smokingConflict || alcoholConflict) {
    return {
      budgetOverlap: true,
      zoneMatch: 0,
      zoneOverlapZones: [],
      sleepMatch: 0,
      cleanlinessMatch: 0,
      noiseMatch: 0,
      guestMatch: 0,
      studyMatch: 0,
      smokingConflict,
      alcoholConflict,
      totalScore: 0,
      matchedFactors,
    }
  }

  const zoneOverlapZones = viewer.zones.filter((zone) => candidate.zones.includes(zone))
  const zoneMatch = zoneOverlapZones.length > 0 ? SOCIAL_SCORES.ZONE_MATCH : 0
  total += zoneMatch
  if (zoneMatch > 0) matchedFactors.push(`Zone overlap: ${zoneOverlapZones.join(', ')}`)

  const sleepMatch =
    viewer.lifestyle.sleepTime === candidate.lifestyle.sleepTime ||
    viewer.lifestyle.sleepTime === 'Flexible' ||
    candidate.lifestyle.sleepTime === 'Flexible'
      ? SOCIAL_SCORES.SLEEP_MATCH
      : 0
  total += sleepMatch
  if (sleepMatch > 0) {
    matchedFactors.push(
      `Sleep schedule overlap: ${viewer.lifestyle.sleepTime}/${candidate.lifestyle.sleepTime}`
    )
  }

  const cleanlinessMatch =
    viewer.lifestyle.cleanlinessLevel === candidate.lifestyle.cleanlinessLevel
      ? SOCIAL_SCORES.CLEANLINESS_MATCH
      : 0
  total += cleanlinessMatch
  if (cleanlinessMatch > 0) {
    matchedFactors.push(`Cleanliness alignment: ${candidate.lifestyle.cleanlinessLevel}`)
  }

  const noiseMatch =
    viewer.lifestyle.noiseTolerance === candidate.lifestyle.noiseTolerance
      ? SOCIAL_SCORES.NOISE_MATCH
      : 0
  total += noiseMatch
  if (noiseMatch > 0) {
    matchedFactors.push(`Noise tolerance match: ${candidate.lifestyle.noiseTolerance}`)
  }

  const guestMatch =
    viewer.lifestyle.guestFrequency === candidate.lifestyle.guestFrequency
      ? SOCIAL_SCORES.GUEST_MATCH
      : 0
  total += guestMatch
  if (guestMatch > 0) {
    matchedFactors.push(`Guest frequency match: ${candidate.lifestyle.guestFrequency}`)
  }

  const studyMatch =
    viewer.lifestyle.studyStyle === candidate.lifestyle.studyStyle
      ? SOCIAL_SCORES.STUDY_MATCH
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

function calculateHousingScore(
  viewer: UserProfile,
  listing: Listing
): { score: number; budgetFits: boolean; matchedFactors: string[] } {
  let score = 0
  const matchedFactors: string[] = []

  const budgetFits = listingBudgetFits(viewer, listing)
  if (budgetFits) {
    score += HOUSING_SCORES.BUDGET_FIT
    matchedFactors.push(`Listing budget fit: KES ${listing.roommateShare.toLocaleString()}`)
  }

  if (viewer.zones.includes(listing.zone)) {
    score += HOUSING_SCORES.ZONE_MATCH
    matchedFactors.push(`Listing zone match: ${listing.zone}`)
  }

  const smokingRuleConflict =
    viewer.dealBreakers.noSmokingRequired && listing.houseRules.smokingAllowed
  const wifiRuleConflict =
    viewer.dealBreakers.mustHaveWiFi &&
    !listing.amenities.some((amenity) => amenity.toLowerCase() === 'wifi')

  if (!smokingRuleConflict && !wifiRuleConflict) {
    score += HOUSING_SCORES.RULE_COMPATIBILITY
    matchedFactors.push('House rules compatible')
  } else {
    if (smokingRuleConflict) matchedFactors.push('Clash: smoking not acceptable')
    if (wifiRuleConflict) matchedFactors.push('Clash: WiFi required')
  }

  return {
    score: clampScore(score),
    budgetFits,
    matchedFactors,
  }
}

export function isEliminated(
  viewer: UserProfile,
  candidate: UserProfile
): boolean {
  if (
    !budgetOverlaps(
      { min: viewer.minBudget, max: viewer.maxBudget },
      { min: candidate.minBudget, max: candidate.maxBudget }
    )
  ) {
    return true
  }

  return hasDealBreakerConflict(viewer, candidate)
}

export function calculateCompatibilityScore(
  viewer: UserProfile,
  candidate: UserProfile,
  candidateListing?: Listing
): ScoreBreakdown {
  const socialBreakdown = calculateSocialScoreBreakdown(viewer, candidate)
  const socialScore = toPercent(Math.max(0, socialBreakdown.totalScore), SOCIAL_MAX_SCORE)

  const isSeekerToHostWithListing =
    viewer.role === 'SEEKER' &&
    candidate.role === 'HOST' &&
    !!candidateListing

  if (isSeekerToHostWithListing && candidateListing) {
    const housing = calculateHousingScore(viewer, candidateListing)
    const compositeScore = clampScore(socialScore * 0.6 + housing.score * 0.4)

    return {
      ...socialBreakdown,
      budgetOverlap: housing.budgetFits,
      totalScore: compositeScore,
      matchedFactors: [
        ...socialBreakdown.matchedFactors,
        ...housing.matchedFactors,
        `Social score: ${socialScore}`,
        `Housing score: ${housing.score}`,
        `Composite score (60/40): ${compositeScore}`,
      ],
    }
  }

  return {
    ...socialBreakdown,
    totalScore: socialScore,
    matchedFactors: [...socialBreakdown.matchedFactors, `Social score: ${socialScore}`],
  }
}

export function runDiscoveryEngine(
  viewer: UserProfile,
  candidates: UserProfile[],
  filters?: DiscoveryFilters,
  candidateListingsByHostId?: Record<string, Listing>
): MatchResult[] {
  const results: MatchResult[] = []
  const effectiveZones = filters?.zones?.length ? filters.zones : viewer.zones

  for (const candidate of candidates) {
    if (candidate.uid === viewer.uid) continue
    if (candidate.status !== 'active') continue

    if (filters?.gender && candidate.gender !== filters.gender) continue
    if (filters?.courseYear && candidate.courseYear !== filters.courseYear) continue
    if (filters?.moveInMonth && candidate.moveInMonth !== filters.moveInMonth) continue

    const shouldHideConflict = filters?.hideDealBreakerConflicts !== false
    if (shouldHideConflict && hasDealBreakerConflict(viewer, candidate)) continue

    const candidateListing = candidateListingsByHostId?.[candidate.uid]
    const isSeekerToHostWithListing =
      viewer.role === 'SEEKER' &&
      candidate.role === 'HOST' &&
      !!candidateListing

    if (isSeekerToHostWithListing && candidateListing) {
      if (!listingBudgetFits(viewer, candidateListing)) continue
      if (effectiveZones.length > 0 && !effectiveZones.includes(candidateListing.zone)) {
        continue
      }
    } else if (
      !budgetOverlaps(
        { min: viewer.minBudget, max: viewer.maxBudget },
        { min: candidate.minBudget, max: candidate.maxBudget }
      )
    ) {
      continue
    }

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

    const scoreBreakdown = calculateCompatibilityScore(
      viewer,
      candidate,
      candidateListing
    )
    const normalizedScore = clampScore(scoreBreakdown.totalScore)

    results.push({
      profile: candidate,
      listing: candidateListing,
      compatibilityScore: normalizedScore,
      scoreBreakdown,
      isExactMatch: normalizedScore >= 60,
    })
  }

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

export function runRelaxedDiscovery(
  viewer: UserProfile,
  candidates: UserProfile[],
  filters: DiscoveryFilters,
  candidateListingsByHostId?: Record<string, Listing>
): { results: MatchResult[]; relaxedFilters: Partial<DiscoveryFilters> } {
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
    results = runDiscoveryEngine(
      relaxedViewer,
      candidates,
      { ...filters, ...relaxedFilters },
      candidateListingsByHostId
    )

    if (results.length > 0) break
  }

  return { results, relaxedFilters }
}

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

export function getCompatibilityPercentage(score: number): number {
  return clampScore(score)
}
