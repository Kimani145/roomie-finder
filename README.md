# Roomie Finder

Student roommate matching for TUK students, built around compatibility scoring instead of pure listing search. The platform pairs students based on lifestyle overlap, mutual housing goals, and verified identity rather than raw listing search.

The codebase is an **npm workspaces monorepo** with a clear trust boundary: the React client handles presentation and Firestore reads/writes governed by Security Rules, while the Fastify backend owns privileged operations (email, admin provisioning, audit logging).

---

## Architecture

### Untrusted client (`frontend/`)

- **Role:** Presentation, routing, and user interaction.
- **Stack:** React 18, Vite, TypeScript, Tailwind CSS, Zustand, React Router v6.
- **Rules:** The frontend does not send email, issue admin tokens, or decide authorization. It authenticates via Firebase Auth and passes ID tokens to the backend for trusted operations.

### Trusted backend (`backend/`)

- **Role:** Orchestration, authorization, and secure communications.
- **Stack:** Node.js 22, Fastify, TypeScript, Zod, Pino.
- **Responsibilities:**
  - Password reset and email verification (Firebase Admin SDK)
  - SMTP-backed transactional email (Brevo / compatible providers)
  - Administrator invitation lifecycle and RBAC
  - Immutable audit trails for privileged actions

### Shared infrastructure

- **Firebase Auth + Firestore** — identity and primary data store (Security Rules enforced at the database layer)
- **Cloudinary** — listing photos and avatars via unsigned upload presets
- **No Redis** — offline detection is client-side (`navigator.onLine`); no separate cache layer is required

---

## Core features

- Compatibility-driven discovery feed (rooms + roommates)
- Mutual-like matching flow with real-time chat and unread tracking
- Persistent notification history (Firestore-backed)
- Role-based profiles (`HOST`, `SEEKER`, `FLEX`)
- Email-based two-step verification (SHA-256 OTPs, 5-minute expiry, rate-limited attempts, 60s resend cooldown)
- Listing creation wizard with Cloudinary image uploads
- Admin console with RBAC, moderation, and mandatory 2FA for admin accounts
- Responsive app shell with collapsible desktop sidebar and PWA metadata

---

## Project structure

```txt
Roomie_Finder/
├── frontend/                 # React + Vite SPA (deployed to Vercel)
│   ├── src/
│   │   ├── components/     # UI, layout, discovery, onboarding
│   │   ├── pages/          # Route-level pages (student + admin)
│   │   ├── firebase/       # Firestore client SDK helpers
│   │   ├── services/       # apiClient, auth, 2FA
│   │   ├── store/          # Zustand stores
│   │   └── engine/         # compatibilityEngine.ts
│   └── vercel.json         # SPA rewrite rules
│
├── backend/                  # Fastify API (deployed to Fly.io)
│   ├── src/
│   │   ├── routes/         # auth, admin, communications, audit
│   │   ├── middleware/     # authenticate, authorize (permissions)
│   │   ├── services/       # Firebase Admin, SMTP, audit, invitations
│   │   ├── providers/      # SMTP provider abstraction
│   │   └── templates/      # React Email templates
│   └── Dockerfile.backend  # (referenced from repo root)
│
├── shared/                   # Shared TypeScript package (@roomiefinder/shared)
├── Dockerfile.backend        # Monorepo-aware backend image
├── fly.toml                  # Fly.io app config
└── package.json              # Workspace root
```

---

## Getting started

### Prerequisites

- Node.js 22 LTS
- npm 10+
- Firebase project (Auth + Firestore enabled)
- Cloudinary account
- SMTP provider (e.g. Brevo)

### Install and run locally

From the repository root:

```bash
npm install
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
npm run dev
```

This starts the frontend (Vite) and backend (Fastify) concurrently.

Useful workspace commands:

```bash
npm run dev              # frontend + backend
npm run build            # build all workspaces
npm run lint             # lint all workspaces
npm run type-check       # type-check all workspaces
npm run doctor           # sanity checks (ports, env files, deps)
```

### Environment variables

**Frontend** (`frontend/.env`):

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=roomie_unsigned
VITE_API_BASE_URL=http://localhost:8080
```

**Backend** (`backend/.env`):

```bash
PORT=8080
HOST=0.0.0.0
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=Roomie Finder <no-reply@example.com>

LOG_LEVEL=info
```

### API documentation

When the backend is running locally, Swagger UI is available at:

```txt
http://localhost:8080/documentation
```

Authenticated endpoints require:

```txt
Authorization: Bearer <Firebase_ID_Token>
```

---

## Deployment

### Frontend — Vercel

- **Production URL:** https://roomie-finder.vercel.app
- Root directory: `frontend`
- `frontend/vercel.json` rewrites all routes to `/index.html` for SPA client-side routing.

Set `VITE_API_BASE_URL` in the Vercel project to your Fly.io backend URL.

### Backend — Fly.io

The root `Dockerfile.backend` and `fly.toml` are tailored for the npm workspaces layout so Fly builds only the backend without confusion from the monorepo.

```bash
fly deploy
```

After the first successful deploy, set secrets (these are **not** stored in `fly.toml`):

```bash
fly secrets set \
  FIREBASE_PROJECT_ID=... \
  FIREBASE_CLIENT_EMAIL=... \
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" \
  SMTP_HOST=... \
  SMTP_PORT=587 \
  SMTP_USER=... \
  SMTP_PASSWORD=... \
  SMTP_FROM="Roomie Finder <no-reply@yourdomain.com>"
```

Non-sensitive config (`FRONTEND_URL`, `PORT`, `NODE_ENV`) lives in `fly.toml`. CORS on the backend allows the production Vercel origin plus localhost dev ports.

Verify after deploy:

```bash
curl https://<your-fly-app>.fly.dev/health
```

---

## Security and trust model

- **Zero-trust client:** Frontend role claims are ignored; authorization is evaluated by the backend and Firestore Security Rules.
- **Permission-based RBAC:** Admin access uses granular permissions (e.g. `CREATE_ADMIN`, `SUSPEND_USERS`, `VIEW_AUDIT_LOGS`).
- **Immutable auditing:** Privileged actions write correlation-tracked records to Firestore.
- **Mandatory admin 2FA:** Administrative accounts require two-factor authentication.
- **CORS:** Production backend accepts requests only from the configured `FRONTEND_URL` (plus localhost during development).

### Firestore rules (high level)

- Authenticated, verified student gating
- OTP and audit log collections restricted to owners
- Match and chat participant checks
- Notification ownership (`recipientId == auth.uid`)

---

## Key routes

**Student app**

| Route | Purpose |
| --- | --- |
| `/discover` | Compatibility-driven feed |
| `/matches` | Mutual matches |
| `/messages/:matchId?` | Chat |
| `/notifications` | Notification center |
| `/listing/:listingId` | Listing detail |
| `/create-listing` | Listing wizard |
| `/profile`, `/edit-profile` | Profile management |
| `/security`, `/verify-2fa` | Account security |

**Admin**

| Route | Purpose |
| --- | --- |
| `/admin` | Dashboard |
| `/admin/login` | Admin sign-in |
| `/admin/accept-invitation` | Accept admin invite |
| `/admin/administrators` | Admin provisioning (super admin) |
| `/admin/user-management` | User management |
| `/admin/moderation` | Content moderation |

---

## Backend API (summary)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Health check |
| `GET` | `/version` | No | Build metadata |
| `POST` | `/auth/password-reset` | No | Send password reset email |
| `POST` | `/auth/email-verification` | No | Send verification email |
| `POST` | `/admin/invitations` | Yes + `CREATE_ADMIN` | Invite administrator |
| `POST` | `/admin/invitations/accept` | No | Accept invitation |
| `POST` | `/communications/send` | Yes + permission | Dispatch email template |
| `GET` | `/audit` | Yes + `VIEW_AUDIT_LOGS` | Retrieve audit logs |

See Swagger UI for full request/response schemas.

---

## Architecture notes

### Discovery and compatibility

- Discovery applies hard filters first, then soft scoring.
- Compatibility considers budget overlap, zone overlap, and lifestyle fit.
- If strict matches are empty, filters relax progressively.

### Two-step verification (2FA)

- 6-digit OTPs hashed with SHA-256 before storage in `/otps`.
- 5-minute expiry, max 5 verification attempts, 60-second resend cooldown.

### Notifications

- `GlobalListeners` watches matches/chats and writes to the `notifications` collection.
- The notification bell and center read from Firestore ordered by `createdAt`.

### Media uploads

- Listing photos and avatars share the `uploadToCloudinary` utility with unsigned preset support.

---

## PWA / icons

Static assets in `frontend/public/`:

- `favicon-16x16.png`, `favicon-32x32.png`, `favicon.ico`
- `apple-touch-icon.png`
- `site.webmanifest`

`index.html` references icon links, manifest, and `theme-color`.
