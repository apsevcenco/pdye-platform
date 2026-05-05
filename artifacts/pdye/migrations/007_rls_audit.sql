-- ============================================================
-- PDYE — Row-Level Security Audit (Migration 007)
-- ============================================================
-- Locks down every public.* table so a malicious caller using the
-- public anon key (or a logged-in user's JWT) cannot read or write
-- data they should not see.
--
-- Run once in: Supabase SQL Editor → New query → paste → Run.
--
-- SAFETY:
--   * Idempotent: every CREATE/DROP uses IF (NOT) EXISTS.
--   * The Supabase service-role key (used by the api-server) bypasses
--     RLS automatically — server-side code is unaffected.
--   * Existing weak policies (e.g. "Authenticated users see all" on
--     yachts) are explicitly dropped so they cannot leak data.
--
-- After running, verify with:
--   SELECT tablename, rowsecurity
--     FROM pg_tables
--    WHERE schemaname = 'public'
--    ORDER BY tablename;
--   -- expect rowsecurity = true for every row.
--
--   SELECT tablename, count(*) AS n_policies
--     FROM pg_policies
--    WHERE schemaname = 'public'
--    GROUP BY tablename
--    ORDER BY tablename;
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 0) Helper: is_admin(uid)  — SECURITY DEFINER so it can read
--    public.users without itself being blocked by RLS.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = uid AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated, service_role;


-- ─────────────────────────────────────────────────────────────
-- 1) Enable RLS on every table that holds user data.
--    (No-op if already enabled.)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.users                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yachts                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.introductions               ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.deals                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_participants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_documents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_activity_logs          ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.deal_rooms                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_room_participants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_room_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_room_documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_room_blocks            ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.nda_envelopes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nda_acceptance_logs         ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.platform_nda_documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_nda_signatures     ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.deal_nda_documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_nda_signatures         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_commission_documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_commission_signatures  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.audit_logs                  ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────
-- 2) Drop legacy / weak policies so they cannot accidentally
--    keep granting wide access.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public yachts visible"           ON public.yachts;
DROP POLICY IF EXISTS "Authenticated users see all"     ON public.yachts;

-- Drop any prior policies we are about to re-create so this script can
-- be re-run safely after edits.
DO $do$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND policyname LIKE 'rls_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                   r.policyname, r.schemaname, r.tablename);
  END LOOP;
END
$do$;


-- ─────────────────────────────────────────────────────────────
-- 3) public.users
--   * Each user reads / updates their OWN row only.
--   * Admins read everyone; admins update everyone.
--   * INSERT is allowed for the matching auth.uid() (used by
--     register flow that upserts the profile).
--   * DELETE is admin-only.
--   * `role` and `approved` cannot be changed from the client
--     (enforced by trigger below; bypassed by service_role).
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_users_select_self        ON public.users
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY rls_users_select_admin       ON public.users
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY rls_users_insert_self        ON public.users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY rls_users_update_self        ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY rls_users_update_admin       ON public.users
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY rls_users_delete_admin       ON public.users
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));


-- Trigger: prevent non-admin / non-service-role callers from
-- changing privilege columns (role, approved, archived).
CREATE OR REPLACE FUNCTION public.protect_user_privilege_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role     text;
  jwt_user_txt text;
  jwt_user     uuid;
  caller_admin boolean := false;
BEGIN
  BEGIN
    jwt_role     := current_setting('request.jwt.claims', true)::json->>'role';
    jwt_user_txt := current_setting('request.jwt.claims', true)::json->>'sub';
    IF jwt_user_txt IS NOT NULL AND jwt_user_txt <> '' THEN
      jwt_user := jwt_user_txt::uuid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    jwt_role := NULL; jwt_user := NULL;
  END;

  -- Service role (api-server) is fully trusted.
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF jwt_user IS NOT NULL THEN
    SELECT (role = 'admin') INTO caller_admin FROM public.users WHERE id = jwt_user;
    IF caller_admin THEN
      RETURN NEW;
    END IF;
  END IF;

  -- INSERT: force safe defaults, regardless of what the client sent.
  IF TG_OP = 'INSERT' THEN
    NEW.role     := COALESCE(NULLIF(NEW.role, 'admin'), NEW.role);  -- never let client self-assign admin
    IF NEW.role = 'admin' THEN NEW.role := 'investor'; END IF;
    NEW.approved := false;
    NEW.archived := false;
    NEW.archived_at := NULL;
    RETURN NEW;
  END IF;

  -- UPDATE: forbid privilege changes from non-admin callers.
  IF NEW.role        IS DISTINCT FROM OLD.role
     OR NEW.approved IS DISTINCT FROM OLD.approved
     OR NEW.archived IS DISTINCT FROM OLD.archived
     OR NEW.archived_at IS DISTINCT FROM OLD.archived_at
  THEN
    RAISE EXCEPTION
      'Privilege columns (role, approved, archived) can only be changed by an admin or the API server'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_privilege_guard ON public.users;
CREATE TRIGGER users_privilege_guard
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_privilege_columns();


-- ─────────────────────────────────────────────────────────────
-- 4) public.yachts
--   * Anyone (anon + authenticated) can SELECT yachts that are
--     "approved & published" (listing_status = 'approved').
--   * Owners can SELECT their own yachts in any state.
--   * Admins can do everything.
--   * Owners can INSERT their own yachts (owner_id = auth.uid()).
--   * Owners can UPDATE / DELETE their own yachts.
--   * Listing-moderation columns are still locked down by the
--     trigger from migration 005 (yacht_listing_moderation_guard).
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_yachts_select_public     ON public.yachts
  FOR SELECT TO anon, authenticated
  USING (listing_status = 'approved');

CREATE POLICY rls_yachts_select_owner      ON public.yachts
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY rls_yachts_select_admin      ON public.yachts
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY rls_yachts_insert_owner      ON public.yachts
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY rls_yachts_insert_admin      ON public.yachts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY rls_yachts_update_owner      ON public.yachts
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY rls_yachts_update_admin      ON public.yachts
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY rls_yachts_delete_owner      ON public.yachts
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY rls_yachts_delete_admin      ON public.yachts
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 5) public.access_requests
--   * Requester reads / inserts their own.
--   * Admins read all and update all (approve / reject).
--   * Nobody else can read or modify.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_access_requests_select_own   ON public.access_requests
  FOR SELECT TO authenticated USING (requester_id = auth.uid());

CREATE POLICY rls_access_requests_select_admin ON public.access_requests
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY rls_access_requests_insert_own   ON public.access_requests
  FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());

CREATE POLICY rls_access_requests_update_admin ON public.access_requests
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY rls_access_requests_delete_admin ON public.access_requests
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 6) public.leads
--   * Anyone (incl. anon, public form) can INSERT.
--   * Only admins can SELECT / UPDATE / DELETE.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_leads_insert_public      ON public.leads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY rls_leads_select_admin       ON public.leads
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY rls_leads_update_admin       ON public.leads
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY rls_leads_delete_admin       ON public.leads
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 7) public.introductions
--   * Only the from_user / to_user participants can SELECT.
--   * Authenticated users can INSERT only as themselves
--     (from_user = auth.uid()).
--   * Admins read / write everything.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_introductions_select_participant ON public.introductions
  FOR SELECT TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());

CREATE POLICY rls_introductions_select_admin       ON public.introductions
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY rls_introductions_insert_self        ON public.introductions
  FOR INSERT TO authenticated WITH CHECK (from_user = auth.uid());

CREATE POLICY rls_introductions_update_admin       ON public.introductions
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY rls_introductions_delete_admin       ON public.introductions
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 8) public.deals (legacy deal flow tracked alongside deal_rooms)
--   * Buyer / broker / owner / created_by participants can SELECT.
--   * Authenticated users can INSERT a deal where they are
--     created_by AND buyer_id (this matches Yachts.tsx flow that
--     creates the deal when requesting access).
--   * Admins do everything.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_deals_select_participant ON public.deals
  FOR SELECT TO authenticated
  USING (
       buyer_id   = auth.uid()
    OR broker_id  = auth.uid()
    OR owner_id   = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
         SELECT 1 FROM public.deal_participants dp
          WHERE dp.deal_id = deals.id AND dp.user_id = auth.uid()
       )
  );

CREATE POLICY rls_deals_select_admin       ON public.deals
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY rls_deals_insert_self        ON public.deals
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND buyer_id = auth.uid());

CREATE POLICY rls_deals_insert_admin       ON public.deals
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY rls_deals_update_admin       ON public.deals
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY rls_deals_delete_admin       ON public.deals
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 9) public.deal_participants
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_deal_participants_select_self  ON public.deal_participants
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY rls_deal_participants_select_admin ON public.deal_participants
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Yachts.tsx adds the requesting buyer as a participant of the new deal.
CREATE POLICY rls_deal_participants_insert_self  ON public.deal_participants
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY rls_deal_participants_insert_admin ON public.deal_participants
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY rls_deal_participants_update_admin ON public.deal_participants
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY rls_deal_participants_delete_admin ON public.deal_participants
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 10) public.deal_messages
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_deal_messages_select_participant ON public.deal_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deal_participants dp
       WHERE dp.deal_id = deal_messages.deal_id
         AND dp.user_id = auth.uid()
         AND dp.can_view = true
    )
  );

CREATE POLICY rls_deal_messages_select_admin       ON public.deal_messages
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY rls_deal_messages_insert_participant ON public.deal_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.deal_participants dp
       WHERE dp.deal_id = deal_messages.deal_id
         AND dp.user_id = auth.uid()
         AND dp.can_message = true
    )
  );

CREATE POLICY rls_deal_messages_admin_all          ON public.deal_messages
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 11) public.deal_documents
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_deal_documents_select_participant ON public.deal_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.deal_participants dp
       WHERE dp.deal_id = deal_documents.deal_id
         AND dp.user_id = auth.uid()
         AND dp.can_view = true
         AND (
              (dp.role = 'buyer'  AND deal_documents.visible_to_buyer  = true)
           OR (dp.role = 'broker' AND deal_documents.visible_to_broker = true)
           OR (dp.role = 'owner'  AND deal_documents.visible_to_owner  = true)
         )
    )
  );

CREATE POLICY rls_deal_documents_admin_all ON public.deal_documents
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 12) public.deal_activity_logs
--   * Authenticated users can INSERT their own action rows for
--     deals they participate in (matches Yachts.tsx).
--   * Otherwise admin-only.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_deal_activity_logs_insert_self  ON public.deal_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.deal_participants dp
       WHERE dp.deal_id = deal_activity_logs.deal_id
         AND dp.user_id = auth.uid()
    )
  );

CREATE POLICY rls_deal_activity_logs_admin_all    ON public.deal_activity_logs
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 13) public.deal_rooms (production deal-room infrastructure)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_deal_rooms_select_participant ON public.deal_rooms
  FOR SELECT TO authenticated
  USING (
       buyer_user_id  = auth.uid()
    OR seller_user_id = auth.uid()
    OR EXISTS (
         SELECT 1 FROM public.deal_room_participants drp
          WHERE drp.deal_room_id = deal_rooms.id
            AND drp.user_id = auth.uid()
       )
  );

CREATE POLICY rls_deal_rooms_admin_all          ON public.deal_rooms
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 14) public.deal_room_participants
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_deal_room_participants_select_self  ON public.deal_room_participants
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY rls_deal_room_participants_admin_all    ON public.deal_room_participants
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 15) public.deal_room_messages
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_deal_room_messages_select_participant ON public.deal_room_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
        FROM public.deal_room_participants drp
        JOIN public.deal_rooms dr ON dr.id = deal_room_messages.deal_room_id
       WHERE drp.deal_room_id = deal_room_messages.deal_room_id
         AND drp.user_id = auth.uid()
         AND drp.can_view = true
    )
  );

CREATE POLICY rls_deal_room_messages_insert_participant ON public.deal_room_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
        FROM public.deal_room_participants drp
       WHERE drp.deal_room_id = deal_room_messages.deal_room_id
         AND drp.user_id = auth.uid()
         AND drp.can_message = true
    )
  );

CREATE POLICY rls_deal_room_messages_admin_all          ON public.deal_room_messages
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 16) public.deal_room_documents
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_deal_room_documents_select_participant ON public.deal_room_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
        FROM public.deal_room_participants drp
       WHERE drp.deal_room_id = deal_room_documents.deal_room_id
         AND drp.user_id = auth.uid()
         AND drp.can_view = true
    )
  );

CREATE POLICY rls_deal_room_documents_admin_all          ON public.deal_room_documents
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 17) public.deal_room_blocks
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_deal_room_blocks_select_participant ON public.deal_room_blocks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
        FROM public.deal_room_participants drp
       WHERE drp.deal_room_id = deal_room_blocks.deal_room_id
         AND drp.user_id = auth.uid()
    )
  );

CREATE POLICY rls_deal_room_blocks_admin_all          ON public.deal_room_blocks
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 18) public.nda_envelopes
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_nda_envelopes_select_self  ON public.nda_envelopes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY rls_nda_envelopes_admin_all    ON public.nda_envelopes
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 19) public.nda_acceptance_logs
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_nda_acceptance_logs_select_self ON public.nda_acceptance_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY rls_nda_acceptance_logs_insert_self ON public.nda_acceptance_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY rls_nda_acceptance_logs_admin_all   ON public.nda_acceptance_logs
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 20) Platform-wide NDA documents + signatures
--   * Documents: anyone authenticated can read the active doc.
--   * Signatures: each user reads / inserts their own; admin all.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_platform_nda_documents_select_active ON public.platform_nda_documents
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY rls_platform_nda_documents_admin_all     ON public.platform_nda_documents
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY rls_platform_nda_signatures_select_self  ON public.platform_nda_signatures
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY rls_platform_nda_signatures_insert_self  ON public.platform_nda_signatures
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY rls_platform_nda_signatures_admin_all    ON public.platform_nda_signatures
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 21) Deal-room NDA + Commission documents/signatures
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_deal_nda_documents_select_active     ON public.deal_nda_documents
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY rls_deal_nda_documents_admin_all         ON public.deal_nda_documents
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY rls_deal_nda_signatures_select_self      ON public.deal_nda_signatures
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY rls_deal_nda_signatures_insert_self      ON public.deal_nda_signatures
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY rls_deal_nda_signatures_admin_all        ON public.deal_nda_signatures
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY rls_deal_commission_documents_select_active ON public.deal_commission_documents
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY rls_deal_commission_documents_admin_all     ON public.deal_commission_documents
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY rls_deal_commission_signatures_select_self  ON public.deal_commission_signatures
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY rls_deal_commission_signatures_insert_self  ON public.deal_commission_signatures
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY rls_deal_commission_signatures_admin_all    ON public.deal_commission_signatures
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 22) public.audit_logs — admin-only.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rls_audit_logs_admin_all ON public.audit_logs
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- ─────────────────────────────────────────────────────────────
-- 23) Reload PostgREST schema cache so new policies take effect
--     immediately for the public anon key.
-- ─────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- Done. The service-role key (api-server) bypasses RLS, so the
-- backend keeps working unchanged.
-- ============================================================
