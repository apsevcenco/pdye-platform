import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- базовые цены за метр (очень важно) ---
const PRICE_PER_METER: Record<string, number> = {
  "Motor Yacht": 80000,
  "Superyacht": 120000,
  "Sport Cruiser": 60000,
  "Flybridge": 70000,
  "Explorer Yacht": 90000,
  "Sailing Yacht": 50000,
  "Catamaran": 65000,
  "Trawler": 55000,
  "Classic Yacht": 45000,
  "Gulet": 30000,
};

// --- коэффициенты брендов ---
function brandFactor(builder?: string) {
  if (!builder) return 1;

  const b = builder.toLowerCase();

  if (["feadship", "lürssen", "amels", "benetti"].some(x => b.includes(x))) return 1.4;
  if (["azimut", "sunseeker", "ferretti", "princess"].some(x => b.includes(x))) return 1.15;
  if (["bavaria", "jeanneau"].some(x => b.includes(x))) return 0.9;

  return 1;
}

// --- состояние ---
function conditionFactor(condition?: string) {
  if (!condition) return 1;

  switch (condition) {
    case "New": return 1.25;
    case "Excellent": return 1.15;
    case "Good": return 1;
    case "Fair": return 0.85;
    case "Needs Refit": return 0.7;
    case "Project": return 0.5;
    default: return 1;
  }
}

// --- возраст ---
function ageFactor(year?: number) {
  if (!year) return 0.7;

  const age = new Date().getFullYear() - year;

  if (age < 3) return 1.2;
  if (age < 8) return 1;
  if (age < 15) return 0.85;
  if (age < 25) return 0.7;

  return 0.5;
}

// --- парсинг числа ---
function num(val: any): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

router.post("/valuation", async (req, res) => {
  try {
    const d = req.body;

    // --- 1. полнота данных ---
    const importantFields = [
      "type","builder","year","refit","length","beam","draft",
      "gross_tonnage","condition","hull_material","hull_type",
      "engine_maker","engine_model","engine_count","horse_power",
      "max_speed","cruise_speed","cabins","crew"
    ];

    const filled = importantFields.filter(
      (k) => d[k] && String(d[k]).trim() !== ""
    ).length;

    const completeness = Math.round((filled / importantFields.length) * 100);

    let confidence = "low";
    if (completeness >= 75) confidence = "high";
    else if (completeness >= 45) confidence = "medium";

    // --- 2. базовый расчет ---
    const length = num(d.length);
    const basePerMeter = PRICE_PER_METER[d.type] || 60000;

    let base = length * basePerMeter;

    base *= brandFactor(d.builder);
    base *= conditionFactor(d.condition);
    base *= ageFactor(Number(d.year));

    // --- диапазон ---
    let min = base * 0.85;
    let max = base * 1.15;

    if (confidence === "low") {
      min = base * 0.6;
      max = base * 1.5;
    }

    const baseRange = `€${Math.round(min).toLocaleString()}–€${Math.round(max).toLocaleString()}`;

    // --- 3. AI уточнение ---
    const prompt = `
You are a senior yacht broker.

Data completeness: ${completeness}%

Base calculated range: ${baseRange}

Yacht data:
${JSON.stringify(d, null, 2)}

Rules:
- Do NOT invent missing data
- Adjust price realistically
- If data is incomplete → keep wide range
- If data is detailed → tighten range
- Use EU market

Return JSON:
{
  "estimated_price": "€X–€Y",
  "confidence": "${confidence}",
  "reasoning": "...",
  "comparables": [
    {
      "builder": "...",
      "model": "...",
      "year": 2020,
      "length": "24m",
      "condition": "Good",
      "price": "€X",
      "note": "..."
    }
  ]
}
`;

    const ai = await openai.responses.create({
      model: "gpt-4.1",
      input: prompt,
    });

    const text = ai.output_text;

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        estimated_price: baseRange,
        confidence,
        reasoning: "AI fallback used. Based on calculated model.",
        comparables: [],
      };
    }

    return res.json(parsed);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "valuation failed" });
  }
});

export default router;
