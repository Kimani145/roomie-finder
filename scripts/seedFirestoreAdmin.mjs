#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import process from 'node:process'
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const MAX_USERS = 100
const DEFAULT_USERS = 100
const DEFAULT_PROJECT_ID = 'roomie-finder-145'

const TUK_ZONES = [
  'Ruiru',
  'Juja',
  'Kahawa',
  'Kahawa Sukari',
  'Thika',
  'Roysambu',
  'Kasarani',
  'South B',
  'Pangani',
  'Muthaiga',
  'Ngara',
]

const GENDERS = ['Male', 'Female', 'Non-binary']
const USER_ROLES = ['HOST', 'SEEKER', 'FLEX']
const HOUSING_TYPES = [
  'Single Room',
  'Bedsitter',
  'Studio',
  'Double Room',
  '1 Bedroom',
  '2 Bedroom',
  '3 Bedroom',
]
const PROFILE_STATUSES = ['active', 'inactive', 'paused']
const LISTING_STATUSES = ['active', 'active', 'paused', 'filled']
const COURSES = [
  'BSc Information Science',
  'BSc Computer Science',
  'BSc Electrical Engineering',
  'BSc Civil Engineering',
  'BA Business Administration',
  'BSc Applied Physics',
  'BSc Mechanical Engineering',
  'Diploma in ICT',
]
const SLEEP_TIMES = ['Early', 'Late', 'Flexible']
const NOISE_LEVELS = ['Low', 'Medium', 'High']
const GUEST_FREQS = ['Rare', 'Sometimes', 'Often']
const CLEANLINESS_LEVELS = ['Relaxed', 'Moderate', 'Strict']
const STUDY_STYLES = ['Silent', 'Background noise ok']
const AMENITIES = [
  'WiFi',
  'Water',
  'Security',
  'Parking',
  'Furnished',
  'Laundry Area',
  'Near Campus',
  'Hot Shower',
]
const GUEST_POLICIES = [
  'No overnight guests',
  'Guests allowed until 9PM',
  'Guests allowed with prior notice',
  'Weekend guests allowed',
]
const MOCK_INTERIOR_PHOTOS = [
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
]
const FIRST_NAMES = [
  'Brian',
  'Amina',
  'Kevin',
  'Grace',
  'Dennis',
  'Faith',
  'Elijah',
  'Ivy',
  'Farouk',
  'Tiffany',
  'George',
  'Yvonne',
  'Harrison',
  'Hannah',
  'Ian',
  'Mary',
  'James',
  'Olivia',
  'Kelvin',
  'Sharon',
  'Leonard',
  'Ruth',
  'Newton',
  'Diana',
  'Oscar',
  'Janet',
  'Patrick',
  'Linda',
  'Ronald',
  'Priscilla',
  'Samuel',
  'Nancy',
  'Victor',
  'Ursula',
  'Wilfred',
  'Zipporah',
]
const LAST_NAMES = [
  'Otieno',
  'Mwangi',
  'Kamau',
  'Waweru',
  'Hassan',
  'Kimani',
  'Odhiambo',
  'Njuguna',
  'Cheruiyot',
  'Mutua',
  'Wekesa',
  'Njoroge',
  'Omondi',
  'Kiprotich',
  'Gitau',
  'Barasa',
  'Achieng',
  'Muthoni',
  'Chelangat',
  'Akinyi',
  'Njeri',
  'Wairimu',
  'Kemunto',
  'Moraa',
  'Nekesa',
  'Atieno',
  'Wambui',
  'Cherono',
  'Mumbi',
  'Adhiambo',
]

function parseArgs(argv) {
  let count = DEFAULT_USERS
  let projectId = process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID
  let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || null

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg.startsWith('--count=')) {
      count = Number(arg.split('=')[1])
    } else if (arg === '--count' && argv[i + 1]) {
      count = Number(argv[i + 1])
      i += 1
    } else if (arg.startsWith('--projectId=')) {
      projectId = arg.split('=')[1]
    } else if (arg === '--projectId' && argv[i + 1]) {
      projectId = argv[i + 1]
      i += 1
    } else if (arg.startsWith('--serviceAccount=')) {
      serviceAccountPath = arg.split('=')[1]
    } else if (arg === '--serviceAccount' && argv[i + 1]) {
      serviceAccountPath = argv[i + 1]
      i += 1
    }
  }

  if (!Number.isInteger(count) || count < 1 || count > MAX_USERS) {
    throw new Error(`--count must be an integer between 1 and ${MAX_USERS}.`)
  }

  return { count, projectId, serviceAccountPath }
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickUnique(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, arr.length))
}

const MALE_PORTRAITS = [
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=256&h=256&q=80'
]

const FEMALE_PORTRAITS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=256&h=256&q=80'
]

const MALE_BIOS = [
  "Final year TUK student looking for a clean, study-focused roommate. I mostly code or play video games on weekends.",
  "Very clean and organized. Looking for someone quiet to share a bedsitter or single room near Roysambu.",
  "Outgoing student. Love football, music, and occasional gaming. Cleanliness is important to me.",
  "Early bird and study-focused. Looking for a neat space with stable WiFi and water supply."
]

const FEMALE_BIOS = [
  "TUK Information Science major. Clean, respects boundaries, and values a quiet study environment.",
  "Looking for a friendly female roommate to share a neat 1-bedroom. I enjoy cooking and quiet evenings.",
  "Organized and friendly. I study most of the day and prefer a clean, peaceful space to relax afterward.",
  "Very tidy and quiet student. Searching for a roommate who respects privacy and values hygiene."
]

const OTHER_BIOS = [
  "Looking for a roommate who is clean, respectful, and communicates well. Easygoing and focused on studies."
]

function avatarUrl(name, gender, index) {
  if (gender === 'Male') {
    return MALE_PORTRAITS[index % MALE_PORTRAITS.length]
  } else if (gender === 'Female') {
    return FEMALE_PORTRAITS[index % FEMALE_PORTRAITS.length]
  } else {
    const encoded = encodeURIComponent(name)
    return `https://ui-avatars.com/api/?name=${encoded}&background=3b82f6&color=fff&size=256&bold=true`
  }
}

function getBio(gender, index, zones) {
  if (gender === 'Male') {
    return MALE_BIOS[index % MALE_BIOS.length] + ` Preferred zone: ${zones[0]}.`
  } else if (gender === 'Female') {
    return FEMALE_BIOS[index % FEMALE_BIOS.length] + ` Preferred zone: ${zones[0]}.`
  } else {
    return OTHER_BIOS[0] + ` Preferred zone: ${zones[0]}.`
  }
}

function randomMoveInMonth() {
  const month = String(randInt(1, 12)).padStart(2, '0')
  return `2026-${month}`
}

function randomRentTotal(housingType) {
  switch (housingType) {
    case 'Single Room':
      return randInt(6, 12) * 1000
    case 'Bedsitter':
      return randInt(8, 16) * 1000
    case 'Studio':
      return randInt(10, 20) * 1000
    case 'Double Room':
      return randInt(12, 20) * 1000
    case '1 Bedroom':
      return randInt(15, 28) * 1000
    case '2 Bedroom':
      return randInt(24, 42) * 1000
    case '3 Bedroom':
      return randInt(32, 60) * 1000
    default:
      return randInt(8, 18) * 1000
  }
}

function makeUserRecord(index) {
  const uid = `seed-user-${String(index + 1).padStart(3, '0')}`
  const displayName = `${FIRST_NAMES[index % FIRST_NAMES.length]} ${LAST_NAMES[(index * 7) % LAST_NAMES.length]}`
  const gender = pick(GENDERS)
  const role = pick(USER_ROLES)

  const minBudget = randInt(4, 10) * 1000
  const maxBudget = minBudget + randInt(2, 9) * 1000
  const zones = pickUnique(TUK_ZONES, randInt(1, 3))
  const smoking = Math.random() < 0.2
  const alcohol = Math.random() < 0.35
  const status = pick(PROFILE_STATUSES)

  const profile = {
    uid,
    displayName,
    photoURL: avatarUrl(displayName, gender, index),
    role,
    gender,
    age: randInt(18, 25),
    school: 'Technical University of Kenya',
    courseYear: randInt(1, 4),
    minBudget,
    maxBudget,
    zones,
    preferredRoomType: pick(HOUSING_TYPES),
    lifestyle: {
      sleepTime: pick(SLEEP_TIMES),
      noiseTolerance: pick(NOISE_LEVELS),
      guestFrequency: pick(GUEST_FREQS),
      cleanlinessLevel: pick(CLEANLINESS_LEVELS),
      studyStyle: pick(STUDY_STYLES),
      smoking,
      alcohol,
    },
    dealBreakers: {
      noSmokingRequired: !smoking && Math.random() < 0.6,
      noAlcoholRequired: !alcohol && Math.random() < 0.45,
      mustHaveWiFi: Math.random() < 0.8,
      femaleOnly: gender === 'Female' && Math.random() < 0.2,
      maleOnly: gender === 'Male' && Math.random() < 0.15,
    },
    status,
    lastActive: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    bio: getBio(gender, index, zones),
    moveInMonth: Math.random() < 0.8 ? randomMoveInMonth() : null,
  }

  const userMeta = {
    role,
    profileCompleted: true,
    updatedAt: FieldValue.serverTimestamp(),
  }

  let listing = null
  if (role === 'HOST') {
    const housingType = pick(HOUSING_TYPES)
    const rentTotal = randomRentTotal(housingType)
    listing = {
      id: `listing-${uid}`,
      hostId: uid,
      zone: pick(zones),
      housingType,
      rentTotal,
      roommateShare: Math.floor(rentTotal / 2),
      amenities: pickUnique(AMENITIES, randInt(3, 6)),
      photos: pickUnique(MOCK_INTERIOR_PHOTOS, randInt(3, 5)),
      houseRules: {
        smokingAllowed: Math.random() < 0.25,
        petsAllowed: Math.random() < 0.3,
        guestPolicy: pick(GUEST_POLICIES),
      },
      createdAt: new Date().toISOString(),
      status: pick(LISTING_STATUSES),
    }
  }

  return { uid, userMeta, profile, listing }
}

function initFirebase(projectId, serviceAccountPath) {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    return initializeApp({
      credential: cert(parsed),
      projectId,
    })
  }

  if (serviceAccountPath) {
    const parsed = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
    return initializeApp({
      credential: cert(parsed),
      projectId,
    })
  }

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId })
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  })
}

async function commitInChunks(db, operations, chunkSize = 450) {
  let committed = 0
  for (let i = 0; i < operations.length; i += chunkSize) {
    const chunk = operations.slice(i, i + chunkSize)
    const batch = db.batch()
    for (const op of chunk) {
      batch.set(op.ref, op.data)
    }
    await batch.commit()
    committed += chunk.length
  }
  return committed
}

async function main() {
  const { count, projectId, serviceAccountPath } = parseArgs(process.argv.slice(2))
  initFirebase(projectId, serviceAccountPath)
  const db = getFirestore()

  const operations = []
  let profileCount = 0
  let listingCount = 0

  for (let i = 0; i < count; i += 1) {
    const { uid, userMeta, profile, listing } = makeUserRecord(i)
    operations.push({ ref: db.collection('users').doc(uid), data: userMeta })
    operations.push({ ref: db.collection('profiles').doc(uid), data: profile })
    profileCount += 1

    if (listing) {
      operations.push({ ref: db.collection('listings').doc(listing.id), data: listing })
      listingCount += 1
    }
  }

  for (const zone of TUK_ZONES) {
    const zoneId = zone.toLowerCase().replace(/\s+/g, '-')
    operations.push({ ref: db.collection('zones').doc(zoneId), data: { name: zone } })
  }

  const writeCount = await commitInChunks(db, operations)
  console.info(`Seed complete`)
  console.info(`Project: ${projectId}`)
  console.info(`Profiles: ${profileCount}`)
  console.info(`Listings: ${listingCount}`)
  console.info(`Writes: ${writeCount}`)
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
