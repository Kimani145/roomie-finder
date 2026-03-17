# 🏠 Roomie Finder

> Student roommate matching built on compatibility, not listings.

## Stack

- **React 18** + **TypeScript**
- **Vite** (dev server + bundler)
- **Firebase** (Firestore, Auth)
- **Cloudinary** (unsigned image uploads)
- **Zustand** (state management)
- **React Router v6**

---

## Project Structure

```
src/
├── components/
│   ├── ui/           # Shared design system components (Button, Badge, BottomSheet…)
│   ├── onboarding/   # Multi-step profile wizard
│   ├── discovery/    # Feed, filter pills, profile cards
│   ├── profile/      # View & edit profile
│   └── chat/         # Matched conversations
├── engine/
│   └── compatibilityEngine.ts   # Core scoring + matching logic
├── firebase/
│   ├── config.ts     # Firebase init
│   ├── profiles.ts   # Firestore profile CRUD
│   └── matches.ts    # Like / mutual match logic
├── hooks/
│   ├── useAuthListener.ts
│   └── useDiscovery.ts
├── pages/            # Route-level page components
├── store/
│   ├── authStore.ts
│   └── discoveryStore.ts
├── types/
│   └── index.ts      # All TypeScript types
├── utils/
│   └── formatters.ts
└── styles/
    └── global.css
```

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up Firebase
cp .env.example .env
# Fill in your Firebase + Cloudinary values in .env

# 3. Start dev server
npm run dev
```

Required environment variables:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

---

## Architecture

### Two-Pipeline Design

**Profile Creation Flow (Input)**
Captures structured compatibility data across budget, zone, room type, lifestyle enums, and hard-constraint booleans.

**Discovery Engine (Query)**
- **Hard filters** — Firestore server-side: `zone == selectedZone`, `status == active`
- **Soft filters** — Client-side scoring after load

### Compatibility Scoring

| Factor            | Points |
|-------------------|--------|
| Zone match        | +20    |
| Sleep schedule    | +15    |
| Cleanliness       | +20    |
| Noise tolerance   | +10    |
| Smoking conflict  | −100 (eliminates) |

### Budget Overlap Formula

```
overlap = (userA.min <= userB.max) AND (userA.max >= userB.min)
```

### Zero Results Strategy

When results = 0, soft filters are relaxed progressively:
`noiseTolerance → guestFrequency → sleepTime → cleanlinessLevel`

---

## Build Sprints

| Sprint | Feature |
|--------|---------|
| ✅ 1 | Project scaffold + types + engine |
| ✅ 2 | Profile creation wizard (onboarding) |
| ✅ 3 | Discovery feed + filter pills + bottom sheets |
| ✅ 4 | Profile view + edit |
| ✅ 5 | Matches list |
| ✅ 6 | Chat (mutual match gate) |
