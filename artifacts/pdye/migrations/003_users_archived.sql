-- ============================================================
-- PDYE Users Archive Migration v3
-- Adds soft-archive flag to public.users so admins can
-- archive/unarchive client records without losing history.
-- Run this in Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_archived ON public.users (archived);
