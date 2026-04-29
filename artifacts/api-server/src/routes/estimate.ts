import { Router } from "express";

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

router.post("/estimate-market-price", async (req, res) => {
  try {
    const yacht = req.body as Record<string, unknown>;
    if (!yacht || !yacht.name) {
      res.status(400).json({ error: "Yacht data required" });
      return;
    }

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

router.post("/valuation", async (req, res) => {
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

    const prompt = `You are a professional superyacht market appraiser with access to live yacht listing databases. Your task is to find REAL, CURRENTLY LISTED OR RECENTLY SOLD yachts that closely match the target vessel, and use them to determine its fair market value. Use web search iteratively — refine your queries as you learn more about this vessel's segment, and verify data on actual listing pages before using it.

TARGET VESSEL SPECIFICATIONS:
${specs}

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

Based on the 5 verified comparable listings, determine the fair market value of the target vessel. The price must reflect actual market evidence — not a theoretical estimate.

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

    res.json(result);
  } catch (err) {
    console.error("Valuation error:", err);
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Valuation failed" });
  }
});

export default router;
