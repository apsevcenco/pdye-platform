import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Calculator, TrendingUp, ChevronRight, RotateCcw,
  Building2, Sliders, Gauge, Anchor, Wind, Users
} from "lucide-react";

const YACHT_TYPES = ["Motor Yacht", "Sailing Yacht", "Catamaran", "Superyacht", "Explorer Yacht", "Sport Cruiser", "Trawler", "Classic Yacht", "Gulet", "Flybridge"];
const CONDITIONS = ["New / Unused", "Excellent", "Good", "Fair", "Needs Refit", "Project"];
const HULL_MATERIALS = ["GRP / Fiberglass", "Steel", "Aluminium", "Carbon Fibre", "Wood / Composite", "Ferro-Cement"];
const HULL_TYPES = ["Monohull", "Catamaran", "Trimaran", "SWATH", "Semi-Displacement", "Planing"];
const ENGINE_CONFIGS = ["Single diesel", "Twin diesel", "Triple diesel", "Quad diesel", "IPS drives", "Sail (auxiliary)", "Electric / Hybrid", "Waterjet"];
const FUEL_TYPES = ["Diesel", "Petrol / Gasoline", "Electric", "Hybrid", "LNG", "HFO"];
const STATUSES = ["Private / Off-Market", "Listed for Sale", "Recently Relisted", "Bank Repo / Distressed"];

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
  estimated_low: string;
  estimated_high: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  comparables: Comparable[];
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

const baseInp = "bg-[#070f1a] border border-white/10 focus:border-primary text-white focus:outline-none transition-colors placeholder:text-white/20 font-sans text-sm";
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
  type: "", builder: "", year: "", refit: "", status: "",
  length: "", beam: "", draft: "", displacement: "", gross_tonnage: "",
  hull_material: "", hull_type: "",
  engines: "", engine_count: "", horse_power: "", fuel_type: "",
  fuel_capacity: "", water_capacity: "",
  max_speed: "", cruise_speed: "", range: "",
  cabins: "", heads: "", berths: "", crew: "",
  condition: "", asking_price: "",
};

export default function Valuation() {
  const [mode, setMode] = useState<Mode>("builder");
  const [units, setUnits] = useState<Units>("metric");
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function setF(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

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
      fuel_capacity:  toImp ? lToG(p.fuel_capacity)   : gToL(p.fuel_capacity),
      water_capacity: toImp ? lToG(p.water_capacity)  : gToL(p.water_capacity),
      max_speed:      toImp ? kToNm(p.max_speed)      : nmToK(p.max_speed),
      cruise_speed:   toImp ? kToNm(p.cruise_speed)   : nmToK(p.cruise_speed),
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
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, units, ...form }),
      });
      const data = await res.json();
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
      <div className="pt-24 pb-10 bg-[#070f1a] border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 border border-primary/30 text-primary text-[10px] font-bold tracking-[0.25em] uppercase px-5 py-2 mb-6">
              <Calculator size={11} />
              AI Market Valuation
            </span>
            <h1 className="font-display text-4xl md:text-5xl text-white mb-4">Estimate Your Yacht's Value</h1>
            <p className="text-white/40 font-sans text-sm max-w-xl mx-auto leading-relaxed">
              Enter your vessel specifications and our AI will analyse current global market data to provide an independent price estimate — no name, flag or location required.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="min-h-screen bg-[#070f1a] py-10">
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

              <div className="bg-[#0c1929] border border-white/6 p-7 space-y-5">
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* GENERAL */}
                  <SectionHead icon={Anchor} title="General Information" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <label className={lbl}>Yacht Type *</label>
                      <select value={form.type} onChange={e => setF("type", e.target.value)} required className={sel}>
                        <option value="">Select type...</option>
                        {YACHT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
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

                  {mode === "builder" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Builder / Manufacturer</label>
                        <input value={form.builder} onChange={e => setF("builder", e.target.value)}
                          className={inp} placeholder="e.g. Ferretti, Sunseeker, Azimut, Benetti..." />
                      </div>
                      <div>
                        <label className={lbl}>Market Status</label>
                        <select value={form.status} onChange={e => setF("status", e.target.value)} className={sel}>
                          <option value="">Select...</option>
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
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
                    <div>
                      <label className={lbl}>Current Asking Price (optional)</label>
                      <input value={form.asking_price} onChange={e => setF("asking_price", e.target.value)}
                        className={inp} placeholder="e.g. € 3,500,000" />
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
                      <label className={lbl}>Beam</label>
                      <div className="relative">
                        <input value={form.beam} onChange={e => setF("beam", e.target.value)} className={inpUnit} placeholder={M ? "e.g. 6.2" : "e.g. 20.3"} />
                        <UnitBadge unit={M ? "m" : "ft"} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Draft</label>
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
                    <div>
                      <label className={lbl}>Hull Material</label>
                      <select value={form.hull_material} onChange={e => setF("hull_material", e.target.value)} className={sel}>
                        <option value="">Select...</option>
                        {HULL_MATERIALS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className={lbl}>Hull Type</label>
                      <select value={form.hull_type} onChange={e => setF("hull_type", e.target.value)} className={sel}>
                        <option value="">Select...</option>
                        {HULL_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* PROPULSION */}
                  <SectionHead icon={Gauge} title="Propulsion & Performance" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <label className={lbl}>Engine Configuration</label>
                      <select value={form.engines} onChange={e => setF("engines", e.target.value)} className={sel}>
                        <option value="">Select...</option>
                        {ENGINE_CONFIGS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Engine Count</label>
                      <input type="number" value={form.engine_count} onChange={e => setF("engine_count", e.target.value)}
                        min={1} max={8} className={inp} placeholder="e.g. 2" />
                    </div>
                    <div>
                      <label className={lbl}>Total Horsepower</label>
                      <div className="relative">
                        <input type="number" value={form.horse_power} onChange={e => setF("horse_power", e.target.value)}
                          className={inpUnit} placeholder="e.g. 2400" />
                        <UnitBadge unit="HP" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className={lbl}>Fuel Type</label>
                      <select value={form.fuel_type} onChange={e => setF("fuel_type", e.target.value)} className={sel}>
                        <option value="">Select...</option>
                        {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Fuel Capacity</label>
                      <div className="relative">
                        <input value={form.fuel_capacity} onChange={e => setF("fuel_capacity", e.target.value)}
                          className={inpUnit} placeholder={M ? "e.g. 12000" : "e.g. 3170"} />
                        <UnitBadge unit={M ? "L" : "gal"} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Water Capacity</label>
                      <div className="relative">
                        <input value={form.water_capacity} onChange={e => setF("water_capacity", e.target.value)}
                          className={inpUnit} placeholder={M ? "e.g. 3000" : "e.g. 792"} />
                        <UnitBadge unit={M ? "L" : "gal"} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Range</label>
                      <div className="relative">
                        <input value={form.range} onChange={e => setF("range", e.target.value)}
                          className={inpUnit} placeholder={M ? "e.g. 1200" : "e.g. 648"} />
                        <UnitBadge unit="nm" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className={lbl}>Max Speed</label>
                      <div className="relative">
                        <input value={form.max_speed} onChange={e => setF("max_speed", e.target.value)}
                          className={inpUnit} placeholder="e.g. 28" />
                        <UnitBadge unit="kts" />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Cruise Speed</label>
                      <div className="relative">
                        <input value={form.cruise_speed} onChange={e => setF("cruise_speed", e.target.value)}
                          className={inpUnit} placeholder="e.g. 22" />
                        <UnitBadge unit="kts" />
                      </div>
                    </div>
                  </div>

                  {/* ACCOMMODATION */}
                  <SectionHead icon={Users} title="Accommodation & Crew" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className={lbl}>Guest Cabins</label>
                      <input type="number" value={form.cabins} onChange={e => setF("cabins", e.target.value)}
                        min={0} max={20} className={inp} placeholder="e.g. 4" />
                    </div>
                    <div>
                      <label className={lbl}>Heads (WC)</label>
                      <input type="number" value={form.heads} onChange={e => setF("heads", e.target.value)}
                        min={0} max={20} className={inp} placeholder="e.g. 4" />
                    </div>
                    <div>
                      <label className={lbl}>Berths (total)</label>
                      <input type="number" value={form.berths} onChange={e => setF("berths", e.target.value)}
                        min={0} max={40} className={inp} placeholder="e.g. 8" />
                    </div>
                    <div>
                      <label className={lbl}>Crew</label>
                      <input type="number" value={form.crew} onChange={e => setF("crew", e.target.value)}
                        min={0} max={50} className={inp} placeholder="e.g. 5" />
                    </div>
                  </div>

                  {error && (
                    <div className="border border-red-500/20 bg-red-500/5 px-4 py-3 mt-2">
                      <p className="text-red-400 text-xs font-sans">{error}</p>
                    </div>
                  )}

                  <div className="pt-2">
                    <button type="submit" disabled={loading}
                      className="w-full bg-primary hover:bg-white text-[#070f1a] font-bold uppercase tracking-[0.2em] py-4 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2.5 text-sm shadow-[0_0_30px_rgba(200,164,107,0.2)]">
                      {loading
                        ? <><span className="w-4 h-4 border-2 border-[#070f1a]/30 border-t-[#070f1a] rounded-full animate-spin" /><span>Analysing Global Market...</span></>
                        : <><TrendingUp size={15} /><span>Get AI Valuation</span></>
                      }
                    </button>
                    {loading && (
                      <p className="text-white/20 text-[11px] text-center font-sans mt-3 leading-relaxed">
                        Searching YachtWorld, Boat24, RightBoat, YachtBroker.com and 10+ sources... (30–60 sec)
                      </p>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-5">

                {/* Price estimate card */}
                <div className="bg-[#0c1929] border border-primary/25 p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div>
                      <p className="text-white/35 text-[9.5px] uppercase tracking-[0.22em] font-bold mb-3 font-sans">Market Value Estimate</p>
                      <div className="flex flex-wrap items-end gap-3">
                        <span className="font-display text-4xl text-primary">{result.estimated_low}</span>
                        <span className="text-white/25 font-display text-2xl pb-0.5">—</span>
                        <span className="font-display text-4xl text-white">{result.estimated_high}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-widest border px-3 py-1.5 block text-center ${
                        result.confidence === "high" ? "border-green-500/30 text-green-400 bg-green-500/5" :
                        result.confidence === "medium" ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/5" :
                        "border-orange-500/30 text-orange-400 bg-orange-500/5"
                      }`}>
                        {CONFIDENCE_LABEL[result.confidence] || result.confidence}
                      </span>
                    </div>
                  </div>

                  {/* Price bar */}
                  <div className="h-1 bg-white/5 mb-6 relative">
                    <div className="absolute left-[12%] right-[12%] h-full bg-gradient-to-r from-primary/50 to-primary" />
                    <div className="absolute left-[12%] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary/60 shadow-[0_0_8px_rgba(200,164,107,0.4)]" />
                    <div className="absolute right-[12%] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(200,164,107,0.5)]" />
                  </div>

                  <p className="text-white/50 font-sans text-sm leading-relaxed">{result.reasoning}</p>
                </div>

                {/* Comparables */}
                <div>
                  <p className="text-white/25 text-[9.5px] uppercase tracking-[0.22em] font-bold mb-3 font-sans">
                    5 Comparable Market Examples
                  </p>
                  <div className="space-y-2">
                    {(result.comparables || []).map((c, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        className="bg-[#0c1929] border border-white/5 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/10 transition-colors">
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
                    New Estimate
                  </button>
                </div>

                {/* CTA */}
                <div className="bg-primary/5 border border-primary/15 p-7 text-center">
                  <p className="text-white font-display text-xl mb-2">Want a Professional Valuation?</p>
                  <p className="text-white/35 font-sans text-sm mb-5 max-w-sm mx-auto">Our maritime experts provide certified appraisals with full market analysis and documentation.</p>
                  <a href="#/boat-owners"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-white text-[#070f1a] font-bold uppercase tracking-widest px-8 py-3.5 text-xs transition-all duration-300">
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
