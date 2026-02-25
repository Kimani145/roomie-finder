# 🔧 Why You're Seeing the Landing Page Instead of Discovery Feed

## The Problem

From your screenshot, you're on `http://localhost:5173` which shows the **Landing Page** (dark background, "Find your people" text).

The **Discovery Feed** (light background, profile cards from Figma) is on a different route: `http://localhost:5173/discover`

---

## Root Cause

The app has **authentication guards** that prevent unauthenticated users from accessing `/discover`. 

In `App.tsx`, the Discovery route is wrapped in `<PrivateRoute>`:

```tsx
<Route
  path="/discover"
  element={
    <PrivateRoute>  {/* ← Blocks if not authenticated */}
      <AppLayout>
        <DiscoveryPage />
      </AppLayout>
    </PrivateRoute>
  }
/>
```

---

## Quick Fix Option 1: Navigate Directly (Temporary)

Manually type in browser:
```
http://localhost:5173/discover
```

If you get redirected back to `/`, that means authentication is blocking you.

---

## Quick Fix Option 2: Bypass Auth for Development

**Step 1:** Update `App.tsx` to temporarily remove auth guard:

Find this section:
```tsx
<Route
  path="/discover"
  element={
    <PrivateRoute>
      <AppLayout>
        <DiscoveryPage />
      </AppLayout>
    </PrivateRoute>
  }
/>
```

**Change to:**
```tsx
<Route
  path="/discover"
  element={
    <AppLayout>
      <DiscoveryPage />
    </AppLayout>
  }
/>
```

**Step 2:** Add mock data so the feed isn't empty

---

## Quick Fix Option 3: Add Mock Data (Recommended for Testing)

Create a mock user and profiles to see the Discovery feed in action.

**File:** `src/pages/DiscoveryPage.tsx`

At the top, add this mock data:

```tsx
// MOCK DATA FOR TESTING - Remove in production
const MOCK_USER: UserProfile = {
  uid: 'test-user-1',
  displayName: 'Test User',
  photoURL: null,
  gender: 'Male',
  age: 21,
  school: 'Test University',
  courseYear: 3,
  minBudget: 5000,
  maxBudget: 8000,
  zone: 'Ruiru',
  preferredRoomType: 'Bedsitter',
  lifestyle: {
    sleepTime: 'Early',
    noiseTolerance: 'Low',
    guestFrequency: 'Rare',
    cleanlinessLevel: 'Moderate',
    studyStyle: 'Silent',
    smoking: false,
    alcohol: false,
  },
  dealBreakers: {
    noSmokingRequired: true,
    noAlcoholRequired: false,
    mustHaveWiFi: true,
    femaleOnly: false,
    maleOnly: false,
  },
  status: 'active',
  lastActive: new Date(),
  createdAt: new Date(),
  bio: 'Test user for development',
}

const MOCK_CANDIDATES: MatchResult[] = [
  {
    profile: {
      uid: 'candidate-1',
      displayName: 'Joseph',
      photoURL: null,
      gender: 'Male',
      age: 21,
      school: 'TUK',
      courseYear: 3,
      minBudget: 5000,
      maxBudget: 8000,
      zone: 'Ruiru',
      preferredRoomType: 'Bedsitter',
      lifestyle: {
        sleepTime: 'Early',
        noiseTolerance: 'Low',
        guestFrequency: 'Rare',
        cleanlinessLevel: 'Moderate',
        studyStyle: 'Silent',
        smoking: false,
        alcohol: false,
      },
      dealBreakers: {
        noSmokingRequired: true,
        noAlcoholRequired: false,
        mustHaveWiFi: true,
        femaleOnly: false,
        maleOnly: false,
      },
      status: 'active',
      lastActive: new Date(),
      createdAt: new Date(),
      bio: 'Looking for a quiet roommate',
    },
    compatibilityScore: 65,
    scoreBreakdown: {
      budgetOverlap: true,
      zoneMatch: 20,
      sleepMatch: 15,
      cleanlinessMatch: 20,
      noiseMatch: 10,
      smokingConflict: false,
      alcoholConflict: false,
      totalScore: 65,
    },
    isExactMatch: true,
  },
  // Add 2-3 more similar profiles...
]
```

Then in the component, use mock data when `currentUser` is null:

```tsx
const DiscoveryPage: React.FC = () => {
  const { currentUser } = useAuthStore()
  const { runDiscovery, error } = useDiscovery()
  const { candidates, isLoading, hasRelaxedFilters, relaxedFilterKeys } =
    useDiscoveryStore()

  // USE MOCK DATA if no current user (dev mode)
  const displayUser = currentUser || MOCK_USER
  const displayCandidates = candidates.length > 0 ? candidates : MOCK_CANDIDATES
  
  // ... rest of component
```

---

## Full Solution: Set Up Firebase Auth (Production-Ready)

If you want to test with real authentication:

1. **Create Firebase project** at https://console.firebase.google.com
2. **Enable Authentication** → Email/Password
3. **Add test user** in Firebase Console
4. **Update `.env` file** with your Firebase config
5. **Create login page** with email/password form
6. **Use Firebase Auth** to sign in

---

## The Easiest Path Forward (Recommended)

**For now, to see your refactored Discovery feed:**

1. **Remove `<PrivateRoute>` wrapper** from `/discover` in `App.tsx` (temporary)
2. **Add the mock data** to `DiscoveryPage.tsx` (above)
3. **Navigate to** `http://localhost:5173/discover`
4. **You should now see** the Figma design with profile cards!

---

## Expected Result After Fix

When you navigate to `/discover`, you should see:

✅ **Header:** "Roomie Finder ©" + "Ranked by Compatibility" + "Ruiru ▾"
✅ **Label:** "Showing highest compatibility first"
✅ **Cards:** Joseph, 21 • TUK • Year 3 with compatibility badge
✅ **Bottom Nav:** 4 tabs (Discover highlighted in blue)

---

## Files to Update

I'll create these files for you:

1. **LandingPage.tsx** → Add "View Discovery Feed (Demo)" button
2. **DiscoveryPage-with-mocks.tsx** → Version with mock data
3. **App-dev.tsx** → Version without auth guards

Download these and replace your existing files to test immediately!
