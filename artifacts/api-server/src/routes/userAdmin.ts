import { Router, type Request, type Response } from "express";
import pg from "pg";
import { getSupabaseAdmin, requireAdmin } from "../middlewares/auth";

const router: Router = Router();

let pool: pg.Pool | null = null;
function db(): pg.Pool {
  if (!pool) {
    const dbUrl = process.env["DATABASE_URL"];
    if (!dbUrl) throw new Error("DATABASE_URL not set");
    pool = new pg.Pool({ connectionString: dbUrl, max: 5 });
  }
  return pool;
}

type HeliumRef = { table: string; column: string; label: string };

// USER-OWNED data: safe to cascade-delete when the user is removed.
// These rows belong to the specific user and have no shared usage.
const CASCADE_USER_REFS: HeliumRef[] = [
  { table: "platform_nda_signatures",   column: "user_id",        label: "Platform NDA signature(s)" },
  { table: "deal_nda_signatures",       column: "user_id",        label: "Deal Room NDA signature(s)" },
  { table: "deal_commission_signatures", column: "user_id",       label: "Commission Agreement signature(s)" },
  { table: "nda_envelopes",             column: "user_id",        label: "legacy NDA envelope(s)" },
  { table: "deal_room_participants",   column: "user_id",        label: "deal room participation(s)" },
  { table: "deal_rooms",               column: "buyer_user_id",  label: "deal room(s) as buyer" },
  { table: "deal_rooms",               column: "seller_user_id", label: "deal room(s) as seller" },
  { table: "deal_room_messages",       column: "sender_id",      label: "deal room message(s)" },
  { table: "deal_room_documents",      column: "uploaded_by",    label: "uploaded deal room document(s)" },
  { table: "deal_room_blocks",         column: "unlocked_by",    label: "unlocked deal room block(s)" },
  { table: "audit_logs",               column: "user_id",        label: "audit log record(s)" },
];

// EMAIL-keyed signature tables: when a user is deleted we also sweep these by
// user_email to catch "ghost" rows whose user_id belongs to a previously-deleted
// account that shared the same email. Without this, the new user's card would
// keep showing the old NDA signature (because the admin UI matches by email too).
const CASCADE_EMAIL_REFS: HeliumRef[] = [
  { table: "platform_nda_signatures",   column: "user_email", label: "Platform NDA signature(s) (by email)" },
  { table: "deal_nda_signatures",       column: "user_email", label: "Deal Room NDA signature(s) (by email)" },
  { table: "deal_commission_signatures", column: "user_email", label: "Commission Agreement signature(s) (by email)" },
];

// SHARED / ADMIN-CREATED data: must NOT be cascade-deleted because deleting it
// would break the platform for other users (e.g. wiping the seeded NDA template).
// If a user has any of these, delete is REFUSED — admin must manually reassign.
const BLOCK_USER_REFS: HeliumRef[] = [
  { table: "platform_nda_documents",     column: "created_by",          label: "Platform NDA version(s) (shared template!)" },
  { table: "deal_nda_documents",         column: "created_by",          label: "Deal Room NDA version(s) (shared template!)" },
  { table: "deal_commission_documents",  column: "created_by",          label: "Commission Agreement version(s) (shared template!)" },
  { table: "deal_rooms",                 column: "created_by_admin_id", label: "deal room(s) created by this admin" },
];

async function tableExists(client: pg.PoolClient | pg.Pool, table: string): Promise<boolean> {
  const r = await client.query<{ exists: boolean }>(
    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) AS exists",
    [table],
  );
  return Boolean(r.rows[0]?.exists);
}

async function columnExists(client: pg.PoolClient | pg.Pool, table: string, column: string): Promise<boolean> {
  const r = await client.query<{ exists: boolean }>(
    "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2) AS exists",
    [table, column],
  );
  return Boolean(r.rows[0]?.exists);
}

function isValidUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

type CountedRef = { label: string; count: number; table: string; column: string };

async function countRefs(refs: HeliumRef[], userId: string): Promise<{ counts: CountedRef[]; total: number }> {
  const counts: CountedRef[] = [];
  let total = 0;
  for (const ref of refs) {
    if (!(await tableExists(db(), ref.table))) continue;
    if (!(await columnExists(db(), ref.table, ref.column))) continue;
    const r = await db().query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM "${ref.table}" WHERE "${ref.column}" = $1`,
      [userId],
    );
    const c = Number(r.rows[0]?.c || "0");
    if (c > 0) {
      counts.push({ label: ref.label, count: c, table: ref.table, column: ref.column });
      total += c;
    }
  }
  return { counts, total };
}

/* ─────────────────── GET /admin/users/:userId/heliumdb-references ─────────────────── */
router.get("/admin/users/:userId/heliumdb-references", requireAdmin, async (req: Request, res: Response) => {
  const userId = String(req.params.userId || "");
  if (!isValidUuid(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }

  try {
    const cascadeable = await countRefs(CASCADE_USER_REFS, userId);
    const blocking = await countRefs(BLOCK_USER_REFS, userId);
    res.json({
      cascadeable: cascadeable.counts,
      cascadeableTotal: cascadeable.total,
      blocking: blocking.counts,
      blockingTotal: blocking.total,
    });
  } catch (e: any) {
    console.error("[user-admin] heliumdb-references error:", e?.message);
    res.status(500).json({ error: e?.message || "Failed to count heliumdb references" });
  }
});

/* ─────────────────── POST /admin/users/:userId/cascade-delete ─────────────────── */
// Deletes all cascade-eligible heliumdb records for this user_id in a single transaction.
// REFUSES if user has any BLOCK refs (admin-created shared content).
// Does NOT touch the Supabase users row — caller must do that after success.
router.post("/admin/users/:userId/cascade-delete", requireAdmin, async (req: Request, res: Response) => {
  const userId = String(req.params.userId || "");
  if (!isValidUuid(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }
  if (req.authUser && req.authUser.id === userId) {
    res.status(400).json({ error: "You cannot cascade-delete your own account" });
    return;
  }

  // Pre-check: refuse if any BLOCK refs exist (using non-tx query — read-only)
  let blocking;
  try {
    blocking = await countRefs(BLOCK_USER_REFS, userId);
  } catch (e: any) {
    res.status(500).json({ error: "Could not check blocking dependencies: " + (e?.message || "") });
    return;
  }
  if (blocking.total > 0) {
    res.status(409).json({
      error: "The user has shared/admin records whose removal would break the platform. " +
             "Reassign them to another administrator first.",
      blocking: blocking.counts,
    });
    return;
  }

  // Look up the user's email from Supabase BEFORE we touch anything, so we can
  // also sweep email-keyed signature rows (catches "ghost" sigs left by a previous
  // account that re-used this email but had a different user_id).
  let userEmail: string | null = null;
  try {
    const sb = getSupabaseAdmin();
    const { data: authUser } = await sb.auth.admin.getUserById(userId);
    userEmail = (authUser?.user?.email || "").trim().toLowerCase() || null;
    if (!userEmail) {
      // Fall back to public.users row (auth user might already be gone).
      const { data: profileRow } = await sb.from("users").select("email").eq("id", userId).maybeSingle();
      userEmail = ((profileRow as { email?: string } | null)?.email || "").trim().toLowerCase() || null;
    }
  } catch (e: any) {
    console.warn("[user-admin] could not look up email for cascade-delete:", e?.message);
  }

  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const deleted: CountedRef[] = [];
    let total = 0;
    for (const ref of CASCADE_USER_REFS) {
      if (!(await tableExists(client, ref.table))) continue;
      if (!(await columnExists(client, ref.table, ref.column))) continue;
      const r = await client.query(
        `DELETE FROM "${ref.table}" WHERE "${ref.column}" = $1`,
        [userId],
      );
      const c = r.rowCount || 0;
      if (c > 0) {
        deleted.push({ label: ref.label, count: c, table: ref.table, column: ref.column });
        total += c;
      }
    }
    // Now sweep email-keyed signature rows that escaped the user_id sweep
    // (they belonged to a previously-deleted account that shared this email).
    if (userEmail) {
      for (const ref of CASCADE_EMAIL_REFS) {
        if (!(await tableExists(client, ref.table))) continue;
        if (!(await columnExists(client, ref.table, ref.column))) continue;
        const r = await client.query(
          `DELETE FROM "${ref.table}" WHERE LOWER("${ref.column}") = $1`,
          [userEmail],
        );
        const c = r.rowCount || 0;
        if (c > 0) {
          deleted.push({ label: ref.label, count: c, table: ref.table, column: ref.column });
          total += c;
        }
      }
    }
    // Best-effort audit log of the cascade itself
    try {
      if (await tableExists(client, "audit_logs")) {
        const hasUserCol = await columnExists(client, "audit_logs", "user_id");
        const hasActionCol = await columnExists(client, "audit_logs", "action");
        const hasMetaCol = await columnExists(client, "audit_logs", "meta");
        if (hasUserCol && hasActionCol && hasMetaCol) {
          await client.query(
            `INSERT INTO "audit_logs" ("user_id", "action", "meta") VALUES ($1, $2, $3::jsonb)`,
            [req.authUser!.id, "user_cascade_delete", JSON.stringify({ target_user_id: userId, deleted, total })],
          );
        }
      }
    } catch (auditErr: any) {
      console.warn("[user-admin] cascade audit log failed:", auditErr?.message);
    }
    await client.query("COMMIT");
    res.json({ ok: true, deleted, total });
  } catch (e: any) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[user-admin] cascade-delete error:", e?.message);
    res.status(500).json({ error: e?.message || "Cascade delete failed" });
  } finally {
    client.release();
  }
});

/* ─────────────────── POST /admin/users/:userId/delete-auth-user ─────────────────── */
// Removes the Supabase Auth user so the email cannot be silently reused on a later
// signup/lead-approval (which would recycle the same UUID and re-attach any
// surviving signature/profile rows). Idempotent: a missing auth user is success.
router.post("/admin/users/:userId/delete-auth-user", requireAdmin, async (req: Request, res: Response) => {
  const userId = String(req.params.userId || "");
  if (!isValidUuid(userId)) { res.status(400).json({ error: "Invalid user id" }); return; }
  if (req.authUser && req.authUser.id === userId) {
    res.status(400).json({ error: "You cannot delete your own auth account" });
    return;
  }

  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb.auth.admin.deleteUser(userId);
    if (error) {
      const msg = error.message || "";
      const status = (error as any).status as number | undefined;
      const code = (error as any).code as string | undefined;
      // Idempotent: if the auth user is already gone, treat as success.
      // Prefer structured signals (HTTP status / error code), fall back to message regex.
      const isNotFound =
        status === 404 ||
        code === "user_not_found" ||
        /not\s*found|user_not_found|no rows|user does not exist/i.test(msg);
      if (isNotFound) {
        res.json({ ok: true, alreadyAbsent: true });
        return;
      }
      console.error("[user-admin] delete-auth-user error:", msg, { status, code });
      res.status(500).json({ error: msg });
      return;
    }
    res.json({ ok: true });
  } catch (e: any) {
    console.error("[user-admin] delete-auth-user exception:", e?.message);
    res.status(500).json({ error: e?.message || "Failed to delete auth user" });
  }
});

export default router;
