import { CabinetLayout } from "@/components/layout/CabinetLayout";
import { Layout } from "@/components/layout/Layout";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Database, Upload, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

const PageLayout: any = (CabinetLayout as any) || (Layout as any);
const API_BASE: string = (import.meta as any).env?.VITE_API_URL || "/api";

type Stats = {
  total: number;
  by_type: { type: string; c: number }[];
  summary: {
    last_import?: string | null;
    year_min?: number | null;
    year_max?: number | null;
    avg_price?: number | null;
    len_min?: number | null;
    len_max?: number | null;
  };
};

type Comparable = {
  builder: string | null;
  model: string | null;
  type: string | null;
  year: number | null;
  length_m: number | null;
  price_eur: number | null;
  region: string | null;
  source: string | null;
  source_url: string | null;
  is_sold: boolean | null;
  distance: number;
};

const SAMPLE_CSV = `source,source_url,builder,model,type,year,length_m,beam_m,price_eur,currency_orig,price_orig,region,listed_at,is_sold,engine_maker,hull_material,gross_tonnage,horse_power,condition,refit
yachtworld,https://example.com/listing/1,Sunseeker,Manhattan 73,Motor Yacht,2018,22.5,5.6,1850000,EUR,1850000,Mediterranean,2024-09-15,false,MAN,GRP,98,1800,Excellent,2023
boats.com,https://example.com/listing/2,Princess,V70,Motor Yacht,2017,21.3,5.4,1620000,USD,1750000,Florida,2024-10-02,false,Caterpillar,GRP,92,1700,Good,
yachtworld,https://example.com/listing/3,Azimut,72 Flybridge,Motor Yacht,2019,22.0,5.5,1980000,EUR,1980000,Italy,2024-11-20,true,MAN,GRP,95,1900,Excellent,`;

async function authHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not signed in");
  return { Authorization: `Bearer ${token}` };
}

function fmtPrice(n: number | null | undefined): string {
  if (!n) return "—";
  return `€${Math.round(n).toLocaleString("en-US")}`;
}

export default function AdminListingsDb() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CSV upload state
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Test comparables state
  const [testType, setTestType] = useState("Motor Yacht");
  const [testYear, setTestYear] = useState("2018");
  const [testLength, setTestLength] = useState("22");
  const [testing, setTesting] = useState(false);
  const [testMatches, setTestMatches] = useState<Comparable[]>([]);

  async function loadStats() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/yacht-listings/stats`, {
        headers: await authHeader(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as Stats;
      setStats(json);
    } catch (e: any) {
      setError(e?.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStats(); }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
  }

  async function handleImport() {
    if (!csvText.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch(`${API_BASE}/admin/yacht-listings/import-csv`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ csv: csvText }),
      });
      const json = await res.json();
      setImportResult({ ok: res.ok, ...json });
      if (res.ok) {
        setCsvText("");
        loadStats();
      }
    } catch (e: any) {
      setImportResult({ ok: false, error: e?.message || "Upload failed" });
    } finally {
      setImporting(false);
    }
  }

  async function handleTestComparables() {
    setTesting(true);
    setTestMatches([]);
    try {
      const res = await fetch(`${API_BASE}/admin/yacht-listings/comparables`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({
          type: testType,
          year: parseInt(testYear) || 0,
          length_m: parseFloat(testLength) || 0,
        }),
      });
      const json = await res.json();
      setTestMatches(json.matches || []);
    } catch (e: any) {
      setError(e?.message || "Test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <PageLayout>
      <section className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-white flex items-center gap-3">
              <Database size={28} className="text-primary" strokeWidth={1.5} />
              Listings Database
            </h1>
            <p className="text-white/40 text-sm font-sans mt-1">
              Comparables data used by the AI valuation engine. Upload CSV exports from broker subscriptions or your own data sources.
            </p>
          </div>
          <button
            onClick={() => setLocation("/admin")}
            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-white/10 text-white/50 hover:border-white/30 transition-colors"
          >
            ← Back to Admin
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="bg-white/[0.02] border border-white/8 p-6 mb-8">
          <h2 className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-4">Database Stats</h2>
          {loading ? (
            <div className="text-white/40 text-sm">Loading...</div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Total Listings</p>
                <p className="font-display text-3xl text-white tabular-nums">{stats.total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Year Range</p>
                <p className="font-display text-2xl text-white tabular-nums">
                  {stats.summary.year_min ? `${stats.summary.year_min}–${stats.summary.year_max}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Length Range</p>
                <p className="font-display text-2xl text-white tabular-nums">
                  {stats.summary.len_min ? `${Math.round(stats.summary.len_min)}–${Math.round(stats.summary.len_max || 0)}m` : "—"}
                </p>
              </div>
              <div>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Avg Price</p>
                <p className="font-display text-2xl text-white tabular-nums">{fmtPrice(stats.summary.avg_price)}</p>
              </div>
              {stats.by_type.length > 0 && (
                <div className="col-span-2 md:col-span-4 mt-4">
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">By Type</p>
                  <div className="flex flex-wrap gap-2">
                    {stats.by_type.map((t) => (
                      <span key={t.type} className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 text-white/70">
                        {t.type} <span className="text-primary tabular-nums ml-1">{t.c}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* CSV Upload */}
        <div className="bg-white/[0.02] border border-white/8 p-6 mb-8">
          <h2 className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Upload size={14} /> Bulk Import CSV
          </h2>
          <p className="text-white/50 text-xs font-sans mb-4">
            Required columns: <span className="text-primary font-mono">type, year, length_m, price_eur</span>.
            Optional: source, source_url, builder, model, beam_m, currency_orig, price_orig, region, listed_at, sold_at, is_sold.
            Prices in EUR. Length in meters. Dates as YYYY-MM-DD.
          </p>

          <div className="flex flex-wrap gap-3 mb-3">
            <label className="text-xs font-bold uppercase tracking-widest px-3 py-2 border border-white/15 text-white/70 hover:border-primary hover:text-primary cursor-pointer transition-colors">
              Choose CSV File
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileUpload} />
            </label>
            <button
              onClick={() => setCsvText(SAMPLE_CSV)}
              className="text-xs font-bold uppercase tracking-widest px-3 py-2 border border-white/10 text-white/50 hover:border-white/30 transition-colors"
            >
              Load Sample
            </button>
            <button
              onClick={() => setCsvText("")}
              className="text-xs font-bold uppercase tracking-widest px-3 py-2 border border-white/10 text-white/50 hover:border-white/30 transition-colors"
            >
              Clear
            </button>
          </div>

          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste CSV here or choose a file above..."
            className="w-full h-48 bg-black/50 border border-white/10 text-white/80 text-xs font-mono p-3 focus:outline-none focus:border-primary/50"
          />

          <div className="flex items-center justify-between mt-4">
            <p className="text-white/40 text-xs">
              {csvText ? `${csvText.split(/\r?\n/).filter((l) => l.trim()).length - 1} rows` : "No data"}
            </p>
            <button
              onClick={handleImport}
              disabled={importing || !csvText.trim()}
              className="text-xs font-bold uppercase tracking-widest px-4 py-2 bg-primary text-black hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? "Importing..." : "Import to Database"}
            </button>
          </div>

          {importResult && (
            <div className={`mt-4 p-4 text-sm border ${importResult.ok ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
              {importResult.ok ? (
                <>
                  Imported <strong>{importResult.inserted}</strong> rows ·
                  Skipped <strong>{importResult.skipped}</strong> ·
                  Total <strong>{importResult.total}</strong>
                  {importResult.errors?.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs">Show {importResult.errors.length} errors</summary>
                      <ul className="mt-2 text-xs font-mono max-h-40 overflow-auto">
                        {importResult.errors.map((e: any, i: number) => (
                          <li key={i}>Row {e.row}: {e.reason}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
              ) : (
                <>Error: {importResult.error || "Import failed"}</>
              )}
            </div>
          )}
        </div>

        {/* Test KNN */}
        <div className="bg-white/[0.02] border border-white/8 p-6">
          <h2 className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Search size={14} /> Test Comparables Engine
          </h2>
          <p className="text-white/50 text-xs font-sans mb-4">
            See what comparables the valuation engine would inject into the AI prompt for a given vessel.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1 block">Type</label>
              <input
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full bg-black/50 border border-white/10 text-white text-sm p-2 focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1 block">Year</label>
              <input
                value={testYear}
                onChange={(e) => setTestYear(e.target.value)}
                type="number"
                className="w-full bg-black/50 border border-white/10 text-white text-sm p-2 focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1 block">Length (m)</label>
              <input
                value={testLength}
                onChange={(e) => setTestLength(e.target.value)}
                type="number"
                className="w-full bg-black/50 border border-white/10 text-white text-sm p-2 focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleTestComparables}
                disabled={testing}
                className="w-full text-xs font-bold uppercase tracking-widest px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-black disabled:opacity-30 transition-colors"
              >
                {testing ? "Searching..." : "Find Matches"}
              </button>
            </div>
          </div>

          {testMatches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-[10px] uppercase tracking-widest border-b border-white/10">
                    <th className="text-left py-2 px-2">#</th>
                    <th className="text-left py-2 px-2">Builder / Model</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-right py-2 px-2">Year</th>
                    <th className="text-right py-2 px-2">Length</th>
                    <th className="text-right py-2 px-2">Price (EUR)</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-right py-2 px-2">Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {testMatches.map((m, i) => (
                    <tr key={i} className="border-b border-white/5 text-white/70">
                      <td className="py-2 px-2 text-white/30">{i + 1}</td>
                      <td className="py-2 px-2">
                        {m.source_url ? (
                          <a href={m.source_url} target="_blank" rel="noopener" className="text-primary hover:underline">
                            {[m.builder, m.model].filter(Boolean).join(" ") || "—"}
                          </a>
                        ) : (
                          [m.builder, m.model].filter(Boolean).join(" ") || "—"
                        )}
                      </td>
                      <td className="py-2 px-2 text-white/50">{m.type || "—"}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{m.year || "—"}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{m.length_m ? `${m.length_m}m` : "—"}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{fmtPrice(m.price_eur)}</td>
                      <td className="py-2 px-2 text-xs">{m.is_sold ? <span className="text-green-400">SOLD</span> : <span className="text-white/40">asking</span>}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-white/40 text-xs">{m.distance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-white/40 text-xs mt-3">
                {testMatches.length >= 3
                  ? `✓ ${testMatches.length} matches — these will be injected into the AI prompt as primary reference data.`
                  : `Only ${testMatches.length} matches — AI will fall back to web search since minimum is 3.`}
              </p>
            </div>
          ) : testing ? null : (
            <p className="text-white/30 text-sm font-sans">No results yet — fill specs and click Find Matches.</p>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
