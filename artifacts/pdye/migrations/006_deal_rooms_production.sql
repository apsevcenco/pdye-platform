-- ============================================================
-- PDYE Deal Rooms — Production Schema (Supabase / Postgres)
-- ============================================================
-- Creates the Deal Room infrastructure expected by the API server
-- (artifacts/api-server/src/routes/dealRoomsApi.ts and friends).
--
-- SAFETY:
--   * Every CREATE uses IF NOT EXISTS — running twice is a no-op.
--   * No DROP, no RENAME, no destructive ALTER.
--   * No RLS is enabled here. The API server uses the service role and
--     accesses these tables over HTTP; turning RLS on without policies
--     would lock the API out.
--   * Foreign keys are added only where both sides live in this database
--     (deal_room_id, document_id). user_id / yacht_id reference Supabase
--     auth.users / the yachts table, which the API server does not own,
--     so they intentionally have NO FK constraint.
--
-- Run this in: Supabase SQL Editor (or `psql $DATABASE_URL -f …`).
-- ============================================================

-- 0) Required extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1) Deal rooms (main table)
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS deal_room_number_seq START 1;

CREATE TABLE IF NOT EXISTS deal_rooms (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number                 integer DEFAULT nextval('deal_room_number_seq'),

  yacht_id                    uuid,
  created_by_admin_id         uuid,
  buyer_user_id               uuid,
  seller_user_id              uuid,
  seller_type                 text,

  status                      text DEFAULT 'draft',
  archived                    boolean DEFAULT false,
  notes                       text,

  -- NDA workflow
  nda_required                boolean DEFAULT true,
  buyer_nda_status            text DEFAULT 'not_sent',
  seller_nda_status           text DEFAULT 'not_sent',
  buyer_nda_sent_at           timestamptz,
  seller_nda_sent_at          timestamptz,
  buyer_nda_signed_at         timestamptz,
  seller_nda_signed_at        timestamptz,
  fully_activated_at          timestamptz,

  -- Commission workflow
  commission_status           text DEFAULT 'not_started',
  buyer_commission_status     text DEFAULT 'not_sent',
  seller_commission_status    text DEFAULT 'not_sent',
  buyer_commission_signed_at  timestamptz,
  seller_commission_signed_at timestamptz,
  commission_fully_signed_at  timestamptz,

  -- Privacy
  identities_revealed         boolean DEFAULT false,

  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- If deal_rooms already existed (e.g. partial migration), make sure every
-- column the backend references is present. These are all idempotent.
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS room_number                 integer DEFAULT nextval('deal_room_number_seq');
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS yacht_id                    uuid;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS created_by_admin_id         uuid;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS buyer_user_id               uuid;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS seller_user_id              uuid;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS seller_type                 text;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS status                      text DEFAULT 'draft';
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS archived                    boolean DEFAULT false;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS notes                       text;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS nda_required                boolean DEFAULT true;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS buyer_nda_status            text DEFAULT 'not_sent';
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS seller_nda_status           text DEFAULT 'not_sent';
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS buyer_nda_sent_at           timestamptz;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS seller_nda_sent_at          timestamptz;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS buyer_nda_signed_at         timestamptz;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS seller_nda_signed_at        timestamptz;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS fully_activated_at          timestamptz;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS commission_status           text DEFAULT 'not_started';
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS buyer_commission_status     text DEFAULT 'not_sent';
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS seller_commission_status    text DEFAULT 'not_sent';
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS buyer_commission_signed_at  timestamptz;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS seller_commission_signed_at timestamptz;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS commission_fully_signed_at  timestamptz;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS identities_revealed         boolean DEFAULT false;
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS created_at                  timestamptz NOT NULL DEFAULT now();
ALTER TABLE deal_rooms ADD COLUMN IF NOT EXISTS updated_at                  timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_deal_rooms_buyer_user_id    ON deal_rooms(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_seller_user_id   ON deal_rooms(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_yacht_id         ON deal_rooms(yacht_id);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_status           ON deal_rooms(status);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_created_at       ON deal_rooms(created_at DESC);

-- ============================================================
-- 2) Deal room participants
-- ============================================================

CREATE TABLE IF NOT EXISTS deal_room_participants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id  uuid NOT NULL REFERENCES deal_rooms(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL,
  role          text,
  side          text,
  can_view      boolean DEFAULT true,
  can_message   boolean DEFAULT true,
  can_download  boolean DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_room_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_deal_room_participants_deal_room_id ON deal_room_participants(deal_room_id);
CREATE INDEX IF NOT EXISTS idx_deal_room_participants_user_id      ON deal_room_participants(user_id);

-- ============================================================
-- 3) Deal room messages
-- ============================================================

CREATE TABLE IF NOT EXISTS deal_room_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id  uuid NOT NULL REFERENCES deal_rooms(id) ON DELETE CASCADE,
  sender_id     uuid NOT NULL,
  message       text NOT NULL,
  is_system     boolean DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deal_room_messages_deal_room_id ON deal_room_messages(deal_room_id);
CREATE INDEX IF NOT EXISTS idx_deal_room_messages_created_at   ON deal_room_messages(created_at DESC);

-- ============================================================
-- 4) Deal room documents
-- ============================================================
-- The backend exposes SELECT/DELETE only; uploads are written by the
-- frontend (Supabase storage). Columns here cover both the Admin list
-- (file_url / file_name / file_size / file_type / visible_to_roles) and
-- the legacy DealDetails view (file_path).

CREATE TABLE IF NOT EXISTS deal_room_documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id      uuid NOT NULL REFERENCES deal_rooms(id) ON DELETE CASCADE,
  uploaded_by       uuid,
  file_name         text,
  file_url          text,
  file_path         text,
  file_type         text,
  file_size         bigint,
  visible_to_roles  text[],
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deal_room_documents_deal_room_id ON deal_room_documents(deal_room_id);
CREATE INDEX IF NOT EXISTS idx_deal_room_documents_uploaded_by  ON deal_room_documents(uploaded_by);

-- ============================================================
-- 5) Deal room blocks (unlock state per content section)
-- ============================================================

CREATE TABLE IF NOT EXISTS deal_room_blocks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id  uuid NOT NULL REFERENCES deal_rooms(id) ON DELETE CASCADE,
  block_key     text NOT NULL,
  is_unlocked   boolean DEFAULT false,
  unlocked_by   uuid,
  unlocked_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_room_id, block_key)
);
CREATE INDEX IF NOT EXISTS idx_deal_room_blocks_deal_room_id ON deal_room_blocks(deal_room_id);

-- ============================================================
-- 6) NDA envelopes (per-side envelope tracker — Send NDA / Signed NDA)
-- ============================================================

CREATE TABLE IF NOT EXISTS nda_envelopes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id    uuid NOT NULL REFERENCES deal_rooms(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL,
  side            text NOT NULL,
  provider        text DEFAULT 'internal',
  status          text DEFAULT 'pending',
  sent_at         timestamptz,
  signed_at       timestamptz,
  completed_at    timestamptz,
  document_name   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nda_envelopes_deal_room_id ON nda_envelopes(deal_room_id);
CREATE INDEX IF NOT EXISTS idx_nda_envelopes_user_id      ON nda_envelopes(user_id);

-- ============================================================
-- 7) Audit logs (polymorphic)
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  text,
  entity_id    uuid,
  user_id      uuid,
  action       text NOT NULL,
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity      ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id     ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON audit_logs(created_at DESC);

-- ============================================================
-- 8) Platform NDA (per-user, signed once on first login)
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_nda_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version       text NOT NULL UNIQUE,
  title         text NOT NULL DEFAULT 'PDYE Platform Non-Disclosure Agreement',
  content       text NOT NULL,
  content_hash  text NOT NULL,
  is_active     boolean DEFAULT false,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_nda_signatures (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL,
  user_email        text NOT NULL,
  signature_name    text NOT NULL,
  document_id       uuid NOT NULL,
  document_version  text NOT NULL,
  document_hash     text NOT NULL,
  ip                text,
  user_agent        text,
  signed_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_nda_signatures_user_id_idx ON platform_nda_signatures(user_id);

-- ============================================================
-- 9) Deal Room NDA (per (deal_room, user, side))
-- ============================================================

CREATE TABLE IF NOT EXISTS deal_nda_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version       text NOT NULL UNIQUE,
  title         text NOT NULL,
  content       text NOT NULL,
  content_hash  text NOT NULL,
  is_active     boolean NOT NULL DEFAULT false,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS deal_nda_documents_one_active
  ON deal_nda_documents ((is_active)) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS deal_nda_signatures (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id          uuid NOT NULL,
  user_id               uuid NOT NULL,
  side                  text NOT NULL,
  user_email            text NOT NULL,
  signature_name        text NOT NULL,
  accepted_read         boolean NOT NULL DEFAULT false,
  accepted_understand   boolean NOT NULL DEFAULT false,
  accepted_agree        boolean NOT NULL DEFAULT false,
  document_id           uuid NOT NULL REFERENCES deal_nda_documents(id),
  document_version      text NOT NULL,
  document_hash         text NOT NULL,
  ip                    text,
  user_agent            text,
  signed_at             timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS deal_nda_signatures_room_user_side_uniq
  ON deal_nda_signatures (deal_room_id, user_id, side);
CREATE INDEX IF NOT EXISTS deal_nda_signatures_room_idx ON deal_nda_signatures (deal_room_id);
CREATE INDEX IF NOT EXISTS deal_nda_signatures_user_idx ON deal_nda_signatures (user_id);

-- ============================================================
-- 10) Deal Commission (per (deal_room, user, side))
-- ============================================================

CREATE TABLE IF NOT EXISTS deal_commission_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version       text NOT NULL UNIQUE,
  title         text NOT NULL,
  content       text NOT NULL,
  content_hash  text NOT NULL,
  is_active     boolean NOT NULL DEFAULT false,
  created_by    uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS deal_commission_documents_one_active
  ON deal_commission_documents ((is_active)) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS deal_commission_signatures (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id          uuid NOT NULL,
  user_id               uuid NOT NULL,
  side                  text NOT NULL,
  user_email            text NOT NULL,
  signature_name        text NOT NULL,
  accepted_read         boolean NOT NULL DEFAULT false,
  accepted_understand   boolean NOT NULL DEFAULT false,
  accepted_agree        boolean NOT NULL DEFAULT false,
  document_id           uuid NOT NULL REFERENCES deal_commission_documents(id),
  document_version      text NOT NULL,
  document_hash         text NOT NULL,
  ip                    text,
  user_agent            text,
  signed_at             timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS deal_commission_signatures_room_user_side_uniq
  ON deal_commission_signatures (deal_room_id, user_id, side);
CREATE INDEX IF NOT EXISTS deal_commission_signatures_room_idx ON deal_commission_signatures (deal_room_id);
CREATE INDEX IF NOT EXISTS deal_commission_signatures_user_idx ON deal_commission_signatures (user_id);

-- ============================================================
-- Done.
-- ============================================================
-- After running this migration, the API server will (on next startup)
-- auto-seed the active platform_nda_documents v1.0, deal_nda_documents
-- v1.0 and deal_commission_documents v1.0 rows from its inline migrations
-- — those CREATE statements are no-ops thanks to IF NOT EXISTS, but the
-- INSERT … ON CONFLICT DO NOTHING seed will populate the documents.
--
-- Verify with:
--   SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public'
--      AND table_name IN (
--        'deal_rooms','deal_room_participants','deal_room_messages',
--        'deal_room_documents','deal_room_blocks','nda_envelopes',
--        'audit_logs','platform_nda_documents','platform_nda_signatures',
--        'deal_nda_documents','deal_nda_signatures',
--        'deal_commission_documents','deal_commission_signatures'
--      )
--    ORDER BY table_name;
-- Expected: 13 rows.
