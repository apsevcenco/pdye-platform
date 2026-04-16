import { Router } from "express";
import pg from "pg";

const router = Router();

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

router.get("/deal-rooms", async (req, res) => {
  try {
    const includeArchived = req.query.include_archived === "true";
    const where = includeArchived ? "" : "WHERE (archived IS NULL OR archived = false)";
    const { rows } = await db().query(`SELECT * FROM deal_rooms ${where} ORDER BY created_at DESC`);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/deal-rooms/by-user/:userId", async (req, res) => {
  try {
    const { rows } = await db().query(
      "SELECT * FROM deal_rooms WHERE buyer_user_id = $1 OR seller_user_id = $1 ORDER BY created_at DESC",
      [req.params.userId]
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/deal-rooms/:id", async (req, res) => {
  try {
    const { rows } = await db().query("SELECT * FROM deal_rooms WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/deal-rooms", async (req, res) => {
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

router.patch("/deal-rooms/:id", async (req, res) => {
  const fields = req.body;
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ error: "No fields" });
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const vals = keys.map(k => fields[k]);
  try {
    const { rows } = await db().query(`UPDATE deal_rooms SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`, [req.params.id, ...vals]);
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/deal-rooms/:id", async (req, res) => {
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

router.get("/deal-rooms/:id/participants", async (req, res) => {
  try {
    const { rows } = await db().query("SELECT * FROM deal_room_participants WHERE deal_room_id = $1", [req.params.id]);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/deal-rooms/:id/participants", async (req, res) => {
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

router.patch("/deal-rooms/:roomId/participants", async (req, res) => {
  const fields = req.body;
  const keys = Object.keys(fields).filter(k => k !== 'deal_room_id');
  if (keys.length === 0) return res.status(400).json({ error: "No fields" });
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  const vals = keys.map(k => fields[k]);
  try {
    const { rows } = await db().query(`UPDATE deal_room_participants SET ${sets} WHERE deal_room_id = $1 RETURNING *`, [req.params.roomId, ...vals]);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/deal-rooms/:id/messages", async (req, res) => {
  try {
    const { rows } = await db().query("SELECT * FROM deal_room_messages WHERE deal_room_id = $1 ORDER BY created_at ASC", [req.params.id]);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/deal-rooms/:id/messages", async (req, res) => {
  const { sender_id, message, is_system } = req.body;
  try {
    const { rows } = await db().query(
      `INSERT INTO deal_room_messages (deal_room_id, sender_id, message, is_system)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.id, sender_id, message, is_system || false]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/deal-rooms/:id/documents", async (req, res) => {
  try {
    const { rows } = await db().query("SELECT * FROM deal_room_documents WHERE deal_room_id = $1 ORDER BY created_at DESC", [req.params.id]);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/deal-room-documents", async (_req, res) => {
  try {
    const { rows } = await db().query("SELECT * FROM deal_room_documents ORDER BY created_at DESC");
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/deal-room-documents/:id", async (req, res) => {
  try {
    await db().query("DELETE FROM deal_room_documents WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/deal-room-messages-all", async (_req, res) => {
  try {
    const { rows } = await db().query("SELECT * FROM deal_room_messages ORDER BY created_at DESC LIMIT 50");
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/deal-room-messages/:id", async (req, res) => {
  try {
    await db().query("DELETE FROM deal_room_messages WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/nda-envelopes", async (req, res) => {
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

router.post("/audit-logs", async (req, res) => {
  const { entity_type, entity_id, user_id, action, meta } = req.body;
  try {
    const { rows } = await db().query(
      `INSERT INTO audit_logs (entity_type, entity_id, user_id, action, meta)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [entity_type, entity_id, user_id, action, JSON.stringify(meta || {})]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/audit-logs/:entityType/:entityId", async (req, res) => {
  try {
    const { rows } = await db().query(
      "SELECT * FROM audit_logs WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC",
      [req.params.entityType, req.params.entityId]
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/deal-rooms/:id/blocks", async (req, res) => {
  try {
    const { rows } = await db().query("SELECT * FROM deal_room_blocks WHERE deal_room_id = $1", [req.params.id]);
    const blockMap: Record<string, { is_unlocked: boolean; unlocked_by: string | null; unlocked_at: string | null }> = {};
    BLOCK_KEYS.forEach(k => { blockMap[k] = { is_unlocked: false, unlocked_by: null, unlocked_at: null }; });
    rows.forEach((r: any) => {
      blockMap[r.block_key] = { is_unlocked: r.is_unlocked, unlocked_by: r.unlocked_by, unlocked_at: r.unlocked_at };
    });
    res.json(blockMap);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/deal-rooms/:id/blocks/:blockKey", async (req, res) => {
  const { blockKey } = req.params;
  const { is_unlocked, admin_id } = req.body;
  if (!BLOCK_KEYS.includes(blockKey)) return res.status(400).json({ error: "Invalid block key" });
  try {
    const { rows } = await db().query(
      `INSERT INTO deal_room_blocks (deal_room_id, block_key, is_unlocked, unlocked_by, unlocked_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (deal_room_id, block_key)
       DO UPDATE SET is_unlocked = $3, unlocked_by = $4, unlocked_at = $5
       RETURNING *`,
      [req.params.id, blockKey, is_unlocked, is_unlocked ? admin_id : null, is_unlocked ? new Date().toISOString() : null]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/deal-rooms/:id/archive", async (req, res) => {
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

router.post("/deal-rooms/:id/commission/send", async (req, res) => {
  const { admin_id } = req.body;
  try {
    const { rows } = await db().query(
      `UPDATE deal_rooms SET
        commission_status = 'pending',
        buyer_commission_status = 'sent',
        seller_commission_status = 'sent',
        updated_at = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/deal-rooms/:id/commission/sign", async (req, res) => {
  const { side, user_id } = req.body;
  if (!["buyer", "seller"].includes(side)) return res.status(400).json({ error: "Invalid side" });
  const now = new Date().toISOString();
  try {
    const col = side === "buyer" ? "buyer_commission_status" : "seller_commission_status";
    const tsCol = side === "buyer" ? "buyer_commission_signed_at" : "seller_commission_signed_at";
    await db().query(`UPDATE deal_rooms SET ${col} = 'signed', ${tsCol} = $2, updated_at = now() WHERE id = $1`, [req.params.id, now]);

    const { rows } = await db().query("SELECT * FROM deal_rooms WHERE id = $1", [req.params.id]);
    const room = rows[0];
    if (room && room.buyer_commission_status === "signed" && room.seller_commission_status === "signed") {
      await db().query(
        "UPDATE deal_rooms SET commission_status = 'completed', commission_fully_signed_at = $2, identities_revealed = true, updated_at = now() WHERE id = $1",
        [req.params.id, now]
      );
      for (const bk of ["identities", "yacht_name", "location"]) {
        await db().query(
          `INSERT INTO deal_room_blocks (deal_room_id, block_key, is_unlocked, unlocked_by, unlocked_at)
           VALUES ($1, $2, true, $3, now())
           ON CONFLICT (deal_room_id, block_key) DO UPDATE SET is_unlocked = true, unlocked_by = $3, unlocked_at = now()`,
          [req.params.id, bk, user_id]
        );
      }
      const updated = await db().query("SELECT * FROM deal_rooms WHERE id = $1", [req.params.id]);
      return res.json(updated.rows[0]);
    }
    const refreshed = await db().query("SELECT * FROM deal_rooms WHERE id = $1", [req.params.id]);
    res.json(refreshed.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
