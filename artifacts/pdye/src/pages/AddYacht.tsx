import { useEffect, useState, useRef } from "react";
import { Link, Redirect, useLocation, useSearch } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { yachtModerationApi } from "@/lib/yachtModerationApi";
import { Layout } from "@/components/layout/Layout";
import {
  ArrowLeft, Upload, X, Plus, CheckCircle, Loader2, Camera, Sparkles, ChevronLeft, ChevronRight,
} from "lucide-react";

const inputCls = "w-full bg-[#070f1a] border border-white/10 text-white px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-white/20";
const labelCls = "block text-white/50 text-[10px] uppercase tracking-widest mb-2 font-sans font-bold";
const unitInputCls = "w-full bg-[#070f1a] border border-white/10 text-white pl-4 pr-14 py-2.5 text-sm font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-white/20";

const API_BASE = import.meta.env.VITE_API_URL || "https://pdye-platform.onrender.com/api";

type FormState = {
  name: string; type: string; status: string; condition: string; flag: string;
  builder: string; year: string; refit: string;
  length: string; beam: string; draft: string; displacement: string; gross_tonnage: string;
  hull_material: string; hull_type: string;
  engines: string; engine_count: string; horse_power: string; fuel_type: string;
  fuel_capacity: string; water_capacity: string;
  max_speed: string; cruise_speed: string; range: string;
  cabins: string; heads: string; berths: string; crew: string;
  location: string; price: string; market_price: string; distressed_price: string;
  image: string; description: string;
};

const EMPTY_FORM: FormState = {
  name: "", type: "Motor Yacht", status: "Available", condition: "Used", flag: "",
  builder: "", year: "", refit: "",
  length: "", beam: "", draft: "", displacement: "", gross_tonnage: "",
  hull_material: "Fiberglass", hull_type: "Monohull",
  engines: "", engine_count: "", horse_power: "", fuel_type: "Diesel",
  fuel_capacity: "", water_capacity: "",
  max_speed: "", cruise_speed: "", range: "",
  cabins: "", heads: "", berths: "", crew: "",
  location: "", price: "", market_price: "", distressed_price: "",
  image: "", description: "",
};

const STATUSES = ["Available", "Under Offer", "Distressed Sale", "Off-Market", "Confidential"];

export default function AddYacht() {
  const { user, userProfile, loading } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  const [aiEstimating, setAiEstimating] = useState(false);
  const [aiNote, setAiNote] = useState<{ reasoning: string; confidence: string; sources?: string } | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reorderPhotos(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;
    setPhotos(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  const M = unitSystem === "metric";

  // Edit-mode: react to ?edit=<id> reactively via wouter's useSearch().
  useEffect(() => {
    let cancelled = false;

    function parseEditId(): string | null {
      // Try the reactive search string from wouter first.
      const fromHook = new URLSearchParams(search || "").get("edit");
      if (fromHook) return fromHook;
      // Fallbacks for hash-based routing.
      const fromSearch = new URLSearchParams(window.location.search).get("edit");
      if (fromSearch) return fromSearch;
      const raw = window.location.hash || "";
      const qIdx = raw.indexOf("?");
      if (qIdx < 0) return null;
      return new URLSearchParams(raw.slice(qIdx + 1)).get("edit");
    }

    async function syncFromUrl() {
      const id = parseEditId();
      if (!id) {
        if (cancelled) return;
        setEditId(null);
        setForm(EMPTY_FORM);
        setPhotos([]);
        setIsPrivate(false);
        setSaved(false);
        setErr("");
        return;
      }
      if (!user) return;
      setEditId(id);
      const { data } = await supabase
        .from("yachts")
        .select("*")
        .eq("id", id)
        .eq("owner_id", user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      setForm({
        name: data.name || "",
        type: data.type || "Motor Yacht",
        status: data.status || "Available",
        condition: data.condition || "Used",
        flag: data.flag || "",
        builder: data.builder || "",
        year: data.year ? String(data.year) : "",
        refit: data.refit ? String(data.refit) : "",
        length: data.length || "",
        beam: data.beam || "",
        draft: data.draft || "",
        displacement: data.displacement || "",
        gross_tonnage: data.gross_tonnage || "",
        hull_material: data.hull_material || "Fiberglass",
        hull_type: data.hull_type || "Monohull",
        engines: data.engines || "",
        engine_count: data.engine_count ? String(data.engine_count) : "",
        horse_power: data.horse_power || "",
        fuel_type: data.fuel_type || "Diesel",
        fuel_capacity: data.fuel_capacity || "",
        water_capacity: data.water_capacity || "",
        max_speed: data.max_speed || "",
        cruise_speed: data.cruise_speed || "",
        range: data.range || "",
        cabins: data.cabins != null ? String(data.cabins) : "",
        heads: data.heads != null ? String(data.heads) : "",
        berths: data.berths != null ? String(data.berths) : "",
        crew: data.crew != null ? String(data.crew) : "",
        location: data.location || "",
        price: data.price || "",
        market_price: data.market_price || "",
        distressed_price: data.distressed_price || "",
        image: data.image || "",
        description: data.description || "",
      });
      setIsPrivate(!!data.is_private);
      if (data.photos && Array.isArray(data.photos) && data.photos.length > 0) setPhotos(data.photos);
      else if (data.image) setPhotos([data.image]);
      else if (data.main_image) setPhotos([data.main_image]);
      else setPhotos([]);
    }

    syncFromUrl();
    return () => {
      cancelled = true;
    };
  }, [user, search]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!user) return <Redirect to="/login" />;

  const role = userProfile?.role;
  if (role !== "broker" && role !== "owner" && role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  function setF(key: keyof FormState, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
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
    if (n === null || val.trim() === "") return val;
    return fmtN(n * factor, dec);
  }
  function toggleUnits() {
    const toImp = unitSystem === "metric";
    const f = (factor: number, dec = 1) => (v: string) => conv(v, factor, dec);
    const mToFt = f(3.28084, 1);
    const ftToM = f(1 / 3.28084, 2);
    const lToG = f(0.264172, 0);
    const gToL = f(1 / 0.264172, 0);
    const tToLT = f(0.984207, 1);
    const ltToT = f(1 / 0.984207, 1);
    setForm(prev => ({
      ...prev,
      length:         toImp ? mToFt(prev.length)       : ftToM(prev.length),
      beam:           toImp ? mToFt(prev.beam)         : ftToM(prev.beam),
      draft:          toImp ? mToFt(prev.draft)        : ftToM(prev.draft),
      displacement:   toImp ? tToLT(prev.displacement) : ltToT(prev.displacement),
      fuel_capacity:  toImp ? lToG(prev.fuel_capacity) : gToL(prev.fuel_capacity),
      water_capacity: toImp ? lToG(prev.water_capacity): gToL(prev.water_capacity),
    }));
    setUnitSystem(toImp ? "imperial" : "metric");
  }

  function UnitBadge({ unit }: { unit: string }) {
    return (
      <span className="absolute right-0 top-0 bottom-0 flex items-center px-3 text-[10px] font-bold text-primary/60 border-l border-white/10 pointer-events-none select-none tracking-wider">
        {unit}
      </span>
    );
  }

  async function uploadPhoto(file: File) {
    if (!file.type.startsWith("image/")) { setErr("Only image files are allowed."); return false; }
    if (file.size > 20 * 1024 * 1024) { setErr("Image must be under 20MB."); return false; }
    setErr("");
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch(`${API_BASE}/upload-photo`, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({} as any));
      if (res.ok && json.url) {
        setPhotos(prev => [...prev, json.url]);
        return true;
      }
      const msg = json.error || `Upload failed (HTTP ${res.status}).`;
      setErr(msg);
      return false;
    } catch (e: any) {
      setErr("Upload error: " + (e?.message || "please try again."));
      return false;
    }
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;
    if (photos.length + files.length > 30) {
      setErr("Maximum 30 photos.");
      return;
    }
    setUploading(true);
    for (const f of files) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await uploadPhoto(f);
      if (!ok) break;
    }
    setUploading(false);
  }

  function removePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  }

  async function estimateWithAI() {
    setAiEstimating(true);
    setAiNote(null);
    setErr("");
    try {
      const payload = { ...form, photos };
      const res = await fetch("/api/estimate-market-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setF("market_price", data.market_price);
      setAiNote({ reasoning: data.reasoning, confidence: data.confidence, sources: data.sources });
    } catch (e: unknown) {
      setErr("AI estimate failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setAiEstimating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setErr("Yacht name is required."); return; }
    if (!user) { setErr("You must be signed in to save a yacht."); return; }
    setSaving(true); setErr("");

    const num = (v: string) => v ? parseInt(v) : null;
    const str = (v: string) => v.trim() || null;

    const payload: Record<string, any> = {
      name: form.name.trim(),
      type: str(form.type),
      status: form.status,
      condition: str(form.condition),
      flag: str(form.flag),
      builder: str(form.builder),
      year: num(form.year),
      refit: num(form.refit),
      length: str(form.length),
      beam: str(form.beam),
      draft: str(form.draft),
      displacement: str(form.displacement),
      gross_tonnage: str(form.gross_tonnage),
      hull_material: str(form.hull_material),
      hull_type: str(form.hull_type),
      engines: str(form.engines),
      engine_count: num(form.engine_count),
      horse_power: str(form.horse_power),
      fuel_type: str(form.fuel_type),
      fuel_capacity: str(form.fuel_capacity),
      water_capacity: str(form.water_capacity),
      max_speed: str(form.max_speed),
      cruise_speed: str(form.cruise_speed),
      range: str(form.range),
      cabins: num(form.cabins),
      heads: num(form.heads),
      berths: num(form.berths),
      crew: num(form.crew),
      location: str(form.location),
      price: form.price || null,
      market_price: str(form.market_price),
      distressed_price: str(form.distressed_price),
      image: str(form.image) || (photos[0] ?? null),
      description: str(form.description),
      photos: photos.length > 0 ? photos : null,
      main_image: photos[0] || str(form.image) || null,
      is_private: isPrivate,
      owner_id: user.id,
      is_locked: true,
      deal_status: "none",
    };

    // For NEW listings, insert as 'draft' first, then immediately call the
    // moderation submit endpoint — that flips status to 'pending' AND fires the
    // admin email + audit trail. The owner does NOT have to click another
    // "Submit for Approval" button on the dashboard. For EDITS we never touch
    // listing_status here — once approved, edits go live and must not silently
    // revert to 'draft'.
    if (!editId) {
      payload.listing_status = "draft";
    }

    let error;
    let newId: string | null = null;
    if (editId) {
      ({ error } = await supabase.from("yachts").update(payload).eq("id", editId).eq("owner_id", user.id));
    } else {
      const ins = await supabase.from("yachts").insert([payload]).select("id").single();
      error = ins.error;
      newId = (ins.data as { id?: string } | null)?.id || null;
    }

    if (error) { setErr(error.message); setSaving(false); return; }

    // Auto-submit new listings for admin approval (single-click flow).
    if (!editId && newId) {
      try {
        await yachtModerationApi.submit(newId);
      } catch (e: any) {
        // Non-fatal — listing is saved as draft and the user can resubmit
        // manually from the dashboard if the email/notification step failed.
        console.warn("[AddYacht] auto-submit failed:", e?.message || e);
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate("/dashboard"), 1500);
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <CheckCircle size={40} className="text-primary mx-auto mb-4" />
          <p className="font-display text-2xl text-white mb-2">{editId ? "Listing Updated" : "Listing Submitted"}</p>
          <p className="text-white/40 text-sm font-sans">Redirecting to dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-6">

          {/* Back */}
          <div className="mb-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white text-sm font-sans transition-colors">
              <ArrowLeft size={14} /> Dashboard
            </Link>
          </div>

          <div className="flex items-end justify-between mb-2 gap-4 flex-wrap">
            <h1 className="font-display text-3xl text-white">{editId ? "Edit Listing" : "Add New Listing"}</h1>
            <button
              type="button"
              onClick={toggleUnits}
              className="flex items-center gap-2 border border-white/10 hover:border-primary/50 px-3 py-1.5 transition-colors"
            >
              <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${M ? "text-primary" : "text-white/30"}`}>Metric</span>
              <span className="text-white/20 text-[10px]">/</span>
              <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${!M ? "text-primary" : "text-white/30"}`}>Imperial</span>
            </button>
          </div>
          <p className="text-white/40 text-sm font-sans mb-10">Fill in the yacht details. Only the basic information and the cover photo are visible publicly — everything else is shown to approved members only.</p>

          <form onSubmit={handleSubmit} className="bg-[#0f1d33] border border-white/5 p-6 space-y-6">

            {/* Classification */}
            <div>
              <p className="text-primary text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-white/5 pb-2">Classification</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className={labelCls}>Vessel Name *</label>
                  <input className={inputCls} placeholder="e.g. AURELIA" value={form.name} onChange={e => setF("name", e.target.value)} required />
                </div>
                <div>
                  <label className={labelCls}>Status *</label>
                  <select className={inputCls} value={form.status} onChange={e => setF("status", e.target.value)}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <select className={inputCls} value={form.type} onChange={e => setF("type", e.target.value)}>
                    <option>Motor Yacht</option>
                    <option>Sailing Yacht</option>
                    <option>Catamaran</option>
                    <option>Sport Cruiser</option>
                    <option>Superyacht</option>
                    <option>Mega Yacht</option>
                    <option>Explorer</option>
                    <option>Classic Yacht</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Condition</label>
                  <select className={inputCls} value={form.condition} onChange={e => setF("condition", e.target.value)}>
                    <option>Used</option>
                    <option>New</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Flag / Registration</label>
                  <input className={inputCls} placeholder="e.g. Cayman Islands" value={form.flag} onChange={e => setF("flag", e.target.value)} />
                </div>
                <div className="lg:col-span-2">
                  <label className={labelCls}>Access Control</label>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(v => !v)}
                    className={`flex items-center gap-3 px-4 py-3 border text-sm font-sans transition-all duration-200 ${
                      isPrivate
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-transparent border-white/10 text-white/40 hover:border-white/25 hover:text-white/60"
                    }`}
                  >
                    <div className={`w-8 h-4 rounded-full transition-all duration-200 flex items-center ${isPrivate ? "bg-primary" : "bg-white/10"}`}>
                      <div className={`w-3 h-3 rounded-full bg-white shadow transition-all duration-200 ${isPrivate ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
                    </div>
                    <span className="uppercase tracking-widest text-xs font-bold">
                      {isPrivate ? "Private — Visible only to logged-in users" : "Public — Visible to everyone"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Builder & Year */}
            <div>
              <p className="text-primary text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-white/5 pb-2">Builder & Year</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Builder / Brand</label>
                  <input className={inputCls} placeholder="e.g. Sunseeker" value={form.builder} onChange={e => setF("builder", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Year Built</label>
                  <input className={inputCls} type="number" placeholder="e.g. 2019" value={form.year} onChange={e => setF("year", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Last Refit</label>
                  <input className={inputCls} type="number" placeholder="e.g. 2022" value={form.refit} onChange={e => setF("refit", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <p className="text-primary text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-white/5 pb-2">Dimensions</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className={labelCls}>Length (LOA)</label>
                  <div className="relative">
                    <input className={unitInputCls} placeholder={M ? "38.5" : "126.3"} value={form.length} onChange={e => setF("length", e.target.value)} />
                    <UnitBadge unit={M ? "m" : "ft"} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Beam</label>
                  <div className="relative">
                    <input className={unitInputCls} placeholder={M ? "7.6" : "24.9"} value={form.beam} onChange={e => setF("beam", e.target.value)} />
                    <UnitBadge unit={M ? "m" : "ft"} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Draft</label>
                  <div className="relative">
                    <input className={unitInputCls} placeholder={M ? "1.9" : "6.2"} value={form.draft} onChange={e => setF("draft", e.target.value)} />
                    <UnitBadge unit={M ? "m" : "ft"} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Displacement</label>
                  <div className="relative">
                    <input className={unitInputCls} placeholder={M ? "145" : "142.7"} value={form.displacement} onChange={e => setF("displacement", e.target.value)} />
                    <UnitBadge unit={M ? "t" : "LT"} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Gross Tonnage</label>
                  <div className="relative">
                    <input className={unitInputCls} placeholder="420" value={form.gross_tonnage} onChange={e => setF("gross_tonnage", e.target.value)} />
                    <UnitBadge unit="GT" />
                  </div>
                </div>
              </div>
            </div>

            {/* Hull */}
            <div>
              <p className="text-primary text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-white/5 pb-2">Hull</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Hull Material</label>
                  <select className={inputCls} value={form.hull_material} onChange={e => setF("hull_material", e.target.value)}>
                    <option>Fiberglass</option>
                    <option>Steel</option>
                    <option>Aluminum</option>
                    <option>Composite</option>
                    <option>Wood</option>
                    <option>Ferro-Cement</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Hull Type</label>
                  <select className={inputCls} value={form.hull_type} onChange={e => setF("hull_type", e.target.value)}>
                    <option>Monohull</option>
                    <option>Catamaran</option>
                    <option>Trimaran</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Engines & Fuel */}
            <div>
              <p className="text-primary text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-white/5 pb-2">Engines & Fuel</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Engine Description</label>
                  <input className={inputCls} placeholder="e.g. Twin MTU 16V 2000 M94" value={form.engines} onChange={e => setF("engines", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>No. of Engines</label>
                  <input className={inputCls} type="number" placeholder="2" value={form.engine_count} onChange={e => setF("engine_count", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Total Horsepower</label>
                  <div className="relative">
                    <input className={unitInputCls} placeholder="2 × 1450" value={form.horse_power} onChange={e => setF("horse_power", e.target.value)} />
                    <UnitBadge unit="hp" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Fuel Type</label>
                  <select className={inputCls} value={form.fuel_type} onChange={e => setF("fuel_type", e.target.value)}>
                    <option>Diesel</option>
                    <option>Gasoline</option>
                    <option>Electric</option>
                    <option>Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Fuel Capacity</label>
                  <div className="relative">
                    <input className={unitInputCls} placeholder={M ? "28000" : "7396"} value={form.fuel_capacity} onChange={e => setF("fuel_capacity", e.target.value)} />
                    <UnitBadge unit={M ? "L" : "gal"} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Water Capacity</label>
                  <div className="relative">
                    <input className={unitInputCls} placeholder={M ? "4000" : "1057"} value={form.water_capacity} onChange={e => setF("water_capacity", e.target.value)} />
                    <UnitBadge unit={M ? "L" : "gal"} />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div>
              <p className="text-primary text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-white/5 pb-2">Performance</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Max Speed</label>
                  <div className="relative">
                    <input className={unitInputCls} placeholder="18" value={form.max_speed} onChange={e => setF("max_speed", e.target.value)} />
                    <UnitBadge unit="kn" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Cruise Speed</label>
                  <div className="relative">
                    <input className={unitInputCls} placeholder="14" value={form.cruise_speed} onChange={e => setF("cruise_speed", e.target.value)} />
                    <UnitBadge unit="kn" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Range</label>
                  <div className="relative">
                    <input className={unitInputCls} placeholder="3200" value={form.range} onChange={e => setF("range", e.target.value)} />
                    <UnitBadge unit="nm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Accommodation */}
            <div>
              <p className="text-primary text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-white/5 pb-2">Accommodation</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className={labelCls}>Guest Cabins</label>
                  <input className={inputCls} type="number" placeholder="5" value={form.cabins} onChange={e => setF("cabins", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Heads (Bathrooms)</label>
                  <input className={inputCls} type="number" placeholder="5" value={form.heads} onChange={e => setF("heads", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Berths</label>
                  <input className={inputCls} type="number" placeholder="10" value={form.berths} onChange={e => setF("berths", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Crew Cabins</label>
                  <input className={inputCls} type="number" placeholder="4" value={form.crew} onChange={e => setF("crew", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Location & Pricing */}
            <div>
              <p className="text-primary text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-white/5 pb-2">Location & Pricing</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className={labelCls}>Location</label>
                  <input className={inputCls} placeholder="e.g. Monaco" value={form.location} onChange={e => setF("location", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Asking Price</label>
                  <input className={inputCls} placeholder="€ 12,500,000" value={form.price} onChange={e => setF("price", e.target.value)} />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className={labelCls}>Market Price</label>
                  <div className="flex gap-2">
                    <input
                      className={inputCls + " flex-1 min-w-0"}
                      placeholder="€ 18,000,000"
                      value={form.market_price}
                      onChange={e => { setF("market_price", e.target.value); setAiNote(null); }}
                    />
                    <button
                      type="button"
                      onClick={estimateWithAI}
                      disabled={aiEstimating || !form.name}
                      title={!form.name ? "Enter the yacht name first" : "Search the market for prices and estimate value"}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold tracking-wider uppercase hover:bg-primary/20 hover:border-primary/60 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {aiEstimating
                        ? <span className="w-3.5 h-3.5 border border-primary/40 border-t-primary rounded-full animate-spin" />
                        : <Sparkles size={13} />
                      }
                      {aiEstimating ? "Searching..." : "AI"}
                    </button>
                  </div>
                  {aiEstimating && (
                    <p className="mt-1.5 text-[10px] text-white/30 font-sans">
                      Searching live prices on YachtWorld, RightBoat, TheYachtMarket... (30–60 sec)
                    </p>
                  )}
                  {aiNote && (
                    <div className="mt-2 p-3 bg-primary/5 border border-primary/15 text-xs font-sans space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Sparkles size={10} className="text-primary flex-shrink-0" />
                        <span className="text-primary font-bold uppercase tracking-widest text-[10px]">
                          Estimate based on live market data · Confidence: {aiNote.confidence}
                        </span>
                      </div>
                      <p className="text-white/65 leading-relaxed">{aiNote.reasoning}</p>
                      {aiNote.sources && (
                        <p className="text-white/35 text-[10px] leading-relaxed">
                          Sources: {aiNote.sources}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Distressed Price</label>
                  <input className={inputCls} placeholder="€ 10,000,000" value={form.distressed_price} onChange={e => setF("distressed_price", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Photos & Description */}
            <div>
              <p className="text-primary text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-white/5 pb-2">Photos & Description</p>
              <div className="space-y-4">

                <div>
                  <label className={labelCls}>Photos ({photos.length}/30)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) uploadFiles(files);
                      e.target.value = "";
                    }}
                  />
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setDragOver(false);
                      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
                      if (files.length > 0) uploadFiles(files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-none cursor-pointer transition-colors flex flex-col items-center justify-center py-8 gap-3 ${
                      dragOver ? "border-primary bg-primary/5" : "border-white/10 hover:border-primary/50 hover:bg-white/5"
                    }`}
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={28} className="text-primary animate-spin" />
                        <p className="text-white/50 text-sm font-sans">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Camera size={28} className="text-primary/50" />
                        <div className="text-center">
                          <p className="text-white/70 text-sm font-sans">Drag photos here or <span className="text-primary">click to choose</span></p>
                          <p className="text-white/30 text-xs font-sans mt-1">JPG, PNG, WebP — up to 20 MB each, 30 photos max</p>
                        </div>
                      </>
                    )}
                  </div>

                  {photos.length > 0 && (
                    <>
                      <p className="text-white/30 text-[10px] font-sans mt-3 mb-2 tracking-wider uppercase">Drag to reorder · the first photo is the main one</p>
                      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2">
                        {photos.map((url, i) => (
                          <div
                            key={url + i}
                            draggable
                            onDragStart={() => setDraggedIdx(i)}
                            onDragOver={e => { e.preventDefault(); }}
                            onDrop={e => {
                              e.preventDefault();
                              if (draggedIdx !== null) reorderPhotos(draggedIdx, i);
                              setDraggedIdx(null);
                            }}
                            onDragEnd={() => setDraggedIdx(null)}
                            className={`relative group/thumb aspect-square cursor-move transition-opacity ${
                              draggedIdx === i ? "opacity-40" : "opacity-100"
                            }`}
                          >
                            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />
                            {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-center bg-primary text-background text-[8px] font-bold uppercase tracking-widest py-0.5">Main</span>}
                            {i > 0 && (
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); reorderPhotos(i, i - 1); }}
                                title="Move left"
                                className="absolute top-1 left-1 bg-background/80 hover:bg-primary text-white hover:text-background w-5 h-5 flex items-center justify-center transition-colors z-10"
                              >
                                <ChevronLeft size={12} />
                              </button>
                            )}
                            {i < photos.length - 1 && (
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); reorderPhotos(i, i + 1); }}
                                title="Move right"
                                className="absolute top-1 right-1 bg-background/80 hover:bg-primary text-white hover:text-background w-5 h-5 flex items-center justify-center transition-colors z-10"
                              >
                                <ChevronRight size={12} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); removePhoto(i); }}
                              className="absolute inset-0 bg-background/70 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <X size={14} className="text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className={labelCls}>Image URL (if no photos uploaded)</label>
                  <input className={inputCls} placeholder="https://..." value={form.image} onChange={e => setF("image", e.target.value)} />
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    className={inputCls + " resize-none"}
                    rows={6}
                    value={form.description}
                    onChange={e => setF("description", e.target.value)}
                    placeholder="Full description of the yacht — condition, features, refit history…"
                  />
                </div>
              </div>
            </div>

            {err && <p className="text-red-400 text-sm font-sans">{err}</p>}

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-primary text-background px-8 py-3 font-bold uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : editId ? "Update Listing" : <><Plus size={15} /> Submit Listing</>}
              </button>
              <Link href="/dashboard" className="flex items-center gap-2 border border-white/10 text-white/50 px-6 py-3 font-bold uppercase tracking-widest text-xs hover:border-white/30 hover:text-white/70 transition-colors">
                Cancel
              </Link>
            </div>

          </form>
        </div>
      </div>
    </Layout>
  );
}
