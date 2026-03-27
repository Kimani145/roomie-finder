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
│   ├── layout/       # App shell, responsive nav, notification bell
│   └── GlobalListeners.tsx  # Background realtime toasts + notification sync
├── engine/
│   └── compatibilityEngine.ts   # Core scoring + matching logic
├── firebase/
│   ├── config.ts     # Firebase init
│   ├── profiles.ts   # Firestore profile CRUD
│   ├── listings.ts   # Listing fetch helpers (host and by id)
│   └── matches.ts    # Like / mutual match logic + recipient notifications
├── hooks/
│   ├── useAuthListener.ts
│   ├── useDiscovery.ts
│   └── useChat.ts    # Shared chat send/read/unread logic
├── pages/            # Route-level page components
│   ├── ProfileDetailPage.tsx   # Full profile view + lightbox trigger
│   ├── MessagesPage.tsx        # Gmail-style unread inbox rows
│   ├── NotificationsPage.tsx   # Notification center with action redirects
│   └── ListingDetailPage.tsx   # Listing destination route
├── store/
│   ├── authStore.ts
│   ├── discoveryStore.ts
│   └── notificationStore.ts    # Message/match counters + notification feed
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

### Realtime Notification Engine

- `GlobalListeners` runs inside auth context and outside route pages.
- Chat listener (`chats` where participants include current user):
    - Recomputes unread message count (`unreadBy includes currentUser.uid`).
    - On `modified` doc changes, toasts when current user is newly added to `unreadBy`.
    - Pushes actionable notifications (`/chat/:chatId`) into the notification store.
- Match listener (`matches` where `recipientId == currentUser.uid`):
    - Toasts `🎉 New Match!` on newly added docs after initial snapshot.
    - Increments unread match badge and creates notification items linking to `/matches`.

### Unread Message Contract (Gmail-style)

- On send, parent `chats/{chatId}` is updated with `unreadBy: [recipientUid]`.
- On chat open, current user is removed from `unreadBy`.
- Inbox rows in Messages use this for unread highlighting:
    - `bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-brand-500 font-semibold`
    - unread message text: `text-slate-900 dark:text-white`
    - read message text: `text-slate-500 dark:text-slate-400 font-normal`

### Profile + Media UX

- `ImageGalleryModal` is a reusable full-screen lightbox with close and prev/next controls.
- Profile cover and thumbnails open full-screen gallery using listing photos.
- Host listing preview links directly to `/listing/:listingId`.

### Responsive App Shell

- Header collision fixed with strict breakpoints:
    - Mobile header: `flex md:hidden`
    - Desktop header: `hidden md:flex`
- Sidebar and footer nav now show live unread badges for Messages and Matches.
- Header notification bell shows aggregate count and dropdown shortcuts.

### New Routes

- `/notifications` — notification center.
- `/listing/:listingId` — listing detail destination for profile listing previews.

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
| ✅ 7 | Full-screen profile image lightbox |
| ✅ 8 | Gmail-style unread inbox + unreadBy chat contract |
| ✅ 9 | Global notification engine + badges + bell + notifications page |
