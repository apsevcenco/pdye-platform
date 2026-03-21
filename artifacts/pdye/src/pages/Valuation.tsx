import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Calculator, TrendingUp, ChevronRight, RotateCcw, Building2, Sliders } from "lucide-react";

const YACHT_TYPES = ["Motor Yacht", "Sailing Yacht", "Catamaran", "Superyacht", "Explorer Yacht", "Sport Cruiser", "Trawler"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Needs Refit", "Project"];
const HULL_MATERIALS = ["GRP / Fiberglass", "Steel", "Aluminium", "Carbon Fibre", "Wood / Composite"];
const ENGINE_OPTIONS = ["Single diesel", "Twin diesel", "Triple diesel", "IPS drives", "Sail (auxiliary)", "Electric / Hybrid"];

type Mode = "builder" | "specs";

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

const CONFIDENCE_COLOR = {
  high: "text-green-400",
  medium: "text-yellow-400",
  low: "text-orange-400",
};
const CONFIDENCE_LABEL = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Indicative estimate",
};

const sel = "w-full bg-[#070f1a] border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors font-sans text-sm cursor-pointer";
const inp = "w-full bg-[#070f1a] border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors placeholder:text-white/20 font-sans text-sm";
const lbl = "block text-white/50 text-[10px] uppercase tracking-widest mb-2 font-sans font-bold";

export default function Valuation() {
  const [mode, setMode] = useState<Mode>("builder");
  const [form, setForm] = useState({
    type: "", builder: "", year: "", length: "", beam: "",
    draft: "", cabins: "", condition: "", hull_material: "", engines: "",
  });
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function setF(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function reset() { setResult(null); setError(""); }

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
        body: JSON.stringify({ mode, ...form }),
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
      <div className="pt-28 pb-14 bg-[#070f1a] border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 border border-primary/30 text-primary text-[10px] font-bold tracking-[0.25em] uppercase px-5 py-2 mb-7">
              <Calculator size={12} />
              AI Market Valuation
            </span>
            <h1 className="font-display text-4xl md:text-5xl text-white mb-4">
              Estimate Your Yacht's Value
            </h1>
            <p className="text-white/45 font-sans text-base max-w-xl mx-auto leading-relaxed">
              Enter your vessel specifications and our AI will analyse the current market to provide an independent price estimate — no name, flag or location required.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="min-h-screen bg-[#070f1a] py-12">
        <div className="max-w-3xl mx-auto px-6">

          {!result ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {/* Mode selector */}
              <div className="flex mb-8 border border-white/10">
                {([["builder", Building2, "By Manufacturer", "Include builder — affects brand premium"], ["specs", Sliders, "By Specifications", "Spec-based only — builder not disclosed"]] as const).map(([m, Icon, label, desc]) => (
                  <button key={m} type="button" onClick={() => setMode(m as Mode)}
                    className={`flex-1 flex items-start gap-3 px-5 py-4 transition-all duration-200 text-left ${mode === m ? "bg-primary/10 border-b-2 border-primary" : "hover:bg-white/3"}`}>
                    <Icon size={18} className={mode === m ? "text-primary mt-0.5" : "text-white/30 mt-0.5"} strokeWidth={1.5} />
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest ${mode === m ? "text-primary" : "text-white/50"}`}>{label}</p>
                      <p className="text-white/30 text-[11px] font-sans mt-0.5 hidden sm:block">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-[#0f1d33] border border-white/5 p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={lbl}>Yacht Type *</label>
                      <select value={form.type} onChange={e => setF("type", e.target.value)} required className={sel}>
                        <option value="">Select type...</option>
                        {YACHT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Build Year *</label>
                      <input type="number" value={form.year} onChange={e => setF("year", e.target.value)} required min={1950} max={2025}
                        className={inp} placeholder="e.g. 2012" />
                    </div>
                  </div>

                  {mode === "builder" && (
                    <div>
                      <label className={lbl}>Builder / Manufacturer</label>
                      <input value={form.builder} onChange={e => setF("builder", e.target.value)}
                        className={inp} placeholder="e.g. Ferretti, Sunseeker, Azimut, Benetti..." />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className={lbl}>Length (LOA) *</label>
                      <input value={form.length} onChange={e => setF("length", e.target.value)} required
                        className={inp} placeholder="e.g. 24m or 79ft" />
                    </div>
                    <div>
                      <label className={lbl}>Beam</label>
                      <input value={form.beam} onChange={e => setF("beam", e.target.value)}
                        className={inp} placeholder="e.g. 6.2m" />
                    </div>
                    <div>
                      <label className={lbl}>Draft</label>
                      <input value={form.draft} onChange={e => setF("draft", e.target.value)}
                        className={inp} placeholder="e.g. 1.8m" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={lbl}>Condition</label>
                      <select value={form.condition} onChange={e => setF("condition", e.target.value)} className={sel}>
                        <option value="">Select condition...</option>
                        {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Cabins</label>
                      <input type="number" value={form.cabins} onChange={e => setF("cabins", e.target.value)} min={1} max={20}
                        className={inp} placeholder="e.g. 4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={lbl}>Hull Material</label>
                      <select value={form.hull_material} onChange={e => setF("hull_material", e.target.value)} className={sel}>
                        <option value="">Select...</option>
                        {HULL_MATERIALS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Engine Configuration</label>
                      <select value={form.engines} onChange={e => setF("engines", e.target.value)} className={sel}>
                        <option value="">Select...</option>
                        {ENGINE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>

                  {error && (
                    <div className="border border-red-500/20 bg-red-500/5 px-4 py-3">
                      <p className="text-red-400 text-xs font-sans">{error}</p>
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full bg-primary hover:bg-white text-[#070f1a] font-bold uppercase tracking-widest py-4 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-[#070f1a]/30 border-t-[#070f1a] rounded-full animate-spin" /><span>Analysing Market...</span></>
                      : <><TrendingUp size={16} /><span>Get AI Valuation</span></>
                    }
                  </button>
                  {loading && (
                    <p className="text-white/25 text-[11px] text-center font-sans">
                      Searching market data across YachtWorld, RightBoat, Boat24 and comparable platforms... (30–60 sec)
                    </p>
                  )}
                </form>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">

                {/* Price estimate */}
                <div className="bg-[#0f1d33] border border-primary/20 p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-2">Market Value Estimate</p>
                      <div className="flex items-end gap-3">
                        <span className="font-display text-4xl text-primary">{result.estimated_low}</span>
                        <span className="text-white/30 font-display text-2xl pb-1">—</span>
                        <span className="font-display text-4xl text-white">{result.estimated_high}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-widest ${CONFIDENCE_COLOR[result.confidence] || "text-white/50"}`}>
                      {CONFIDENCE_LABEL[result.confidence] || result.confidence}
                    </span>
                  </div>

                  {/* Price bar */}
                  <div className="h-1.5 bg-white/5 mb-6 relative">
                    <div className="absolute left-[15%] right-[15%] h-full bg-gradient-to-r from-primary/60 to-primary" />
                    <div className="absolute left-[15%] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/60" />
                    <div className="absolute right-[15%] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                  </div>

                  <p className="text-white/50 font-sans text-sm leading-relaxed">{result.reasoning}</p>
                </div>

                {/* Comparables */}
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold mb-4 font-sans">
                    5 Comparable Market Examples
                  </p>
                  <div className="space-y-3">
                    {(result.comparables || []).map((c, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                        className="bg-[#0f1d33] border border-white/5 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/10 transition-colors">
                        <div className="flex items-start gap-4">
                          <span className="text-primary/40 font-display text-lg w-5 flex-shrink-0">{i + 1}</span>
                          <div>
                            <p className="text-white font-sans text-sm font-medium">
                              {c.builder} {c.model} <span className="text-white/40">({c.year})</span>
                            </p>
                            <p className="text-white/35 text-xs font-sans mt-0.5">
                              {c.length} · {c.condition} {c.note ? `· ${c.note}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className="text-primary font-display text-lg flex-shrink-0">{c.price}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer + reset */}
                <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-white/20 text-[11px] font-sans leading-relaxed max-w-md">
                    This estimate is for informational purposes only. Actual market value depends on condition survey, equipment, service history and current demand.
                  </p>
                  <button onClick={reset}
                    className="flex items-center gap-2 border border-white/10 text-white/50 hover:text-white hover:border-white/30 px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors flex-shrink-0">
                    <RotateCcw size={12} />
                    New Estimate
                  </button>
                </div>

                {/* CTA */}
                <div className="bg-primary/5 border border-primary/15 p-6 text-center">
                  <p className="text-white font-display text-lg mb-2">Want a Professional Valuation?</p>
                  <p className="text-white/40 font-sans text-sm mb-5">Our maritime experts provide certified appraisals with full market analysis.</p>
                  <a href="#/boat-owners" className="inline-flex items-center gap-2 bg-primary hover:bg-white text-[#070f1a] font-bold uppercase tracking-widest px-8 py-3 text-xs transition-all duration-300">
                    <ChevronRight size={14} />
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
