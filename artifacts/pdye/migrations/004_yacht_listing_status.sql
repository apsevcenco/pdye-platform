-- 004_yacht_listing_status.sql
-- Adds listing-moderation columns to public.yachts.
-- Run once in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run).
--
-- Workflow:
--   draft     – yacht just created, not yet submitted for admin review (invisible publicly)
--   pending   – owner pressed "Submit for Approval", admin email triggered
--   approved  – admin approved, yacht is publicly visible. Owner may freely edit afterwards;
--               edits go live immediately, no re-review required.
--   rejected  – admin rejected. listing_review_comment holds the message shown to the owner.
--               Owner may edit the listing and submit again.

ALTER TABLE public.yachts ADD COLUMN IF NOT EXISTS listing_status         text NOT NULL DEFAULT 'draft';
ALTER TABLE public.yachts ADD COLUMN IF NOT EXISTS listing_submitted_at   timestamptz;
ALTER TABLE public.yachts ADD COLUMN IF NOT EXISTS listing_reviewed_at    timestamptz;
ALTER TABLE public.yachts ADD COLUMN IF NOT EXISTS listing_reviewed_by    uuid;
ALTER TABLE public.yachts ADD COLUMN IF NOT EXISTS listing_review_comment text;

-- Existing yachts were added by the admin before this feature existed — grandfather them in
-- as 'approved' so the public catalogue does not suddenly empty out.
UPDATE public.yachts
   SET listing_status = 'approved',
       listing_reviewed_at = COALESCE(listing_reviewed_at, now())
 WHERE listing_status = 'draft';

CREATE INDEX IF NOT EXISTS yachts_listing_status_idx ON public.yachts (listing_status);
