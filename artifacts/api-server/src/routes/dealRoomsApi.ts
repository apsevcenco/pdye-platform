import { Router } from "express";
import pg from "pg";
import { requireAdmin, requireUser, optionalUser } from "../middlewares/auth";
import { requirePlatformNdaSigned } from "./platformNda";

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

const BLOCK_KEYS = ["specs", "photos", "documents", "chat", "location", "yacht_name", "identities"];

router.get("/deal-rooms", requireUser, requirePlatformNdaSigned, async (req, res) => {
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

router.get("/deal-rooms/by-user/:userId", requireUser, requirePlatformNdaSigned, async (req, res) => {
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

router.get("/deal-rooms/:id", optionalUser, async (req, res) => {
  try {
    const { rows } = await db().query("SELECT * FROM deal_rooms WHERE id = $1", [req.params.id]);
    if (rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    res.json(applyPrivacyShape(rows[0], req.authUser));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/deal-rooms", requireAdmin, async (req, res) => {
  const { yacht_id, created_by_admin_id, buyer_user_id, seller_user_id, notes, status, nda_required } = req.body;
  try {
    const { rows } = await db().query(
      `INSERT INTO deal_rooms (yacht_id, created_by_admin_id, buyer_user_id, seller_user_id, notes, status, nda_required)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [yacht_id, created_by_admin_id || '00000000-0000-0000-0000-000000000000', buyer_user_id, seller_user_id, notes, status || 'draft', nda_required !== false]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/deal-rooms/:id", requireAdmin, async (req, res) => {
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

router.delete("/deal-rooms/:id", requireAdmin, async (req, res) => {
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

router.get("/deal-rooms/:id/participants", requireUser, requirePlatformNdaSigned, async (req, res) => {
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

router.post("/deal-rooms/:id/participants", requireAdmin, async (req, res) => {
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

router.patch("/deal-rooms/:roomId/participants", requireAdmin, async (req, res) => {
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

router.get("/deal-rooms/:id/messages", requireUser, requirePlatformNdaSigned, async (req, res) => {
  try {
    const auth = await isParticipantOrAdmin(String(req.params.id), req.authUser);
    if (!auth.ok) { res.status(403).json({ error: "Access denied" }); return; }
    const { rows } = await db().query("SELECT * FROM deal_room_messages WHERE deal_room_id = $1 ORDER BY created_at ASC", [req.params.id]);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/deal-rooms/:id/messages", requireUser, requirePlatformNdaSigned, async (req, res) => {
  const { message, is_system } = req.body;
  if (typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Message text required" });
    return;
  }
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

router.get("/deal-rooms/:id/documents", requireUser, requirePlatformNdaSigned, async (req, res) => {
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

router.delete("/deal-room-documents/:id", requireAdmin, async (req, res) => {
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

router.delete("/deal-room-messages/:id", requireAdmin, async (req, res) => {
  try {
    await db().query("DELETE FROM deal_room_messages WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/nda-envelopes", requireAdmin, async (req, res) => {
  const { deal_room_id, user_id, side, provider, status, sent_at, signed_at, completed_at, document_name } = req.body;
  try {
    const { rows } = await db().query(
      `INSERT INTO nda_envelopes (deal_room_id, user_id, side, provider, status, sent_at, signed_at, completed_at, document_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [deal_room_id, user_id, side, provider || 'internal', status || 'pending', sent_at, signed_at, completed_at, document_name]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/audit-logs", requireUser, requirePlatformNdaSigned, async (req, res) => {
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

router.get("/audit-logs/:entityType/:entityId", requireUser, requirePlatformNdaSigned, async (req, res) => {
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

router.get("/deal-rooms/:id/blocks", requireUser, requirePlatformNdaSigned, async (req, res) => {
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

router.put("/deal-rooms/:id/blocks/:blockKey", requireAdmin, async (req, res) => {
  const blockKey = String(req.params.blockKey || "");
  const { is_unlocked } = req.body;
  if (!BLOCK_KEYS.includes(blockKey)) { res.status(400).json({ error: "Invalid block key" }); return; }
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

router.patch("/deal-rooms/:id/archive", requireAdmin, async (req, res) => {
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

router.post("/deal-rooms/:id/commission/send", requireAdmin, async (req, res) => {
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

router.post("/deal-rooms/:id/commission/sign", requireUser, requirePlatformNdaSigned, async (req, res) => {
  const { side } = req.body;
  if (!["buyer", "seller"].includes(side)) { res.status(400).json({ error: "Invalid side" }); return; }
  const viewer = req.authUser!;
  const now = new Date().toISOString();
  try {
    // Verify caller is the participant for the claimed side
    const { rows: roomRows } = await db().query("SELECT * FROM deal_rooms WHERE id = $1", [req.params.id]);
    if (roomRows.length === 0) { res.status(404).json({ error: "Deal room not found" }); return; }
    const room = roomRows[0];
    const expectedUserId = side === "buyer" ? room.buyer_user_id : room.seller_user_id;
    if (viewer.role !== "admin" && expectedUserId !== viewer.id) {
      res.status(403).json({ error: "You may only sign as your own role in this deal room" });
      return;
    }
    if (room.commission_status !== "pending") {
      res.status(409).json({ error: `Commission is not pending (status: ${room.commission_status})` });
      return;
    }

    const col = side === "buyer" ? "buyer_commission_status" : "seller_commission_status";
    const tsCol = side === "buyer" ? "buyer_commission_signed_at" : "seller_commission_signed_at";
    // Idempotent update — only flip if currently 'sent'
    await db().query(
      `UPDATE deal_rooms SET ${col} = 'signed', ${tsCol} = $2, updated_at = now()
       WHERE id = $1 AND ${col} = 'sent'`,
      [req.params.id, now]
    );

    const { rows } = await db().query("SELECT * FROM deal_rooms WHERE id = $1", [req.params.id]);
    const updated = rows[0];
    if (updated && updated.buyer_commission_status === "signed" && updated.seller_commission_status === "signed" && !updated.commission_fully_signed_at) {
      await db().query(
        "UPDATE deal_rooms SET commission_status = 'completed', commission_fully_signed_at = $2, identities_revealed = true, updated_at = now() WHERE id = $1",
        [req.params.id, now]
      );
      for (const bk of ["identities", "yacht_name", "location"]) {
        await db().query(
          `INSERT INTO deal_room_blocks (deal_room_id, block_key, is_unlocked, unlocked_by, unlocked_at)
           VALUES ($1, $2, true, $3, now())
           ON CONFLICT (deal_room_id, block_key) DO UPDATE SET is_unlocked = true, unlocked_by = $3, unlocked_at = now()`,
          [req.params.id, bk, viewer.id]
        );
      }
    }
    const refreshed = await db().query("SELECT * FROM deal_rooms WHERE id = $1", [req.params.id]);
    res.json(applyPrivacyShape(refreshed.rows[0], viewer));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
