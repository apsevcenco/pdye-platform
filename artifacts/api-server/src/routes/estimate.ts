import { Router } from "express";
import pg from "pg";
import { strictLimiter } from "../middlewares/rateLimit";
import { EstimateMarketPriceBody, ValuationBody } from "@workspace/api-zod";
import { validateBody } from "../middlewares/validate";

// ============================================================================
// DB pool + valuation_requests table (fire-and-forget logging for ML dataset)
// ============================================================================
let pool: pg.Pool | null = null;
function db(): pg.Pool {
  if (!pool) {
    const dbUrl = process.env["DATABASE_URL"];
    if (!dbUrl) throw new Error("DATABASE_URL not set");
    pool = new pg.Pool({ connectionString: dbUrl, max: 5 });
    runValuationMigration().catch((e) =>
      console.error("[valuation] Migration error:", e),
    );
  }
  return pool;
}

let valuationMigrationDone = false;
let valuationMigrationPromise: Promise<void> | null = null;
async function runValuationMigration(): Promise<void> {
  if (valuationMigrationDone) return;
  if (valuationMigrationPromise) return valuationMigrationPromise;
  valuationMigrationPromise = (async () => {
    const client = await db().connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS valuation_requests (
          id bigserial PRIMARY KEY,
          input jsonb NOT NULL,
          output jsonb NOT NULL,
          ip text,
          confidence text,
          estimated_price_eur numeric,
          sanity_adjusted boolean DEFAULT false,
          created_at timestamptz DEFAULT now()
        );
      `);
      valuationMigrationDone = true;
      console.log("[valuation] Migration complete");
    } catch (e: any) {
      if (e?.code === "23505" || e?.code === "42P07") {
        valuationMigrationDone = true;
        console.log("[valuation] Migration complete (table already existed)");
      } else {
        throw e;
      }
    } finally {
      client.release();
    }
  })().catch((e) => {
    valuationMigrationPromise = null;
    throw e;
  });
  return valuationMigrationPromise;
}

// ============================================================================
// Price parsing & sanity check
// Reasonable EUR-per-meter ranges for SOLD yachts by type, used to detect
// AI hallucinations. Outside this range -> clamp to boundary, lower confidence.
// ============================================================================
const PRICE_PER_METER_EUR: Record<string, [number, number]> = {
  "motor yacht": [12000, 250000],
  "sailing yacht": [6000, 120000],
  "catamaran": [10000, 180000],
  "superyacht": [60000, 800000],
  "explorer yacht": [25000, 400000],
  "sport cruiser": [8000, 70000],
  "trawler": [6000, 70000],
  "classic yacht": [4000, 100000],
  "gulet": [4000, 50000],
  "flybridge": [10000, 100000],
};
const DEFAULT_PRICE_PER_METER: [number, number] = [4000, 300000];

function parsePriceEur(s: unknown): number | null {
  if (typeof s !== "string") return null;
  let v = s.replace(/[^\d.,]/g, "");
  if (!v) return null;
  if (v.includes(".") && v.includes(",")) {
    if (v.lastIndexOf(",") > v.lastIndexOf(".")) {
      v = v.replace(/\./g, "").replace(",", ".");
    } else {
      v = v.replace(/,/g, "");
    }
  } else if (v.includes(",")) {
    const parts = v.split(",");
    if (parts.length > 2 || (parts[1] && parts[1].length === 3)) {
      v = v.replace(/,/g, "");
    } else {
      v = v.replace(",", ".");
    }
  } else if (v.includes(".")) {
    const parts = v.split(".");
    if (parts.length > 2 || (parts[1] && parts[1].length === 3)) {
      v = v.replace(/\./g, "");
    }
  }
  const n = parseFloat(v);
  return isFinite(n) && n > 0 ? n : null;
}

function formatEur(n: number): string {
  return "€ " + Math.round(n).toLocaleString("en-US");
}

function sanityCheckPrice(
  priceEur: number,
  lengthMeters: number,
  type: string,
): { ok: boolean; clampedEur: number } {
  const key = String(type || "").toLowerCase().trim();
  const range = PRICE_PER_METER_EUR[key] || DEFAULT_PRICE_PER_METER;
  const perMeter = priceEur / lengthMeters;
  if (perMeter < range[0]) {
    return { ok: false, clampedEur: range[0] * lengthMeters };
  }
  if (perMeter > range[1]) {
    return { ok: false, clampedEur: range[1] * lengthMeters };
  }
  return { ok: true, clampedEur: priceEur };
}

const router = Router();

const OPENAI_BASE_URL = "https://api.openai.com/v1";

function getApiKey(): string {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  return key;
}

async function aiChat(
  messages: { role: string; content: string }[],
  model = "gpt-5-mini"
): Promise<string> {
  const apiKey = getApiKey();
  const resp = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`OpenAI chat ${resp.status}: ${txt.slice(0, 300)}`);
  }
  const data = (await resp.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function aiResponses(
  input: string,
  model = "gpt-5-mini",
  tools?: any[]
): Promise<string> {
  const apiKey = getApiKey();
  const body: Record<string, any> = { model, input };
  if (tools) body.tools = tools;
  const resp = await fetch(`${OPENAI_BASE_URL}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`OpenAI responses ${resp.status}: ${txt.slice(0, 300)}`);
  }
  const data = (await resp.json()) as {
    output_text?: string;
    output?: any[];
  };
  if (data.output_text) return data.output_text;
  const msg = data.output?.find((o: any) => o.type === "message");
  const txt = msg?.content?.find((c: any) => c.type === "output_text")?.text;
  return txt || "";
}

function extractJson(raw: string): any {
  const cleaned = raw
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in AI response");
  let depth = 0;
  let inStr = false;
  let escape = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return JSON.parse(cleaned.slice(start, i + 1));
      }
    }
  }
  throw new Error("Unbalanced JSON in AI response");
}

function cleanReasoning(text: unknown): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/\(\[([^\]]+)\]\([^)]+\)\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function briefYacht(y: Record<string, unknown>): string {
  return [
    y.name,
    y.type,
    y.builder,
    y.year,
    y.refit ? `refit:${y.refit}` : null,
    y.length,
    y.beam,
    y.draft,
    y.hull_material,
    y.engines,
    y.horse_power,
    y.max_speed,
    y.range,
    y.cabins ? `${y.cabins}cab` : null,
    y.crew ? `${y.crew}crew` : null,
    y.condition,
    y.location,
    y.flag,
    y.price ? `asking:${y.price}` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

router.post("/estimate-market-price", validateBody(EstimateMarketPriceBody), async (req, res) => {
  try {
    const yacht = req.body as Record<string, unknown>;

    const targetDesc = briefYacht(yacht);

    const searchPrompt = `You are a superyacht market appraiser. Search the web for current asking prices of similar yachts on YachtWorld, RightBoat, Boat24, Fraser Yachts, Burgess Yachts, and similar platforms. Refine your searches as you learn more about this vessel's segment.

YACHT TO APPRAISE:
${targetDesc}

After searching, estimate the fair market value in EUR. Return ONLY this exact JSON (no markdown):
{"market_price":"€ X,XXX,XXX","confidence":"high|medium|low","reasoning":"2 sentences citing actual comparable listings found online.","sources":"list the yacht sales sites you found data on"}`;

    let result: {
      market_price: string;
      confidence: string;
      reasoning: string;
      sources?: string;
    };

    try {
      const rawText = await aiResponses(searchPrompt, "gpt-5-mini", [
        { type: "web_search_preview" },
      ]);
      if (!rawText) throw new Error("Empty response");
      result = extractJson(rawText);
    } catch (responsesErr) {
      console.warn(
        "Responses API failed, using chat completions:",
        responsesErr instanceof Error ? responsesErr.message : responsesErr
      );
      const raw = await aiChat([
        {
          role: "system",
          content:
            "You are an expert superyacht appraiser with deep knowledge of the global yacht market. Reply ONLY with valid JSON.",
        },
        {
          role: "user",
          content: `Estimate the fair market value in EUR for this yacht:\n${targetDesc}\n\nReturn ONLY: {"market_price":"€ X,XXX,XXX","confidence":"high|medium|low","reasoning":"2 sentences based on market knowledge.","sources":"YachtWorld, RightBoat, Fraser Yachts (market knowledge)"}`,
        },
      ]);
      if (!raw) throw new Error("AI returned empty response");
      result = extractJson(raw);
    }

    res.json({
      market_price: result.market_price,
      confidence: result.confidence,
      reasoning: cleanReasoning(result.reasoning),
      sources: result.sources || "",
    });
  } catch (err: unknown) {
    console.error("Estimate error:", err);
    const msg = err instanceof Error ? err.message : "Estimation failed";
    res.status(500).json({ error: msg });
  }
});

// Public free valuation tool — advertised on the home page as
// "No registration required". Rate-limited (strictLimiter) to deter
// abuse, but intentionally NOT gated behind requireUser.
// Lazy import to avoid circular init order: yachtListings.ts also opens its
// own pg pool but `findComparables` is safe to call at any time.
import { findComparables, type Comparable } from "./yachtListings";

function formatComparablesBlock(matches: Comparable[]): string {
  if (matches.length === 0) return "";
  const rows = matches.map((m, i) => {
    const parts: string[] = [];
    if (m.builder) parts.push(m.builder);
    if (m.model) parts.push(m.model);
    if (m.year) parts.push(`${m.year}`);
    if (m.length_m) parts.push(`${m.length_m}m`);
    const head = parts.join(" ") || `Listing #${i + 1}`;
    const price = m.price_eur
      ? `€${Math.round(m.price_eur).toLocaleString("en-US")}`
      : "n/a";
    const status = m.is_sold ? "SOLD" : "asking";
    const region = m.region ? `, ${m.region}` : "";
    return `  ${i + 1}. ${head} — ${price} (${status}${region})`;
  });
  return rows.join("\n");
}

router.post("/valuation", strictLimiter, validateBody(ValuationBody), async (req, res) => {
  try {
    const b = req.body as Record<string, unknown>;
    const { mode, units } = b;

    const unitNote =
      units === "imperial" ? " (imperial units)" : " (metric units)";

    const specs = [
      b.type && `Type: ${b.type}`,
      mode === "builder" && b.builder ? `Builder: ${b.builder}` : null,
      b.year && `Build year: ${b.year}`,
      b.refit && `Refit year: ${b.refit}`,
      b.condition && `Condition: ${b.condition}`,
      b.length && `Length (LOA): ${b.length}${unitNote}`,
      b.beam && `Beam: ${b.beam}${unitNote}`,
      b.draft && `Draft: ${b.draft}${unitNote}`,
      b.displacement &&
        `Displacement: ${b.displacement}${units === "imperial" ? " LT" : " tonnes"}`,
      b.gross_tonnage && `Gross tonnage: ${b.gross_tonnage} GT`,
      b.hull_material && `Hull material: ${b.hull_material}`,
      b.hull_type && `Hull type: ${b.hull_type}`,
      b.engines && `Engine configuration: ${b.engines}`,
      b.engine_count && `Number of engines: ${b.engine_count}`,
      b.engine_maker && `Engine manufacturer: ${b.engine_maker}`,
      b.engine_model && `Engine model/series: ${b.engine_model}`,
      b.horse_power && `Total horsepower: ${b.horse_power} HP`,
      b.fuel_type && `Fuel type: ${b.fuel_type}`,
      b.fuel_capacity &&
        `Fuel capacity: ${b.fuel_capacity}${units === "imperial" ? " gal" : " L"}`,
      b.water_capacity &&
        `Water capacity: ${b.water_capacity}${units === "imperial" ? " gal" : " L"}`,
      b.max_speed && `Max speed: ${b.max_speed} kts`,
      b.cruise_speed && `Cruise speed: ${b.cruise_speed} kts`,
      b.range && `Range: ${b.range} nm`,
      b.cabins && `Guest cabins: ${b.cabins}`,
      b.heads && `Heads (WC): ${b.heads}`,
      b.berths && `Total berths: ${b.berths}`,
      b.crew && `Crew capacity: ${b.crew}`,
    ]
      .filter(Boolean)
      .join("\n");

    if (!specs) {
      res.status(400).json({ error: "At least some specifications required" });
      return;
    }

    const yearNum = parseInt(String(b.year || "0"));
    const yearMin = yearNum > 0 ? yearNum - 3 : null;
    const yearMax = yearNum > 0 ? yearNum + 3 : null;
    const yearRange =
      yearMin && yearMax ? `${yearMin}–${yearMax}` : "similar year";

    const modeNote =
      mode === "builder"
        ? "Factor in this builder's specific brand premium and reputation in the current market."
        : "Assess purely on technical specifications — do not infer or assume any brand.";

    // ---- Internal comparables DB lookup -----------------------------------
    // If we have ≥3 matches in our own listings DB, inject them as the
    // PRIMARY reference data for the AI. This is more reliable than web
    // search and grounds the valuation in real broker/sale data we control.
    let dbMatches: Comparable[] = [];
    let dbBlock = "";
    try {
      const lenM = parseFloat(String(b.length || "0"));
      // Convert ft -> m if user submitted imperial
      const lenMeters = units === "imperial" ? lenM * 0.3048 : lenM;
      if (b.type && lenMeters > 0) {
        dbMatches = await findComparables(
          String(b.type),
          yearNum,
          lenMeters,
          10
        );
      }
    } catch (e) {
      console.warn("[valuation] comparables lookup failed:", e instanceof Error ? e.message : e);
    }
    if (dbMatches.length >= 3) {
      dbBlock = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIMARY REFERENCE DATA — INTERNAL LISTINGS DATABASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The following ${dbMatches.length} comparable yachts come from our own verified internal database (real broker listings and confirmed sales). USE THESE AS THE AUTHORITATIVE BASIS for your valuation. They override any conflicting web-search results.

${formatComparablesBlock(dbMatches)}

You may still cross-reference with web search to refine, but the price you produce MUST be consistent with this internal sample. If the spread inside this sample is narrow, set confidence to "high".`;
    }

    const prompt = `You are a professional superyacht market appraiser with access to live yacht listing databases. Your task is to find REAL, CURRENTLY LISTED OR RECENTLY SOLD yachts that closely match the target vessel, and use them to determine its fair market value. Use web search iteratively — refine your queries as you learn more about this vessel's segment, and verify data on actual listing pages before using it.

TARGET VESSEL SPECIFICATIONS:
${specs}
${dbBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — SEARCH INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Perform multiple targeted web searches on the following platforms. Search each one:
- YachtWorld (yachtworld.com)
- Boat Trader / boats.com
- RightBoat (rightboat.com)
- Boat24 (boat24.com)
- YachtBroker (yachtbroker.com)
- Apollo Duck (apolloduck.com)
- YachtCharterFleet / YachtSales

Use search queries like:
- "[type] for sale [year range] [length]"
- "[builder] [model] for sale [year]"
- "[length]m [type] [year] for sale EUR"
- "[engine maker] [engine model] yacht for sale"

If your initial searches don't return strong matches, refine your queries (try different builders in the same tier, adjust length range, switch language, search broker websites directly).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — STRICT MATCHING CRITERIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Only include a vessel as a comparable if it meets ALL of these criteria:
✓ Same vessel type (or closely related category)
✓ Build year within ${yearRange} (±3 years maximum)
✓ Length within ±15% of the target vessel's length
✓ Similar engine configuration, power range, or fuel type (if specified)
✓ Similar accommodation layout (cabins ±1–2) — if specified
✓ Price is confirmed: listed asking price OR confirmed recent sale price
✗ DO NOT include vessels that don't match on year AND length simultaneously
✗ DO NOT fabricate or estimate vessel data — only use what you actually found on the listing page

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — VISIT LISTING PAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For each candidate you find in search results, visit the actual listing page to verify:
- Exact year, length, engine specs and condition
- Confirmed asking price (or sold price)
- Any recent refit or known issues that affect value

If a listing page's specs don't match the target criteria strictly, discard it and search for another.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — VALUATION & OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${modeNote}

Based on the 5 verified comparable listings, determine the fair market value of the target vessel.

⚠ CRITICAL — ASKING vs SOLD price:
Listing prices on broker sites are ASKING prices. Real CLOSING (sold) prices are typically 10–18% LOWER than asking for normal open-market sales. Your "estimated_price" MUST reflect a realistic SOLD price for a normal market transaction — apply roughly −15% adjustment from comparable asking prices. Briefly mention this asking-vs-sold adjustment in the reasoning.

The price must reflect actual market evidence — not a theoretical estimate.

Return ONLY this JSON (absolutely no markdown, no text before or after):
{
  "estimated_price": "€ X,XXX,XXX",
  "confidence": "high|medium|low",
  "reasoning": "3–4 sentences: cite the comparable listings found, explain how the target vessel's specs compare to them (better/worse condition, newer/older, more/fewer engines etc.), and justify the final price.",
  "comparables": [
    {
      "builder": "Exact builder name from listing",
      "model": "Exact model/series from listing",
      "year": 2018,
      "length": "28.5m",
      "condition": "Good",
      "price": "€ 2,850,000",
      "note": "Specific spec differences vs target vessel — e.g. twin MTU 1800HP, recent 2022 refit, 5 cabins"
    }
  ]
}

RULES:
- The comparables array must have EXACTLY 5 entries from real listings you visited
- If you cannot find 5 real matches within the strict criteria, widen year range by ±1 year and search again
- Set confidence to "low" if you had to widen search criteria significantly
- DO NOT include vessel names, owner names, flag, or registration country
- DO NOT invent pricing — every price must come from a real listing or confirmed sale`;

    let result: Record<string, unknown>;

    try {
      const rawText = await aiResponses(prompt, "gpt-5-mini", [
        { type: "web_search_preview" },
      ]);
      if (!rawText) throw new Error("Empty response");
      result = extractJson(rawText);
    } catch (primaryErr) {
      console.warn(
        "Responses API failed, using chat completions:",
        primaryErr instanceof Error ? primaryErr.message : primaryErr
      );
      const fallbackPrompt = `You are an expert superyacht market appraiser with deep knowledge of the global brokerage market.

TARGET VESSEL:
${specs}

${modeNote}

Based on your knowledge of comparable vessels sold or listed on YachtWorld, RightBoat, Boat24 and similar platforms, provide 5 real comparable examples that closely match the target vessel (same type, ±3 years, ±15% length, similar engines if specified).

Return ONLY valid JSON, no markdown:
{
  "estimated_price": "€ X,XXX,XXX",
  "confidence": "low",
  "reasoning": "3–4 sentences citing comparable vessels and explaining how the target's specs affect its value relative to them.",
  "comparables": [
    {
      "builder": "Builder name",
      "model": "Model/Series",
      "year": 2018,
      "length": "28m",
      "condition": "Good",
      "price": "€ 2,800,000",
      "note": "Key spec differences vs target vessel"
    }
  ]
}
Comparables array must have EXACTLY 5 entries. DO NOT include vessel names, owner names or flag.`;

      const raw = await aiChat([
        {
          role: "system",
          content:
            "You are an expert superyacht market appraiser. Reply ONLY with valid JSON, no markdown.",
        },
        { role: "user", content: fallbackPrompt },
      ]);
      result = extractJson(raw);
    }

    if (typeof result.reasoning === "string") {
      result.reasoning = cleanReasoning(result.reasoning);
    }
    if (Array.isArray(result.comparables)) {
      result.comparables = (result.comparables as any[]).map((c) => ({
        ...c,
        note: cleanReasoning(c?.note),
      }));
    }

    // ── Post-processing: sanity check + distressed scenarios ──────────────
    const lengthRaw = parseFloat(
      String(b.length ?? "").replace(/[^\d.]/g, "")
    );
    const lengthMeters =
      isFinite(lengthRaw) && lengthRaw > 0
        ? units === "imperial"
          ? lengthRaw / 3.28084
          : lengthRaw
        : null;

    let aiPriceEur = parsePriceEur(result.estimated_price);
    let sanityAdjusted = false;
    let confidence = String(result.confidence || "low") as
      | "high"
      | "medium"
      | "low";

    if (aiPriceEur && lengthMeters) {
      const check = sanityCheckPrice(
        aiPriceEur,
        lengthMeters,
        String(b.type || "")
      );
      if (!check.ok) {
        aiPriceEur = check.clampedEur;
        sanityAdjusted = true;
        confidence = "low";
      }
    }

    let marketPriceStr: string;
    let distressedPriceStr = "";
    let quickSalePriceStr = "";
    let estimatedPriceEur: number | null = null;

    if (aiPriceEur) {
      estimatedPriceEur = Math.round(aiPriceEur);
      marketPriceStr = formatEur(aiPriceEur);
      distressedPriceStr = formatEur(aiPriceEur * 0.75);
      quickSalePriceStr = formatEur(aiPriceEur * 0.65);
    } else {
      // Fallback: keep AI's original string if we couldn't parse
      marketPriceStr = String(result.estimated_price || "");
    }

    const finalResult = {
      ...result,
      estimated_price: marketPriceStr,
      market_price: marketPriceStr,
      distressed_price: distressedPriceStr,
      quick_sale_price: quickSalePriceStr,
      estimated_price_eur: estimatedPriceEur,
      currency: "EUR",
      confidence,
      sanity_adjusted: sanityAdjusted,
      internal_comparables_count: dbMatches.length,
    };

    // Fire-and-forget: log every request for future ML training data.
    // Never blocks the response.
    void runValuationMigration()
      .then(() =>
        db().query(
          `INSERT INTO valuation_requests
             (input, output, ip, confidence, estimated_price_eur, sanity_adjusted)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            JSON.stringify(b),
            JSON.stringify(finalResult),
            req.ip || null,
            confidence,
            estimatedPriceEur,
            sanityAdjusted,
          ]
        )
      )
      .catch((e) =>
        console.error(
          "[valuation] log save failed:",
          e instanceof Error ? e.message : e
        )
      );

    res.json(finalResult);
  } catch (err) {
    console.error("Valuation error:", err);
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Valuation failed" });
  }
});

export default router;
