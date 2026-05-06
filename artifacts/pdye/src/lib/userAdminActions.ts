import { supabase } from "@/lib/supabase";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function apiRequest(path: string, options?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  const authHeader: Record<string, string> = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...options?.headers,
    },
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return resp.json();
}

export const ARCHIVE_MIGRATION_MISSING_HINT =
  "Database is not ready: the `archived` column is missing from the `users` table. " +
  "Run the SQL migration `artifacts/pdye/migrations/003_users_archived.sql` once " +
  "in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run). " +
  "Archive / Restore will start working after that.";

function isMissingColumnError(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  if (err.code === "42703" || err.code === "PGRST204") return true;
  if (err.message && /column .* does not exist/i.test(err.message)) return true;
  if (err.message && /could not find the .* column/i.test(err.message)) return true;
  return false;
}

export type ArchiveResult = {
  ok: boolean;
  error?: string;
  errorKind?: "migration_missing" | "other";
};

export async function archiveUserAction(userId: string, archive: boolean): Promise<ArchiveResult> {
  const { error, data } = await supabase
    .from("users")
    .update({ archived: archive, archived_at: archive ? new Date().toISOString() : null })
    .eq("id", userId)
    .select("id");
  if (error) {
    if (isMissingColumnError(error)) {
      return { ok: false, error: ARCHIVE_MIGRATION_MISSING_HINT, errorKind: "migration_missing" };
    }
    return { ok: false, error: error.message, errorKind: "other" };
  }
  if (!data || data.length === 0) {
    return {
      ok: false,
      errorKind: "other",
      error: "No row was updated (0 rows). The Supabase RLS policy may be blocking UPDATE for the current role — check policies on public.users.",
    };
  }
  return { ok: true };
}

/* ─────────────────── Reference checks ─────────────────── */
// Only Supabase tables with verified columns. heliumdb tables are checked via api-server.
const SUPABASE_REFS: Array<{ table: string; column: string; label: string }> = [
  { table: "access_requests", column: "requester_id", label: "access request(s)" },
  { table: "yachts",          column: "owner_id",    label: "yacht listing(s)" },
];

export type UserReference = { label: string; count: number; table?: string; column?: string };
export type PreflightFailure = { table: string; column: string; code?: string; message: string };

export type ReferenceCheck = {
  counts: UserReference[];
  total: number;
  preflightFailed: boolean;
  failures: PreflightFailure[];
};

export type FullReferenceCheck = {
  supabase: ReferenceCheck;
  heliumdb: {
    cascadeable: UserReference[];   // user-owned heliumdb data (safe to cascade-delete)
    blocking: UserReference[];      // shared/admin heliumdb data (must refuse delete)
    cascadeableTotal: number;
    blockingTotal: number;
    error?: string;
  };
  blockingTotal: number;            // Supabase blocking + heliumdb blocking (delete REFUSED)
  cascadeableTotal: number;         // heliumdb cascadeable count (delete needs approval)
};

export async function countSupabaseReferences(userId: string): Promise<ReferenceCheck> {
  const counts: UserReference[] = [];
  const failures: PreflightFailure[] = [];
  let total = 0;
  for (const ref of SUPABASE_REFS) {
    const { count, error } = await supabase
      .from(ref.table)
      .select("*", { count: "exact", head: true })
      .eq(ref.column, userId);
    if (error) {
      failures.push({ table: ref.table, column: ref.column, code: (error as any).code, message: error.message || "(empty)" });
      continue;
    }
    if (count && count > 0) {
      counts.push({ label: ref.label, count, table: ref.table, column: ref.column });
      total += count;
    }
  }
  return { counts, total, preflightFailed: failures.length > 0, failures };
}

export async function countHeliumdbReferences(userId: string): Promise<{
  cascadeable: UserReference[];
  blocking: UserReference[];
  cascadeableTotal: number;
  blockingTotal: number;
  error?: string;
}> {
  try {
    const r = await apiRequest(`/admin/users/${encodeURIComponent(userId)}/heliumdb-references`);
    return {
      cascadeable: r.cascadeable || [],
      blocking: r.blocking || [],
      cascadeableTotal: r.cascadeableTotal || 0,
      blockingTotal: r.blockingTotal || 0,
    };
  } catch (e: any) {
    return {
      cascadeable: [], blocking: [], cascadeableTotal: 0, blockingTotal: 0,
      error: e?.message || "Could not fetch data from the deal-rooms database",
    };
  }
}

export async function countAllUserReferences(userId: string): Promise<FullReferenceCheck> {
  const [sb, hd] = await Promise.all([countSupabaseReferences(userId), countHeliumdbReferences(userId)]);
  return {
    supabase: sb,
    heliumdb: hd,
    blockingTotal: sb.total + hd.blockingTotal,
    cascadeableTotal: hd.cascadeableTotal,
  };
}

// Backwards-compat shim: some callers still use countUserReferences (Supabase-only).
export async function countUserReferences(userId: string): Promise<ReferenceCheck> {
  return countSupabaseReferences(userId);
}

/* ─────────────────── Delete ─────────────────── */

export type DeleteOptions = {
  cascadeHeliumdb?: boolean;  // if true, calls cascade-delete endpoint to wipe heliumdb refs first
};

export type DeleteResult = {
  ok: boolean;
  error?: string;
  errorKind?: "supabase_blocked" | "preflight_failed" | "heliumdb_refs_present" | "cascade_failed" | "other";
  supabaseRefs?: UserReference[];
  heliumdbRefs?: UserReference[];
  cascadeDeleted?: UserReference[];
  failures?: PreflightFailure[];
  authUserDeleted?: boolean;        // true if the Supabase Auth account was removed (or already absent)
  authUserWarning?: string;         // non-fatal warning if auth-user deletion failed
};

export async function deleteUserAction(userId: string, opts: DeleteOptions = {}): Promise<DeleteResult> {
  // Self-delete guard
  try {
    const { data: { user: me } } = await supabase.auth.getUser();
    if (me && me.id === userId) {
      return {
        ok: false,
        errorKind: "other",
        error: "You cannot delete your own account. Ask another administrator.",
      };
    }
  } catch {
    /* if we can't determine current user, fall through and let server-side guards handle it */
  }

  const all = await countAllUserReferences(userId);

  if (all.supabase.preflightFailed) {
    const lines = all.supabase.failures.map(f => `• ${f.table}.${f.column}: ${f.message || "(empty error)"}`).join("\n");
    return {
      ok: false,
      errorKind: "preflight_failed",
      failures: all.supabase.failures,
      error:
        "Cannot delete: the Supabase dependency check failed for one or more tables. " +
        "To avoid orphaned records, deletion was cancelled.\n\n" + lines,
    };
  }
  if (all.blockingTotal > 0) {
    const supLines = all.supabase.counts.map(c => `• ${c.count} ${c.label} (Supabase)`).join("\n");
    const hdLines = all.heliumdb.blocking.map(c => `• ${c.count} ${c.label} (heliumdb)`).join("\n");
    const allLines = [supLines, hdLines].filter(Boolean).join("\n");
    return {
      ok: false,
      errorKind: "supabase_blocked",
      supabaseRefs: all.supabase.counts,
      heliumdbRefs: all.heliumdb.blocking,
      error:
        "Cannot delete: the user is linked to records whose removal would break the platform " +
        "(Supabase FK constraints or shared/admin templates).\n\n" +
        allLines +
        "\n\nUse Archive — it will hide the user from active lists while preserving all related history.",
    };
  }
  if (all.cascadeableTotal > 0 && !opts.cascadeHeliumdb) {
    return {
      ok: false,
      errorKind: "heliumdb_refs_present",
      heliumdbRefs: all.heliumdb.cascadeable,
      error:
        "The deal-rooms database (heliumdb) has records linked to this user that are not visible in Supabase:\n\n" +
        all.heliumdb.cascadeable.map(c => `• ${c.count} ${c.label}`).join("\n") +
        "\n\nA plain delete would leave them orphaned. " +
        "To proceed you must approve a cascade delete of these records together with the user.",
    };
  }

  // Cascade heliumdb refs first (if any and approved)
  let cascadeDeleted: UserReference[] | undefined;
  if (opts.cascadeHeliumdb && all.cascadeableTotal > 0) {
    try {
      const r = await apiRequest(`/admin/users/${encodeURIComponent(userId)}/cascade-delete`, { method: "POST" });
      cascadeDeleted = r.deleted || [];
    } catch (e: any) {
      return {
        ok: false,
        errorKind: "cascade_failed",
        error: "Cascade delete in the deal-rooms database failed: " + (e?.message || "unknown error"),
      };
    }
  }

  // Now delete from Supabase users
  const { error, data } = await supabase.from("users").delete().eq("id", userId).select("id");
  if (error) return { ok: false, error: error.message, errorKind: "other", cascadeDeleted };
  if (!data || data.length === 0) {
    return {
      ok: false,
      errorKind: "other",
      cascadeDeleted,
      error: "No row was deleted (0 rows). The Supabase RLS policy may be blocking DELETE for the current role — check policies on public.users.",
    };
  }

  // Finally remove the Supabase Auth user. If we skip this, the orphan auth account
  // can be silently recycled by `/leads/:id/approve` for a future signup with the same
  // email, recycling the same UUID and bypassing the Platform CNCA gate.
  let authUserDeleted = false;
  let authUserWarning: string | undefined;
  try {
    const r = await apiRequest(`/admin/users/${encodeURIComponent(userId)}/delete-auth-user`, { method: "POST" });
    authUserDeleted = !!r?.ok;
  } catch (e: any) {
    authUserWarning =
      "User profile and related records were deleted, but the Supabase Auth account could not be removed: " +
      (e?.message || "unknown error") +
      ". Delete it manually from the Supabase dashboard to prevent the email from being reused.";
  }

  return { ok: true, cascadeDeleted, authUserDeleted, authUserWarning };
}

/* ─────────────────── Interactive helper used by Admin list panels ─────────────────── */
// Drop-in replacement for the legacy raw `supabase.from("users").delete()` calls
// in Admin.tsx (Buyers / Brokers / Owners panels). Mirrors the safe flow used in
// AdminUserDetail: preflight refs → block on shared content → confirm cascade →
// delete profile → delete auth user. Returns true if the user was removed.
export async function confirmAndDeleteUserInteractive(userId: string, email: string): Promise<boolean> {
  const all = await countAllUserReferences(userId);

  if (all.supabase.preflightFailed) {
    window.alert(
      `Cannot delete ${email}: the Supabase dependency check failed.\n\n` +
      all.supabase.failures.map(f => `• ${f.table}.${f.column}: ${f.message || "(empty error)"}`).join("\n")
    );
    return false;
  }
  if (all.heliumdb.error) {
    window.alert(`Could not check the deal-rooms database: ${all.heliumdb.error}\n\nDeletion cancelled.`);
    return false;
  }
  if (all.blockingTotal > 0) {
    const supLines = all.supabase.counts.map(c => `• ${c.count} ${c.label} (Supabase)`).join("\n");
    const hdLines = all.heliumdb.blocking.map(c => `• ${c.count} ${c.label} (heliumdb)`).join("\n");
    const allLines = [supLines, hdLines].filter(Boolean).join("\n");
    window.alert(
      `Cannot delete ${email}: linked records would break the platform (Supabase FK constraints or shared/admin templates):\n\n` +
      allLines +
      `\n\nUse Archive — it will hide the user from active lists while preserving all related history.`
    );
    return false;
  }

  let cascadeFlag = false;
  if (all.cascadeableTotal > 0) {
    const ok = window.confirm(
      `${email} has records in the deal-rooms database (heliumdb) that are not visible in Supabase:\n\n` +
      all.heliumdb.cascadeable.map(c => `• ${c.count} ${c.label}`).join("\n") +
      `\n\nThey will be PERMANENTLY deleted together with the user. This action cannot be undone.\n\nProceed?`
    );
    if (!ok) return false;
    cascadeFlag = true;
  } else {
    if (!window.confirm(`PERMANENTLY DELETE ${email}? This action cannot be undone.\n\nNo linked records found.`)) {
      return false;
    }
  }

  const r = await deleteUserAction(userId, { cascadeHeliumdb: cascadeFlag });
  if (!r.ok) {
    window.alert("Delete failed: " + r.error);
    return false;
  }

  const lines: string[] = [`User ${email} deleted.`];
  if (r.cascadeDeleted && r.cascadeDeleted.length) {
    lines.push("", "Removed from the deal-rooms database:");
    lines.push(...r.cascadeDeleted.map(c => `• ${c.count} ${c.label}`));
  }
  if (r.authUserWarning) {
    lines.push("", "⚠ " + r.authUserWarning);
  }
  // Only show a notification if there's something noteworthy beyond the bare "deleted" line
  if (lines.length > 1) window.alert(lines.join("\n"));
  return true;
}
