import { Router, type IRouter } from "express";
import pg from "pg";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

let pool: pg.Pool | null = null;
function db(): pg.Pool {
  if (!pool) {
    const dbUrl = process.env["DATABASE_URL"];
    if (!dbUrl) throw new Error("DATABASE_URL not set");
    pool = new pg.Pool({ connectionString: dbUrl, max: 5 });
    runMigration().catch((e) =>
      console.error("[site-content] Migration error:", e),
    );
  }
  return pool;
}

let migrationDone = false;
let migrationPromise: Promise<void> | null = null;
async function runMigration(): Promise<void> {
  if (migrationDone) return;
  if (migrationPromise) return migrationPromise;
  migrationPromise = (async () => {
    const client = await db().connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS site_content (
          page_id text NOT NULL,
          section_id text NOT NULL,
          field_key text NOT NULL,
          value text NOT NULL,
          updated_at timestamptz DEFAULT now(),
          updated_by uuid,
          PRIMARY KEY (page_id, section_id, field_key)
        );
      `);
      migrationDone = true;
      console.log("[site-content] Migration complete");
    } catch (e: any) {
      // Postgres can raise 23505/42P07 when CREATE TABLE IF NOT EXISTS races
      // a concurrent create (pg_type duplicate). The table exists either way.
      if (e?.code === "23505" || e?.code === "42P07") {
        migrationDone = true;
        console.log("[site-content] Migration complete (table already existed)");
      } else {
        throw e;
      }
    } finally {
      client.release();
    }
  })().catch((e) => {
    migrationPromise = null;
    throw e;
  });
  return migrationPromise;
}

const ID_RE = /^[a-z0-9_]{1,64}$/i;

function isValidId(s: unknown): s is string {
  return typeof s === "string" && ID_RE.test(s);
}

router.get("/site-content", async (_req, res) => {
  try {
    await runMigration().catch(() => { /* fall through */ });
    const { rows } = await db().query<{
      page_id: string;
      section_id: string;
      field_key: string;
      value: string;
    }>(
      "SELECT page_id, section_id, field_key, value FROM site_content",
    );
    const out: Record<string, Record<string, Record<string, string>>> = {};
    for (const r of rows) {
      if (!out[r.page_id]) out[r.page_id] = {};
      if (!out[r.page_id][r.section_id]) out[r.page_id][r.section_id] = {};
      out[r.page_id][r.section_id][r.field_key] = r.value;
    }
    res.set("Cache-Control", "no-store");
    res.json({ content: out });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/admin/site-content", requireAdmin, async (req, res) => {
  const { page_id, section_id, data } = req.body || {};
  if (!isValidId(page_id) || !isValidId(section_id)) {
    res.status(400).json({ error: "Invalid page_id or section_id" });
    return;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    res.status(400).json({ error: "data must be an object" });
    return;
  }
  const entries = Object.entries(data as Record<string, unknown>);
  for (const [k, v] of entries) {
    if (!isValidId(k)) {
      res.status(400).json({ error: `Invalid field key: ${k}` });
      return;
    }
    if (typeof v !== "string") {
      res.status(400).json({ error: `Field "${k}" must be a string` });
      return;
    }
    if (v.length > 20000) {
      res.status(400).json({ error: `Field "${k}" exceeds 20000 chars` });
      return;
    }
  }
  try {
    await runMigration().catch(() => { /* fall through */ });
    const u = req.authUser!;
    const client = await db().connect();
    try {
      await client.query("BEGIN");
      for (const [field_key, value] of entries) {
        await client.query(
          `INSERT INTO site_content (page_id, section_id, field_key, value, updated_at, updated_by)
           VALUES ($1, $2, $3, $4, now(), $5)
           ON CONFLICT (page_id, section_id, field_key) DO UPDATE
             SET value = EXCLUDED.value,
                 updated_at = now(),
                 updated_by = EXCLUDED.updated_by`,
          [page_id, section_id, field_key, value, u.id],
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
    res.json({ ok: true, page_id, section_id, count: entries.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete(
  "/admin/site-content/:pageId/:sectionId",
  requireAdmin,
  async (req, res) => {
    const pageId = String(req.params.pageId || "");
    const sectionId = String(req.params.sectionId || "");
    if (!isValidId(pageId) || !isValidId(sectionId)) {
      res.status(400).json({ error: "Invalid page_id or section_id" });
      return;
    }
    try {
      await runMigration().catch(() => { /* fall through */ });
      const { rowCount } = await db().query(
        "DELETE FROM site_content WHERE page_id = $1 AND section_id = $2",
        [pageId, sectionId],
      );
      res.json({ ok: true, deleted: rowCount });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

export default router;
