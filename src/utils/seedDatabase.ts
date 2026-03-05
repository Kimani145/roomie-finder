import { writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { TUK_ZONES } from '@/constants/zones'
import type {
  Gender,
  SleepTime,
  NoiseTolerance,
  GuestFrequency,
  CleanlinessLevel,
  StudyStyle,
  RoomType,
  ProfileStatus,
  TukZone,
} from '@/types'

// ─── Name Roster ──────────────────────────────────────────────────────────────
const NAMES: Array<{ name: string; gender: Gender }> = [
  // Male
  { name: 'Brian Otieno', gender: 'Male' },
  { name: 'Kevin Mwangi', gender: 'Male' },
  { name: 'Dennis Kamau', gender: 'Male' },
  { name: 'Elijah Waweru', gender: 'Male' },
  { name: 'Farouk Hassan', gender: 'Male' },
  { name: 'George Kimani', gender: 'Male' },
  { name: 'Harrison Odhiambo', gender: 'Male' },
  { name: 'Ian Njuguna', gender: 'Male' },
  { name: 'James Cheruiyot', gender: 'Male' },
  { name: 'Kelvin Mutua', gender: 'Male' },
  { name: 'Leonard Wekesa', gender: 'Male' },
  { name: 'Mathendegu Njoroge', gender: 'Male' },
  { name: 'Newton Kariuki', gender: 'Male' },
  { name: 'Oscar Omondi', gender: 'Male' },
  { name: 'Patrick Kiprotich', gender: 'Male' },
  { name: 'Quinton Mutura', gender: 'Male' },
  { name: 'Ronald Gitau', gender: 'Male' },
  { name: 'Samuel Barasa', gender: 'Male' },
  { name: 'Timothy Gachie', gender: 'Male' },
  { name: 'Victor Ndiema', gender: 'Male' },
  { name: 'Wilfred Sang', gender: 'Male' },
  { name: 'Xavier Omari', gender: 'Male' },
  { name: 'Clifford Simiyu', gender: 'Male' },
  { name: 'Derrick Langat', gender: 'Male' },
  { name: 'Emmanuel Nyaga', gender: 'Male' },
  { name: 'Felix Muriithi', gender: 'Male' },
  { name: 'Gideon Kiplagat', gender: 'Male' },
  // Female
  { name: 'Amina Wanjiru', gender: 'Female' },
  { name: 'Beatrice Achieng', gender: 'Female' },
  { name: 'Caroline Muthoni', gender: 'Female' },
  { name: 'Diana Chelangat', gender: 'Female' },
  { name: 'Edith Akinyi', gender: 'Female' },
  { name: 'Faith Njeri', gender: 'Female' },
  { name: 'Grace Wairimu', gender: 'Female' },
  { name: 'Hannah Kemunto', gender: 'Female' },
  { name: 'Ivy Moraa', gender: 'Female' },
  { name: 'Janet Wanjiru', gender: 'Female' },
  { name: 'Karen Nekesa', gender: 'Female' },
  { name: 'Linda Atieno', gender: 'Female' },
  { name: 'Mary Wambui', gender: 'Female' },
  { name: 'Nancy Cherono', gender: 'Female' },
  { name: 'Olivia Mumbi', gender: 'Female' },
  { name: 'Priscilla Adhiambo', gender: 'Female' },
  { name: 'Ruth Kerubo', gender: 'Female' },
  { name: 'Sharon Nyambura', gender: 'Female' },
  { name: 'Tiffany Awuor', gender: 'Female' },
  { name: 'Ursula Wangeci', gender: 'Female' },
  { name: 'Veronica Mukami', gender: 'Female' },
  { name: 'Winnie Otieno', gender: 'Female' },
  { name: 'Yvonne Njambi', gender: 'Female' },
  { name: 'Zipporah Chepkemoi', gender: 'Female' },
  { name: 'Agnes Wangari', gender: 'Female' },
  { name: 'Brenda Auma', gender: 'Female' },
  { name: 'Catherine Nyokabi', gender: 'Female' },
]

// ─── Enum Pools ───────────────────────────────────────────────────────────────
const COURSES = [
  'BSc Information Science',
  'BSc Electrical Engineering',
  'BSc Computer Science',
  'BA Business Administration',
  'BSc Civil Engineering',
  'BSc Applied Physics',
  'BSc Mechanical Engineering',
  'Diploma in ICT',
]

const SLEEP_TIMES: SleepTime[] = ['Early', 'Late', 'Flexible']
const NOISE_LEVELS: NoiseTolerance[] = ['Low', 'Medium', 'High']
const GUEST_FREQS: GuestFrequency[] = ['Rare', 'Sometimes', 'Often']
const CLEANLINESS: CleanlinessLevel[] = ['Relaxed', 'Moderate', 'Strict']
const STUDY_STYLES: StudyStyle[] = ['Silent', 'Background noise ok']
const ROOM_TYPES: RoomType[] = ['Single Room', 'Bedsitter', '1 Bedroom', 'Shared Hostel']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function hsl2hex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `${f(0)}${f(8)}${f(4)}`
}

function avatarUrl(name: string): string {
  const encoded = encodeURIComponent(name)
  // Deterministic hue from name character codes
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  const bg = hsl2hex(hue, 55, 60)
  return `https://ui-avatars.com/api/?name=${encoded}&background=${bg}&color=fff&size=256&bold=true`
}

function seedUid(name: string): string {
  return 'seed-' + name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// ─── Main Seeder ──────────────────────────────────────────────────────────────
export async function seedMockUsers(): Promise<void> {
  const PROFILES_COLLECTION = 'profiles'
  const batch = writeBatch(db)
  let count = 0

  for (const { name, gender } of NAMES) {
    const uid = seedUid(name)
    const minBudget = randInt(4000, 8000)
    const maxBudget = minBudget + randInt(2000, 5000)
    const zoneCount = randInt(1, 3)
    const shuffled = [...TUK_ZONES].sort(() => Math.random() - 0.5)
    const zones: TukZone[] = shuffled.slice(0, zoneCount)
    const course = pick(COURSES)
    const yearOfStudy = randInt(1, 4)
    const smoking = Math.random() < 0.2
    const alcohol = Math.random() < 0.3

    const profile = {
      uid,
      displayName: name,
      photoURL: avatarUrl(name),
      gender,
      age: randInt(18, 25),
      school: 'Technical University of Kenya',
      courseYear: yearOfStudy,
      minBudget,
      maxBudget,
      zones,
      preferredRoomType: pick(ROOM_TYPES),
      lifestyle: {
        sleepTime: pick(SLEEP_TIMES),
        noiseTolerance: pick(NOISE_LEVELS),
        guestFrequency: pick(GUEST_FREQS),
        cleanlinessLevel: pick(CLEANLINESS),
        studyStyle: pick(STUDY_STYLES),
        smoking,
        alcohol,
      },
      dealBreakers: {
        noSmokingRequired: !smoking && Math.random() < 0.5,
        noAlcoholRequired: !alcohol && Math.random() < 0.4,
        mustHaveWiFi: Math.random() < 0.7,
        femaleOnly: gender === 'Female' && Math.random() < 0.35,
        maleOnly: gender === 'Male' && Math.random() < 0.25,
      },
      bio: `${course} student at TUK, Year ${yearOfStudy}. Looking for a compatible roomie in ${zones[0]}.`,
      status: 'active' as ProfileStatus,
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp(),
    }

    const ref = doc(db, PROFILES_COLLECTION, uid)
    batch.set(ref, profile)
    count++
  }

  await batch.commit()
  console.info(`✓ Seeded ${count} profiles to Firestore via batch write.`)
}
