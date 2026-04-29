import { useEffect, useState, useRef, useCallback } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Layout } from "@/components/layout/Layout";
import {
  ArrowLeft, Upload, X, Ship, Plus, CheckCircle, Loader2, PenLine,
} from "lucide-react";
import {
  WordToolbar,
  stylesToCSS,
  loadSpecStyles,
  saveSpecStyles,
  DEFAULT_TOOLBAR_STYLES,
  type ToolbarStyles,
} from "@/components/ui/WordToolbar";

const inp = "w-full bg-[#070f1a] border border-white/10 focus:border-primary/50 px-4 py-3 text-white text-sm focus:outline-none transition-colors placeholder:text-white/20 font-sans";
const lbl = "block text-white/50 text-[10px] uppercase tracking-widest mb-2 font-sans font-bold";
const sel = inp + " cursor-pointer";
const specInp = "w-full bg-[#070f1a] border border-white/10 focus:border-primary/50 px-4 py-3 text-white focus:outline-none transition-colors placeholder:text-white/20 font-sans";

function applyFormatAdd(tag: string, value: string, onChange: (v: string) => void, ref: React.RefObject<HTMLTextAreaElement | HTMLInputElement>) {
  const el = ref.current;
  if (!el) return;
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const baseTag = tag.split(" ")[0];
  const newVal = value.slice(0, start) + `<${tag}>${value.slice(start, end)}</${baseTag}>` + value.slice(end);
  onChange(newVal);
  setTimeout(() => { el.focus(); }, 0);
}

type FormData = {
  name: string;
  builder: string;
  length: string;
  year: string;
  description: string;
  location: string;
  price: string;
  distressed_price: string;
  market_price: string;
  type: string;
  cabins: string;
  crew: string;
  is_private: boolean;
  status: string;
};

const EMPTY: FormData = {
  name: "", builder: "", length: "", year: "", description: "",
  location: "", price: "", distressed_price: "", market_price: "",
  type: "Motor Yacht", cabins: "", crew: "", is_private: false, status: "Available",
};

const YACHT_TYPES = ["Motor Yacht", "Sailing Yacht", "Superyacht", "Mega Yacht", "Explorer", "Sport Cruiser", "Catamaran"];
const STATUSES = ["Available", "Under Offer", "Distressed Sale", "Private Listing"];

export default function AddYacht() {
  const { user, userProfile, loading } = useAuth();
  const [, navigate] = useLocation();

  const [form, setForm] = useState<FormData>(EMPTY);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [specStyles, setSpecStyles] = useState<ToolbarStyles>(loadSpecStyles);
  const specCSS = stylesToCSS(specStyles);
  const handleSpecStyleChange = useCallback((s: ToolbarStyles) => {
    setSpecStyles(s);
    saveSpecStyles(s);
  }, []);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const [descTbStyles, setDescTbStyles] = useState<ToolbarStyles>({ ...DEFAULT_TOOLBAR_STYLES });

  // Check for ?edit=id param
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
    const id = params.get("edit");
    if (id && user) {
      setEditId(id);
      supabase.from("yachts").select("*").eq("id", id).eq("owner_id", user.id).single()
        .then(({ data }) => {
          if (!data) return;
          setForm({
            name: data.name || "",
            builder: data.builder || "",
            length: data.length || "",
            year: data.year || "",
            description: data.description || "",
            location: data.location || "",
            price: data.price || "",
            distressed_price: data.distressed_price || "",
            market_price: data.market_price || "",
            type: data.type || "Motor Yacht",
            cabins: data.cabins != null ? String(data.cabins) : "",
            crew: data.crew != null ? String(data.crew) : "",
            is_private: data.is_private || false,
            status: data.status || "Available",
          });
          if (data.photos) setPhotos(data.photos);
          else if (data.image) setPhotos([data.image]);
          else if (data.main_image) setPhotos([data.main_image]);
        });
    }
  }, [user]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!user) return <Redirect to="/login" />;

  const role = userProfile?.role;
  if (role !== "broker" && role !== "owner" && role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  function setF(key: keyof FormData, val: string | boolean) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function uploadPhoto(file: File) {
    if (!file.type.startsWith("image/")) { setErr("Only image files are allowed."); return; }
    if (file.size > 10 * 1024 * 1024) { setErr("Image must be under 10MB."); return; }
    setUploading(true);
    setErr("");
    try {
      const fd = new FormData();
      // The server (multer) expects the file under the "file" field name —
      // see artifacts/api-server/src/routes/upload.ts. Sending "photo" used
      // to silently fail with "No file provided".
      fd.append("file", file);
      const res = await fetch("/api/upload-photo", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({} as any));
      if (res.ok && json.url) {
        setPhotos(prev => [...prev, json.url]);
      } else {
        const msg = json.error || `Upload failed (HTTP ${res.status}).`;
        console.error("[uploadPhoto] failed:", msg);
        setErr(msg);
      }
    } catch (e: any) {
      console.error("[uploadPhoto] network error:", e);
      setErr("Upload error: " + (e?.message || "please try again."));
    }
    setUploading(false);
  }

  function removePhoto(url: string) {
    setPhotos(prev => prev.filter(p => p !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setErr("Yacht name is required."); return; }
    if (!user) { setErr("You must be signed in to save a yacht."); return; }
    setSaving(true); setErr("");

    const payload: Record<string, any> = {
      name: form.name.trim(),
      builder: form.builder || null,
      length: form.length || null,
      year: form.year || null,
      description: form.description || null,
      location: form.location || null,
      price: form.price || null,
      distressed_price: form.distressed_price || null,
      market_price: form.market_price || null,
      type: form.type,
      cabins: form.cabins ? parseInt(form.cabins) : null,
      crew: form.crew ? parseInt(form.crew) : null,
      is_private: form.is_private,
      status: form.status,
      photos: photos.length > 0 ? photos : null,
      image: photos[0] || null,
      main_image: photos[0] || null,
      owner_id: user.id,
      is_locked: true,
      deal_status: "none",
    };

    // For NEW listings, start as 'draft' so they don't appear publicly until the owner
    // explicitly hits "Submit for Approval" from the dashboard. For EDITS we never touch
    // listing_status here — once the listing is approved, edits go live immediately and
    // must not silently revert to 'draft'.
    if (!editId) {
      payload.listing_status = "draft";
    }

    let error;
    if (editId) {
      ({ error } = await supabase.from("yachts").update(payload).eq("id", editId).eq("owner_id", user.id));
    } else {
      ({ error } = await supabase.from("yachts").insert([payload]));
    }

    if (error) { setErr(error.message); setSaving(false); return; }
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
        <div className="max-w-3xl mx-auto px-6">

          {/* Back */}
          <div className="mb-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white text-sm font-sans transition-colors">
              <ArrowLeft size={14} /> Dashboard
            </Link>
          </div>

          <h1 className="font-display text-3xl text-white mb-2">{editId ? "Edit Listing" : "Add New Listing"}</h1>
          <p className="text-white/40 text-sm font-sans mb-10">Fill in the details. Only builder, length, year and main photo will be publicly visible until access is granted.</p>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Basic Info */}
            <div className="bg-[#0f1d33] border border-white/5 p-6 space-y-5">
              <p className="text-white/30 text-[10px] uppercase tracking-widest font-sans">Vessel Identity</p>

              <div>
                <label className={lbl}>Yacht / Project Name *</label>
                <input className={inp} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="e.g. Project Neptune" required />
              </div>

              <div className="bg-[#0a1426] border border-white/8 p-3 mb-2">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                  <p className="text-primary text-[10px] uppercase tracking-widest font-bold font-sans flex items-center gap-2">
                    <PenLine size={12} />
                    Spec Formatting
                  </p>
                  <WordToolbar
                    mode="style"
                    styles={specStyles}
                    onStyleChange={handleSpecStyleChange}
                    compact
                  />
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={lbl}>Builder</label>
                  <input style={specCSS} className={specInp} value={form.builder} onChange={e => setF("builder", e.target.value)} placeholder="e.g. Feadship" />
                </div>
                <div>
                  <label className={lbl}>Type</label>
                  <select style={specCSS} className={specInp + " cursor-pointer"} value={form.type} onChange={e => setF("type", e.target.value)}>
                    {YACHT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Length Overall</label>
                  <input style={specCSS} className={specInp} value={form.length} onChange={e => setF("length", e.target.value)} placeholder="e.g. 42m" />
                </div>
                <div>
                  <label className={lbl}>Year Built</label>
                  <input style={specCSS} className={specInp} value={form.year} onChange={e => setF("year", e.target.value)} placeholder="e.g. 2018" />
                </div>
                <div>
                  <label className={lbl}>Guest Cabins</label>
                  <input type="number" style={specCSS} className={specInp} value={form.cabins} onChange={e => setF("cabins", e.target.value)} placeholder="e.g. 5" min={0} max={50} />
                </div>
                <div>
                  <label className={lbl}>Crew</label>
                  <input type="number" style={specCSS} className={specInp} value={form.crew} onChange={e => setF("crew", e.target.value)} placeholder="e.g. 8" min={0} max={100} />
                </div>
              </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-[#0f1d33] border border-white/5 p-6 space-y-5">
              <p className="text-white/30 text-[10px] uppercase tracking-widest font-sans">Pricing — Visible to Approved Members Only</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={lbl}>Status</label>
                  <select className={sel} value={form.status} onChange={e => setF("status", e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Asking Price</label>
                  <input className={inp} value={form.price} onChange={e => setF("price", e.target.value)} placeholder="e.g. €12,000,000" />
                </div>
                {form.status === "Distressed Sale" && (
                  <>
                    <div>
                      <label className={lbl}>Market Value</label>
                      <input className={inp} value={form.market_price} onChange={e => setF("market_price", e.target.value)} placeholder="e.g. €18,500,000" />
                    </div>
                    <div>
                      <label className={lbl}>Distressed Price</label>
                      <input className={inp} value={form.distressed_price} onChange={e => setF("distressed_price", e.target.value)} placeholder="e.g. €10,000,000" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Location & Description */}
            <div className="bg-[#0f1d33] border border-white/5 p-6 space-y-5">
              <p className="text-white/30 text-[10px] uppercase tracking-widest font-sans">Details — Visible to Approved Members Only</p>

              <div>
                <label className={lbl}>Current Location</label>
                <input className={inp} value={form.location} onChange={e => setF("location", e.target.value)} placeholder="e.g. Monaco, France" />
              </div>

              <div>
                <label className={lbl}>Description</label>
                <WordToolbar
                  mode="richtext"
                  styles={descTbStyles}
                  onStyleChange={setDescTbStyles}
                  onFormat={tag => applyFormatAdd(tag, form.description, (v) => setF("description", v), descRef as React.RefObject<HTMLTextAreaElement | HTMLInputElement>)}
                />
                <textarea ref={descRef} className={inp + " resize-none"} rows={5} value={form.description} onChange={e => setF("description", e.target.value)} placeholder="Full vessel description, condition notes, notable features, refit history…" />
              </div>
            </div>

            {/* Photos */}
            <div className="bg-[#0f1d33] border border-white/5 p-6 space-y-4">
              <p className="text-white/30 text-[10px] uppercase tracking-widest font-sans">Photos</p>
              <p className="text-white/25 text-xs font-sans">First photo is the main (public) image. All others visible to approved members only.</p>

              {photos.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {photos.map((url, i) => (
                    <div key={url} className="relative group">
                      <img src={url} alt="" className="w-24 h-16 object-cover border border-white/10" />
                      {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-center bg-primary text-background text-[8px] font-bold uppercase tracking-widest py-0.5">Main</span>}
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex items-center gap-3 border border-dashed border-white/15 hover:border-primary/40 px-6 py-4 cursor-pointer transition-colors group">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }}
                  disabled={uploading}
                />
                {uploading ? (
                  <><Loader2 size={16} className="text-primary animate-spin" /><span className="text-white/40 text-sm font-sans">Uploading…</span></>
                ) : (
                  <><Upload size={16} className="text-white/30 group-hover:text-primary transition-colors" /><span className="text-white/40 text-sm font-sans">Click to upload photo</span></>
                )}
              </label>
            </div>

            {/* Visibility */}
            <div className="bg-[#0f1d33] border border-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium mb-1">Private Listing</p>
                  <p className="text-white/30 text-xs font-sans">Private listings are hidden from the general catalogue and only visible to selected members.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setF("is_private", !form.is_private)}
                  className={`relative w-12 h-6 border transition-colors flex-shrink-0 ${form.is_private ? "bg-primary/20 border-primary/50" : "bg-white/5 border-white/10"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 border transition-all ${form.is_private ? "left-6 bg-primary border-primary" : "left-0.5 bg-white/30 border-white/20"}`} />
                </button>
              </div>
            </div>

            {err && <p className="text-red-400 text-sm font-sans">{err}</p>}

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 bg-primary text-background px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : editId ? "Update Listing" : <><Plus size={15} /> Submit Listing</>}
              </button>
              <Link href="/dashboard" className="flex items-center gap-2 border border-white/10 text-white/50 px-6 py-4 font-bold uppercase tracking-widest text-xs hover:border-white/30 hover:text-white/70 transition-colors">
                Cancel
              </Link>
            </div>

          </form>
        </div>
      </div>
    </Layout>
  );
}
