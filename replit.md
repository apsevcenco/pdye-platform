# Private Distressed Yacht Exchange (PDYE)

## Overview

Private B2B off-market yacht platform. pnpm workspace monorepo using TypeScript. Supabase for auth + database.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Frontend**: React + Vite + Tailwind CSS + Wouter (hash routing)
- **Backend**: Express 5 API server
- **Database**: Supabase (PostgreSQL) — `zpvisupiqrtjllavblim.supabase.co`
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS, self-hosted fonts, dark navy (#0a1426) + gold (#c8a46b)

## Database Architecture (DUAL DB)

### Supabase Tables (via Supabase REST API)
- **users**: id, email, role (investor/broker/owner/admin), approved, created_at
- **yachts**: Full yacht data with images, specs, pricing
- **access_requests**: yacht_id, requester_id, role, status (pending → approved_spec → rejected → escalated → archived)
- **leads**: Public form submissions
- **introductions**: Formal introduction records

### Replit PG Tables (via API server at /api/deal-rooms/*)
- **deal_rooms**: yacht_id, buyer_user_id, seller_user_id, status (draft → nda_pending → partially_signed → active → closed/cancelled), dual NDA tracking, room_number (serial DR-XXXXXX), archived flag, commission fields (buyer/seller_commission_status, commission_status, commission_fully_signed_at, identities_revealed)
- **deal_room_participants**: deal_room_id, user_id, role, can_view, can_message, can_download
- **deal_room_documents**: deal_room_id, uploaded_by, file_name, file_url, visible_to_roles
- **deal_room_messages**: deal_room_id, sender_id, message, is_system
- **deal_room_blocks**: deal_room_id, block_key (specs/photos/documents/chat/location/yacht_name/identities), is_unlocked, unlocked_by, unlocked_at — per-block admin visibility controls
- **nda_envelopes**: deal_room_id, user_id, side (buyer/seller), provider, status, envelope_id, sent_at, signed_at
- **audit_logs**: entity_type, entity_id, user_id, action, meta

Frontend accesses deal room tables exclusively via `dealRoomApi` (`src/lib/dealRoomApi.ts`) which calls the API server.

## Key Environment Variables

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/publishable key
- `VITE_SUPABASE_SERVICE_ROLE_KEY` — Actually the anon key (frontend safe)
- `SUPABASE_SERVICE_ROLE_KEY` — Real service role key (API server only)

## Architecture

### Frontend (artifacts/pdye)

React + Vite app with hash routing (`/#/path`).

**Public pages**: Home, Boat Owners, Brokers, Private Buyers, Access, Valuation
**Protected pages**: Yachts, Dashboard, DealRoom, DealDetails, AddYacht
**Admin pages**: Admin (sidebar nav with sub-views), AdminUsers, AdminRequests

### API Server (artifacts/api-server)

Express on port 8080. Routes:
- `/api/health` — health check
- `/api/upload-photo` — yacht photo upload to Supabase Storage
- `/api/estimate-market-price` — Algorithmic yacht market price estimation
- `/api/valuation` — Public yacht valuation (algorithmic, no AI dependency)
- `/api/nda/*` — NDA send/sign/status/webhook endpoints
- `/api/deal-rooms` — CRUD for deal rooms (list, get, create, update, delete)
- `/api/deal-rooms/by-user/:userId` — rooms by participant
- `/api/deal-rooms/:id/participants` — participant CRUD
- `/api/deal-rooms/:id/messages` — message list/send
- `/api/deal-rooms/:id/documents` — document list
- `/api/deal-room-documents` — all documents list + delete
- `/api/deal-room-messages-all` — recent messages list + delete
- `/api/deal-rooms/:id/blocks` — GET/PUT block visibility per key
- `/api/deal-rooms/:id/archive` — PATCH archive/unarchive
- `/api/deal-rooms/:id/commission/send` — POST send commission agreement
- `/api/deal-rooms/:id/commission/sign` — POST sign commission (auto-reveals identities when both signed)
- `/api/nda-envelopes` — create NDA envelope
- `/api/audit-logs` — create + list by entity

### Access & Deal Flow (Core Business Logic — Two-Stage)

**Stage 1: Spec Access**
1. Buyer browses limited yacht catalog (builder, length, year, 1 photo only)
2. Clicks "Request Details" → creates access_request (status: pending)
3. Admin reviews → approves to spec access (status: approved_spec) or rejects
4. Buyer gets anonymized spec view: full tech specs but name/location/gallery/seller hidden

**Stage 2: Deal Room (Dual-Gate)**
5. Admin manually creates deal_room from approved request (status: escalated on request)
6. Deal room created (status: draft), participants assigned, DR-XXXXXX ID assigned
7. Admin sends NDA to both parties → status: nda_pending (Gate 1)
8. Each party signs NDA independently → partially_signed → active (auto-activates when both signed)
9. Deal room access with block-level visibility (admin controls which sections are visible)
10. Admin sends Commission Agreement → commission_status: pending (Gate 2)
11. Each party signs Commission → when both signed: identities_revealed=true, identity blocks auto-unlocked
12. Full identity reveal: yacht name, location, participant emails visible

### User Roles

- `buyer` (displayed as "Private Buyer" in UI)
- `broker`
- `owner`
- `admin`

### Key Files

- `src/App.tsx` — Router, providers, font loader
- `src/context/AuthContext.tsx` — Auth state with race-condition protection
- `src/components/ui/WordToolbar.tsx` — Word-like formatting toolbar (font, size, B/I/U/S, color, align) + shared spec styles
- `src/pages/Admin.tsx` — Admin panel with all sub-views (2700+ lines)
- `src/pages/DealRoom.tsx` — User's deal list with status cards
- `src/pages/DealDetails.tsx` — Full deal room (timeline, NDA, docs, messages)
- `src/pages/Dashboard.tsx` — Role-specific dashboards
- `src/pages/Yachts.tsx` — Yacht catalog with request flow
- `src/lib/dealTypes.ts` — Deal flow types and status config
- `src/lib/legalText.ts` — Centralized NDA, Terms, disclaimer text
- `src/lib/supabase.ts` — Supabase anon client
- `src/lib/supabaseAdmin.ts` — Supabase admin client (uses anon key on frontend)

### Important Notes

- **users table has NO `full_name` column** — only id, email, role, approved, created_at, name, phone, company, budget, yacht_type, location, notes
- **Two databases**: Supabase (auth + `users` profile) and Replit's local PostgreSQL `heliumdb` (DATABASE_URL — `deal_rooms`, `deal_room_*`, `nda_envelopes`, `audit_logs`, `platform_nda_documents`, `platform_nda_signatures`)
- **Internal role value `investor`** is displayed as "Private Buyer" in UI
- **Hash routing** — all routes use `/#/path` format
- **Currency switching** — €/$/£ with useCurrency hook
- **WordToolbar** — Full MS Word-like formatting panel on all text editors (CMS, yacht description). Yacht specs use ONE shared toolbar that styles ALL spec inputs at once (font, size, bold, etc.). Settings saved to localStorage key `pdye_spec_styles`.
- **RLS disabled** on access_requests and users tables (supabaseAdmin uses anon key)
- **SQL migrations** at `migrations/001_deal_flow.sql` and `migrations/002_access_workflow.sql` must be run in Supabase SQL Editor
- **Auto-migrations** in heliumdb: `dealRoomsApi.ts` and `platformNda.ts` run schema migrations + seeds on first DB access (eager-triggered on module load via `setImmediate`); seeds use `ON CONFLICT DO NOTHING`

### Platform NDA Onboarding Gate (in-app electronic signature)

- **Goal**: every non-admin user must sign a platform-level NDA before accessing the personal cabinet (profile, dashboard, deal rooms, etc.). Admins are pre-signed by policy.
- **Backend** (`artifacts/api-server/src/routes/platformNda.ts`):
  - Tables in heliumdb: `platform_nda_documents` (versioned, content_hash, is_active), `platform_nda_signatures` (user_id, user_email, signature_name, document_id, document_version, document_hash, ip, user_agent, signed_at)
  - Initial NDA v1.0 seeded automatically (English, ~6.6k chars, 10 sections)
  - Endpoints: `GET /api/platform-nda` (active doc), `GET /api/platform-nda/me` (signed status), `POST /api/platform-nda/sign` (sign — requires `document_id` + `content_hash` to detect mid-session version-publish; returns 409 `PLATFORM_NDA_VERSION_CHANGED` on mismatch), `GET /api/admin/platform-nda` (versions), `PUT /api/admin/platform-nda` (publish new version), `GET /api/admin/platform-nda/signatures` (audit log)
  - Exports `requirePlatformNdaSigned` middleware — chained AFTER `requireUser` on non-admin user-facing routes; returns 403 `PLATFORM_NDA_NOT_SIGNED` for unsigned non-admins; admin bypass automatic
  - Currently applied to: all non-admin endpoints in `dealRoomsApi.ts` (deal rooms list/by-user, participants/messages/documents/blocks GET, messages POST, commission/sign POST, audit-logs GET/POST). Apply to other sensitive non-admin endpoints as they're added.
- **Frontend**:
  - `AuthContext.tsx` fetches NDA status via `/platform-nda/me` after login; admins auto-treated as signed
  - `ProtectedRoute` in `App.tsx` redirects unsigned non-admin users to `/platform-nda` (uses `skipNdaGate` prop on the `/platform-nda` route to avoid infinite redirect)
  - `pages/PlatformNda.tsx`: shows NDA text in scrollable preview, 3 acknowledgement checkboxes, full-name signature input with Georgia italic preview; sends `document_id` + `content_hash` on submit
  - `pages/AdminPlatformNda.tsx`: edit/publish new versions + version history + signature audit log
  - Admin nav link in `Admin.tsx`
- **Phase 2 (DONE)**: calligraphic Great Vibes signature font + PDF generation + Resend email of signed PDF
  - PDF: `src/lib/ndaPdf.ts` uses `pdfkit` with Great Vibes TTF (`src/assets/fonts/GreatVibes-Regular.ttf`, copied to `dist/assets/fonts/` by `build.ts`); `bufferPages: true` for consistent footers; full NDA body rendered with bold section headers + audit block (printed name, email, UTC time, IP, UA, doc version, doc hash) + pre-signed PDYE Holdings counterparty block.
  - Endpoint: `GET /api/platform-nda/signature/:id/pdf` (auth: signer or admin); streams `application/pdf` with `Content-Disposition: attachment` and proper `Content-Length`.
  - Email: `POST /platform-nda/sign` fires-and-forgets `sendSignedNdaEmail()` which builds the PDF and sends via Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL` default `PDYE <onboarding@resend.dev>`); HTML body matches PDYE branding (navy + gold); attaches PDF as base64; **email failure does NOT fail the sign request** (logged-only).
  - Frontend: `PlatformNda.tsx` injects Google Fonts `Great Vibes` for live signature preview + post-sign download button via `platformNdaApi.downloadSignedPdf()` (authenticated `fetch` → blob → `URL.createObjectURL`). `AdminPlatformNda.tsx` audit log shows signed names in Great Vibes + per-row authenticated PDF download. Helper `triggerBlobDownload()` in `platformNdaApi.ts`.
  - Important: `<a href>` cannot pass bearer tokens to the API; ALL signed-PDF downloads MUST use `platformNdaApi.downloadSignedPdf()` + `triggerBlobDownload()`.

### Admin Client Dossier (`/admin/users/:id`)

- **Goal**: in the admin panel each user-category row (Investors / Brokers / Owners) acts as the master client card. Clicking the row opens a dedicated full-page dossier that aggregates everything known about the client.
- **Page**: `pages/AdminUserDetail.tsx` — admin-only route; hash-based path `/#/admin/users/:id`.
- **Sections**:
  1. Identity header — avatar, name, email, role badge (broker/owner/buyer), approval status, Approve/Revoke action.
  2. Contact & Profile — name, email (read-only), phone, company, location, registered. Inline Edit/Save/Cancel writes back to `users` table via `supabaseAdmin`.
  3. Application Profile — `yacht_type`, `budget`, notes (read-only mirror).
  4. Platform NDA — signed/not-signed badge, version, signed_at (UTC, RU locale), printed name, IP, document hash, UA. Per-signature **Download PDF** button using `platformNdaApi.downloadSignedPdf()` + `triggerBlobDownload()`. Pulls all signatures via `platformNdaApi.adminListSignatures()` and filters by `user_id` OR case-insensitive `user_email`.
  5. Placeholder card for upcoming sections: deal rooms, deal-level NDAs, commission agreements, activity history.
- **Navigation**:
  - Top bar with **Back** button → `/admin`, plus a refresh button.
  - Row clicks in `Admin.tsx` `InvestorsView` / `BrokersView` / `OwnersView` use `setLocation(\`/admin/users/${user.id}\`)`. Quick approval buttons keep `e.stopPropagation()` so they don't navigate.
- **Note**: the legacy in-place sidebar code in those three views is now unreachable (kept temporarily for diff size — TODO: remove after the new flow is confirmed in production).

### User Archive & Delete (admin)

- **Schema**: migration `artifacts/pdye/migrations/003_users_archived.sql` adds `archived BOOLEAN DEFAULT false` + `archived_at TIMESTAMPTZ` + index on `users` table. **Must be run manually in Supabase SQL Editor** before Archive/Restore work (DATABASE_URL is heliumdb, not supabase). Delete works without it.
- **Centralized helpers** in `src/lib/userAdminActions.ts`:
  - `archiveUserAction(userId, archive)` → `{ ok, error?, errorKind? }`. Detects Postgres error code `42703` / "column does not exist" and returns `errorKind: "migration_missing"` with a friendly hint pointing to migration 003.
  - `countUserReferences(userId)` → `{ counts: [{label, count}], total }` — counts rows in dependent tables (`access_requests`, `deal_participants`, `deal_room_participants`, `deal_rooms` × buyer/seller/listing_owner, `nda_envelopes`, `audit_logs`). Tables that don't exist or other query errors are silently skipped (we only block on positively-counted refs).
  - `deleteUserAction(userId)` → `{ ok, error?, errorKind? }`. Runs the preflight count first; if any references exist, refuses with `errorKind: "has_references"` and a list of counts plus an "Archive instead" recommendation. Otherwise issues the `users` delete.
- **Per-row buttons** (Investors / Brokers / Owners): Approve · Archive/Restore · Delete sit next to each other; all use `e.stopPropagation()` so the row click still navigates to the dossier. Delete first runs the preflight, surfaces an alert with linked-record counts if any, otherwise asks for final confirmation.
- **Show-archived toggle** in each view header (top-right). Default hidden; archived rows render at 50% opacity with an "Archived" badge.
- **Filter chains**:
  - Investors / Owners: `baseUsers = showArchived ? users : users.filter(u => !u.archived)` then existing `filter` (all/approved/pending) applies on top.
  - Brokers: `visibleUsers = showArchived ? users : users.filter(u => !u.archived)` (no approve filter).
- **Mirrored in `AdminUserDetail.tsx`**: identity header has Approve · Archive/Restore · Delete using the same shared helpers; "Archived" badge appears next to approval badge when applicable; Delete navigates back to `/admin` on success.

## Structure

```text
artifacts/
├── pdye/                  # Main frontend app
│   ├── src/
│   │   ├── components/    # UI components (layout, ui)
│   │   ├── context/       # AuthContext
│   │   ├── lib/           # Supabase clients, types, legal text, data
│   │   └── pages/         # All page components
│   └── migrations/        # SQL migrations for Supabase
├── api-server/            # Express API server
└── mockup-sandbox/        # Component preview server
```
