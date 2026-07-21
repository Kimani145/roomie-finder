# ADR 001 — Backend Authority Refactor

**Date:** 2026-07-20  
**Status:** Accepted  
**Authors:** Engineering Team

---

## Context

The initial Roomie Finder implementation had all business logic in the React frontend. Firebase Client SDK was used directly to create `likes`, `matches`, `chats`, and `notifications`. SMTP credentials and API keys were stored in frontend environment variables (visible to browser builds). Audit logs were written directly to Firestore from the browser.

This created several security and reliability problems:

1. **Security rules were the only enforcement layer.** Any bypass in the rules (e.g., null-value errors, `exists()` vs `existsAfter()` misuse) could allow fraudulent data creation.
2. **No server-side audit trail.** Browser-written audit logs could be omitted or falsified by a malicious client.
3. **SMTP credentials in frontend env.** `RESEND_API_KEY` was in `frontend/.env` — exposed to anyone who inspected the Vite bundle.
4. **Transaction complexity in client.** The Like→Match→Chat atomic transaction was running in the browser, where rule evaluation order caused systematic `permission-denied` errors (existsAfter() vs exists() issue with atomic writes).
5. **No email enumeration protection.** Password reset returned different responses for existing vs. non-existing emails.

## Decision

Move all security-sensitive writes to the Fastify backend (Fly.io), which authenticates to Firebase with the Admin SDK (bypasses all Firestore security rules). The frontend becomes a presentation layer only.

### Ownership Model

| Collection | Creator | Firestore Rule |
|---|---|---|
| `likes` | `MatchService` (backend) | `allow create: if false` |
| `matches` | `MatchService` (backend) | `allow create: if false` |
| `chats` | `MatchService` (backend) | `allow create: if false` |
| `notifications` | `NotificationService` (backend) | `allow create: if false` |
| `auditLogs` | `AuditService` (backend) | `allow create: if false` |
| `messages` | Frontend (verified student, participant only) | `allow create: if isVerifiedStudent() && isParticipant()` |
| `profiles` | Frontend (owner only) | `allow create/update: if isOwner()` |
| `listings` | Frontend (host only) | `allow create: if isVerifiedStudent()` |
| `reports` | Frontend (any verified student) | `allow create: if isVerifiedStudent()` |
| `otps` | Frontend (own email only) | `allow read, write: if isSignedIn() && email == request.auth.token.email` |

### What the frontend retains write access to

- Own `profile`, `user`, `profilePreview` documents
- Own `listings`
- `messages` subcollection (within authorized chats)
- `reports` creation
- `otps` (2FA — deferred to separate sprint)
- Marking notifications as `isRead`

### What the frontend loses write access to

- `likes` creation
- `matches` creation
- `chats` creation
- `notifications` creation
- `auditLogs` creation

## Communication Provider Abstraction

The previous `CommunicationService` was tightly coupled to `SMTPProvider`. The refactored architecture:

```
CommunicationDispatcher
  → IEmailProvider interface
    → SMTPProvider (current: Brevo via nodemailer)
    → [Future] ResendProvider
    → [Future] SESProvider
    → [Future] MailgunProvider
```

Switching providers requires:
1. Creating a new file implementing `IEmailProvider`
2. Setting `EMAIL_PROVIDER=resend` (or similar) in `backend/.env`
3. No changes to business logic, routes, or dispatch calls

## Email Enumeration Prevention

`POST /auth/password-reset` now always returns `200` with the same body:
```json
{ "success": true, "message": "If that email is registered, a reset link has been sent." }
```

Errors are logged server-side. The reset link is generated and emailed without being returned to the client.

## Port Separation

| Service | Port | Environment |
|---|---|---|
| Firebase Emulator (Firestore) | 8080 | Local only |
| Firebase Emulator (Auth) | 9099 | Local only |
| Fastify Backend | 3001 | Local |
| Fastify Backend | 8080 | Production (Fly.io) |

## Consequences

**Positive:**
- Firestore security rules are now a defense-in-depth layer, not the primary enforcement layer.
- All security-sensitive actions produce immutable server-side audit trails.
- SMTP credentials never touch the frontend.
- The Like→Match→Chat flow is now a single atomic backend transaction — no more permission-denied from nested writes.
- Future email provider migration requires zero business logic changes.

**Negative / Tradeoffs:**
- An extra network hop (frontend → backend → Firestore) is added to the like flow. Acceptable: the latency is ~50-100ms on Fly.io.
- The `GlobalListeners.tsx` no longer creates notification documents for incoming messages and matches. The backend's message handler will need to be extended in a future sprint to create those notifications server-side.
- 2FA OTP creation in `twoFactorService.ts` remains client-side (deferred to a dedicated 2FA sprint).
- `appeals` writes remain client-side — the backend does not yet have an appeal endpoint.

## Known Remaining Risks (Deferred)

| Risk | Mitigation Plan |
|---|---|
| 2FA OTP generated and stored client-side | Dedicated sprint: move OTP generation to `/api/v1/auth/2fa/send` |
| `appeals` written directly to Firestore | Future sprint: `POST /api/v1/appeals` endpoint |
| Message notifications still client-absent | Future sprint: backend message handler creates notification |
| `viewCount` increment on listings is client-side | Low risk — non-security-sensitive counter |
