import { Router } from "express";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin, requireUser, optionalUser } from "../middlewares/auth";
import { requirePlatformNdaSigned } from "./platformNda";
import { sendDealNdaInviteEmail } from "../lib/dealLegalEmail";
import {
  ArchiveBody,
  AuditLogBody,
  AuditLogParams,
  BlockUpdateBody,
  CreateDealRoomBody,
  CreateParticipantBody,
  DEAL_ROOM_BLOCK_KEYS,
  DealRoomBlockParams,
  DealRoomByUserParams,
  DealRoomIdParams,
  DealRoomListQuery,
  DealRoomRoomIdParams,
  NdaEnvelopeBody,
  PostMessageBody,
  UpdateDealRoomBody,
  UpdateParticipantBody,
} from "@workspace/api-zod";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middlewares/validate";

const router = Router();

const ALLOWED_PATCH_FIELDS = new Set([
  "status",
  "buyer_user_id",
  "seller_user_id",
  "seller_type",
  "nda_required",
  "buyer_nda_status",
  "seller_nda_status",
  "buyer_nda_sent_at",
  "seller_nda_sent_at",
  "buyer_nda_signed_at",
  "seller_nda_signed_at",
  "fully_activated_at",
  "notes",
]);

const ALLOWED_PARTICIPANT_FIELDS = new Set([
  "role",
  "side",
  "can_view",
  "can_message",
  "can_download",
]);

async function isParticipantOrAdmin(roomId: string, viewer: { id: string; role: string } | undefined): Promise<{ ok: boolean; room?: any }> {
  if (!viewer) return { ok: false };
  const { rows } = await db().query("SELECT * FROM deal_rooms WHERE id = $1", [roomId]);
  if (rows.length === 0) return { ok: false };
  const room = rows[0];
  if (viewer.role === "admin") return { ok: true, room };
  if (viewer.id === room.buyer_user_id || viewer.id === room.seller_user_id) return { ok: true, room };
  // Also check explicit participants table
  const p = await db().query(
    "SELECT 1 FROM deal_room_participants WHERE deal_room_id = $1 AND user_id = $2 LIMIT 1",
    [roomId, viewer.id]
  );
  if (p.rows.length > 0) return { ok: true, room };
  return { ok: false };
}

function applyPrivacyShape(room: any, viewer: { id: string; role: string } | undefined): any {
  if (!room) return room;
  if (viewer && viewer.role === "admin") return room;
  const isParticipant = !!viewer && (viewer.id === room.buyer_user_id || viewer.id === room.seller_user_id);
  if (!isParticipant) {
    // Outsider: never expose identities or names
    return {
      id: room.id,
      room_number: room.room_number,
      status: room.status,
      archived: room.archived,
      created_at: room.created_at,
    };
  }
  // Participant: hide opposing party until commission fully signed (identities_revealed)
  if (!room.identities_revealed) {
    const masked = { ...room };
    if (viewer.id !== room.buyer_user_id) masked.buyer_user_id = null;
    if (viewer.id !== room.seller_user_id) masked.seller_user_id = null;
    return masked;
  }
  return room;
}

function getPool() {
  const dbUrl = process.env["DATABASE_URL"];
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  return new pg.Pool({ connectionString: dbUrl, max: 5 });
}

let pool: pg.Pool | null = null;
let migrationQueued = false;
function db() {
  if (!pool) {
    pool = getPool();
    if (!migrationQueued) {
      migrationQueued = true;
      runMigration().catch(e => console.error("Migration error:", e));
    }
  }
  return pool;
}

let migrationDone = false;
async function runMigration() {
  if (migrationDone) return;
  migrationDone = true;
  const client = await db().connect();
  try {
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deal_rooms' AND column_name='room_number') THEN
          CREATE SEQUENCE IF NOT EXISTS deal_room_number_seq START 1;
          ALTER TABLE deal_rooms ADD COLUMN room_number integer DEFAULT nextval('deal_room_number_seq');
        END IF;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deal_rooms' AND column_name='archived') THEN
          ALTER TABLE deal_rooms ADD COLUMN archived boolean DEFAULT false;
        END IF;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deal_rooms' AND column_name='commission_status') THEN
          ALTER TABLE deal_rooms ADD COLUMN commission_status text DEFAULT 'not_started';
          ALTER TABLE deal_rooms ADD COLUMN buyer_commission_status text DEFAULT 'not_sent';
          ALTER TABLE deal_rooms ADD COLUMN seller_commission_status text DEFAULT 'not_sent';
          ALTER TABLE deal_rooms ADD COLUMN buyer_commission_signed_at timestamptz;
          ALTER TABLE deal_rooms ADD COLUMN seller_commission_signed_at timestamptz;
          ALTER TABLE deal_rooms ADD COLUMN commission_fully_signed_at timestamptz;
          ALTER TABLE deal_rooms ADD COLUMN identities_revealed boolean DEFAULT false;
        END IF;
      END $$;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS deal_room_blocks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        deal_room_id uuid NOT NULL,
        block_key text NOT NULL,
        is_unlocked boolean DEFAULT false,
        unlocked_by uuid,
        unlocked_at timestamptz,
        created_at timestamptz DEFAULT now(),
        UNIQUE(deal_room_id, block_key)
      );
    `);
  } finally {
    client.release();
  }
}

const BLOCK_KEYS = DEAL_ROOM_BLOCK_KEYS as readonly string[];

router.get("/deal-rooms", requireUser, requirePlatformNdaSigned, validateQuery(DealRoomListQuery), async (req, res) => {
  try {
    const includeArchived = req.query.include_archived === "true";
    const viewer = req.authUser!;
    const archivedClause = includeArchived ? "" : "AND (archived IS NULL OR archived = false)";
    let rows: any[];
    if (viewer.role === "admin") {
      const r = await db().query(`SELECT * FROM deal_rooms WHERE 1=1 ${archivedClause} ORDER BY created_at DESC`);
      rows = r.rows;
    } else {
      const r = await db().query(
        `SELECT * FROM deal_rooms
         WHERE (buyer_user_id = $1 OR seller_user_id = $1
                OR id IN (SELECT deal_room_id FROM deal_room_participants WHERE user_id = $1))
         ${archivedClause}
         ORDER BY created_at DESC`,
        [viewer.id]
      );
      rows = r.rows;
    }
    res.json(rows.map(r => applyPrivacyShape(r, viewer)));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/deal-rooms/by-user/:userId", requireUser, requirePlatformNdaSigned, validateParams(DealRoomByUserParams), async (req, res) => {
  try {
    const viewer = req.authUser!;
    if (viewer.role !== "admin" && viewer.id !== req.params.userId) {
      res.status(403).json({ error: "You may only list your own deal rooms" });
      return;
    }
    const { rows } = await db().query(
      "SELECT * FROM deal_rooms WHERE buyer_user_id = $1 OR seller_user_id = $1 ORDER BY created_at DESC",
      [req.params.userId]
    );
    res.json(rows.map(r => applyPrivacyShape(r, viewer)));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/deal-rooms/:id", optionalUser, validateParams(DealRoomIdParams), async (req, res) => {
  try {
    const { rows } = await db().query("SELECT * FROM deal_rooms WHERE id = $1", [req.params.id]);
    if (rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    res.json(applyPrivacyShape(rows[0], req.authUser));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/deal-rooms", requireAdmin, validateBody(CreateDealRoomBody), async (req, res) => {
  // Always use the authenticated admin as creator (route is requireAdmin-gated).
  // We deliberately ignore any `created_by_admin_id` from the body to prevent spoofing
  // and to avoid the previous nil-UUID fallback.
  const { yacht_id, buyer_user_id, seller_user_id, notes, status, nda_required } = req.body;
  const creatorId = req.authUser!.id;
  try {
    const { rows } = await db().query(
      `INSERT INTO deal_rooms (yacht_id, created_by_admin_id, buyer_user_id, seller_user_id, notes, status, nda_required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [yacht_id, creatorId, buyer_user_id, seller_user_id, notes, status || 'draft', nda_required !== false]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/deal-rooms/:id", requireAdmin, validateParams(DealRoomIdParams), validateBody(UpdateDealRoomBody), async (req, res) => {
  const fields = req.body || {};
  const keys = Object.keys(fields).filter(k => ALLOWED_PATCH_FIELDS.has(k));
  if (keys.length === 0) { res.status(400).json({ error: "No allowed fields to update" }); return; }
  const sets = keys.map((k, i) => `"${k}" = $${i + 2}`).join(", ");
  const vals = keys.map(k => fields[k]);
  try {
    const { rows } = await db().query(`UPDATE deal_rooms SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`, [req.params.id, ...vals]);
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/deal-rooms/:id", requireAdmin, validateParams(DealRoomIdParams), async (req, res) => {
  try {
    const id = req.params.id;
    await db().query("DELETE FROM deal_room_blocks WHERE deal_room_id = $1", [id]);
    await db().query("DELETE FROM deal_room_messages WHERE deal_room_id = $1", [id]);
    await db().query("DELETE FROM deal_room_documents WHERE deal_room_id = $1", [id]);
    await db().query("DELETE FROM deal_room_participants WHERE deal_room_id = $1", [id]);
    await db().query("DELETE FROM nda_envelopes WHERE deal_room_id = $1", [id]);
    await db().query("DELETE FROM audit_logs WHERE entity_type = 'deal_room' AND entity_id = $1", [id]);
    await db().query("DELETE FROM deal_rooms WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/deal-rooms/:id/participants", requireUser, requirePlatformNdaSigned, validateParams(DealRoomIdParams), async (req, res) => {
  try {
    const auth = await isParticipantOrAdmin(String(req.params.id), req.authUser);
    if (!auth.ok) { res.status(403).json({ error: "Access denied" }); return; }
    const { rows } = await db().query("SELECT * FROM deal_room_participants WHERE deal_room_id = $1", [req.params.id]);
    // Hide participant identities from non-admin viewers until commission is fully signed
    if (req.authUser!.role !== "admin" && !auth.room?.identities_revealed) {
      res.json(rows.filter((p: any) => p.user_id === req.authUser!.id));
      return;
    }
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/deal-rooms/:id/participants", requireAdmin, validateParams(DealRoomIdParams), validateBody(CreateParticipantBody), async (req, res) => {
  const { user_id, role, side, can_view, can_message, can_download } = req.body;
  try {
    const { rows } = await db().query(
      `INSERT INTO deal_room_participants (deal_room_id, user_id, role, side, can_view, can_message, can_download)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (deal_room_id, user_id) DO UPDATE SET role = $3, side = $4, can_view = $5, can_message = $6, can_download = $7
       RETURNING *`,
      [req.params.id, user_id, role, side, can_view !== false, can_message !== false, can_download !== false]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/deal-rooms/:roomId/participants", requireAdmin, validateParams(DealRoomRoomIdParams), validateBody(UpdateParticipantBody), async (req, res) => {
  const fields = req.body || {};
  const keys = Object.keys(fields).filter(k => ALLOWED_PARTICIPANT_FIELDS.has(k));
  if (keys.length === 0) { res.status(400).json({ error: "No allowed fields to update" }); return; }
  const sets = keys.map((k, i) => `"${k}" = $${i + 2}`).join(", ");
  const vals = keys.map(k => fields[k]);
  try {
    const { rows } = await db().query(`UPDATE deal_room_participants SET ${sets} WHERE deal_room_id = $1 RETURNING *`, [req.params.roomId, ...vals]);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/deal-rooms/:id/messages", requireUser, requirePlatformNdaSigned, validateParams(DealRoomIdParams), async (req, res) => {
  try {
    const auth = await isParticipantOrAdmin(String(req.params.id), req.authUser);
    if (!auth.ok) { res.status(403).json({ error: "Access denied" }); return; }
    const { rows } = await db().query("SELECT * FROM deal_room_messages WHERE deal_room_id = $1 ORDER BY created_at ASC", [req.params.id]);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/deal-rooms/:id/messages", requireUser, requirePlatformNdaSigned, validateParams(DealRoomIdParams), validateBody(PostMessageBody), async (req, res) => {
  const { message, is_system } = req.body;
  try {
    const auth = await isParticipantOrAdmin(String(req.params.id), req.authUser);
    if (!auth.ok) { res.status(403).json({ error: "Access denied" }); return; }
    const senderId = req.authUser!.id;
    const isSystem = !!is_system && req.authUser!.role === "admin";
    const { rows } = await db().query(
      `INSERT INTO deal_room_messages (deal_room_id, sender_id, message, is_system)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.id, senderId, message, isSystem]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/deal-rooms/:id/documents", requireUser, requirePlatformNdaSigned, validateParams(DealRoomIdParams), async (req, res) => {
  try {
    const auth = await isParticipantOrAdmin(String(req.params.id), req.authUser);
    if (!auth.ok) { res.status(403).json({ error: "Access denied" }); return; }
    const { rows } = await db().query("SELECT * FROM deal_room_documents WHERE deal_room_id = $1 ORDER BY created_at DESC", [req.params.id]);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/deal-room-documents", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await db().query("SELECT * FROM deal_room_documents ORDER BY created_at DESC");
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/deal-room-documents/:id", requireAdmin, validateParams(DealRoomIdParams), async (req, res) => {
  try {
    await db().query("DELETE FROM deal_room_documents WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/deal-room-messages-all", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await db().query("SELECT * FROM deal_room_messages ORDER BY created_at DESC LIMIT 50");
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/deal-room-messages/:id", requireAdmin, validateParams(DealRoomIdParams), async (req, res) => {
  try {
    await db().query("DELETE FROM deal_room_messages WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/nda-envelopes", requireAdmin, validateBody(NdaEnvelopeBody), async (req, res) => {
  const { deal_room_id, user_id, side, provider, status, sent_at, signed_at, completed_at, document_name } = req.body;
  try {
    const { rows } = await db().query(
      `INSERT INTO nda_envelopes (deal_room_id, user_id, side, provider, status, sent_at, signed_at, completed_at, document_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [deal_room_id, user_id, side, provider || 'internal', status || 'pending', sent_at, signed_at, completed_at, document_name]
    );
    // Fire-and-forget invite email when this envelope represents a "send NDA" event.
    // We send only on status='sent' (the create + manual-send paths) and only when
    // the envelope hasn't already been signed/completed (idempotent retry safety).
    const finalStatus = status || 'pending';
    if (finalStatus === 'sent' && !signed_at && !completed_at) {
      void sendDealNdaInvite({ deal_room_id, user_id, side })
        .catch(err => console.error("[deal-rooms] NDA invite email failed:", err?.message || err));
    }
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ─────────── NDA invite email helper ─────────── */

let supabaseAdminClient: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (supabaseAdminClient) return supabaseAdminClient;
  const url = process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) return null;
  supabaseAdminClient = createClient(url, key, { auth: { persistSession: false } });
  return supabaseAdminClient;
}

async function sendDealNdaInvite(opts: { deal_room_id: string; user_id: string; side: string }) {
  const { deal_room_id, user_id, side } = opts;
  if (!user_id || (side !== "buyer" && side !== "seller")) return;

  const { rows: roomRows } = await db().query(
    "SELECT id, room_number, yacht_id FROM deal_rooms WHERE id = $1",
    [deal_room_id]
  );
  if (roomRows.length === 0) return;
  const room = roomRows[0];
  const dealRoomCode = room.room_number
    ? `DR-${String(room.room_number).padStart(6, "0")}`
    : String(room.id).slice(0, 8).toUpperCase();

  const sb = getSupabaseAdmin();
  if (!sb) {
    console.warn("[deal-rooms] Supabase env not set — cannot look up email for NDA invite");
    return;
  }

  let toEmail = "";
  try {
    const { data } = await sb.auth.admin.getUserById(user_id);
    toEmail = data?.user?.email || "";
  } catch (e) {
    console.warn(`[deal-rooms] auth.getUserById(${user_id}) failed:`, (e as Error).message);
  }
  if (!toEmail) {
    try {
      const { data } = await sb.from("users").select("email").eq("id", user_id).maybeSingle();
      toEmail = (data as any)?.email || "";
    } catch { /* ignore */ }
  }
  if (!toEmail) {
    console.warn(`[deal-rooms] No email found for user ${user_id} — skipping NDA invite`);
    return;
  }

  let yachtName: string | null = null;
  if (room.yacht_id) {
    try {
      const { data } = await sb.from("yachts").select("name").eq("id", room.yacht_id).maybeSingle();
      yachtName = (data as any)?.name || null;
    } catch { /* ignore */ }
  }

  await sendDealNdaInviteEmail({
    toEmail,
    side: side as "buyer" | "seller",
    dealRoomCode,
    dealRoomId: String(deal_room_id),
    yachtName,
  });
}

router.post("/audit-logs", requireUser, requirePlatformNdaSigned, validateBody(AuditLogBody), async (req, res) => {
  const { entity_type, entity_id, action, meta } = req.body;
  try {
    // Server-side participation check for deal_room audits (non-admins)
    if (req.authUser!.role !== "admin" && entity_type === "deal_room") {
      const auth = await isParticipantOrAdmin(String(entity_id), req.authUser);
      if (!auth.ok) { res.status(403).json({ error: "Access denied" }); return; }
    }
    const { rows } = await db().query(
      `INSERT INTO audit_logs (entity_type, entity_id, user_id, action, meta)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [entity_type, entity_id, req.authUser!.id, action, JSON.stringify(meta || {})]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/audit-logs/:entityType/:entityId", requireUser, requirePlatformNdaSigned, validateParams(AuditLogParams), async (req, res) => {
  try {
    if (req.authUser!.role !== "admin" && req.params.entityType === "deal_room") {
      const auth = await isParticipantOrAdmin(String(req.params.entityId), req.authUser);
      if (!auth.ok) { res.status(403).json({ error: "Access denied" }); return; }
    } else if (req.authUser!.role !== "admin") {
      // Other entity types: only admins can read audit history
      res.status(403).json({ error: "Admin only" });
      return;
    }
    const { rows } = await db().query(
      "SELECT * FROM audit_logs WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC",
      [req.params.entityType, req.params.entityId]
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/deal-rooms/:id/blocks", requireUser, requirePlatformNdaSigned, validateParams(DealRoomIdParams), async (req, res) => {
  try {
    const auth = await isParticipantOrAdmin(String(req.params.id), req.authUser);
    if (!auth.ok) { res.status(403).json({ error: "Access denied" }); return; }
    const { rows } = await db().query("SELECT * FROM deal_room_blocks WHERE deal_room_id = $1", [req.params.id]);
    const isAdmin = req.authUser!.role === "admin";
    const blockMap: Record<string, { is_unlocked: boolean; unlocked_by: string | null; unlocked_at: string | null }> = {};
    BLOCK_KEYS.forEach(k => { blockMap[k] = { is_unlocked: false, unlocked_by: null, unlocked_at: null }; });
    rows.forEach((r: any) => {
      blockMap[r.block_key] = {
        is_unlocked: r.is_unlocked,
        unlocked_by: isAdmin ? r.unlocked_by : null,
        unlocked_at: isAdmin ? r.unlocked_at : null,
      };
    });
    res.json(blockMap);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/deal-rooms/:id/blocks/:blockKey", requireAdmin, validateParams(DealRoomBlockParams), validateBody(BlockUpdateBody), async (req, res) => {
  const blockKey = String(req.params.blockKey || "");
  const { is_unlocked } = req.body;
  try {
    const adminId = req.authUser!.id;
    const { rows } = await db().query(
      `INSERT INTO deal_room_blocks (deal_room_id, block_key, is_unlocked, unlocked_by, unlocked_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (deal_room_id, block_key)
       DO UPDATE SET is_unlocked = $3, unlocked_by = $4, unlocked_at = $5
       RETURNING *`,
      [req.params.id, blockKey, is_unlocked, is_unlocked ? adminId : null, is_unlocked ? new Date().toISOString() : null]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/deal-rooms/:id/archive", requireAdmin, validateParams(DealRoomIdParams), validateBody(ArchiveBody), async (req, res) => {
  const { archived } = req.body;
  try {
    const { rows } = await db().query(
      "UPDATE deal_rooms SET archived = $2, updated_at = now() WHERE id = $1 RETURNING *",
      [req.params.id, archived !== false]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/deal-rooms/:id/commission/send", requireAdmin, validateParams(DealRoomIdParams), async (req, res) => {
  try {
    // Only initiate commission if not already in progress / completed (state regression guard)
    const { rows } = await db().query(
      `UPDATE deal_rooms SET
        commission_status = 'pending',
        buyer_commission_status = 'sent',
        seller_commission_status = 'sent',
        updated_at = now()
       WHERE id = $1
         AND (commission_status IS NULL OR commission_status IN ('not_started'))
       RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0) {
      const cur = await db().query("SELECT commission_status FROM deal_rooms WHERE id = $1", [req.params.id]);
      if (cur.rows.length === 0) { res.status(404).json({ error: "Deal room not found" }); return; }
      res.status(409).json({ error: `Commission already ${cur.rows[0].commission_status}` });
      return;
    }
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// NOTE: POST /deal-rooms/:id/commission/sign is now served by dealCommission.ts —
// it captures a versioned, content-hash-bound signature in deal_commission_signatures,
// generates a signed PDF, and emails it to the signer.

export default router;
