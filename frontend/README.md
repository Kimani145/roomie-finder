# 🏠 Roomie Finder

Student roommate matching for TUK students, built around compatibility scoring instead of pure listing search.

## Core Features

- Compatibility-driven discovery feed (rooms + roommates)
- Mutual-like matching flow
- Real-time chat with unread tracking (`unreadBy`)
- Persistent notification history (Firestore-backed)
- Role-based profiles (`HOST`, `SEEKER`, `FLEX`)
- Email-Based Two-Step Verification (2FA) (SHA-256 OTPs, 5-minute expiry, rate-limited attempts, 60s cooldown)
- Listing creation wizard with Cloudinary image uploads
- Inline avatar upload from Profile page
- Responsive app shell with collapsible desktop sidebar
- PWA metadata support (`site.webmanifest`, favicon set, apple touch icon)

## Tech Stack

- React 18 + TypeScript
- Vite
- Firebase Auth + Firestore
- Zustand
- React Router v6
- Tailwind CSS
- Cloudinary (unsigned uploads)

## Project Structure

```txt
src/
├── components/
│   ├── discovery/
│   ├── layout/
│   ├── onboarding/
│   ├── ui/
│   └── GlobalListeners.tsx
├── engine/
│   └── compatibilityEngine.ts
├── firebase/
│   ├── config.ts
│   ├── listings.ts
│   ├── matches.ts
│   ├── notifications.ts
│   └── profiles.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useDiscovery.ts
│   └── useChat.ts
├── pages/
│   ├── SecurityPage.tsx
│   └── Verify2faPage.tsx
├── services/
│   ├── authService.ts
│   ├── emailService.ts
│   └── twoFactorService.ts
├── store/
│   ├── authStore.ts
│   ├── discoveryStore.ts
│   └── notificationStore.ts
├── types/
│   └── index.ts
└── utils/
    ├── formatters.ts
    └── uploadToCloudinary.ts
```

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

### Required Environment Variables

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

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run type-check
```

## Architecture Notes

### Two-Step Verification (2FA)

- Generates secure, random 6-digit numeric OTPs.
- Hashes codes using client-side SHA-256 (SubtleCrypto API) before storage in `/otps` collection.
- Expiration is set to 5 minutes.
- Multi-attempt rate-limiting limits users to 5 verification attempts.
- Cooldown period limits resending codes to once every 60 seconds to prevent email spam.
- Triggers structured HTML notifications to the developer console and toast popups in development mode.

### Discovery + Compatibility

- Discovery uses hard filters + soft scoring.
- Compatibility scoring considers budget overlap, zone overlap, and lifestyle fit.
- If strict matches are empty, soft filters relax progressively.

### Chat Gate + Error Handling

- Chat entry is protected by Firestore rules and matching state.
- Chat initialization handles `permission-denied` gracefully and informs users they must match first.

### Notifications

- `GlobalListeners` subscribes to matches/chats and writes notification records to Firestore.
- Notification center and bell read from `notifications` collection in descending `createdAt`.
- Clicking a notification marks it read, then routes to its deep link.

### Media Uploads

- Listing photos and avatars use shared `uploadToCloudinary` utility.
- Edit Profile and Profile avatar flows support conditional upload UX and progress states.

### App Shell + Layout

- Shared `AppLayout` controls sidebar collapse state.
- Header, sidebar, and content areas are synchronized for light/dark elevation layers.
- Chat page uses strict flex layout: only message pane scrolls.

## PWA / Icons

The app includes:

- `public/favicon-16x16.png`
- `public/favicon-32x32.png`
- `public/favicon.ico`
- `public/apple-touch-icon.png`
- `public/site.webmanifest`

`index.html` is wired with icon links, manifest, and `theme-color`.

## Key Routes

- `/discover`
- `/matches`
- `/messages`
- `/chat/:matchId`
- `/notifications`
- `/listing/:listingId`
- `/profile`
- `/edit-profile`
- `/security`
- `/verify-2fa`

## Security Model (Firestore)

- Authenticated, verified student gating
- Two-Factor Authentication enforcement rules (`/otps` and `/auditLogs` owner-restricted)
- Immutable-like behavior for likes
- Match participant checks
- Chat participant checks
- Notification ownership checks (`recipientId == auth.uid`)
