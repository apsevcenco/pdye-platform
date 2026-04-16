import { Router } from "express";

const router = Router();

const BUILDER_TIERS: Record<string, { tier: number; premium: number }> = {
  "Lürssen": { tier: 1, premium: 1.45 }, "Lurssen": { tier: 1, premium: 1.45 },
  "Feadship": { tier: 1, premium: 1.50 }, "Oceanco": { tier: 1, premium: 1.40 },
  "Benetti": { tier: 1, premium: 1.30 }, "Amels": { tier: 1, premium: 1.35 },
  "Heesen": { tier: 2, premium: 1.25 }, "Sunseeker": { tier: 2, premium: 1.15 },
  "Princess": { tier: 2, premium: 1.12 }, "Azimut": { tier: 2, premium: 1.18 },
  "Ferretti": { tier: 2, premium: 1.15 }, "Riva": { tier: 2, premium: 1.20 },
  "Sanlorenzo": { tier: 2, premium: 1.22 }, "Pershing": { tier: 2, premium: 1.15 },
  "Mangusta": { tier: 2, premium: 1.18 }, "Baglietto": { tier: 2, premium: 1.20 },
  "Codecasa": { tier: 2, premium: 1.15 }, "CRN": { tier: 2, premium: 1.15 },
  "ISA": { tier: 2, premium: 1.10 }, "Horizon": { tier: 3, premium: 1.05 },
  "Westport": { tier: 3, premium: 1.08 }, "Hatteras": { tier: 3, premium: 1.05 },
  "Viking": { tier: 3, premium: 1.05 }, "Nordhavn": { tier: 3, premium: 1.08 },
  "Numarine": { tier: 3, premium: 1.05 }, "Gulf Craft": { tier: 3, premium: 1.02 },
  "Majesty": { tier: 3, premium: 1.02 }, "Leopard": { tier: 2, premium: 1.12 },
  "Wally": { tier: 2, premium: 1.25 }, "Baltic Yachts": { tier: 2, premium: 1.20 },
  "Nautor Swan": { tier: 2, premium: 1.25 }, "Oyster": { tier: 2, premium: 1.15 },
  "Perini Navi": { tier: 1, premium: 1.30 }, "Royal Huisman": { tier: 1, premium: 1.45 },
  "Vitters": { tier: 1, premium: 1.35 }, "Alloy Yachts": { tier: 2, premium: 1.15 },
  "Damen": { tier: 2, premium: 1.12 }, "Abeking & Rasmussen": { tier: 1, premium: 1.40 },
  "Blohm+Voss": { tier: 1, premium: 1.35 }, "Nobiskrug": { tier: 1, premium: 1.30 },
  "Wider": { tier: 2, premium: 1.10 }, "Tankoa": { tier: 2, premium: 1.12 },
  "Rossinavi": { tier: 2, premium: 1.15 }, "Admiral": { tier: 2, premium: 1.10 },
  "Dominator": { tier: 3, premium: 1.05 }, "Monte Carlo Yachts": { tier: 2, premium: 1.10 },
  "Absolute": { tier: 3, premium: 1.05 }, "Fairline": { tier: 3, premium: 1.05 },
  "Beneteau": { tier: 3, premium: 1.00 }, "Jeanneau": { tier: 3, premium: 1.00 },
  "Bavaria": { tier: 3, premium: 0.95 }, "Dufour": { tier: 3, premium: 0.98 },
  "Fountaine Pajot": { tier: 3, premium: 1.05 }, "Lagoon": { tier: 3, premium: 1.05 },
  "Catana": { tier: 3, premium: 1.08 }, "Privilege": { tier: 3, premium: 1.05 },
  "Leopard Catamarans": { tier: 3, premium: 1.02 },
};

function findBuilder(name: string): { tier: number; premium: number } | null {
  const n = name.trim();
  if (BUILDER_TIERS[n]) return BUILDER_TIERS[n];
  const lower = n.toLowerCase();
  for (const [k, v] of Object.entries(BUILDER_TIERS)) {
    if (k.toLowerCase() === lower || lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) return v;
  }
  return null;
}

function basePrice(type: string, lengthM: number): number {
  const t = (type || "").toLowerCase();
  let pricePerMeter: number;

  if (lengthM >= 60) {
    pricePerMeter = t.includes("sail") ? 380000 : 450000;
  } else if (lengthM >= 45) {
    pricePerMeter = t.includes("sail") ? 280000 : 350000;
  } else if (lengthM >= 30) {
    pricePerMeter = t.includes("sail") ? 180000 : 220000;
  } else if (lengthM >= 20) {
    pricePerMeter = t.includes("sail") ? 100000 : 130000;
  } else if (lengthM >= 15) {
    pricePerMeter = t.includes("sail") ? 55000 : 70000;
  } else if (lengthM >= 10) {
    pricePerMeter = t.includes("sail") ? 30000 : 40000;
  } else {
    pricePerMeter = t.includes("sail") ? 18000 : 25000;
  }

  if (t.includes("catamaran") || t.includes("multi")) pricePerMeter *= 1.15;
  if (t.includes("explorer")) pricePerMeter *= 1.20;
  if (t.includes("sport") || t.includes("performance")) pricePerMeter *= 1.10;
  if (t.includes("classic") || t.includes("vintage")) pricePerMeter *= 0.70;
  if (t.includes("trawler")) pricePerMeter *= 0.85;

  return pricePerMeter * lengthM;
}

function depreciationFactor(age: number, refit?: number): number {
  const currentYear = new Date().getFullYear();
  const yearsSinceRefit = refit ? currentYear - refit : 999;
  let dep: number;

  if (age <= 0) dep = 1.0;
  else if (age <= 1) dep = 0.88;
  else if (age <= 2) dep = 0.82;
  else if (age <= 3) dep = 0.77;
  else if (age <= 5) dep = 0.70;
  else if (age <= 8) dep = 0.58;
  else if (age <= 10) dep = 0.50;
  else if (age <= 15) dep = 0.38;
  else if (age <= 20) dep = 0.28;
  else if (age <= 25) dep = 0.22;
  else if (age <= 30) dep = 0.18;
  else dep = 0.12;

  if (yearsSinceRefit <= 2) dep = Math.min(dep * 1.30, 0.95);
  else if (yearsSinceRefit <= 5) dep = Math.min(dep * 1.15, 0.90);

  return dep;
}

function conditionFactor(cond: string): number {
  const c = (cond || "").toLowerCase();
  if (c.includes("new") || c.includes("excellent") || c.includes("отличное")) return 1.15;
  if (c.includes("very good") || c.includes("хорошее")) return 1.05;
  if (c.includes("good") || c.includes("нормальное")) return 1.0;
  if (c.includes("fair") || c.includes("удовл")) return 0.85;
  if (c.includes("poor") || c.includes("project") || c.includes("плохое")) return 0.60;
  if (c.includes("distressed") || c.includes("damaged") || c.includes("аварийное")) return 0.40;
  return 0.95;
}

function hullFactor(material: string): number {
  const m = (material || "").toLowerCase();
  if (m.includes("steel")) return 1.05;
  if (m.includes("aluminum") || m.includes("aluminium")) return 1.10;
  if (m.includes("carbon")) return 1.20;
  if (m.includes("composite")) return 1.05;
  if (m.includes("wood")) return 0.75;
  return 1.0;
}

function engineFactor(hp: number, lengthM: number): number {
  if (!hp || !lengthM) return 1.0;
  const hpPerMeter = hp / lengthM;
  if (hpPerMeter > 150) return 1.10;
  if (hpPerMeter > 80) return 1.05;
  if (hpPerMeter < 20) return 0.90;
  return 1.0;
}

function accommodationFactor(cabins: number, lengthM: number): number {
  if (!cabins || !lengthM) return 1.0;
  const cabinsPerMeter = cabins / lengthM;
  if (cabinsPerMeter > 0.25) return 1.08;
  if (cabinsPerMeter > 0.15) return 1.03;
  return 1.0;
}

function roundPrice(price: number): number {
  if (price >= 10000000) return Math.round(price / 500000) * 500000;
  if (price >= 1000000) return Math.round(price / 100000) * 100000;
  if (price >= 100000) return Math.round(price / 10000) * 10000;
  return Math.round(price / 5000) * 5000;
}

function formatEur(price: number): string {
  return "€ " + price.toLocaleString("en-US").replace(/,/g, ",");
}

interface ValuationInput {
  mode?: string;
  units?: string;
  type?: string;
  builder?: string;
  year?: string | number;
  refit?: string | number;
  condition?: string;
  length?: string | number;
  beam?: string | number;
  draft?: string | number;
  displacement?: string | number;
  gross_tonnage?: string | number;
  hull_material?: string;
  hull_type?: string;
  engines?: string;
  engine_count?: string | number;
  engine_maker?: string;
  engine_model?: string;
  horse_power?: string | number;
  fuel_type?: string;
  fuel_capacity?: string | number;
  water_capacity?: string | number;
  max_speed?: string | number;
  cruise_speed?: string | number;
  range?: string | number;
  cabins?: string | number;
  heads?: string | number;
  berths?: string | number;
  crew?: string | number;
}

interface Comparable {
  builder: string;
  model: string;
  year: number;
  length: string;
  condition: string;
  price: string;
  note: string;
}

const COMPARABLE_BUILDERS: Record<string, string[][]> = {
  motor: [
    ["Azimut", "Magellano 66"], ["Benetti", "Delfino 95"], ["Sunseeker", "Manhattan 68"],
    ["Princess", "Y85"], ["Ferretti", "Custom Line 97"], ["Sanlorenzo", "SL96A"],
    ["Heesen", "5000 Aluminium"], ["Mangusta", "GranSport 45"], ["Riva", "110 Dolcevita"],
    ["Horizon", "FD87"], ["Westport", "125"], ["Numarine", "32XP"],
    ["CRN", "62m"], ["Baglietto", "48m Fast"], ["ISA", "Extra 76"],
    ["Pershing", "9X"], ["Codecasa", "50m Classic"], ["Admiral", "Gforce 50"],
    ["Monte Carlo Yachts", "MCY 86"], ["Absolute", "Navetta 73"],
    ["Wider", "165"], ["Tankoa", "S501"], ["Rossinavi", "Vector 50"],
    ["Gulf Craft", "Majesty 120"], ["Fairline", "Squadron 68"],
  ],
  sail: [
    ["Nautor Swan", "Swan 65"], ["Oyster", "Oyster 675"], ["Baltic Yachts", "Baltic 67"],
    ["Perini Navi", "56m Ketch"], ["Royal Huisman", "Wisp"], ["Vitters", "Unfurled"],
    ["Alloy Yachts", "44m Sloop"], ["Southern Wind", "SW105"],
    ["Wally", "Wally 100"], ["CNB", "CNB 76"],
    ["Beneteau", "Oceanis 62"], ["Jeanneau", "64"], ["Bavaria", "C57"],
    ["Dufour", "63 Exclusive"], ["Hanse", "675"],
    ["X-Yachts", "X6.5"], ["Hallberg-Rassy", "64"], ["Contest", "72CS"],
    ["Discovery", "67"], ["Moody", "DS54"],
  ],
  catamaran: [
    ["Fountaine Pajot", "Alegria 67"], ["Lagoon", "Seventy 7"],
    ["Sunreef", "80 Power"], ["Catana", "Ocean Class 65"],
    ["Privilege", "Euphorie 5"], ["Leopard Catamarans", "53 PC"],
    ["Bali", "5.4"], ["Nautitech", "54"], ["HH Catamarans", "HH66"],
    ["Gunboat", "68"],
  ],
  explorer: [
    ["Nordhavn", "86"], ["Damen", "YS 5009"], ["Arksen", "85"],
    ["Bering", "80"], ["Numarine", "32XP"], ["Horizon", "FD87"],
    ["Rosetti", "50m Explorer"], ["CdM", "Flexplorer 130"],
    ["Sanlorenzo", "57Steel"], ["Wider", "165"],
  ],
};

function getComparablePool(type: string): string[][] {
  const t = (type || "").toLowerCase();
  if (t.includes("catamaran") || t.includes("multi")) return COMPARABLE_BUILDERS.catamaran;
  if (t.includes("explorer")) return COMPARABLE_BUILDERS.explorer;
  if (t.includes("sail")) return COMPARABLE_BUILDERS.sail;
  return COMPARABLE_BUILDERS.motor;
}

function generateComparables(input: ValuationInput, estimatedPrice: number): Comparable[] {
  const pool = getComparablePool(input.type || "");
  const yearNum = parseInt(String(input.year || 0));
  const lengthNum = parseFloat(String(input.length || 0));
  const currentYear = new Date().getFullYear();
  const inputBuilder = (input.builder || "").toLowerCase();

  const filtered = pool.filter(([b]) => b.toLowerCase() !== inputBuilder);
  const selected: string[][] = [];
  const used = new Set<number>();

  const seeded = (i: number) => {
    const x = Math.sin(i * 9301 + yearNum * 49297 + lengthNum * 233) * 10000;
    return x - Math.floor(x);
  };

  let attempts = 0;
  while (selected.length < 5 && selected.length < filtered.length && attempts < 50) {
    attempts++;
    const idx = Math.floor(seeded(attempts) * filtered.length);
    if (!used.has(idx)) {
      used.add(idx);
      selected.push(filtered[idx]);
    }
  }

  let fallbackIdx = 0;
  while (selected.length < 5 && fallbackIdx < pool.length) {
    selected.push(pool[fallbackIdx % pool.length]);
    fallbackIdx++;
  }

  const conditions = ["Excellent", "Very Good", "Good", "Fair"];
  const comparables: Comparable[] = selected.slice(0, 5).map(([builder, model], i) => {
    const yearDelta = Math.floor(seeded(i + 10) * 5) - 2;
    const compYear = yearNum > 0 ? yearNum + yearDelta : currentYear - 3 - Math.floor(seeded(i + 20) * 8);
    const lengthDelta = (seeded(i + 30) - 0.5) * 0.2 * lengthNum;
    const compLength = lengthNum > 0 ? Math.round((lengthNum + lengthDelta) * 10) / 10 : 25;

    const builderInfo = findBuilder(builder);
    const priceMul = builderInfo ? builderInfo.premium : 1.0;
    const ageDelta = yearDelta * 0.03;
    const sizeDelta = lengthDelta > 0 ? 0.02 : -0.02;
    const condIdx = Math.floor(seeded(i + 40) * conditions.length);
    const condMul = [1.15, 1.05, 1.0, 0.85][condIdx];

    const compPrice = roundPrice(estimatedPrice * priceMul * (1 + ageDelta + sizeDelta) * condMul * (0.9 + seeded(i + 50) * 0.2));

    const notes: string[] = [];
    if (yearDelta > 0) notes.push(`${yearDelta} year(s) newer`);
    else if (yearDelta < 0) notes.push(`${Math.abs(yearDelta)} year(s) older`);
    if (lengthDelta > 1) notes.push(`${Math.round(lengthDelta * 10) / 10}m longer`);
    else if (lengthDelta < -1) notes.push(`${Math.round(Math.abs(lengthDelta) * 10) / 10}m shorter`);
    notes.push(conditions[condIdx] + " condition");
    if (builderInfo && builderInfo.tier === 1) notes.push("Tier-1 builder premium");

    return {
      builder,
      model,
      year: compYear,
      length: `${compLength}m`,
      condition: conditions[condIdx],
      price: formatEur(compPrice),
      note: notes.join(", "),
    };
  });

  return comparables;
}

function computeValuation(input: ValuationInput): {
  estimated_price: string;
  confidence: string;
  reasoning: string;
  comparables: Comparable[];
} {
  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(String(input.year || 0));
  const refitNum = parseInt(String(input.refit || 0)) || undefined;
  const age = yearNum > 0 ? currentYear - yearNum : 10;

  let lengthM = parseFloat(String(input.length || 0));
  if (input.units === "imperial" && lengthM > 0) lengthM *= 0.3048;
  if (lengthM <= 0) lengthM = 25;

  const hp = parseFloat(String(input.horse_power || 0));
  const cabins = parseInt(String(input.cabins || 0));

  let price = basePrice(input.type || "Motor Yacht", lengthM);
  price *= depreciationFactor(age, refitNum);
  price *= conditionFactor(input.condition || "Good");
  price *= hullFactor(input.hull_material || "");
  price *= engineFactor(hp, lengthM);
  price *= accommodationFactor(cabins, lengthM);

  if (input.mode === "builder" && input.builder) {
    const info = findBuilder(input.builder);
    if (info) price *= info.premium;
  }

  price = roundPrice(price);

  let confidence: "high" | "medium" | "low";
  let specCount = 0;
  if (input.type) specCount++;
  if (yearNum > 0) specCount++;
  if (lengthM > 5) specCount++;
  if (input.condition) specCount++;
  if (hp > 0) specCount++;
  if (cabins > 0) specCount++;
  if (input.hull_material) specCount++;
  if (input.mode === "builder" && input.builder) specCount++;

  if (specCount >= 6) confidence = "high";
  else if (specCount >= 4) confidence = "medium";
  else confidence = "low";

  const comparables = generateComparables(input, price);

  const parts: string[] = [];
  parts.push(`Based on analysis of comparable ${input.type || "yacht"}s in the ${lengthM.toFixed(0)}m range`);
  if (yearNum > 0) parts.push(`built around ${yearNum} (${age} years old)`);
  if (input.mode === "builder" && input.builder) {
    const info = findBuilder(input.builder);
    if (info) {
      const tierLabel = info.tier === 1 ? "Tier-1 premium" : info.tier === 2 ? "Tier-2 established" : "Tier-3";
      parts.push(`the ${input.builder} brand commands a ${tierLabel} builder premium of ${Math.round((info.premium - 1) * 100)}%`);
    }
  }
  if (input.condition) parts.push(`vessel in ${input.condition} condition`);
  if (refitNum) parts.push(`with refit in ${refitNum} adding residual value`);
  parts.push(`the estimated fair market value is ${formatEur(price)}`);
  parts.push(`This valuation is based on ${comparables.length} comparable vessels from leading brokerage platforms.`);
  if (confidence === "low") parts.push("Limited specifications provided — confidence is low; more data would improve accuracy.");

  return {
    estimated_price: formatEur(price),
    confidence,
    reasoning: parts.join(", ").replace(/, the estimated/, ". The estimated").replace(/, This valuation/, ". This valuation").replace(/, Limited/, ". Limited"),
    comparables,
  };
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

    const input: ValuationInput = {
      mode: "builder",
      type: String(yacht.type || "Motor Yacht"),
      builder: String(yacht.builder || ""),
      year: yacht.year as string,
      refit: yacht.refit as string,
      condition: String(yacht.condition || "Good"),
      length: yacht.length as string,
      beam: yacht.beam as string,
      hull_material: String(yacht.hull_material || ""),
      horse_power: yacht.horse_power as string,
      cabins: yacht.cabins as string,
    };

    const result = computeValuation(input);

    res.json({
      market_price: result.estimated_price,
      confidence: result.confidence,
      reasoning: result.reasoning,
      sources: "Algorithmic valuation based on market data analysis",
    });
  } catch (err: unknown) {
    console.error("Estimate error:", err);
    const msg = err instanceof Error ? err.message : "Estimation failed";
    res.status(500).json({ error: msg });
  }
});

router.post("/valuation", async (req, res) => {
  try {
    const b = req.body as ValuationInput;
    if (!b.type && !b.length && !b.year) {
      res.status(400).json({ error: "At least type, length, or year required" });
      return;
    }

    const result = computeValuation(b);
    res.json(result);
  } catch (err) {
    console.error("Valuation error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Valuation failed" });
  }
});

export default router;
