-- 008_yacht_documents.sql
-- Adds a JSONB column to store PDF documents attached to a yacht listing.
-- Each entry in the array has the shape:
--   { id: string, name: string, url: string, path: string,
--     size: number, uploadedAt: string }
--
-- The column is read by:
--   - artifacts/pdye/src/pages/AddYacht.tsx     (admin/owner edit form)
--   - artifacts/pdye/src/pages/DealDetails.tsx  (Deal Room → Documents tab,
--                                                merged in as "Listing" docs)
--
-- Run once in Supabase SQL Editor (Project → SQL Editor → New query → paste → Run),
-- then reload the schema cache (Database → Schema cache → Reload).

ALTER TABLE public.yachts
  ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Defensive: ensure existing rows have a valid array (not NULL) so the
-- frontend's `Array.isArray(data.documents)` check always passes.
UPDATE public.yachts
   SET documents = '[]'::jsonb
 WHERE documents IS NULL;

COMMENT ON COLUMN public.yachts.documents IS
  'PDF documents attached to the listing. Array of { id, name, url, path, size, uploadedAt }. Surfaced in Deal Room Documents tab as listing-sourced files.';
