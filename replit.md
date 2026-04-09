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

## Supabase Tables

- **users**: id, email, role (buyer/broker/owner/admin), approved, created_at
- **yachts**: Full yacht data with images, specs, pricing
- **access_requests**: yacht_id, requester_id, role, status (pending/approved/rejected)
- **deals**: Workflow pipeline — yacht_id, buyer_id, broker_id, owner_id, status (created → pending_admin_review → approved → nda_pending → nda_signed → intro_sent → active → closed/cancelled), NDA/terms acceptance, intro lock, deal_room_enabled
- **deal_documents**: Files visible inside deal room with role-based visibility
- **deal_messages**: Internal communication inside deal room
- **deal_activity_logs**: Audit trail for all deal actions
- **deal_participants**: Explicit access control per deal
- **nda_acceptance_logs**: Legal confirmation records
- **leads**: Public form submissions
- **introductions**: Formal introduction records

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

### Deal Flow (Core Business Logic)

1. Buyer browses limited yacht catalog (builder, length, year, 1 photo only)
2. Clicks "Request Details" → creates access_request + deal (pending_admin_review)
3. Admin reviews → approves (→ nda_pending) or rejects
4. Buyer signs NDA + Terms → nda_signed
5. Admin sends intro (intro_locked) → intro_sent
6. Admin enables deal room → active
7. Full deal room access: documents, messages, deal details

### User Roles

- `buyer` (displayed as "Private Buyer" in UI)
- `broker`
- `owner`
- `admin`

### Key Files

- `src/App.tsx` — Router, providers, font loader
- `src/context/AuthContext.tsx` — Auth state with race-condition protection
- `src/pages/Admin.tsx` — Admin panel with all sub-views (2400+ lines)
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
- **RLS disabled** on access_requests and users tables (supabaseAdmin uses anon key)
- **SQL migration** at `migrations/001_deal_flow.sql` must be run in Supabase SQL Editor

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
