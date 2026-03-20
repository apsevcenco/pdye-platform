import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const router = Router();

function getSupabaseAdmin() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  return createClient(url, key, { auth: { persistSession: false } });
}

function getOpenAI() {
  const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (!baseURL || !apiKey) throw new Error("OpenAI AI integration env vars not set");
  return new OpenAI({ baseURL, apiKey });
}

function briefYacht(y: Record<string, unknown>): string {
  return [
    y.name, y.type, y.builder, y.year, y.refit ? `refit:${y.refit}` : null,
    y.length, y.beam, y.hull_material, y.engines, y.horse_power, y.max_speed,
    y.cabins ? `${y.cabins}cab` : null, y.crew ? `${y.crew}crew` : null,
    y.condition, y.location,
    y.market_price ? `market:${y.market_price}` : null,
    y.price ? `listed:${y.price}` : null,
  ].filter(Boolean).join(", ");
}

router.post("/estimate-market-price", async (req, res) => {
  try {
    const yacht = req.body as Record<string, unknown>;
    if (!yacht || !yacht.name) {
      res.status(400).json({ error: "Yacht data required" });
      return;
    }

    const supabase = getSupabaseAdmin();
    const openai = getOpenAI();

    const { data: allYachts } = await supabase
      .from("yachts")
      .select("name,type,builder,year,refit,length,beam,hull_material,engines,horse_power,max_speed,cabins,crew,condition,location,price,market_price")
      .neq("id", (yacht.id as string) || "")
      .limit(6);

    const comparables = (allYachts || []).filter((y: Record<string, unknown>) => y.price || y.market_price);
    const targetLine = briefYacht(yacht);
    const compLines = comparables.length > 0
      ? comparables.map((y: Record<string, unknown>) => briefYacht(y)).join("\n")
      : "No DB comparables — use general superyacht market knowledge.";

    const userPrompt = `Estimate fair market value in EUR for this yacht:
TARGET: ${targetLine}

COMPARABLES:
${compLines}

Reply ONLY with this JSON (no markdown):
{"market_price":"€ X,XXX,XXX","confidence":"high","reasoning":"One sentence."}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a yacht appraiser. Reply with valid JSON only." },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = (response.choices[0]?.message?.content || "").trim();

    if (!raw) {
      throw new Error("AI returned empty response. finish_reason=" + response.choices[0]?.finish_reason);
    }

    let result: { market_price: string; confidence: string; reasoning: string };
    try {
      const jsonStr = raw.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
      result = JSON.parse(jsonStr);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        throw new Error("Could not parse: " + raw.slice(0, 200));
      }
    }

    res.json({
      market_price: result.market_price,
      confidence: result.confidence,
      reasoning: result.reasoning,
      comparables_count: comparables.length,
    });
  } catch (err: unknown) {
    console.error("Estimate error:", err);
    const msg = err instanceof Error ? err.message : "Estimation failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
