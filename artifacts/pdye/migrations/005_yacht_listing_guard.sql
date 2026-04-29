-- 005_yacht_listing_guard.sql
-- Hardens the yacht-moderation flow at the DB layer so the listing_* columns can ONLY
-- be modified through the moderation API (service-role) or by admin users.
-- Without this, any authenticated user could call:
--   supabase.from('yachts').update({ listing_status: 'approved' }).eq('id', ownYachtId)
-- and silently bypass admin review.
--
-- The trigger checks who is calling:
--   1. Service-role (api-server moderation endpoints) — fully trusted.
--   2. Authenticated admin user (public.users.role = 'admin') — fully trusted.
--   3. Anyone else — on INSERT, listing_status is forced to 'draft' and all review
--      fields cleared; on UPDATE, any change to listing_* columns raises an error.
--
-- Run once in Supabase SQL Editor (Project → SQL Editor → New query → paste → Run).

CREATE OR REPLACE FUNCTION public.protect_yacht_listing_moderation_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role     text;
  jwt_user_txt text;
  jwt_user     uuid;
  is_admin     boolean := false;
BEGIN
  -- Best-effort claim parsing (no JWT in some background contexts → claims missing)
  BEGIN
    jwt_role     := current_setting('request.jwt.claims', true)::json->>'role';
    jwt_user_txt := current_setting('request.jwt.claims', true)::json->>'sub';
    IF jwt_user_txt IS NOT NULL AND jwt_user_txt <> '' THEN
      jwt_user := jwt_user_txt::uuid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    jwt_role := NULL; jwt_user := NULL;
  END;

  -- 1. Service role (api-server) is fully trusted.
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- 2. Admin users are fully trusted.
  IF jwt_user IS NOT NULL THEN
    SELECT (role = 'admin') INTO is_admin FROM public.users WHERE id = jwt_user;
    IF is_admin THEN
      RETURN NEW;
    END IF;
  END IF;

  -- 3. Everyone else.
  IF TG_OP = 'INSERT' THEN
    -- Force a fresh draft regardless of what the client sent.
    NEW.listing_status         := 'draft';
    NEW.listing_submitted_at   := NULL;
    NEW.listing_reviewed_at    := NULL;
    NEW.listing_reviewed_by    := NULL;
    NEW.listing_review_comment := NULL;
    RETURN NEW;
  END IF;

  -- UPDATE: any change to a moderation column from a non-admin/non-service-role caller is rejected.
  IF NEW.listing_status         IS DISTINCT FROM OLD.listing_status
     OR NEW.listing_submitted_at   IS DISTINCT FROM OLD.listing_submitted_at
     OR NEW.listing_reviewed_at    IS DISTINCT FROM OLD.listing_reviewed_at
     OR NEW.listing_reviewed_by    IS DISTINCT FROM OLD.listing_reviewed_by
     OR NEW.listing_review_comment IS DISTINCT FROM OLD.listing_review_comment
  THEN
    RAISE EXCEPTION
      'Moderation columns (listing_status, listing_submitted_at, listing_reviewed_at, listing_reviewed_by, listing_review_comment) can only be changed by an admin or the moderation API'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS yacht_listing_moderation_guard ON public.yachts;
CREATE TRIGGER yacht_listing_moderation_guard
  BEFORE INSERT OR UPDATE ON public.yachts
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_yacht_listing_moderation_columns();
