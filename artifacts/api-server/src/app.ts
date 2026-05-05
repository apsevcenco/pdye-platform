import express, { type Express } from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import router from "./routes";
import OpenAI from "openai";
import { requireUser } from "./middlewares/auth";
import { globalLimiter, strictLimiter } from "./middlewares/rateLimit";
import { ValuationBody } from "@workspace/api-zod";
import { validateBody } from "./middlewares/validate";

const app: Express = express();

const isProd = process.env["NODE_ENV"] === "production";

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
    hsts: isProd
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  }),
);

const defaultAllowed = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /\.replit\.app$/,
  /\.replit\.dev$/,
  /\.kirk\.replit\.dev$/,
];

const prodAllowed = [
  "https://pdye-platform-1.onrender.com",
  "https://pdye-platform.onrender.com",
];

const envAllowed = (process.env["ALLOWED_ORIGINS"] || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isOriginAllowed(origin: string): boolean {
  if (envAllowed.includes(origin)) return true;
  if (prodAllowed.includes(origin)) return true;
  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return false;
  }
  return defaultAllowed.some((re) =>
    re instanceof RegExp ? re.test(origin) || re.test(hostname) : re === origin,
  );
}

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (isOriginAllowed(origin)) return cb(null, true);
    console.warn("CORS blocked:", origin);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use(globalLimiter);

if (!isProd) {
  app.use((req, _res, next) => {
    console.log("REQ:", req.method, req.url);
    next();
  });
}

app.use("/api", router);

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

app.post("/api/valuation", strictLimiter, requireUser, validateBody(ValuationBody), async (req, res) => {
  try {
    const data = req.body;

    const importantFields = [
      "type", "builder", "year", "refit", "length", "beam", "draft",
      "gross_tonnage", "condition", "hull_material", "hull_type",
      "engine_maker", "engine_model", "engine_count", "horse_power",
      "max_speed", "cruise_speed", "cabins", "crew",
    ];

    const filled = importantFields.filter(
      (k) => data[k] && String(data[k]).trim() !== "",
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

Return JSON only.
`;

    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: prompt,
    });

    const parsed = JSON.parse(response.output_text);

    return res.json({ ...parsed, confidence });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "valuation failed" });
  }
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message === "Not allowed by CORS") {
    res.status(403).json({ error: "CORS: origin not allowed" });
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
