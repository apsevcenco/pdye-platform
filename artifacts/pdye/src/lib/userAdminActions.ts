import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const ARCHIVE_MIGRATION_MISSING_HINT =
  "Database migration not yet applied. Please run artifacts/pdye/migrations/003_users_archived.sql in the Supabase SQL Editor before using Archive/Restore.";

function isMissingColumnError(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  if (err.code === "42703") return true;
  if (err.message && /column .* does not exist/i.test(err.message)) return true;
  return false;
}

export type ArchiveResult = {
  ok: boolean;
  error?: string;
  errorKind?: "migration_missing" | "other";
};

export async function archiveUserAction(userId: string, archive: boolean): Promise<ArchiveResult> {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ archived: archive, archived_at: archive ? new Date().toISOString() : null })
    .eq("id", userId);
  if (error) {
    if (isMissingColumnError(error)) {
      return { ok: false, error: ARCHIVE_MIGRATION_MISSING_HINT, errorKind: "migration_missing" };
    }
    return { ok: false, error: error.message, errorKind: "other" };
  }
  return { ok: true };
}

const REFERENCING_TABLES: Array<{ table: string; column: string; label: string }> = [
  { table: "access_requests",        column: "user_id",              label: "access request(s)" },
  { table: "deal_participants",      column: "user_id",              label: "deal participation(s)" },
  { table: "deal_room_participants", column: "user_id",              label: "deal room participation(s)" },
  { table: "deal_rooms",             column: "buyer_user_id",        label: "deal room(s) as buyer" },
  { table: "deal_rooms",             column: "seller_user_id",       label: "deal room(s) as seller" },
  { table: "deal_rooms",             column: "listing_owner_user_id", label: "deal room(s) as listing owner" },
  { table: "nda_envelopes",          column: "user_id",              label: "NDA envelope(s)" },
  { table: "audit_logs",             column: "user_id",              label: "audit log entry(ies)" },
];

export type UserReference = { label: string; count: number };
export type PreflightFailure = { table: string; column: string; code?: string; message: string };

export type ReferenceCheck = {
  counts: UserReference[];
  total: number;
  preflightFailed: boolean;
  failures: PreflightFailure[];
};

// Postgres error codes we expect to ignore safely (schema not yet migrated):
//   42P01 = undefined_table, 42703 = undefined_column
function isExpectedSchemaMissing(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  if (err.code === "42P01" || err.code === "42703") return true;
  if (err.message && /(relation|table) .* does not exist/i.test(err.message)) return true;
  if (err.message && /column .* does not exist/i.test(err.message)) return true;
  return false;
}

export async function countUserReferences(userId: string): Promise<ReferenceCheck> {
  const counts: UserReference[] = [];
  const failures: PreflightFailure[] = [];
  let total = 0;
  for (const ref of REFERENCING_TABLES) {
    const { count, error } = await supabaseAdmin
      .from(ref.table)
      .select("*", { count: "exact", head: true })
      .eq(ref.column, userId);
    if (error) {
      // Only ignore expected "schema not yet present" errors. Anything else (RLS, permissions,
      // network) is treated as an unknown state — we MUST fail closed and refuse delete.
      if (!isExpectedSchemaMissing(error)) {
        failures.push({ table: ref.table, column: ref.column, code: (error as any).code, message: error.message });
      }
      continue;
    }
    if (count && count > 0) {
      counts.push({ label: ref.label, count });
      total += count;
    }
  }
  return { counts, total, preflightFailed: failures.length > 0, failures };
}

export type DeleteResult = {
  ok: boolean;
  error?: string;
  errorKind?: "has_references" | "preflight_failed" | "other";
  references?: UserReference[];
  failures?: PreflightFailure[];
};

export async function deleteUserAction(userId: string): Promise<DeleteResult> {
  const refs = await countUserReferences(userId);
  if (refs.preflightFailed) {
    const lines = refs.failures.map(f => `• ${f.table}.${f.column}: ${f.message}`).join("\n");
    return {
      ok: false,
      errorKind: "preflight_failed",
      failures: refs.failures,
      error:
        "Cannot permanently delete: dependency preflight check failed for one or more tables. " +
        "Refusing to delete to avoid orphaning records.\n\n" + lines,
    };
  }
  if (refs.total > 0) {
    const lines = refs.counts.map(c => `• ${c.count} ${c.label}`).join("\n");
    return {
      ok: false,
      errorKind: "has_references",
      references: refs.counts,
      error:
        "Cannot permanently delete: this user is linked to existing records.\n\n" +
        lines +
        "\n\nArchive the user instead — this hides them from active lists while preserving the linked history.",
    };
  }
  const { error } = await supabaseAdmin.from("users").delete().eq("id", userId);
  if (error) return { ok: false, error: error.message, errorKind: "other" };
  return { ok: true };
}
