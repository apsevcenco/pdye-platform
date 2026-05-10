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

let migrated: Promise<void> | null = null;
async function ensureSchema(): Promise<void> {
  if (migrated) return migrated;
  migrated = (async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS yacht_listings (
        id            bigserial PRIMARY KEY,
        source        text,
        source_url    text,
        builder       text,
        model         text,
        type          text,
        year          int,
        length_m      numeric(6,2),
        beam_m        numeric(6,2),
        price_eur     numeric(14,2),
        currency_orig text,
        price_orig    numeric(14,2),
        region        text,
        listed_at     date,
        sold_at       date,
        is_sold       boolean DEFAULT false,
        raw           jsonb,
        scraped_at    timestamptz DEFAULT now(),
        created_at    timestamptz DEFAULT now()
      );
      ALTER TABLE yacht_listings ADD COLUMN IF NOT EXISTS engine_maker   text;
      ALTER TABLE yacht_listings ADD COLUMN IF NOT EXISTS hull_material  text;
      ALTER TABLE yacht_listings ADD COLUMN IF NOT EXISTS gross_tonnage  int;
      ALTER TABLE yacht_listings ADD COLUMN IF NOT EXISTS horse_power    int;
      ALTER TABLE yacht_listings ADD COLUMN IF NOT EXISTS condition      text;
      ALTER TABLE yacht_listings ADD COLUMN IF NOT EXISTS refit          int;
      ALTER TABLE yacht_listings ADD COLUMN IF NOT EXISTS configuration  text;
      CREATE INDEX IF NOT EXISTS idx_yl_type_year_len
        ON yacht_listings (type, year, length_m);
      CREATE INDEX IF NOT EXISTS idx_yl_source_url
        ON yacht_listings (source_url);
    `;
    try {
      await db().query(sql);
      console.log("[yacht-listings] Migration complete");
    } catch (e: any) {
      const code = e?.code;
      if (code === "23505" || code === "42P07") return;
      console.warn("[yacht-listings] Migration warning:", e?.message || e);
    }
  })();
  return migrated;
}

// ---------------------------------------------------------------------------
// Type normalization — map free-text yacht types to canonical buckets so that
// "Motor yacht", "motor-yacht", "M/Y" all match each other in KNN.
// ---------------------------------------------------------------------------
function normalizeType(t: string | null | undefined): string {
  if (!t) return "";
  const s = t.toLowerCase().trim();
  if (/sail|sailing|s\/y/.test(s)) return "sailing";
  if (/cat[ae]maran/.test(s)) return "catamaran";
  if (/explorer|expedition/.test(s)) return "explorer";
  if (/sport.?fish/.test(s)) return "sportfish";
  if (/trawler/.test(s)) return "trawler";
  if (/super.?yacht|mega.?yacht/.test(s)) return "superyacht";
  if (/motor|m\/y|cruiser|flybridge|express/.test(s)) return "motor";
  return s.replace(/[^a-z]/g, "");
}

export type Comparable = {
  builder: string | null;
  model: string | null;
  type: string | null;
  year: number | null;
  length_m: number | null;
  beam_m: number | null;
  price_eur: number | null;
  region: string | null;
  source: string | null;
  source_url: string | null;
  listed_at: string | null;
  is_sold: boolean | null;
  engine_maker: string | null;
  hull_material: string | null;
  gross_tonnage: number | null;
  horse_power: number | null;
  configuration: string | null;
  distance: number;
};

export type ComparableExtras = {
  builder?: string | null;
  model?: string | null;
  configuration?: string | null;
  engine_maker?: string | null;
  hull_material?: string | null;
  gross_tonnage?: number | null;
  horse_power?: number | null;
  beam_m?: number | null;
  refit?: number | null;
};

/**
 * Find K nearest comparables in the listings DB.
 * Composite distance = length% diff (weight 2) + year diff/3 (weight 1).
 * Same-type filter is applied first; year/length windows widen progressively
 * if not enough matches found.
 */
function strEq(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export async function findComparables(
  type: string,
  year: number,
  lengthM: number,
  k: number = 10,
  extras: ComparableExtras = {}
): Promise<Comparable[]> {
  await ensureSchema();
  const canonical = normalizeType(type);
  if (!canonical || !lengthM || lengthM <= 0) return [];

  // Try progressively wider windows until we find enough
  const windows = [
    { yr: 3, lenPct: 0.15 },
    { yr: 5, lenPct: 0.20 },
    { yr: 8, lenPct: 0.30 },
  ];

  for (const w of windows) {
    const yrMin = year > 0 ? year - w.yr : 1900;
    const yrMax = year > 0 ? year + w.yr : 2100;
    const lenMin = lengthM * (1 - w.lenPct);
    const lenMax = lengthM * (1 + w.lenPct);

    let rows: any[] = [];
    try {
      const q = `
        SELECT builder, model, type, year, length_m::float8 AS length_m,
               beam_m::float8 AS beam_m,
               price_eur::float8 AS price_eur, region, source, source_url,
               listed_at::text AS listed_at, is_sold,
               engine_maker, hull_material,
               gross_tonnage, horse_power, configuration
        FROM yacht_listings
        WHERE price_eur IS NOT NULL
          AND price_eur > 0
          AND length_m BETWEEN $1 AND $2
          AND (year IS NULL OR year BETWEEN $3 AND $4)
        LIMIT 500
      `;
      const r = await db().query(q, [lenMin, lenMax, yrMin, yrMax]);
      rows = r.rows;
    } catch (e: any) {
      if (e?.code === "42P01") return []; // table doesn't exist yet
      console.warn("[yacht-listings] findComparables query failed:", e?.message || e);
      return [];
    }

    // Type filter (in JS — type column is free-text, normalize on read)
    const filtered = rows.filter((r) => normalizeType(r.type) === canonical);

    if (filtered.length >= 3 || w === windows[windows.length - 1]) {
      // Score & sort. Base distance from (length, year), then bonus
      // reductions (and small penalties) for matches/mismatches on
      // optional secondary attributes the user provided.
      // Cap the total bonus reduction so we don't collapse every "vaguely
      // similar" yacht to distance 0 and lose meaningful tie-breaking.
      // Raised to 1.0 to accommodate model (+0.20) and configuration (+0.10)
      // bonuses on top of the existing builder/engine/hull/etc bonuses.
      const MAX_BONUS = 1.0;
      const scored = filtered.map((r) => {
        const lenDiffPct = Math.abs(r.length_m - lengthM) / lengthM;
        const yrDiff = r.year ? Math.abs(r.year - year) : 5;
        const baseDistance = lenDiffPct * 2 + (yrDiff / 3);

        let bonus = 0;
        if (extras.builder && strEq(extras.builder, r.builder)) bonus += 0.4;
        // Model is the second-strongest signal after builder+length: a
        // Sunseeker Predator 60 is priced very differently from a Sunseeker
        // Manhattan 60. Match strategy:
        //   * exact (case-insensitive) match → full bonus
        //   * substring match → bonus only if both sides are ≥ 4 chars long,
        //     otherwise tiny tokens like "60" or "X" would fire on every
        //     listing whose model contains that fragment.
        if (extras.model && r.model) {
          const a = String(extras.model).trim().toLowerCase();
          const b = String(r.model).trim().toLowerCase();
          if (a && b) {
            if (a === b) {
              bonus += 0.2;
            } else if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) {
              bonus += 0.2;
            }
          }
        }
        if (extras.configuration && strEq(extras.configuration, r.configuration)) bonus += 0.1;
        if (extras.engine_maker && strEq(extras.engine_maker, r.engine_maker)) bonus += 0.2;
        if (extras.hull_material && strEq(extras.hull_material, r.hull_material)) bonus += 0.15;
        if (extras.gross_tonnage && r.gross_tonnage) {
          const d = Math.abs(r.gross_tonnage - extras.gross_tonnage) / extras.gross_tonnage;
          if (d < 0.2) bonus += 0.15;
        }
        if (extras.horse_power && r.horse_power) {
          const d = Math.abs(r.horse_power - extras.horse_power) / extras.horse_power;
          if (d < 0.2) bonus += 0.15;
        }
        if (extras.beam_m && r.beam_m) {
          const d = Math.abs(r.beam_m - extras.beam_m) / extras.beam_m;
          if (d < 0.1) bonus += 0.1;
        }
        if (bonus > MAX_BONUS) bonus = MAX_BONUS;

        let distance = baseDistance - bonus;
        if (distance < 0) distance = 0;
        return { ...r, distance };
      });
      scored.sort((a, b) => a.distance - b.distance);
      return scored.slice(0, k);
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// CSV parsing — minimal RFC-4180-ish, handles quoted fields with commas.
// Required columns (case-insensitive): type, year, length_m, price_eur.
// Optional: source, source_url, builder, model, configuration, beam_m,
//           currency_orig, price_orig, region, listed_at, sold_at, is_sold,
//           engine_maker, hull_material, gross_tonnage, horse_power,
//           condition, refit.
// ---------------------------------------------------------------------------
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s\-]/g, "_"));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? "";
    });
    rows.push(row);
  }
  return { headers, rows };
}

function toNum(s: string): number | null {
  if (!s) return null;
  // Strip currency symbols, spaces, thousands separators (both . and ,)
  const cleaned = s.replace(/[€$£¥\s]/g, "");
  // If comma is the only separator and appears once with 0-2 digits after, treat as decimal
  let normalized = cleaned;
  if (cleaned.includes(",") && !cleaned.includes(".")) {
    const parts = cleaned.split(",");
    if (parts.length === 2 && parts[1].length <= 2) normalized = parts.join(".");
    else normalized = cleaned.replace(/,/g, "");
  } else if (cleaned.includes(",") && cleaned.includes(".")) {
    // European 1.234.567,89 vs US 1,234,567.89 — last separator is decimal
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  }
  const n = parseFloat(normalized);
  return isFinite(n) ? n : null;
}

function toInt(s: string): number | null {
  const n = toNum(s);
  return n != null ? Math.round(n) : null;
}

function toBool(s: string): boolean {
  if (!s) return false;
  return /^(1|true|yes|y|sold)$/i.test(s.trim());
}

function toDate(s: string): string | null {
  if (!s) return null;
  const t = s.trim();
  // Accept YYYY-MM-DD or DD.MM.YYYY or DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const d = new Date(t);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

const router: IRouter = Router();

// POST /api/admin/yacht-listings/import-csv
// Body: { csv: "header1,header2,...\nval1,val2,...\n..." }
// Returns: { inserted, skipped, errors: [...] }
router.post("/admin/yacht-listings/import-csv", requireAdmin, async (req, res) => {
  try {
    await ensureSchema();
    const csv = (req.body?.csv as string) || "";
    if (!csv.trim()) {
      res.status(400).json({ error: "Empty CSV body" });
      return;
    }

    const { headers, rows } = parseCsv(csv);
    if (rows.length === 0) {
      res.status(400).json({ error: "No data rows parsed", headers });
      return;
    }

    const required = ["type", "year", "length_m", "price_eur"];
    const missing = required.filter((r) => !headers.includes(r));
    if (missing.length) {
      res.status(400).json({
        error: `Missing required columns: ${missing.join(", ")}`,
        headers,
        required,
      });
      return;
    }

    let inserted = 0;
    let skipped = 0;
    const errors: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const type = r.type?.trim() || null;
      const year = toInt(r.year);
      const length_m = toNum(r.length_m);
      const price_eur = toNum(r.price_eur);

      if (!type || !length_m || !price_eur) {
        skipped++;
        errors.push({ row: i + 2, reason: "missing type / length_m / price_eur" });
        continue;
      }

      try {
        await db().query(
          `INSERT INTO yacht_listings
             (source, source_url, builder, model, type, year, length_m, beam_m,
              price_eur, currency_orig, price_orig, region, listed_at, sold_at,
              is_sold, engine_maker, hull_material, gross_tonnage, horse_power,
              condition, refit, configuration, raw)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
          [
            r.source?.trim() || null,
            r.source_url?.trim() || null,
            r.builder?.trim() || null,
            r.model?.trim() || null,
            type,
            year,
            length_m,
            toNum(r.beam_m),
            price_eur,
            r.currency_orig?.trim() || null,
            toNum(r.price_orig),
            r.region?.trim() || null,
            toDate(r.listed_at),
            toDate(r.sold_at),
            toBool(r.is_sold),
            r.engine_maker?.trim() || null,
            r.hull_material?.trim() || null,
            toInt(r.gross_tonnage),
            toInt(r.horse_power),
            r.condition?.trim() || null,
            toInt(r.refit),
            r.configuration?.trim() || null,
            JSON.stringify(r),
          ]
        );
        inserted++;
      } catch (e: any) {
        skipped++;
        errors.push({ row: i + 2, reason: e?.message?.slice(0, 200) || "insert failed" });
      }
    }

    res.json({ inserted, skipped, total: rows.length, errors: errors.slice(0, 50) });
  } catch (e: any) {
    console.error("[yacht-listings] import-csv error:", e);
    res.status(500).json({ error: e?.message || "Import failed" });
  }
});

// GET /api/admin/yacht-listings/stats
router.get("/admin/yacht-listings/stats", requireAdmin, async (_req, res) => {
  try {
    await ensureSchema();
    const total = await db().query("SELECT COUNT(*)::int AS c FROM yacht_listings");
    const byType = await db().query(
      `SELECT type, COUNT(*)::int AS c
         FROM yacht_listings
         WHERE type IS NOT NULL
         GROUP BY type
         ORDER BY c DESC
         LIMIT 20`
    );
    const recent = await db().query(
      `SELECT MAX(scraped_at) AS last_import,
              MIN(year)::int  AS year_min,
              MAX(year)::int  AS year_max,
              AVG(price_eur)::float8 AS avg_price,
              MIN(length_m)::float8 AS len_min,
              MAX(length_m)::float8 AS len_max
         FROM yacht_listings`
    );
    res.json({
      total: total.rows[0]?.c ?? 0,
      by_type: byType.rows,
      summary: recent.rows[0] || {},
    });
  } catch (e: any) {
    console.error("[yacht-listings] stats error:", e);
    res.status(500).json({ error: e?.message || "Stats failed" });
  }
});

// POST /api/admin/yacht-listings/comparables
// Body: { type, year, length_m }  -> returns top 10 KNN matches.
router.post("/admin/yacht-listings/comparables", requireAdmin, async (req, res) => {
  try {
    const { type, year, length_m } = req.body || {};
    const matches = await findComparables(
      String(type || ""),
      Number(year || 0),
      Number(length_m || 0),
      10
    );
    res.json({ count: matches.length, matches });
  } catch (e: any) {
    console.error("[yacht-listings] comparables error:", e);
    res.status(500).json({ error: e?.message || "Lookup failed" });
  }
});

// DELETE /api/admin/yacht-listings/all  -- guarded; requires confirm=YES_DELETE_ALL
router.delete("/admin/yacht-listings/all", requireAdmin, async (req, res) => {
  try {
    if (req.query.confirm !== "YES_DELETE_ALL") {
      res.status(400).json({ error: "Add ?confirm=YES_DELETE_ALL to confirm" });
      return;
    }
    await ensureSchema();
    const r = await db().query("DELETE FROM yacht_listings");
    res.json({ deleted: r.rowCount ?? 0 });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Delete failed" });
  }
});

export default router;
