import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/valuation", async (req, res) => {
  try {
    const data = req.body;

    // --- 1. считаем полноту данных ---
    const importantFields = [
      "type","builder","year","refit","length","beam","draft",
      "gross_tonnage","condition","hull_material","hull_type",
      "engine_maker","engine_model","engine_count","horse_power",
      "max_speed","cruise_speed","cabins","crew"
    ];

    const filled = importantFields.filter(
      (k) => data[k] && String(data[k]).trim() !== ""
    ).length;

    const completeness = Math.round((filled / importantFields.length) * 100);

    let confidence = "low";
    if (completeness >= 75) confidence = "high";
    else if (completeness >= 45) confidence = "medium";

    // --- 2. prompt ---
    const prompt = `
You are a professional yacht broker.

Data completeness: ${completeness}%.

Yacht data:
${JSON.stringify(data, null, 2)}

Rules:
- Do NOT invent missing data
- Provide realistic market valuation
- More data = tighter price range
- Low data = wide estimate

Return JSON only:
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

    // --- 3. запрос к OpenAI ---
    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: prompt,
    });

    const text = response.output_text;

    const parsed = JSON.parse(text);

    return res.json(parsed);

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "valuation failed",
    });
  }
});
