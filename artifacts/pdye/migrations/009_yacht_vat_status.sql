-- 009_yacht_vat_status.sql
-- Add VAT/Tax status to yachts catalog. Tracks whether the vessel is
-- VAT-paid in the EU (free circulation) or not. This is a critical
-- commercial attribute for European buyers — non-VAT-paid vessels
-- typically trade at a structural discount on the EU market because
-- buyers face import VAT on top of the asking price.
--
-- Values:
--   'paid'      — VAT paid in EU (free circulation)
--   'not_paid'  — Not VAT paid (offshore-flag, US-flag, or pre-import)
--   NULL        — Unknown / legacy record (existing rows are left as-is)
--
-- Run this in the Supabase SQL Editor. Safe to re-run (idempotent).

ALTER TABLE yachts
  ADD COLUMN IF NOT EXISTS vat_status text;

-- Sanity check on values when set (allow NULL for legacy records).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'yachts_vat_status_check'
  ) THEN
    ALTER TABLE yachts
      ADD CONSTRAINT yachts_vat_status_check
      CHECK (vat_status IS NULL OR vat_status IN ('paid', 'not_paid'));
  END IF;
END $$;
