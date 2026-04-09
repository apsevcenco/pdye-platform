-- ============================================================
-- PDYE Deal Flow Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1) ALTER deals table: add workflow columns
-- Keep existing columns (title, description, etc.) for backward compat
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS request_id uuid,
  ADD COLUMN IF NOT EXISTS buyer_id uuid,
  ADD COLUMN IF NOT EXISTS broker_id uuid,
  ADD COLUMN IF NOT EXISTS owner_id uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS nda_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS nda_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nda_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS intro_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS intro_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS deal_room_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2) ALTER deal_documents: add visibility columns
ALTER TABLE deal_documents
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS file_path text,
  ADD COLUMN IF NOT EXISTS file_type text,
  ADD COLUMN IF NOT EXISTS is_sensitive boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS visible_to_buyer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visible_to_broker boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS visible_to_owner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS uploaded_by uuid;

-- 3) CREATE deal_messages
CREATE TABLE IF NOT EXISTS deal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) CREATE deal_activity_logs
CREATE TABLE IF NOT EXISTS deal_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5) CREATE deal_participants
CREATE TABLE IF NOT EXISTS deal_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  can_message boolean NOT NULL DEFAULT true,
  can_download boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(deal_id, user_id)
);

-- 6) CREATE nda_acceptance_logs
CREATE TABLE IF NOT EXISTS nda_acceptance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  document_version text NOT NULL DEFAULT 'v1',
  accepted boolean NOT NULL DEFAULT true,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip text,
  user_agent text
);

-- 7) Indexes
CREATE INDEX IF NOT EXISTS idx_deal_messages_deal_id ON deal_messages(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_activity_logs_deal_id ON deal_activity_logs(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_participants_deal_id ON deal_participants(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_participants_user_id ON deal_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_nda_acceptance_logs_deal_id ON nda_acceptance_logs(deal_id);
CREATE INDEX IF NOT EXISTS idx_deals_buyer_id ON deals(buyer_id);
CREATE INDEX IF NOT EXISTS idx_deals_broker_id ON deals(broker_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);

-- 8) RLS - Enable on all new tables
ALTER TABLE deal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE nda_acceptance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_documents ENABLE ROW LEVEL SECURITY;

-- 9) RLS Policies for deals
CREATE POLICY "Admin full access to deals" ON deals FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Participants can view their deals" ON deals FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR broker_id = auth.uid()
    OR owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM deal_participants WHERE deal_participants.deal_id = deals.id AND deal_participants.user_id = auth.uid())
  );

-- 10) RLS Policies for deal_messages
CREATE POLICY "Admin full access to deal_messages" ON deal_messages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Participants can view messages" ON deal_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM deal_participants WHERE deal_participants.deal_id = deal_messages.deal_id AND deal_participants.user_id = auth.uid() AND deal_participants.can_view = true)
  );

CREATE POLICY "Participants can send messages" ON deal_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (SELECT 1 FROM deal_participants WHERE deal_participants.deal_id = deal_messages.deal_id AND deal_participants.user_id = auth.uid() AND deal_participants.can_message = true)
  );

-- 11) RLS Policies for deal_documents
CREATE POLICY "Admin full access to deal_documents" ON deal_documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Participants can view allowed documents" ON deal_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deal_participants dp
      WHERE dp.deal_id = deal_documents.deal_id
        AND dp.user_id = auth.uid()
        AND dp.can_view = true
        AND (
          (dp.role = 'buyer' AND deal_documents.visible_to_buyer = true)
          OR (dp.role = 'broker' AND deal_documents.visible_to_broker = true)
          OR (dp.role = 'owner' AND deal_documents.visible_to_owner = true)
        )
    )
  );

-- 12) RLS Policies for deal_activity_logs (admin only)
CREATE POLICY "Admin full access to deal_activity_logs" ON deal_activity_logs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- 13) RLS Policies for deal_participants
CREATE POLICY "Admin full access to deal_participants" ON deal_participants FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Users can view their own participation" ON deal_participants FOR SELECT
  USING (user_id = auth.uid());

-- 14) RLS Policies for nda_acceptance_logs
CREATE POLICY "Admin full access to nda_acceptance_logs" ON nda_acceptance_logs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Users can view their own NDA logs" ON nda_acceptance_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own NDA logs" ON nda_acceptance_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 15) Service role key bypass (for supabaseAdmin on API server)
-- The service role key automatically bypasses RLS, so no additional
-- policies are needed for server-side operations.

-- Done!
