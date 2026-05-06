import { Router, type IRouter } from "express";
import pg from "pg";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const ALLOWED_KINDS = new Set(["privacy", "legal"]);

const DEFAULTS: Record<string, { title: string; content: string }> = {
  privacy: {
    title: "Privacy Policy",
    content:
      "<p>This Privacy Policy describes how Private Distressed Yacht Exchange (PDYE) collects, uses and protects your personal data.</p><p>Edit this text in the admin panel.</p>",
  },
  legal: {
    title: "Legal Notice",
    content:
      "<p>This Legal Notice sets out the legal information relating to the PDYE platform, its operator and the conditions of use.</p><p>Edit this text in the admin panel.</p>",
  },
};

let pool: pg.Pool | null = null;
function db(): pg.Pool {
  if (!pool) {
    const dbUrl = process.env["DATABASE_URL"];
    if (!dbUrl) throw new Error("DATABASE_URL not set");
    pool = new pg.Pool({ connectionString: dbUrl, max: 5 });
    runMigration().catch((e) => console.error("[legal-pages] Migration error:", e));
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
        CREATE TABLE IF NOT EXISTS legal_pages (
          kind text PRIMARY KEY,
          title text NOT NULL,
          content text NOT NULL,
          updated_at timestamptz DEFAULT now(),
          updated_by uuid
        );
      `);
      for (const kind of Object.keys(DEFAULTS)) {
        const d = DEFAULTS[kind];
        await client.query(
          `INSERT INTO legal_pages (kind, title, content)
           VALUES ($1, $2, $3)
           ON CONFLICT (kind) DO NOTHING`,
          [kind, d.title, d.content],
        );
      }
      migrationDone = true;
      console.log("[legal-pages] Migration complete");
    } finally {
      client.release();
    }
  })().catch((e) => {
    migrationPromise = null;
    throw e;
  });
  return migrationPromise;
}

router.get("/legal/:kind", async (req, res) => {
  const kind = String(req.params.kind || "").toLowerCase();
  if (!ALLOWED_KINDS.has(kind)) {
    res.status(404).json({ error: "Unknown legal page" });
    return;
  }
  try {
    await runMigration().catch(() => { /* fall through */ });
    const { rows } = await db().query(
      "SELECT kind, title, content, updated_at FROM legal_pages WHERE kind = $1 LIMIT 1",
      [kind],
    );
    if (rows.length === 0) {
      const d = DEFAULTS[kind];
      res.json({ kind, title: d.title, content: d.content, updated_at: null });
      return;
    }
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/admin/legal/:kind", requireAdmin, async (req, res) => {
  const kind = String(req.params.kind || "").toLowerCase();
  if (!ALLOWED_KINDS.has(kind)) {
    res.status(404).json({ error: "Unknown legal page" });
    return;
  }
  const { title, content } = req.body || {};
  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  if (!content || typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "Content is required" });
    return;
  }
  try {
    await runMigration().catch(() => { /* fall through */ });
    const u = req.authUser!;
    const { rows } = await db().query(
      `INSERT INTO legal_pages (kind, title, content, updated_at, updated_by)
       VALUES ($1, $2, $3, now(), $4)
       ON CONFLICT (kind) DO UPDATE
         SET title = EXCLUDED.title,
             content = EXCLUDED.content,
             updated_at = now(),
             updated_by = EXCLUDED.updated_by
       RETURNING kind, title, content, updated_at`,
      [kind, title.trim(), content, u.id],
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
