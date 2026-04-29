import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

const REFERENCING_TABLES: Array<{ table: string; column: string; label: string }> = [
  { table: "access_requests",        column: "user_id",              label: "запрос(ов) доступа" },
  { table: "deal_participants",      column: "user_id",              label: "участи(е/й) в сделке" },
  { table: "deal_room_participants", column: "user_id",              label: "участи(е/й) в комнате сделки" },
  { table: "deal_rooms",             column: "buyer_user_id",        label: "комнат(ы) сделок как покупатель" },
  { table: "deal_rooms",             column: "seller_user_id",       label: "комнат(ы) сделок как продавец" },
  { table: "deal_rooms",             column: "listing_owner_user_id", label: "комнат(ы) сделок как владелец листинга" },
  { table: "nda_envelopes",          column: "user_id",              label: "NDA-конверт(а/ов)" },
  { table: "audit_logs",             column: "user_id",              label: "запис(ь/и) аудита" },
  { table: "yachts",                 column: "owner_id",             label: "листинг(а/ов) яхт" },
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
  if (err.message && /could not find the (table|column)/i.test(err.message)) return true;
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
        "Удаление невозможно: проверка зависимостей завершилась с ошибкой по одной или нескольким таблицам. " +
        "Чтобы не оставить осиротевших записей, удаление отменено.\n\n" + lines,
    };
  }
  if (refs.total > 0) {
    const lines = refs.counts.map(c => `• ${c.count} ${c.label}`).join("\n");
    return {
      ok: false,
      errorKind: "has_references",
      references: refs.counts,
      error:
        "Удаление невозможно: пользователь связан с существующими записями.\n\n" +
        lines +
        "\n\nИспользуйте Архивировать — это скроет пользователя из активных списков, сохранив всю связанную историю.",
    };
  }
  const { error, data } = await supabaseAdmin.from("users").delete().eq("id", userId).select("id");
  if (error) return { ok: false, error: error.message, errorKind: "other" };
  if (!data || data.length === 0) {
    return {
      ok: false,
      errorKind: "other",
      error: "Запись не была удалена (0 строк). Возможно, политика RLS Supabase блокирует DELETE для текущей роли — проверьте policies на public.users.",
    };
  }
  return { ok: true };
}
