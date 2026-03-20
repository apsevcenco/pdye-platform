import { Router } from "express";
import OpenAI from "openai";

const router = Router();

function getOpenAI() {
  const baseURL = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (!baseURL || !apiKey) throw new Error("OpenAI AI integration env vars not set");
  return new OpenAI({ baseURL, apiKey });
}

function buildSearchQuery(yacht: Record<string, unknown>): string {
  const parts: string[] = [];
  if (yacht.builder) parts.push(String(yacht.builder));
  if (yacht.length) parts.push(String(yacht.length));
  if (yacht.type) parts.push(String(yacht.type));
  if (yacht.year) parts.push(String(yacht.year));
  parts.push("for sale price");
  return parts.join(" ");
}

async function searchDuckDuckGo(query: string): Promise<string[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=wt-wt`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; YachtPriceBot/1.0)",
      "Accept": "text/html",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!resp.ok) return [];
  const html = await resp.text();

  // Extract snippets from DuckDuckGo result blocks
  const snippets: string[] = [];
  // Match result titles and snippets
  const resultBlocks = html.matchAll(/<a[^>]+class="result__a"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g);
  for (const match of resultBlocks) {
    const title = match[1].replace(/<[^>]+>/g, "").trim();
    const snippet = match[2].replace(/<[^>]+>/g, "").trim();
    if (title || snippet) snippets.push(`• ${title}: ${snippet}`);
    if (snippets.length >= 8) break;
  }

  // Fallback: extract any text that looks like a price
  if (snippets.length === 0) {
    const priceMatches = html.matchAll(/[\€\$\£]\s*[\d,]+(?:\.\d+)?(?:\s*(?:million|M|k))?/gi);
    const prices = [...priceMatches].map(m => m[0]).slice(0, 10);
    if (prices.length > 0) snippets.push("Prices found: " + prices.join(", "));
  }

  return snippets;
}

async function fetchYachtSiteData(yacht: Record<string, unknown>): Promise<string> {
  const searchQuery = buildSearchQuery(yacht);

  // Run multiple targeted searches in parallel
  const queries = [
    `${searchQuery} site:yachtworld.com`,
    `${searchQuery} site:rightboat.com OR site:boat24.com`,
    `${String(yacht.builder || "")} ${String(yacht.length || "")} motor yacht market value 2024 2025`,
  ];

  const results = await Promise.allSettled(queries.map(q => searchDuckDuckGo(q)));
  const allSnippets: string[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") allSnippets.push(...r.value);
  }

  if (allSnippets.length === 0) {
    return "No specific web results found. Use general superyacht market knowledge.";
  }

  return allSnippets.slice(0, 12).join("\n");
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

    // Fetch live market data from yacht sales websites
    let webData = "";
    try {
      webData = await fetchYachtSiteData(yacht);
    } catch (e) {
      console.warn("Web search failed, proceeding without:", e);
      webData = "Web search unavailable. Use general market knowledge.";
    }

    const userPrompt = `You are an expert superyacht appraiser. Estimate the fair MARKET VALUE in EUR for this yacht.

YACHT:
${targetDesc}

LIVE WEB MARKET DATA (from yacht sales sites):
${webData}

Base your estimate on the web data above AND your knowledge of the superyacht market. Consider: builder reputation, age, size, specs, condition, location, and comparable listings.

Reply ONLY with this exact JSON (no markdown, no extra text):
{"market_price":"€ X,XXX,XXX","confidence":"high","reasoning":"2 sentences max explaining your estimate based on market data.","sources":"YachtWorld, RightBoat, or other sites referenced"}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a yacht appraiser. Reply ONLY with valid JSON." },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = (response.choices[0]?.message?.content || "").trim();

    if (!raw) {
      throw new Error("AI returned empty response");
    }

    let result: { market_price: string; confidence: string; reasoning: string; sources?: string };
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
      sources: result.sources || "",
    });

  } catch (err: unknown) {
    console.error("Estimate error:", err);
    const msg = err instanceof Error ? err.message : "Estimation failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
