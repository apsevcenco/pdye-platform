# Private Distressed Yacht Exchange (PDYE)

## Overview

The Private Distressed Yacht Exchange (PDYE) is a B2B off-market platform designed for exclusive yacht transactions. It facilitates a two-stage process for buyers to access yacht specifications and then enter secure deal rooms. The platform aims to streamline the sales process for distressed yacht assets, connecting private buyers, brokers, and owners.

## User Preferences

I prefer concise and direct communication. When making changes, prioritize iterative development and explain the rationale for significant architectural decisions. Ask for confirmation before implementing major structural changes or deploying new features. Ensure code is well-documented, especially for complex business logic.

## System Architecture

The project is a pnpm workspace monorepo utilizing TypeScript.

**Frontend (artifacts/pdye):**
-   **Framework:** React with Vite.
-   **Styling:** Tailwind CSS for a dark navy (`#0a1426`) and gold (`#c8a46b`) color scheme, using self-hosted fonts.
-   **Routing:** Wouter for hash-based routing (`/#/path`).
-   **Key Pages:** Includes public informational pages, protected dashboards, yacht listings, and dedicated admin interfaces for user management, access requests, and deal room oversight.
-   **Two Layout Wrappers:**
    -   `Layout` (`components/layout/Layout.tsx`) — marketing chrome: fixed top `Navbar` + `Footer`. Used on public pages (`Home`, `Brokers`, `Investors`, `BoatOwners`, `Valuation`, `Access`, `Login`, etc.).
    -   `CabinetLayout` (`components/layout/CabinetLayout.tsx`) — closed cabinet chrome: fixed left sidebar with role-aware nav items + sticky top bar (currency selector, user email + role). No marketing menu. Logout lives in sidebar footer; admins additionally get a "View public site" link back to `/`. Mobile uses a drawer. Used on all logged-in pages: `Dashboard`, `Profile`, `Yachts`, `DealRoom`, `DealDetails`, `AddYacht`. Sidebar items per role:
        -   **Buyer/Investor:** Dashboard · Yacht Catalog · Deal Rooms · Profile
        -   **Owner/Broker:** Dashboard · Yacht Catalog · Add Yacht · Deal Rooms · Profile
        -   **Admin:** Admin Panel · Users · Access Requests · Yachts · Deal Rooms · Platform NDA · Deal NDA · Commission · Profile + "View public site"
    -   Existing admin sub-pages (`Admin`, `AdminUsers`, `AdminRequests`, `AdminUserDetail`, `AdminPlatformNda`, `AdminDealNda`, `AdminDealCommission`, `AdminYachtReview`) keep their own custom chrome (no Layout wrapper); the CabinetLayout sidebar's admin items link directly to them.
-   **UI Components:** Features a `WordToolbar` for rich text editing with shared styling for yacht specifications, saved in local storage.
-   **Platform NDA Gate:** All non-admin users must sign a platform-level NDA before accessing internal sections. This involves an in-app electronic signature process, generating a PDF, and emailing it to the user.

**Backend (artifacts/api-server):**
-   **Framework:** Express 5 API server.
-   **Core Functionality:** Handles yacht photo uploads, market price estimations, public valuations, NDA processing (send, sign, status, webhooks), lead approval, access request rejection, and comprehensive CRUD operations for deal rooms, participants, messages, and documents.
-   **Deal Flow Logic:** Implements a two-stage access and deal flow:
    1.  **Spec Access:** Initial limited yacht browsing, followed by access requests and admin approval to view anonymized full specifications.
    2.  **Deal Room (Dual-Gate):** Manual admin creation of deal rooms from approved requests. This involves a multi-stage process with NDA signing by both buyer and seller (Gate 1), followed by commission agreement signing (Gate 2), leading to full identity reveal and active deal room status. Block-level visibility controls allow admins to manage access to specific deal room sections.
-   **Audience-Aware Commission Templates:** The Commission Agreement supports two simultaneously-active templates differing only in commission percentage: `broker` (used when seller is a broker) and `owner` (used when seller is the yacht owner directly). Schema: `deal_commission_documents.audience text NOT NULL DEFAULT 'broker'`, composite unique on `(version, audience)`, partial unique index `(audience) WHERE is_active = true` (one active per audience). Migration auto-seeds an `owner` v1.0 cloned from `broker` v1.0 — admin edits the owner % afterwards. Audience is resolved server-side from the deal room's `seller_user_id` → Supabase `users.role` (default `broker`) by `resolveAudienceForRoom()`. Endpoints: `GET /deal-commission/document?roomId=…|?audience=…` returns the right template; `POST /deal-rooms/:id/commission/sign` validates against the room's audience-specific active doc; admin `GET /admin/deal-commission` returns `{ broker: {active, history}, owner: {active, history} }`; admin `PUT /admin/deal-commission` requires `audience` and only deactivates that audience's previous active doc. `AdminDealCommission.tsx` shows audience tabs (Broker / Owner); the editor pre-fills with the selected audience's active content. `CommissionSigningForm` in `DealDetails.tsx` passes its `roomId` to `getDocument({ roomId })`.
-   **Admin Client Dossier:** A dedicated admin interface (`/admin/users/:id`) aggregates all client information, including identity, contact details, application profile, Platform NDA status with PDF download, and a **Client History** section showing the user's listings (yachts where `owner_id` matches, for owners/brokers), access requests (`access_requests.requester_id`, for buyers/investors), and deal rooms (`dealRoomApi.byUser`, for everyone, with role badge buyer/seller and link to `/dealroom/:id`).
-   **Owner Listing Workflow (mirrors broker):** Owners use the same `ListingsDashboard` as brokers (no separate `OwnerDashboard`). New listings created via `AddYacht` are inserted as `draft` and immediately auto-submitted to `pending` via `yachtModerationApi.submit()` — no second click required. The dashboard's Submit/Resubmit button still appears for `draft` (legacy / auto-submit fallback) and `rejected` (after admin requests changes); deal rooms are admin-only.
-   **Broker Application Form (`Brokers.tsx`):** Public form has fields Name, Email, Phone/WhatsApp, Agency/Company, Address, Broker License/MLS, Years of Experience, Partnership Type, Additional Info. Submits to `leads` writing `company` and `location` (from Address) directly; falls back to embedding Company/Address in `message` if those columns don't exist. On admin approval (`/api/leads/:id/approve`), `lead.location` and `lead.company` are mapped to `users.location` and `users.company`, surfacing in `AdminUserDetail` Contact panel.
-   **User Management:** Provides admin tools for archiving and deleting users with preflight checks for dependent records to prevent data loss.

**Database Architecture:**
-   **Dual Database System:**
    -   **Supabase (PostgreSQL):** Used for core authentication (`auth.users`) and primary platform data (`users`, `yachts`, `access_requests`, `leads`, `introductions`).
    -   **Replit's Local PostgreSQL (heliumdb):** Manages sensitive deal-specific data (`deal_rooms`, `deal_room_participants`, `deal_room_documents`, `deal_room_messages`, `deal_room_blocks`, `nda_envelopes`, `audit_logs`, `platform_nda_documents`, `platform_nda_signatures`, `deal_nda_documents`, `deal_nda_signatures`). Access to these tables is exclusively via the API server.
-   **Data Consistency:** `dealRoomApi` abstracts interaction with the API server for deal room data.
-   **NDA Management:** Both platform-level and per-deal-room NDAs are versioned, hashed, and stored, with associated signature records. PDF generation for signed NDAs uses `pdfkit` and a custom font.

**Monorepo Structure:**
-   `artifacts/pdye/`: Frontend application.
-   `artifacts/api-server/`: Backend API.
-   `artifacts/mockup-sandbox/`: Component preview server.

## External Dependencies

-   **Database:** Supabase (PostgreSQL), Replit's local PostgreSQL (heliumdb).
-   **Authentication:** Supabase Auth.
-   **Email Service:** Resend for sending transactional emails (welcome, rejection, signed NDAs).
-   **PDF Generation:** `pdfkit` library for server-side PDF creation of signed NDAs.