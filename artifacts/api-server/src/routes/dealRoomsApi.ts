import { Router } from "express";
import pg from "pg";

const router = Router();

function getPool() {
  const dbUrl = process.env["DATABASE_URL"];
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  return new pg.Pool({ connectionString: dbUrl, max: 5 });
}

let pool: pg.Pool | null = null;
function db() {
  if (!pool) pool = getPool();
  return pool;
}

router.get("/deal-rooms", async (_req, res) => {
  try {
    const { rows } = await db().query("SELECT * FROM deal_rooms ORDER BY created_at DESC");
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
    await db().query("DELETE FROM deal_rooms WHERE id = $1", [req.params.id]);
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

export default router;
