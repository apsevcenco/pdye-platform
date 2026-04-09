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
- **deal_rooms**: yacht_id, buyer_user_id, seller_user_id, status (draft → nda_pending → partially_signed → active → closed/cancelled), dual NDA tracking
- **deal_room_participants**: deal_room_id, user_id, role, can_view, can_message, can_download
- **deal_room_documents**: deal_room_id, uploaded_by, file_name, file_url, visible_to_roles
- **deal_room_messages**: deal_room_id, sender_id, message, is_system
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
- `/api/estimate` — AI yacht valuation
- `/api/nda/*` — NDA send/sign/status/webhook endpoints
- `/api/deal-rooms` — CRUD for deal rooms (list, get, create, update, delete)
- `/api/deal-rooms/by-user/:userId` — rooms by participant
- `/api/deal-rooms/:id/participants` — participant CRUD
- `/api/deal-rooms/:id/messages` — message list/send
- `/api/deal-rooms/:id/documents` — document list
- `/api/deal-room-documents` — all documents list + delete
- `/api/deal-room-messages-all` — recent messages list + delete
- `/api/nda-envelopes` — create NDA envelope
- `/api/audit-logs` — create + list by entity

### Access & Deal Flow (Core Business Logic — Two-Stage)

**Stage 1: Spec Access**
1. Buyer browses limited yacht catalog (builder, length, year, 1 photo only)
2. Clicks "Request Details" → creates access_request (status: pending)
3. Admin reviews → approves to spec access (status: approved_spec) or rejects
4. Buyer gets anonymized spec view: full tech specs but name/location/gallery/seller hidden

**Stage 2: Deal Room**
5. Admin manually creates deal_room from approved request (status: escalated on request)
6. Deal room created (status: draft), participants assigned
7. Admin sends NDA to both parties → status: nda_pending
8. Each party signs NDA independently → partially_signed → active (auto-activates when both signed)
9. Full deal room access: documents, messages, full yacht details, seller identity revealed

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

- **users table has NO `full_name` column** — only id, email, role, approved, created_at
- **Internal role value `investor`** is displayed as "Private Buyer" in UI
- **Hash routing** — all routes use `/#/path` format
- **Currency switching** — €/$/£ with useCurrency hook
- **WordToolbar** — Full MS Word-like formatting panel on all text editors (CMS, yacht description). Yacht specs use ONE shared toolbar that styles ALL spec inputs at once (font, size, bold, etc.). Settings saved to localStorage key `pdye_spec_styles`.
- **RLS disabled** on access_requests and users tables (supabaseAdmin uses anon key)
- **SQL migrations** at `migrations/001_deal_flow.sql` and `migrations/002_access_workflow.sql` must be run in Supabase SQL Editor

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
