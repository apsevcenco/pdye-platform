import { Router, type IRouter } from "express";
import pg from "pg";
import { requireAdmin } from "../middlewares/auth";

let pool: pg.Pool | null = null;
function db(): pg.Pool {
  if (pool) return pool;
  const dbUrl = process.env["DATABASE_URL"];
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  pool = new pg.Pool({ connectionString: dbUrl, max: 5 });
  return pool;
}

const EPOCH = "1970-01-01T00:00:00.000Z";

type CountSpec = {
  table: string;
  timeCol: "created_at" | "signed_at";
  where?: string;
};

const SECTIONS: Record<string, CountSpec> = {
  adminLeads:         { table: "leads",                       timeCol: "created_at" },
  adminMessages:      { table: "deal_room_messages",          timeCol: "created_at", where: "is_system = false" },
  adminDocuments:     { table: "deal_room_documents",         timeCol: "created_at" },
  adminPrivateBuyers: { table: "users",                       timeCol: "created_at", where: "role IN ('buyer','investor')" },
  adminBrokers:       { table: "users",                       timeCol: "created_at", where: "role = 'broker'" },
  adminOwners:        { table: "users",                       timeCol: "created_at", where: "role = 'owner'" },
  adminPlatformNda:   { table: "platform_nda_signatures",     timeCol: "signed_at" },
  adminDealNda:       { table: "deal_nda_signatures",         timeCol: "signed_at" },
  adminCommission:    { table: "deal_commission_signatures",  timeCol: "signed_at" },
};

function isIsoTimestamp(s: unknown): s is string {
  if (typeof s !== "string") return false;
  if (s.length > 40) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

const router: IRouter = Router();

// POST /api/admin/badge-counts
// Body: { since: { [section]: ISO timestamp } }
// Returns: { counts: { [section]: number } }
//
// Counts rows added/signed strictly AFTER the per-section "lastSeen" timestamp.
// Missing/invalid section timestamps fall back to epoch (count all).
// Tables that don't exist yet (legacy DBs without a migration) silently return 0.
router.post("/admin/badge-counts", requireAdmin, async (req, res) => {
  const sinceRaw = (req.body && (req.body.since as Record<string, unknown>)) || {};
  const counts: Record<string, number> = {};

  await Promise.all(
    Object.entries(SECTIONS).map(async ([key, spec]) => {
      const since = isIsoTimestamp(sinceRaw[key]) ? (sinceRaw[key] as string) : EPOCH;
      const whereExtra = spec.where ? ` AND ${spec.where}` : "";
      const sql = `SELECT COUNT(*)::int AS c FROM ${spec.table} WHERE ${spec.timeCol} > $1${whereExtra}`;
      try {
        const { rows } = await db().query(sql, [since]);
        counts[key] = rows[0]?.c ?? 0;
      } catch (e: any) {
        // Missing table / column — treat as 0 rather than 500ing the whole call.
        // This keeps the sidebar working even if a section's migration hasn't
        // been applied yet on this environment.
        const code = e?.code;
        if (code === "42P01" || code === "42703") {
          counts[key] = 0;
        } else {
          console.warn(`[badge-counts] ${key} failed:`, e?.message || e);
          counts[key] = 0;
        }
      }
    })
  );

  res.json({ counts });
});

export default router;
