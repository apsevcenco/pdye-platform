import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Calculator, TrendingUp, ChevronRight, RotateCcw,
  Building2, Sliders, Gauge, Anchor, Users, AlertTriangle
} from "lucide-react";
import { useSiteSection } from "@/lib/siteContent";
import { useCurrency } from "@/lib/currency";
import { CurrencySelector } from "@/components/ui/CurrencySelector";

// Two-level taxonomy.
// Level 1 (Yacht Type / Class) — 4 clean classes. Everything else (Trawler,
// Gulet, Explorer, Flybridge, Sport Cruiser, Classic) lives inside Configuration
// where it semantically belongs.
const YACHT_TYPES = ["Motor Yacht", "Sailing Yacht", "Catamaran", "Superyacht"];
// Level 2 (Configuration / Category) — depends on the chosen class.
const CONFIG_OPTIONS: Record<string, string[]> = {
  "Motor Yacht": [
    "Flybridge", "Open / Express", "Hard Top", "Coupé", "Sport Yacht",
    "Sport Bridge", "Pilothouse", "Sedan", "Convertible (Sportfish)",
    "Trawler", "Long Range / Explorer", "Motor Gulet", "Classic Motor",
  ],
  "Sailing Yacht": [
    "Sloop", "Ketch", "Cutter", "Schooner", "Yawl",
    "Cruiser-Racer", "Performance Cruiser", "Bluewater Cruiser",
    "Classic Sailing", "Sailing Gulet",
  ],
  "Catamaran": [
    "Sail Catamaran (Cruising)", "Sail Catamaran (Performance)",
    "Power Catamaran", "Charter Catamaran",
  ],
  "Superyacht": [
    "Tri-deck Motor", "Quad-deck Motor", "Explorer / Expedition",
    "Sport Superyacht", "Classic Motor Superyacht", "Sailing Superyacht",
  ],
};
const CONDITIONS = ["New", "Excellent", "Good", "Fair", "Needs Refit", "Project"];
const HULL_MATERIALS = ["GRP / Fiberglass", "Steel", "Aluminium", "Carbon Fibre", "Wood / Composite", "Ferro-Cement"];
const ENGINE_CONFIGS = ["Single diesel", "Twin diesel", "Triple diesel", "Quad diesel", "IPS drives", "Sail (auxiliary)", "Electric / Hybrid", "Waterjet"];
type Mode = "builder" | "specs";
type Units = "metric" | "imperial";

interface Comparable {
  builder: string;
  model: string;
  year: number;
  length: string;
  condition: string;
  price: string;
  note: string;
}

interface ValuationResult {
  estimated_price: string;
  market_price?: string;
  distressed_price?: string;
  quick_sale_price?: string;
  sanity_adjusted?: boolean;
  sanity_ai_original_price_eur?: number | null;
  sanity_band_low_eur?: number | null;
  sanity_band_high_eur?: number | null;
  sanity_band_label?: string | null;
  sanity_per_meter_eur?: number | null;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  comparables: Comparable[];
  completeness_score?: number;
  completeness_filled?: number;
  completeness_total?: number;
  completeness_missing_critical?: string[];
  internal_comparables_count?: number;
}

// Mirror of COMPLETENESS_WEIGHTS in artifacts/api-server/src/routes/estimate.ts.
// Keep in sync. Used purely for the live indicator before submit; the server
// recomputes authoritatively.
const COMPLETENESS_WEIGHTS: Record<string, number> = {
  type: 15, year: 15, length: 15, builder: 10, model: 8, configuration: 6,
  engine_maker: 4, engine_model: 2, horse_power: 5, engines: 2, engine_count: 2,
  gross_tonnage: 4, hull_material: 3, displacement: 3, beam: 2,
  condition: 5, refit: 3,
  draft: 1, range: 2, cabins: 1, heads: 0, berths: 0, crew: 1,
};

function computeCompletenessLocal(form: Record<string, string>, mode: string): { score: number; filled: number; total: number } {
  let earned = 0, possible = 0, filled = 0, total = 0;
  for (const [k, w] of Object.entries(COMPLETENESS_WEIGHTS)) {
    if ((k === "builder" || k === "model") && mode !== "builder") continue;
    possible += w;
    total++;
    if ((form[k] || "").trim() !== "") {
      earned += w;
      filled++;
    }
  }
  return {
    score: possible > 0 ? Math.round((earned / possible) * 100) : 0,
    filled,
    total,
  };
}

const CONFIDENCE_COLOR = { high: "text-green-400", medium: "text-yellow-400", low: "text-orange-400" };
const CONFIDENCE_LABEL = { high: "High confidence", medium: "Medium confidence", low: "Indicative estimate" };

function SectionHead({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 pt-2 pb-1">
      <Icon size={14} className="text-primary/60" strokeWidth={1.8} />
      <span className="text-white/30 text-[10px] font-bold uppercase tracking-[0.22em] font-sans">{title}</span>
      <div className="flex-1 h-[1px] bg-white/5" />
    </div>
  );
}

const baseInp = "bg-[#0a1628] border border-white/10 focus:border-primary text-white focus:outline-none transition-colors placeholder:text-white/20 font-sans text-sm";
const sel = `w-full ${baseInp} px-4 py-2.5 cursor-pointer`;
const inp = `w-full ${baseInp} px-4 py-2.5`;
const inpUnit = `w-full ${baseInp} pl-4 pr-14 py-2.5`;
const lbl = "block text-white/45 text-[9.5px] uppercase tracking-[0.18em] mb-1.5 font-sans font-bold";

function UnitBadge({ unit }: { unit: string }) {
  return (
    <span className="absolute right-0 top-0 bottom-0 flex items-center px-3 text-[9px] font-bold text-primary/50 border-l border-white/10 pointer-events-none tracking-wider uppercase">
      {unit}
    </span>
  );
}

function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? null : n;
}
function fmtN(n: number, dec = 1): string {
  const r = parseFloat(n.toFixed(dec));
  return r % 1 === 0 ? r.toString() : r.toFixed(dec);
}
function conv(val: string, factor: number, dec = 1): string {
  const n = parseNum(val);
  if (n === null || !val.trim()) return val;
  return fmtN(n * factor, dec);
}

const EMPTY: Record<string, string> = {
  type: "", configuration: "", builder: "", model: "", year: "", refit: "",
  engine_maker: "", engine_model: "",
  length: "", beam: "", draft: "", displacement: "", gross_tonnage: "",
  hull_material: "",
  engines: "", engine_count: "", horse_power: "",
  range: "",
  cabins: "", heads: "", berths: "", crew: "",
  condition: "",
};

// Fields the user MUST fill (in addition to the always-required type/year/length)
// unless they explicitly check "I don't have all the data". `builder` and
// `model` are added dynamically when `mode === "builder"` (no point asking for
// model when we don't even know the manufacturer).
const REQUIRED_EXTRA = [
  "configuration",
  "beam", "draft",
  "engine_maker", "engines", "engine_count", "horse_power",
  "cabins", "heads", "crew",
];
const FIELD_LABELS: Record<string, string> = {
  type: "Yacht Class", year: "Build Year", length: "Length",
  configuration: "Configuration / Style",
  beam: "Beam", draft: "Draft",
  builder: "Builder / Manufacturer", model: "Model / Range",
  engine_maker: "Engine Manufacturer", engines: "Engine Configuration",
  engine_count: "Engine Count", horse_power: "Total Horsepower",
  cabins: "Guest Cabins", heads: "Heads (WC)", crew: "Crew",
};

export default function Valuation() {
  const [mode, setMode] = useState<Mode>("builder");
  const [units, setUnits] = useState<Units>("metric");
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bypassRequired, setBypassRequired] = useState(false);
  const heroT = useSiteSection("valuation", "hero");
  const formT = useSiteSection("valuation", "form");
  const t = { hero: heroT, formT };
  const { formatPrice } = useCurrency();

  function setF(k: string, v: string) {
    setForm(p => {
      const next = { ...p, [k]: v };
      // Clear configuration when type changes — old value (e.g. "Sloop") may
      // not exist in the new type's option list (e.g. Motor Yacht).
      if (k === "type" && v !== p.type) next.configuration = "";
      return next;
    });
  }

  function toggleUnits() {
    const toImp = units === "metric";
    const mToFt = (v: string) => conv(v, 3.28084, 1);
    const ftToM = (v: string) => conv(v, 1 / 3.28084, 2);
    const lToG = (v: string) => conv(v, 0.264172, 0);
    const gToL = (v: string) => conv(v, 1 / 0.264172, 0);
    const tToLT = (v: string) => conv(v, 0.984207, 1);
    const ltToT = (v: string) => conv(v, 1 / 0.984207, 1);
    const kToNm = (v: string) => conv(v, 0.539957, 0);
    const nmToK = (v: string) => conv(v, 1.852, 0);
    setForm(p => ({
      ...p,
      length:         toImp ? mToFt(p.length)         : ftToM(p.length),
      beam:           toImp ? mToFt(p.beam)           : ftToM(p.beam),
      draft:          toImp ? mToFt(p.draft)          : ftToM(p.draft),
      displacement:   toImp ? tToLT(p.displacement)   : ltToT(p.displacement),
      range:          toImp ? kToNm(p.range)           : nmToK(p.range),
    }));
    setUnits(toImp ? "imperial" : "metric");
  }

  function reset() { setResult(null); setError(""); }

  const M = units === "metric";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.type || !form.year || !form.length) {
      setError("Please fill in at least: Type, Year and Length.");
      return;
    }
    if (!bypassRequired) {
      // Only require `configuration` when the chosen yacht type actually has
      // a configuration dropdown rendered for it (defensive — every type in
      // CONFIG_OPTIONS today has options, but if we ever add a new yacht type
      // without a config list, the form must still be submittable).
      const hasConfig = !!form.type && Array.isArray((CONFIG_OPTIONS as any)[form.type]);
      const requiredAll = [
        ...REQUIRED_EXTRA.filter(k => k !== "configuration" || hasConfig),
        ...(mode === "builder" ? ["builder", "model"] : []),
      ];
      const missing = requiredAll.filter(k => !(form[k] || "").trim());
      if (missing.length > 0) {
        setError(
          `Missing required fields: ${missing.map(k => FIELD_LABELS[k] || k).join(", ")}. ` +
          `Either fill them in or check the box below to proceed with an indicative estimate.`
        );
        return;
      }
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const API_BASE =
  import.meta.env.VITE_API_URL || "https://pdye-platform.onrender.com/api";

const res = await fetch(`${API_BASE}/valuation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, units, bypass_required: bypassRequired, ...form }),
      });
      const text = await res.text();
const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || "Estimation failed");
      setResult(data as ValuationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Estimation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      {/* Hero */}
      <div className="pt-24 pb-10 bg-[#0a1628] border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 border border-primary/30 text-primary text-[10px] font-bold tracking-[0.25em] uppercase px-5 py-2 mb-6">
              <Calculator size={11} />
              <span dangerouslySetInnerHTML={{ __html: t.hero.tag }} />
            </span>
            <h1 className="font-display text-4xl md:text-5xl text-white mb-4" dangerouslySetInnerHTML={{ __html: t.hero.title }} />
            <p className="text-white/40 font-sans text-sm max-w-xl mx-auto leading-relaxed" dangerouslySetInnerHTML={{ __html: t.hero.desc }} />
          </motion.div>
        </div>
      </div>

      <div className="min-h-screen bg-[#0a1628] py-10">
        <div className="max-w-4xl mx-auto px-6">

          {!result ? (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

              {/* Mode + Units row */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {/* Mode */}
                <div className="flex flex-1 border border-white/10">
                  {([["builder", Building2, "By Manufacturer"] as const, ["specs", Sliders, "Specs Only"] as const]).map(([m, Icon, label]) => (
                    <button key={m} type="button" onClick={() => setMode(m)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200 ${mode === m ? "bg-primary/12 border-b-2 border-primary" : "hover:bg-white/3"}`}>
                      <Icon size={13} className={mode === m ? "text-primary" : "text-white/30"} strokeWidth={1.8} />
                      <span className={`text-[10px] font-bold uppercase tracking-widest font-sans ${mode === m ? "text-primary" : "text-white/45"}`}>{label}</span>
                    </button>
                  ))}
                </div>
                {/* Units toggle */}
                <button type="button" onClick={toggleUnits}
                  className="flex items-center gap-3 border border-white/10 px-5 py-3 hover:border-white/25 transition-colors group">
                  <Gauge size={13} className="text-primary/60" strokeWidth={1.8} />
                  <span className="text-[10px] font-bold uppercase tracking-widest font-sans text-white/50 group-hover:text-white/80 transition-colors">
                    {M ? "Metric (m / L / kts)" : "Imperial (ft / gal / kts)"}
                  </span>
                  <span className="text-[9px] font-bold text-primary/50 border border-primary/25 px-1.5 py-0.5 ml-1">SWITCH</span>
                </button>
              </div>

              <div className="bg-[#0f1d33] border border-white/6 p-7 space-y-5">
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* GENERAL */}
                  <SectionHead icon={Anchor} title="General Information" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <label className={lbl}>Yacht Class *</label>
                      <select value={form.type} onChange={e => setF("type", e.target.value)} required className={sel}>
                        <option value="">Select class...</option>
                        {YACHT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <p className="text-white/30 text-[10px] font-sans mt-1.5 leading-relaxed">
                        Step 1: pick the broad class. Specific style (Flybridge, Trawler, Sloop, Explorer...) comes next.
                      </p>
                    </div>
                    <div>
                      <label className={lbl}>Build Year *</label>
                      <input type="number" value={form.year} onChange={e => setF("year", e.target.value)}
                        required min={1940} max={2025} className={inp} placeholder="e.g. 2012" />
                    </div>
                    <div>
                      <label className={lbl}>Refit Year</label>
                      <input type="number" value={form.refit} onChange={e => setF("refit", e.target.value)}
                        min={1940} max={2025} className={inp} placeholder="e.g. 2019" />
                    </div>
                  </div>

                  {/* Configuration / Style — appears as soon as a yacht type
                      is chosen, with options that depend on the type. */}
                  {form.type && CONFIG_OPTIONS[form.type] && (
                    <div>
                      <label className={lbl}>Configuration / Style *</label>
                      <select value={form.configuration} onChange={e => setF("configuration", e.target.value)} className={sel}>
                        <option value="">Select configuration...</option>
                        {CONFIG_OPTIONS[form.type].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <p className="text-white/30 text-[10px] font-sans mt-1.5 leading-relaxed">
                        Same length and year, different configuration = very different price (e.g. Flybridge vs Open).
                      </p>
                    </div>
                  )}

                  {mode === "builder" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Builder / Manufacturer *</label>
                        <input value={form.builder} onChange={e => setF("builder", e.target.value)}
                          className={inp} placeholder="e.g. Ferretti, Sunseeker, Azimut..." />
                      </div>
                      <div>
                        <label className={lbl}>Model / Range *</label>
                        <input value={form.model} onChange={e => setF("model", e.target.value)}
                          className={inp} placeholder="e.g. Predator 60, Manhattan 66, F62..." />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={lbl}>Condition</label>
                      <select value={form.condition} onChange={e => setF("condition", e.target.value)} className={sel}>
                        <option value="">Select condition...</option>
                        {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* DIMENSIONS */}
                  <SectionHead icon={Anchor} title="Hull & Dimensions" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className={lbl}>Length (LOA) *</label>
                      <div className="relative">
                        <input value={form.length} onChange={e => setF("length", e.target.value)} required className={inpUnit} placeholder={M ? "e.g. 24.5" : "e.g. 80.4"} />
                        <UnitBadge unit={M ? "m" : "ft"} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Beam *</label>
                      <div className="relative">
                        <input value={form.beam} onChange={e => setF("beam", e.target.value)} className={inpUnit} placeholder={M ? "e.g. 6.2" : "e.g. 20.3"} />
                        <UnitBadge unit={M ? "m" : "ft"} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Draft *</label>
                      <div className="relative">
                        <input value={form.draft} onChange={e => setF("draft", e.target.value)} className={inpUnit} placeholder={M ? "e.g. 1.8" : "e.g. 5.9"} />
                        <UnitBadge unit={M ? "m" : "ft"} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Displacement</label>
                      <div className="relative">
                        <input value={form.displacement} onChange={e => setF("displacement", e.target.value)} className={inpUnit} placeholder={M ? "e.g. 65" : "e.g. 64"} />
                        <UnitBadge unit={M ? "t" : "LT"} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className={lbl}>Gross Tonnage</label>
                      <input type="number" value={form.gross_tonnage} onChange={e => setF("gross_tonnage", e.target.value)}
                        className={inp} placeholder="GT" />
                    </div>
                    <div className="col-span-2">
                      <label className={lbl}>Hull Material</label>
                      <select value={form.hull_material} onChange={e => setF("hull_material", e.target.value)} className={sel}>
                        <option value="">Select...</option>
                        {HULL_MATERIALS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* PROPULSION */}
                  <SectionHead icon={Gauge} title="Propulsion & Performance" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <label className={lbl}>Engine Configuration *</label>
                      <select value={form.engines} onChange={e => setF("engines", e.target.value)} className={sel}>
                        <option value="">Select...</option>
                        {ENGINE_CONFIGS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Engine Count *</label>
                      <input type="number" value={form.engine_count} onChange={e => setF("engine_count", e.target.value)}
                        min={1} max={8} className={inp} placeholder="e.g. 2" />
                    </div>
                    <div>
                      <label className={lbl}>Total Horsepower *</label>
                      <div className="relative">
                        <input type="number" value={form.horse_power} onChange={e => setF("horse_power", e.target.value)}
                          className={inpUnit} placeholder="e.g. 2400" />
                        <UnitBadge unit="HP" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <label className={lbl}>Engine Manufacturer *</label>
                      <input value={form.engine_maker} onChange={e => setF("engine_maker", e.target.value)}
                        className={inp} placeholder="e.g. MAN, MTU, Caterpillar, Volvo Penta, Cummins..." />
                    </div>
                    <div className="col-span-2">
                      <label className={lbl}>Engine Model / Series</label>
                      <input value={form.engine_model} onChange={e => setF("engine_model", e.target.value)}
                        className={inp} placeholder="e.g. MAN V12-1550, MTU Series 2000, Volvo IPS-1200..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="col-span-2 sm:col-span-4">
                      <label className={lbl}>Range</label>
                      <div className="relative">
                        <input value={form.range} onChange={e => setF("range", e.target.value)}
                          className={inpUnit} placeholder={M ? "e.g. 1200" : "e.g. 648"} />
                        <UnitBadge unit="nm" />
                      </div>
                    </div>
                  </div>

                  {/* ACCOMMODATION */}
                  <SectionHead icon={Users} title="Accommodation & Crew" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className={lbl}>Guest Cabins *</label>
                      <input type="number" value={form.cabins} onChange={e => setF("cabins", e.target.value)}
                        min={0} max={20} className={inp} placeholder="e.g. 4" />
                    </div>
                    <div>
                      <label className={lbl}>Heads (WC) *</label>
                      <input type="number" value={form.heads} onChange={e => setF("heads", e.target.value)}
                        min={0} max={20} className={inp} placeholder="e.g. 4" />
                    </div>
                    <div>
                      <label className={lbl}>Berths (total)</label>
                      <input type="number" value={form.berths} onChange={e => setF("berths", e.target.value)}
                        min={0} max={40} className={inp} placeholder="e.g. 8" />
                    </div>
                    <div>
                      <label className={lbl}>Crew *</label>
                      <input type="number" value={form.crew} onChange={e => setF("crew", e.target.value)}
                        min={0} max={50} className={inp} placeholder="e.g. 5" />
                    </div>
                  </div>

                  {/* Prominent escape hatch — checkbox is yellow-bordered with
                      icon so it's impossible to miss when an error blocks
                      submission. Toggling it relaxes the required-fields rule
                      and forces the result confidence to "low". */}
                  <div className={`border-2 mt-4 transition-all ${bypassRequired ? "border-amber-400/60 bg-amber-400/10" : "border-amber-500/30 bg-amber-500/5"}`}>
                    <label className="flex items-start gap-3 p-4 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={bypassRequired}
                        onChange={e => setBypassRequired(e.target.checked)}
                        className="mt-0.5 w-5 h-5 accent-amber-400 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" strokeWidth={2.2} />
                          <span className="text-amber-300 font-bold text-sm font-sans">
                            I don't have all the data — proceed with an indicative estimate
                          </span>
                        </div>
                        <p className="text-amber-200/60 text-[11.5px] font-sans leading-snug">
                          Check this box only if you can't fill the required fields above (marked with *). The result will be flagged as <span className="font-bold">low confidence</span>, since we can't produce a precise valuation without core specs.
                        </p>
                      </div>
                    </label>
                  </div>

                  {error && (
                    <div className="border border-red-500/30 bg-red-500/5 px-4 py-3 mt-3">
                      <p className="text-red-400 text-xs font-sans leading-relaxed">{error}</p>
                    </div>
                  )}

                  {/* Live completeness indicator — encourages users to fill more
                      fields. Server recomputes this authoritatively on submit. */}
                  {(() => {
                    const c = computeCompletenessLocal(form, mode);
                    const color = c.score >= 70 ? "bg-green-400" : c.score >= 50 ? "bg-yellow-400" : c.score >= 30 ? "bg-orange-400" : "bg-red-400";
                    const labelColor = c.score >= 70 ? "text-green-400" : c.score >= 50 ? "text-yellow-400" : c.score >= 30 ? "text-orange-400" : "text-red-400";
                    const hint =
                      c.score >= 70 ? "Excellent — high-confidence valuation possible"
                      : c.score >= 50 ? "Good — fill a few more for higher accuracy"
                      : c.score >= 30 ? "Limited data — result will be indicative"
                      : "Too thin — fill at least type, year and length";
                    return (
                      <div className="border border-white/10 bg-white/[0.02] p-4 mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/45 text-[10px] uppercase tracking-[0.2em] font-bold font-sans">Profile completeness</span>
                          <span className={`text-sm font-bold tabular-nums ${labelColor}`}>{c.score}% <span className="text-white/30 font-normal text-xs">({c.filled}/{c.total})</span></span>
                        </div>
                        <div className="w-full h-1.5 bg-white/8 overflow-hidden">
                          <div className={`h-full transition-all ${color}`} style={{ width: `${c.score}%` }} />
                        </div>
                        <p className="text-white/35 text-[11px] font-sans mt-2 leading-snug">{hint}</p>
                      </div>
                    );
                  })()}

                  <div className="pt-2">
                    <button type="submit" disabled={loading}
                      className="w-full bg-white/5 backdrop-blur-md border border-primary text-primary hover:bg-primary/10 hover:text-white hover:border-white font-bold uppercase tracking-[0.2em] py-4 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2.5 text-sm">
                      {loading
                        ? <><span className="w-4 h-4 border-2 border-[#0a1628]/30 border-t-[#0a1628] rounded-full animate-spin" /><span>{t.formT.loading_text}</span></>
                        : <><TrendingUp size={15} /><span>{t.formT.submit_btn}</span></>
                      }
                    </button>
                    {loading && (
                      <p className="text-white/20 text-[11px] text-center font-sans mt-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.formT.loading_desc }} />
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-5">

                {/* Price estimate card */}
                <div className="bg-[#0f1d33] border border-primary/25 p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <p className="text-white/35 text-[9.5px] uppercase tracking-[0.22em] font-bold font-sans">{t.formT.result_label}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-shrink-0">
                      <CurrencySelector compact />
                      <span className={`text-[10px] font-bold uppercase tracking-widest border px-3 py-1.5 block text-center ${
                        result.confidence === "high" ? "border-green-500/30 text-green-400 bg-green-500/5" :
                        result.confidence === "medium" ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/5" :
                        "border-orange-500/30 text-orange-400 bg-orange-500/5"
                      }`}>
                        {CONFIDENCE_LABEL[result.confidence] || result.confidence}
                      </span>
                    </div>
                  </div>

                  {/* Three-tier price tiles: open-market / discreet / quick sale */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    <div className="bg-primary/5 border border-primary/30 p-5">
                      <p className="text-primary/70 text-[9px] uppercase tracking-[0.2em] font-bold mb-2 font-sans">Open market</p>
                      <p className="font-display text-3xl text-primary leading-tight">{formatPrice(result.market_price || result.estimated_price)}</p>
                      <p className="text-white/30 text-[10px] mt-2 font-sans leading-snug">Open-market listing equivalent (asking price)</p>
                    </div>
                    {result.distressed_price && (
                      <div className="bg-amber-500/5 border border-amber-500/25 p-5">
                        <p className="text-amber-400/80 text-[9px] uppercase tracking-[0.2em] font-bold mb-2 font-sans">Discreet sale</p>
                        <p className="font-display text-3xl text-amber-300 leading-tight">{formatPrice(result.distressed_price)}</p>
                        <p className="text-white/30 text-[10px] mt-2 font-sans leading-snug">Confidential / off-market sale (≈ −25%)</p>
                      </div>
                    )}
                    {result.quick_sale_price && (
                      <div className="bg-orange-500/5 border border-orange-500/25 p-5">
                        <p className="text-orange-400/80 text-[9px] uppercase tracking-[0.2em] font-bold mb-2 font-sans">Quick sale</p>
                        <p className="font-display text-3xl text-orange-300 leading-tight">{formatPrice(result.quick_sale_price)}</p>
                        <p className="text-white/30 text-[10px] mt-2 font-sans leading-snug">Forced / urgent liquidation (≈ −35%)</p>
                      </div>
                    )}
                  </div>

                  {result.sanity_adjusted && (
                    <div className="border border-white/10 bg-white/3 px-4 py-2.5 mb-4">
                      <p className="text-white/55 text-[10.5px] font-sans leading-snug">
                        <span className="text-white/75 font-bold">Sanity adjustment applied.</span>{" "}
                        {result.sanity_ai_original_price_eur && result.sanity_per_meter_eur ? (
                          <>
                            AI estimate was{" "}
                            <span className="text-white/75">€ {result.sanity_ai_original_price_eur.toLocaleString("en-US")}</span>
                            {" "}({"≈ €"}{(result.sanity_per_meter_eur / 1000).toFixed(0)}k/m).{" "}
                          </>
                        ) : (
                          <>AI estimate was outside the typical band.{" "}</>
                        )}
                        {result.sanity_band_low_eur && result.sanity_band_high_eur && result.sanity_band_label ? (
                          <>
                            Clamped to the {result.sanity_band_label} band of{" "}
                            <span className="text-white/75">
                              € {result.sanity_band_low_eur.toLocaleString("en-US")} – € {result.sanity_band_high_eur.toLocaleString("en-US")}
                            </span>
                            .{" "}
                          </>
                        ) : null}
                        Treat as indicative.
                      </p>
                    </div>
                  )}

                  {/* Data completeness + internal comparables badges */}
                  {(result.completeness_score !== undefined || (result.internal_comparables_count ?? 0) > 0) && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {result.completeness_score !== undefined && (
                        <span className="text-[10px] font-bold uppercase tracking-widest border border-white/10 bg-white/[0.02] text-white/55 px-3 py-1.5">
                          Data completeness:&nbsp;
                          <span className={
                            result.completeness_score >= 70 ? "text-green-400" :
                            result.completeness_score >= 50 ? "text-yellow-400" :
                            result.completeness_score >= 30 ? "text-orange-400" : "text-red-400"
                          }>
                            {result.completeness_score}%
                          </span>
                          {result.completeness_filled !== undefined && result.completeness_total !== undefined && (
                            <span className="text-white/30 ml-1.5 normal-case font-normal tracking-normal">({result.completeness_filled}/{result.completeness_total} fields)</span>
                          )}
                        </span>
                      )}
                      {(result.internal_comparables_count ?? 0) >= 3 && (
                        <span className="text-[10px] font-bold uppercase tracking-widest border border-primary/30 bg-primary/5 text-primary px-3 py-1.5">
                          ✓ {result.internal_comparables_count} internal matches
                        </span>
                      )}
                    </div>
                  )}

                  <div className="h-[1px] bg-white/6 mb-5" />
                  <p className="text-white/50 font-sans text-sm leading-relaxed">{result.reasoning}</p>
                </div>

                {/* Comparables */}
                <div>
                  <p className="text-white/25 text-[9.5px] uppercase tracking-[0.22em] font-bold mb-3 font-sans">
                    {t.formT.comparables_title}
                  </p>
                  <div className="space-y-2">
                    {(result.comparables || []).map((c, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        className="bg-[#0f1d33] border border-white/5 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/10 transition-colors">
                        <div className="flex items-start gap-3.5">
                          <span className="text-primary/35 font-display text-base w-4 flex-shrink-0 pt-0.5">{i + 1}</span>
                          <div>
                            <p className="text-white/90 font-sans text-sm font-semibold">
                              {c.builder} {c.model} <span className="text-white/35 font-normal">({c.year})</span>
                            </p>
                            <p className="text-white/30 text-xs font-sans mt-0.5">
                              {c.length}{c.condition ? ` · ${c.condition}` : ""}{c.note ? ` · ${c.note}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className="text-primary font-display text-xl flex-shrink-0">{c.price}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Actions row */}
                <div className="border-t border-white/5 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <p className="text-white/18 text-[10.5px] font-sans leading-relaxed max-w-sm">
                    Estimate for informational purposes only. Actual value depends on full survey, equipment list and current demand.
                  </p>
                  <button onClick={reset}
                    className="flex items-center gap-2 border border-white/10 text-white/45 hover:text-white hover:border-white/25 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors flex-shrink-0">
                    <RotateCcw size={11} />
                    {t.formT.new_btn}
                  </button>
                </div>

                {/* CTA */}
                <div className="bg-primary/5 border border-primary/15 p-7 text-center">
                  <p className="text-white font-display text-xl mb-2">Want a Professional Valuation?</p>
                  <p className="text-white/35 font-sans text-sm mb-5 max-w-sm mx-auto">Our maritime experts provide certified appraisals with full market analysis and documentation.</p>
                  <a href="/boat-owners"
                    className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-primary text-primary hover:bg-primary/10 hover:text-white hover:border-white font-bold uppercase tracking-widest px-8 py-3.5 text-xs transition-all duration-300">
                    <ChevronRight size={13} />
                    Contact Our Team
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </Layout>
  );
}
