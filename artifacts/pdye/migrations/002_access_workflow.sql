-- ============================================================
-- PDYE Access Workflow Migration v2
-- Separates "approved spec access" from "deal room access"
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1) Extend access_requests with new workflow columns
ALTER TABLE access_requests
  ADD COLUMN IF NOT EXISTS listing_owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS approved_spec_access boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_spec_access_at timestamptz,
  ADD COLUMN IF NOT EXISTS escalated_to_deal_room boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deal_room_id uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Update existing approved requests to have approved_spec_access = true
UPDATE access_requests SET approved_spec_access = true, approved_spec_access_at = now() WHERE status = 'approved';

-- 2) Create deal_rooms table (separate from deals)
CREATE TABLE IF NOT EXISTS deal_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id uuid NOT NULL,
  access_request_id uuid,
  created_by_admin_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  buyer_user_id uuid,
  seller_user_id uuid,
  seller_type text,
  nda_required boolean NOT NULL DEFAULT true,
  buyer_nda_status text NOT NULL DEFAULT 'not_sent',
  seller_nda_status text NOT NULL DEFAULT 'not_sent',
  buyer_nda_sent_at timestamptz,
  seller_nda_sent_at timestamptz,
  buyer_nda_signed_at timestamptz,
  seller_nda_signed_at timestamptz,
  fully_activated_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Create deal_room_participants
CREATE TABLE IF NOT EXISTS deal_room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id uuid NOT NULL REFERENCES deal_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL,
  side text,
  can_view boolean NOT NULL DEFAULT false,
  can_message boolean NOT NULL DEFAULT false,
  can_download boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(deal_room_id, user_id)
);

-- 4) Create nda_envelopes (signature tracking)
CREATE TABLE IF NOT EXISTS nda_envelopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id uuid NOT NULL REFERENCES deal_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  side text NOT NULL,
  provider text NOT NULL DEFAULT 'internal',
  envelope_id text,
  document_name text,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  signed_at timestamptz,
  completed_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5) Create deal_room_documents
CREATE TABLE IF NOT EXISTS deal_room_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id uuid NOT NULL REFERENCES deal_rooms(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  uploaded_by uuid NOT NULL,
  visible_to_buyer boolean NOT NULL DEFAULT true,
  visible_to_seller boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6) Create deal_room_messages
CREATE TABLE IF NOT EXISTS deal_room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_room_id uuid NOT NULL REFERENCES deal_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7) Create audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  user_id uuid,
  action text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8) Indexes
CREATE INDEX IF NOT EXISTS idx_deal_rooms_yacht_id ON deal_rooms(yacht_id);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_buyer_user_id ON deal_rooms(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_seller_user_id ON deal_rooms(seller_user_id);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_status ON deal_rooms(status);
CREATE INDEX IF NOT EXISTS idx_deal_room_participants_room_id ON deal_room_participants(deal_room_id);
CREATE INDEX IF NOT EXISTS idx_deal_room_participants_user_id ON deal_room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_nda_envelopes_room_id ON nda_envelopes(deal_room_id);
CREATE INDEX IF NOT EXISTS idx_nda_envelopes_user_id ON nda_envelopes(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_room_documents_room_id ON deal_room_documents(deal_room_id);
CREATE INDEX IF NOT EXISTS idx_deal_room_messages_room_id ON deal_room_messages(deal_room_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_requester ON access_requests(requester_id);

-- 9) Enable RLS on all new tables
ALTER TABLE deal_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE nda_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_room_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 10) RLS Policies for deal_rooms
CREATE POLICY "Admin full access to deal_rooms" ON deal_rooms FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Participants can view their deal_rooms" ON deal_rooms FOR SELECT
  USING (
    buyer_user_id = auth.uid()
    OR seller_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM deal_room_participants WHERE deal_room_participants.deal_room_id = deal_rooms.id AND deal_room_participants.user_id = auth.uid())
  );

-- 11) RLS Policies for deal_room_participants
CREATE POLICY "Admin full access to deal_room_participants" ON deal_room_participants FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Users can view their own participation in rooms" ON deal_room_participants FOR SELECT
  USING (user_id = auth.uid());

-- 12) RLS Policies for nda_envelopes
CREATE POLICY "Admin full access to nda_envelopes" ON nda_envelopes FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Users can view their own NDA envelopes" ON nda_envelopes FOR SELECT
  USING (user_id = auth.uid());

-- 13) RLS Policies for deal_room_documents
CREATE POLICY "Admin full access to deal_room_documents" ON deal_room_documents FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Participants can view allowed room documents" ON deal_room_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deal_room_participants drp
      JOIN deal_rooms dr ON dr.id = deal_room_documents.deal_room_id
      WHERE drp.deal_room_id = deal_room_documents.deal_room_id
        AND drp.user_id = auth.uid()
        AND drp.can_view = true
        AND dr.status = 'active'
        AND (
          (drp.side = 'buyer' AND deal_room_documents.visible_to_buyer = true)
          OR (drp.side = 'seller' AND deal_room_documents.visible_to_seller = true)
          OR drp.role = 'admin'
        )
    )
  );

-- 14) RLS Policies for deal_room_messages
CREATE POLICY "Admin full access to deal_room_messages" ON deal_room_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Participants can view room messages" ON deal_room_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deal_room_participants drp
      JOIN deal_rooms dr ON dr.id = deal_room_messages.deal_room_id
      WHERE drp.deal_room_id = deal_room_messages.deal_room_id
        AND drp.user_id = auth.uid()
        AND drp.can_view = true
        AND dr.status = 'active'
    )
  );

CREATE POLICY "Participants can send room messages" ON deal_room_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM deal_room_participants drp
      JOIN deal_rooms dr ON dr.id = deal_room_messages.deal_room_id
      WHERE drp.deal_room_id = deal_room_messages.deal_room_id
        AND drp.user_id = auth.uid()
        AND drp.can_message = true
        AND dr.status = 'active'
    )
  );

-- 15) RLS Policies for audit_logs (admin only)
CREATE POLICY "Admin full access to audit_logs" ON audit_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Done!
