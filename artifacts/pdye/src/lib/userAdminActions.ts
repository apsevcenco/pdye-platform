import { supabaseAdmin } from "@/lib/supabaseAdmin";
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
  "База данных не готова: в таблице users отсутствует колонка `archived`. " +
  "Однократно выполните SQL-миграцию `artifacts/pdye/migrations/003_users_archived.sql` " +
  "в Supabase SQL Editor (Project → SQL Editor → New query → вставить → Run). " +
  "После этого Архивировать/Восстановить заработают.";

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
  const { error, data } = await supabaseAdmin
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
      error: "Запись не была обновлена (0 строк). Возможно, политика RLS Supabase блокирует UPDATE для текущей роли — проверьте policies на public.users.",
    };
  }
  return { ok: true };
}

/* ─────────────────── Reference checks ─────────────────── */
// Only Supabase tables with verified columns. heliumdb tables are checked via api-server.
const SUPABASE_REFS: Array<{ table: string; column: string; label: string }> = [
  { table: "access_requests", column: "requester_id", label: "запрос(ов) доступа" },
  { table: "yachts",          column: "owner_id",    label: "листинг(а/ов) яхт" },
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
    const { count, error } = await supabaseAdmin
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
      error: e?.message || "Не удалось получить данные из базы сделок",
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
};

export async function deleteUserAction(userId: string, opts: DeleteOptions = {}): Promise<DeleteResult> {
  // Self-delete guard
  try {
    const { data: { user: me } } = await supabase.auth.getUser();
    if (me && me.id === userId) {
      return {
        ok: false,
        errorKind: "other",
        error: "Нельзя удалить свой собственный аккаунт. Попросите другого администратора.",
      };
    }
  } catch {
    /* if we can't determine current user, fall through and let server-side guards handle it */
  }

  const all = await countAllUserReferences(userId);

  if (all.supabase.preflightFailed) {
    const lines = all.supabase.failures.map(f => `• ${f.table}.${f.column}: ${f.message || "(пустая ошибка)"}`).join("\n");
    return {
      ok: false,
      errorKind: "preflight_failed",
      failures: all.supabase.failures,
      error:
        "Удаление невозможно: проверка зависимостей в Supabase завершилась с ошибкой по одной или нескольким таблицам. " +
        "Чтобы не оставить осиротевших записей, удаление отменено.\n\n" + lines,
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
        "Удаление невозможно: пользователь связан с записями, удаление которых сломает платформу " +
        "(FK-ограничения Supabase или общие/админские шаблоны).\n\n" +
        allLines +
        "\n\nИспользуйте Архивировать — это скроет пользователя из активных списков, сохранив всю связанную историю.",
    };
  }
  if (all.cascadeableTotal > 0 && !opts.cascadeHeliumdb) {
    return {
      ok: false,
      errorKind: "heliumdb_refs_present",
      heliumdbRefs: all.heliumdb.cascadeable,
      error:
        "В базе сделок (heliumdb) у пользователя есть записи, которые не видны Supabase:\n\n" +
        all.heliumdb.cascadeable.map(c => `• ${c.count} ${c.label}`).join("\n") +
        "\n\nПри простом удалении они останутся «осиротевшими». " +
        "Чтобы продолжить — нужно подтвердить каскадное удаление этих записей вместе с пользователем.",
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
        error: "Каскадное удаление в базе сделок не удалось: " + (e?.message || "неизвестная ошибка"),
      };
    }
  }

  // Now delete from Supabase users
  const { error, data } = await supabaseAdmin.from("users").delete().eq("id", userId).select("id");
  if (error) return { ok: false, error: error.message, errorKind: "other", cascadeDeleted };
  if (!data || data.length === 0) {
    return {
      ok: false,
      errorKind: "other",
      cascadeDeleted,
      error: "Запись не была удалена (0 строк). Возможно, политика RLS Supabase блокирует DELETE для текущей роли — проверьте policies на public.users.",
    };
  }
  return { ok: true, cascadeDeleted };
}
