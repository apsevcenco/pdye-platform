import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";
import OpenAI from "openai";

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ ROUTES FIRST
app.use("/api", router);

// --- OpenAI ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ valuation endpoint MUST be here BEFORE export
app.post("/api/valuation", async (req, res) => {
  try {
    const data = req.body;

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

    const prompt = `
You are a professional yacht broker.

Data completeness: ${completeness}%.

Yacht data:
${JSON.stringify(data, null, 2)}

Return ONLY JSON:
{
  "estimated_price": "€X–€Y",
  "confidence": "${confidence}",
  "reasoning": "...",
  "comparables": []
}
`;

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

export default app;
