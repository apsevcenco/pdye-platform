import { Router } from "express";
import OpenAI from "openai";

const router = Router();

function getOpenAI() {
  const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (!baseURL || !apiKey) throw new Error("OpenAI AI integration env vars not set");
  return new OpenAI({ baseURL, apiKey });
}

function briefYacht(y: Record<string, unknown>): string {
  return [
    y.name, y.type, y.builder, y.year, y.refit ? `refit:${y.refit}` : null,
    y.length, y.beam, y.draft, y.hull_material,
    y.engines, y.horse_power, y.max_speed, y.range,
    y.cabins ? `${y.cabins}cab` : null, y.crew ? `${y.crew}crew` : null,
    y.condition, y.location, y.flag,
    y.price ? `asking:${y.price}` : null,
  ].filter(Boolean).join(", ");
}

router.post("/estimate-market-price", async (req, res) => {
  try {
    const yacht = req.body as Record<string, unknown>;
    if (!yacht || !yacht.name) {
      res.status(400).json({ error: "Yacht data required" });
      return;
    }

    const openai = getOpenAI();
    const targetDesc = briefYacht(yacht);

    // Build search query based on yacht specs
    const searchTerms = [
      yacht.builder, yacht.length, yacht.type, yacht.year, "for sale price EUR"
    ].filter(Boolean).join(" ");

    // Use OpenAI Responses API with built-in web_search_preview tool
    // This lets OpenAI search yacht listing sites directly
    const searchPrompt = `You are a superyacht market appraiser. Search the web for current asking prices of similar yachts on YachtWorld, RightBoat, Boat24, Fraser Yachts, Burgess Yachts, and similar platforms.

YACHT TO APPRAISE:
${targetDesc}

Search for: "${searchTerms}"

After searching, estimate the fair market value in EUR. Return ONLY this exact JSON (no markdown):
{"market_price":"€ X,XXX,XXX","confidence":"high|medium|low","reasoning":"2 sentences citing actual comparable listings found online.","sources":"list the yacht sales sites you found data on"}`;

    let result: { market_price: string; confidence: string; reasoning: string; sources?: string };

    try {
      // Try Responses API with web_search_preview tool first
      const webResponse = await (openai as unknown as {
        responses: {
          create: (params: Record<string, unknown>) => Promise<{ output_text?: string; output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> }>;
        };
      }).responses.create({
        model: "gpt-5-mini",
        tools: [{ type: "web_search_preview" }],
        input: searchPrompt,
      });

      const rawText = webResponse.output_text ||
        webResponse.output?.find((o) => o.type === "message")
          ?.content?.find((c) => c.type === "output_text")
          ?.text || "";

      if (!rawText) throw new Error("Empty response from Responses API");

      const jsonStr = rawText.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in response: " + rawText.slice(0, 200));
      result = JSON.parse(match[0]);

    } catch (responsesErr) {
      // Fallback: chat completions without web search (uses OpenAI's training knowledge)
      console.warn("Responses API failed, using chat completions:", responsesErr instanceof Error ? responsesErr.message : responsesErr);

      const fallbackResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert superyacht appraiser with deep knowledge of the global yacht market. Reply ONLY with valid JSON." },
          { role: "user", content: `Estimate the fair market value in EUR for this yacht:\n${targetDesc}\n\nReturn ONLY: {"market_price":"€ X,XXX,XXX","confidence":"high|medium|low","reasoning":"2 sentences based on market knowledge.","sources":"YachtWorld, RightBoat, Fraser Yachts (market knowledge)"}` },
        ],
      });

      const raw = (fallbackResponse.choices[0]?.message?.content || "").trim();
      if (!raw) throw new Error("AI returned empty response");

      const jsonStr = raw.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse JSON: " + raw.slice(0, 200));
      result = JSON.parse(match[0]);
    }

    // Strip markdown links from reasoning to keep it clean
    const cleanReasoning = (result.reasoning || "")
      .replace(/\(\[([^\]]+)\]\([^)]+\)\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    res.json({
      market_price: result.market_price,
      confidence: result.confidence,
      reasoning: cleanReasoning,
      sources: result.sources || "",
    });

  } catch (err: unknown) {
    console.error("Estimate error:", err);
    const msg = err instanceof Error ? err.message : "Estimation failed";
    res.status(500).json({ error: msg });
  }
});


// Public valuation endpoint — no vessel name/flag/location required
router.post("/valuation", async (req, res) => {
  try {
    const { mode, type, builder, year, length, beam, draft, cabins, condition, hull_material, engines } = req.body as Record<string, unknown>;

    const specs = [
      type          && `Type: ${type}`,
      mode === "builder" && builder ? `Builder: ${builder}` : null,
      year          && `Year: ${year}`,
      length        && `Length: ${length}`,
      beam          && `Beam: ${beam}`,
      draft         && `Draft: ${draft}`,
      cabins        && `Cabins: ${cabins}`,
      condition     && `Condition: ${condition}`,
      hull_material && `Hull material: ${hull_material}`,
      engines       && `Engines: ${engines}`,
    ].filter(Boolean).join("\n");

    if (!specs) {
      res.status(400).json({ error: "At least some specifications required" });
      return;
    }

    const modeNote = mode === "builder"
      ? "Take into account this specific builder's brand premium and typical pricing."
      : "Evaluate purely on technical specs — do not assume a brand premium.";

    const prompt = `You are an expert superyacht market appraiser. Estimate the fair market value for a vessel with these specs and provide 5 realistic comparable market examples.

VESSEL SPECIFICATIONS:
${specs}

${modeNote}

Return ONLY this JSON (no markdown, no extra text):
{
  "estimated_low": "€ X,XXX,XXX",
  "estimated_high": "€ X,XXX,XXX",
  "confidence": "high|medium|low",
  "reasoning": "2-3 sentences explaining the valuation methodology and key value drivers.",
  "comparables": [
    {
      "builder": "Builder name",
      "model": "Model / Series name",
      "year": 2018,
      "length": "28m",
      "condition": "Good",
      "price": "€ 2,800,000",
      "note": "One sentence about why this is comparable"
    }
  ]
}

The comparables array must have EXACTLY 5 entries. These must be realistic vessels plausibly found on the market. Do NOT include vessel names, owner names, or broker/seller information.`;

    const openai = getOpenAI();
    let result: Record<string, unknown>;

    try {
      const webResponse = await (openai as unknown as {
        responses: {
          create: (p: Record<string, unknown>) => Promise<{ output_text?: string; output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> }>;
        };
      }).responses.create({
        model: "gpt-5-mini",
        tools: [{ type: "web_search_preview" }],
        input: prompt,
      });

      const rawText = webResponse.output_text ||
        webResponse.output?.find(o => o.type === "message")
          ?.content?.find(c => c.type === "output_text")?.text || "";
      if (!rawText) throw new Error("Empty response");
      const match = rawText.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim().match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      result = JSON.parse(match[0]);
    } catch {
      const fallback = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert superyacht market appraiser. Reply ONLY with valid JSON, no markdown." },
          { role: "user", content: prompt },
        ],
      });
      const raw = (fallback.choices[0]?.message?.content || "").trim();
      const match = raw.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim().match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse JSON");
      result = JSON.parse(match[0]);
    }

    // Clean markdown links from reasoning
    if (typeof result.reasoning === "string") {
      result.reasoning = result.reasoning
        .replace(/\(\[([^\]]+)\]\([^)]+\)\)/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .trim();
    }

    res.json(result);
  } catch (err) {
    console.error("Valuation error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Valuation failed" });
  }
});

export default router;
