# 🏠 Roomie Finder

Roomie Finder is a secure, compatibility-driven student roommate matching platform. It pairs TUK students based on lifestyle overlap, mutual housing goals, and verified identity rather than raw listing search.

This project is built on a **Service-Oriented Architecture (SOA)**, separating the presentation layer (untrusted client) from the operational layer (trusted backend). 

---

## Architecture Overview

Roomie Finder is divided into two primary systems:

### 1. The Untrusted Client (Frontend)
- **Role:** Presentation, routing, and user interaction.
- **Tech:** React 18, Vite, TypeScript, Tailwind CSS, Zustand.
- **Rules:** The frontend cannot generate secure tokens, send emails directly, perform privileged database operations, or determine its own authorization level. It relies purely on Firebase Authentication for user sessions and passes identity tokens to the backend.

### 2. The Trusted Execution Environment (Backend)
- **Role:** Orchestration, authorization, and secure communications.
- **Tech:** Node.js 22 LTS, Fastify, TypeScript, Zod (validation), Pino (logging).
- **Rules:** The backend owns all confidential operations. It validates Firebase ID tokens via the Firebase Admin SDK and manages:
  - **Identity Lifecycle:** Generating email verification and password reset links securely.
  - **Communications:** Operating the SMTP abstraction layer (Brevo/Resend/SES) to send templated emails.
  - **Administrator Provisioning:** Securely handling the lifecycle of administrative invitations and Role-Based Access Control (RBAC).
  - **Audit Trails:** Writing immutable logs for all privileged and sensitive actions.

### 3. The Core Infrastructure (Firebase & Cloudinary)
- **Authentication:** Firebase Authentication serves as the system of record for identity.
- **Database:** Firestore serves as the primary data store, with strict Security Rules applied at the database level.
- **Media:** Cloudinary handles image and avatar uploads via unsigned presets.

---

## Project Structure

```txt
roomiefinder/
├── roomie-finder/           # Frontend (React + Vite)
│   ├── src/components/      # UI components and layout
│   ├── src/pages/           # Routing and page-level orchestration
│   ├── src/firebase/        # Untrusted Firestore reads/writes
│   └── src/store/           # Client-side state (Zustand)
│
└── roomiefinder-backend/    # Backend (Fastify)
    ├── src/controllers/     # Request/Response orchestration
    ├── src/middleware/      # Token validation & Rate Limiting
    ├── src/routes/          # Fastify endpoints and Zod schemas
    ├── src/services/        # Firebase Admin, Communications, Audit
    └── src/providers/       # Interchangeable SMTP Providers
```

---

## Security & Trust Model

Roomie Finder enforces the principles of **Security, Accountability, and Reliability**:

- **Permission-Based Authorization:** Instead of simple role checks, access is governed by granular permissions (e.g., `CREATE_ADMIN`, `SUSPEND_USERS`).
- **Immutable Auditing:** Every privileged action generates a correlation-tracked, immutable record in Firestore.
- **Zero-Trust Client:** Frontend claims are ignored. Authorization is evaluated exclusively by the backend and enforced by Firestore Security Rules.
- **Mandatory 2FA:** Administrative accounts are strictly gated behind Two-Factor Authentication.

---

## Getting Started

### Prerequisites
- Node.js 22 LTS
- Firebase Project (Auth & Firestore enabled)
- Cloudinary Account
- SMTP Provider (e.g., Brevo)

### Running the System Locally

*(Detailed steps will be populated as the monorepo/workspace setup is finalized.)*

1. Clone the repository.
2. Install dependencies for both the frontend and backend.
3. Configure `.env` files for both projects using the provided `.env.example` templates.
4. Run the development servers concurrently.

---

## Documentation

- The backend exposes comprehensive OpenAPI documentation. When running locally, visit `http://localhost:<PORT>/documentation` to explore the API endpoints, schemas, and authentication requirements via Swagger UI. 
- Ensure all backend API requests include a valid `Authorization: Bearer <Firebase_ID_Token>` header.
