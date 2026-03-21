import { useState, useRef, useEffect, Fragment } from "react";
import { Link } from "wouter";
import { ALL_YACHTS, type Yacht, type YachtDocument } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  LayoutDashboard,
  Ship,
  Lock,
  Users,
  Briefcase,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  TrendingUp,
  Anchor,
  Bell,
  Search,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  PenLine,
  Trash2,
  Camera,
  X,
  Sparkles,
  ImagePlus,
} from "lucide-react";
import { GOOGLE_FONTS } from "@/lib/googleFonts";
import {
  SIZE_OPTIONS,
  PAGE_DEFAULTS,
  getHeroContent,
  saveHeroContent,
  getPageContent,
  savePageContent,
  DEFAULT_FONT_OPTIONS,
  getCustomFonts,
  saveCustomFonts,
  injectGoogleFont,
  HERO_DEFAULTS,
  type CustomFont,
} from "@/lib/content";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "yachts", label: "Yachts", icon: Ship },
  { id: "private", label: "Private Deals", icon: Lock },
  { id: "investors", label: "Investors", icon: Users },
  { id: "brokers", label: "Brokers", icon: Briefcase },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "content", label: "Page Content", icon: PenLine },
  { id: "settings", label: "Settings", icon: Settings },
];

const INVESTOR_REQUESTS = [
  { id: 1, name: "Jean-Pierre Moreau", company: "Moreau Capital", capacity: "€5M–€20M", status: "pending", date: "2026-03-10" },
  { id: 2, name: "Roberto Sforza", company: "Sforza Maritime Invest.", capacity: "€10M+", status: "approved", date: "2026-03-08" },
  { id: 3, name: "Alexandra Voss", company: "Voss Family Office", capacity: "€2M–€8M", status: "approved", date: "2026-03-05" },
  { id: 4, name: "Marcus Chen", company: "Harbour Peak Ventures", capacity: "€15M+", status: "pending", date: "2026-03-03" },
  { id: 5, name: "Sophia Laurent", company: "Laurent & Associés", capacity: "€3M–€10M", status: "review", date: "2026-03-01" },
];

const BROKER_SUBMISSIONS = [
  { id: 1, broker: "Camille Dubois", yacht: "Azimut 72S", year: 2019, length: "22m", price: "€1.8M", status: "active" },
  { id: 2, broker: "Marco Ferrara", yacht: "Pershing 82", year: 2017, length: "25m", price: "€2.1M", status: "review" },
  { id: 3, broker: "Elena Rossi", yacht: "Princess V78", year: 2020, length: "24m", price: "€1.5M", status: "active" },
];

const DOCUMENTS = [
  { id: 1, name: "AURELIA – Technical Survey", type: "Survey", yacht: "AURELIA", date: "2026-02-28", size: "4.2 MB" },
  { id: 2, name: "LADY BLUE – Legal Pack", type: "Legal", yacht: "LADY BLUE", date: "2026-02-25", size: "2.8 MB" },
  { id: 3, name: "OCEANIS – Financial Report", type: "Financial", yacht: "OCEANIS", date: "2026-02-20", size: "1.6 MB" },
  { id: 4, name: "AURELIA – NDA Template", type: "NDA", yacht: "AURELIA", date: "2026-02-15", size: "0.3 MB" },
  { id: 5, name: "STELLA MARIS – Survey", type: "Survey", yacht: "STELLA MARIS", date: "2026-02-10", size: "3.9 MB" },
];

const MESSAGES = [
  { id: 1, from: "Roberto Sforza", subject: "Due diligence on LADY BLUE", preview: "I would like to arrange a technical inspection...", date: "2h ago", read: false },
  { id: 2, from: "Camille Dubois", subject: "New listing submission", preview: "Please find attached the documents for the Sunseeker...", date: "5h ago", read: false },
  { id: 3, from: "Alexandra Voss", subject: "Re: AURELIA — Offer", preview: "We are prepared to move forward at the agreed price...", date: "1d ago", read: true },
  { id: 4, from: "Marcus Chen", subject: "Investor access request", preview: "My family office is actively seeking distressed...", date: "2d ago", read: true },
  { id: 5, from: "Elena Rossi", subject: "Princess V78 documents", preview: "I have uploaded the survey report to the deal room...", date: "3d ago", read: true },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    approved: "bg-green-500/10 text-green-400 border-green-500/20",
    review: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    active: "bg-green-500/10 text-green-400 border-green-500/20",
  };
  const icons: Record<string, JSX.Element> = {
    pending: <Clock size={10} />,
    approved: <CheckCircle size={10} />,
    review: <AlertCircle size={10} />,
    active: <CheckCircle size={10} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${styles[status] || styles.review}`}>
      {icons[status]}
      {status}
    </span>
  );
}

function Dashboard() {
  const stats = [
    { label: "Active Yachts", value: ALL_YACHTS.length, icon: Ship, trend: "+2 this month", color: "text-primary" },
    { label: "Investor Requests", value: INVESTOR_REQUESTS.length, icon: Users, trend: "+3 this week", color: "text-green-400" },
    { label: "Broker Submissions", value: BROKER_SUBMISSIONS.length, icon: Briefcase, trend: "1 pending review", color: "text-blue-400" },
    { label: "Private Deals", value: 3, icon: Lock, trend: "2 active NDAs", color: "text-yellow-400" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white font-bold">Dashboard</h1>
          <p className="text-white/50 text-sm font-sans mt-1">Welcome back, Administrator</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-xs font-sans">March 11, 2026</span>
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary text-xs font-bold">AD</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#0f1d33] border border-white/5 p-6 hover:border-primary/20 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <stat.icon size={20} className={`${stat.color} opacity-80`} />
              <ArrowUpRight size={14} className="text-white/20" />
            </div>
            <p className={`text-4xl font-display font-bold ${stat.color} mb-1`}>{stat.value}</p>
            <p className="text-white/80 text-sm font-sans font-medium mb-1">{stat.label}</p>
            <p className="text-white/40 text-xs font-sans">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Investor Requests */}
        <div className="bg-[#0f1d33] border border-white/5">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="font-display text-lg text-white">Recent Investor Requests</h2>
            <span className="text-primary text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-white transition-colors">View All</span>
          </div>
          <div className="divide-y divide-white/5">
            {INVESTOR_REQUESTS.slice(0, 4).map((req) => (
              <div key={req.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/2 transition-colors">
                <div>
                  <p className="text-white text-sm font-medium font-sans">{req.name}</p>
                  <p className="text-white/40 text-xs font-sans">{req.company} · {req.capacity}</p>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-[#0f1d33] border border-white/5">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="font-display text-lg text-white">Recent Messages</h2>
            <span className="text-primary text-xs font-bold uppercase tracking-wider cursor-pointer hover:text-white transition-colors">View All</span>
          </div>
          <div className="divide-y divide-white/5">
            {MESSAGES.slice(0, 4).map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 px-6 py-4 hover:bg-white/2 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${msg.read ? "bg-white/10" : "bg-primary"}`}></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-sans truncate ${msg.read ? "text-white/60" : "text-white font-medium"}`}>{msg.from}</p>
                    <span className="text-white/30 text-xs flex-shrink-0">{msg.date}</span>
                  </div>
                  <p className="text-white/40 text-xs font-sans truncate">{msg.subject}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function YachtsView() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const EMPTY_FORM = {
    name: "", type: "Motor Yacht", status: "Off-Market", condition: "Used", flag: "",
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
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [formPhotoSaving, setFormPhotoSaving] = useState(false);
  const [formPhotoError, setFormPhotoError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const formFileRef = useRef<HTMLInputElement>(null);
  const [formIsPrivate, setFormIsPrivate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiEstimating, setAiEstimating] = useState(false);
  const [aiNote, setAiNote] = useState<{ reasoning: string; confidence: string; comparables: number; sources?: string } | null>(null);

  async function estimateWithAI() {
    setAiEstimating(true);
    setAiNote(null);
    try {
      const payload = { ...form, photos: formPhotos };
      const res = await fetch("/api/estimate-market-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setF("market_price", data.market_price);
      setAiNote({ reasoning: data.reasoning, confidence: data.confidence, comparables: 0, sources: data.sources });
    } catch (e: unknown) {
      setFormError("AI оценка не удалась: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setAiEstimating(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("yachts").select("*");
    setYachts((data as Yacht[]) || []);
    setLoading(false);
  }

  function setF(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function uploadFilesToServer(files: File[], yachtId = "new"): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      form.append("yachtId", yachtId);
      const res = await fetch("/api/upload-photo", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Upload failed");
      }
      const { url } = await res.json();
      urls.push(url);
    }
    return urls;
  }

  async function handleFormPhotoUpload(files: File[]) {
    if (formPhotos.length + files.length > 30) {
      setFormPhotoError(`Максимум 30 фото. Можно добавить ещё ${30 - formPhotos.length}.`);
      return;
    }
    setFormPhotoSaving(true);
    setFormPhotoError("");
    try {
      const newUrls = await uploadFilesToServer(files, "new");
      setFormPhotos(prev => [...prev, ...newUrls]);
    } catch (e: any) {
      setFormPhotoError(e.message || "Ошибка загрузки");
    } finally {
      setFormPhotoSaving(false);
      if (formFileRef.current) formFileRef.current.value = "";
    }
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.price.trim()) {
      setFormError("Vessel name and asking price are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    const num = (v: string) => v ? parseInt(v) : null;
    const str = (v: string) => v.trim() || null;
    const payload: Record<string, unknown> = {
      name: form.name,
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
      price: form.price,
      market_price: str(form.market_price),
      distressed_price: str(form.distressed_price),
      image: str(form.image) || (formPhotos[0] ?? "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800&q=80"),
      description: str(form.description),
      photos: formPhotos.length > 0 ? formPhotos : null,
      is_private: formIsPrivate,
    };

    const { error } = await supabaseAdmin.from("yachts").insert([payload]);
    setSaving(false);
    if (error) {
      setFormError(error.message);
    } else {
      setSuccessMsg("Yacht added to database.");
      setTimeout(() => setSuccessMsg(""), 3000);
      setForm(EMPTY_FORM);
      setFormPhotos([]);
      setFormIsPrivate(false);
      setShowForm(false);
      load();
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this listing from the database?")) return;
    await supabaseAdmin.from("yachts").delete().eq("id", id);
    load();
  }

  function startEdit(yacht: Yacht) {
    setEditingId(yacht.id);
    setForm({
      name: yacht.name || "",
      type: yacht.type || "Motor Yacht",
      status: yacht.status || "Off-Market",
      condition: yacht.condition || "Used",
      flag: yacht.flag || "",
      builder: yacht.builder || "",
      year: yacht.year ? String(yacht.year) : "",
      refit: yacht.refit ? String(yacht.refit) : "",
      length: yacht.length || "",
      beam: yacht.beam || "",
      draft: yacht.draft || "",
      displacement: yacht.displacement || "",
      gross_tonnage: yacht.gross_tonnage || "",
      hull_material: yacht.hull_material || "Fiberglass",
      hull_type: yacht.hull_type || "Monohull",
      engines: yacht.engines || "",
      engine_count: yacht.engine_count ? String(yacht.engine_count) : "",
      horse_power: yacht.horse_power || "",
      fuel_type: yacht.fuel_type || "Diesel",
      fuel_capacity: yacht.fuel_capacity || "",
      water_capacity: yacht.water_capacity || "",
      max_speed: yacht.max_speed || "",
      cruise_speed: yacht.cruise_speed || "",
      range: yacht.range || "",
      cabins: yacht.cabins ? String(yacht.cabins) : "",
      heads: yacht.heads ? String(yacht.heads) : "",
      berths: yacht.berths ? String(yacht.berths) : "",
      crew: yacht.crew ? String(yacht.crew) : "",
      location: yacht.location || "",
      price: yacht.price || "",
      market_price: yacht.market_price || "",
      distressed_price: yacht.distressed_price || "",
      image: yacht.image || "",
      description: yacht.description || "",
    });
    setFormPhotos(yacht.photos || []);
    setFormIsPrivate(yacht.is_private || false);
    setFormError("");
    setAiNote(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleUpdate() {
    if (!editingId) return;
    if (!form.name.trim() || !form.price.trim()) {
      setFormError("Vessel name and asking price are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    const num = (v: string) => v ? parseInt(v) : null;
    const str = (v: string) => v.trim() || null;
    const payload: Record<string, unknown> = {
      name: form.name,
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
      price: form.price,
      market_price: str(form.market_price),
      distressed_price: str(form.distressed_price),
      image: str(form.image) || (formPhotos[0] ?? null),
      description: str(form.description),
      photos: formPhotos.length > 0 ? formPhotos : null,
      is_private: formIsPrivate,
    };

    const { error } = await supabaseAdmin.from("yachts").update(payload).eq("id", editingId);
    setSaving(false);
    if (error) {
      setFormError(error.message);
    } else {
      setSuccessMsg("Yacht updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
      setForm(EMPTY_FORM);
      setFormPhotos([]);
      setFormIsPrivate(false);
      setEditingId(null);
      setShowForm(false);
      load();
    }
  }

  const [expandedPhotoYacht, setExpandedPhotoYacht] = useState<string | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [photoSaving, setPhotoSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedDocYacht, setExpandedDocYacht] = useState<string | null>(null);
  const [docSaving, setDocSaving] = useState(false);
  const [docError, setDocError] = useState("");
  const docFileRef = useRef<HTMLInputElement>(null);

  const BUCKET = "yacht-photos";

  async function savePhotos(yachtId: string, photos: string[]) {
    await supabaseAdmin.from("yachts").update({ photos }).eq("id", yachtId);
    load();
  }

  async function handleAddPhotoUrl(yacht: Yacht) {
    const url = newPhotoUrl.trim();
    if (!url) return;
    const current: string[] = yacht.photos || [];
    if (current.length >= 30) { setUploadError("Maximum 30 photos per yacht."); return; }
    setPhotoSaving(true);
    setUploadError("");
    await savePhotos(yacht.id, [...current, url]);
    setNewPhotoUrl("");
    setPhotoSaving(false);
  }

  async function handleFileUpload(yacht: Yacht, files: File[]) {
    const current: string[] = yacht.photos || [];
    if (current.length + files.length > 30) {
      setUploadError(`Можно добавить ещё ${30 - current.length} фото — максимум 30.`);
      return;
    }
    setPhotoSaving(true);
    setUploadError("");
    try {
      const newUrls = await uploadFilesToServer(files, yacht.id);
      await savePhotos(yacht.id, [...current, ...newUrls]);
    } catch (e: any) {
      setUploadError(e.message || "Upload failed");
    } finally {
      setPhotoSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemovePhoto(yacht: Yacht, url: string) {
    const updated = (yacht.photos || []).filter(p => p !== url);
    await savePhotos(yacht.id, updated);
  }

  async function saveDocs(yachtId: string, docs: YachtDocument[]) {
    await supabaseAdmin.from("yachts").update({ documents: docs }).eq("id", yachtId);
    load();
  }

  async function handleDocUpload(yacht: Yacht, files: File[]) {
    setDocSaving(true);
    setDocError("");
    try {
      const current: YachtDocument[] = yacht.documents || [];
      const newDocs: YachtDocument[] = [];
      for (const file of files) {
        const ext = (file.name.split(".").pop() || "bin").toUpperCase();
        const fd = new FormData();
        fd.append("file", file);
        fd.append("yachtId", yacht.id);
        fd.append("folder", "docs");
        const res = await fetch("/api/upload-photo", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error || "Upload failed");
        }
        const { url } = await res.json();
        const sizeKB = Math.round(file.size / 1024);
        const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
        newDocs.push({ name: file.name.replace(/\.[^/.]+$/, ""), url, size: sizeStr, type: ext });
      }
      await saveDocs(yacht.id, [...current, ...newDocs]);
    } catch (e: any) {
      setDocError(e.message || "Upload failed");
    } finally {
      setDocSaving(false);
      if (docFileRef.current) docFileRef.current.value = "";
    }
  }

  async function handleRemoveDoc(yacht: Yacht, docUrl: string) {
    const updated = (yacht.documents || []).filter(d => d.url !== docUrl);
    await saveDocs(yacht.id, updated);
  }

  async function handleRenameDoc(yacht: Yacht, docUrl: string, newName: string) {
    const updated = (yacht.documents || []).map(d => d.url === docUrl ? { ...d, name: newName } : d);
    await saveDocs(yacht.id, updated);
  }

  const inputCls = "w-full bg-[#070f1a] border border-white/10 text-white px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-white/20";
  const labelCls = "block text-white/50 text-[10px] uppercase tracking-widest mb-1.5 font-sans";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white font-bold">Yachts</h1>
          <p className="text-white/50 text-sm font-sans mt-1">{loading ? "Loading..." : `${yachts.length} listings in database`}</p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setFormError(""); setEditingId(null); setForm(EMPTY_FORM); setFormPhotos([]); setFormIsPrivate(false); setAiNote(null); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-primary/80 transition-colors"
        >
          <Plus size={14} /> {showForm ? "Cancel" : "Add Yacht"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#0f1d33] border border-white/5 p-6 mb-6 space-y-6">
          <h2 className="font-display text-lg text-white">{editingId ? "Edit Listing" : "New Listing"}</h2>

          {/* Classification */}
          <div>
            <p className="text-primary text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-white/5 pb-2">Classification</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className={labelCls}>Vessel Name *</label>
                <input className={inputCls} placeholder="e.g. AURELIA" value={form.name} onChange={e => setF("name", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Status *</label>
                <select className={inputCls} value={form.status} onChange={e => setF("status", e.target.value)}>
                  <option>Off-Market</option>
                  <option>Distressed Sale</option>
                  <option>Confidential</option>
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
              {/* Private listing toggle */}
              <div className="lg:col-span-2">
                <label className={labelCls}>Access Control</label>
                <button
                  type="button"
                  onClick={() => setFormIsPrivate(v => !v)}
                  className={`flex items-center gap-3 px-4 py-3 border text-sm font-sans transition-all duration-200 ${
                    formIsPrivate
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-transparent border-white/10 text-white/40 hover:border-white/25 hover:text-white/60"
                  }`}
                >
                  <div className={`w-8 h-4 rounded-full transition-all duration-200 flex items-center ${formIsPrivate ? "bg-primary" : "bg-white/10"}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow transition-all duration-200 ${formIsPrivate ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
                  </div>
                  <span className="uppercase tracking-widest text-xs font-bold">
                    {formIsPrivate ? "Private — Visible only to logged-in users" : "Public — Visible to everyone"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Builder */}
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
                <input className={inputCls} placeholder="38.5m" value={form.length} onChange={e => setF("length", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Beam</label>
                <input className={inputCls} placeholder="7.6m" value={form.beam} onChange={e => setF("beam", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Draft</label>
                <input className={inputCls} placeholder="1.9m" value={form.draft} onChange={e => setF("draft", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Displacement</label>
                <input className={inputCls} placeholder="145 t" value={form.displacement} onChange={e => setF("displacement", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Gross Tonnage</label>
                <input className={inputCls} placeholder="420 GT" value={form.gross_tonnage} onChange={e => setF("gross_tonnage", e.target.value)} />
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
                <input className={inputCls} placeholder="e.g. 2 × 1,450 hp" value={form.horse_power} onChange={e => setF("horse_power", e.target.value)} />
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
                <input className={inputCls} placeholder="e.g. 28,000 L" value={form.fuel_capacity} onChange={e => setF("fuel_capacity", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Water Capacity</label>
                <input className={inputCls} placeholder="e.g. 4,000 L" value={form.water_capacity} onChange={e => setF("water_capacity", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Performance */}
          <div>
            <p className="text-primary text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-white/5 pb-2">Performance</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Max Speed</label>
                <input className={inputCls} placeholder="e.g. 18 kn" value={form.max_speed} onChange={e => setF("max_speed", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Cruise Speed</label>
                <input className={inputCls} placeholder="e.g. 14 kn" value={form.cruise_speed} onChange={e => setF("cruise_speed", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Range</label>
                <input className={inputCls} placeholder="e.g. 3,200 nm" value={form.range} onChange={e => setF("range", e.target.value)} />
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
                <label className={labelCls}>Asking Price *</label>
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
                    title={!form.name ? "Сначала введите название яхты" : "Найти цены на рынке и оценить стоимость"}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold tracking-wider uppercase hover:bg-primary/20 hover:border-primary/60 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {aiEstimating
                      ? <span className="w-3.5 h-3.5 border border-primary/40 border-t-primary rounded-full animate-spin" />
                      : <Sparkles size={13} />
                    }
                    {aiEstimating ? "Поиск..." : "AI"}
                  </button>
                </div>
                {aiEstimating && (
                  <p className="mt-1.5 text-[10px] text-white/30 font-sans">
                    Поиск актуальных цен на YachtWorld, RightBoat, TheYachtMarket... (30–60 сек)
                  </p>
                )}
                {aiNote && (
                  <div className="mt-2 p-3 bg-primary/5 border border-primary/15 text-xs font-sans space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Sparkles size={10} className="text-primary flex-shrink-0" />
                      <span className="text-primary font-bold uppercase tracking-widest text-[10px]">
                        Оценка по живым данным рынка · Точность: {aiNote.confidence}
                      </span>
                    </div>
                    <p className="text-white/65 leading-relaxed">{aiNote.reasoning}</p>
                    {aiNote.sources && (
                      <p className="text-white/35 text-[10px] leading-relaxed">
                        Источники: {aiNote.sources}
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

              {/* Drag-and-drop upload zone */}
              <div>
                <label className={labelCls}>Photos ({formPhotos.length}/30)</label>
                <input
                  ref={formFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) handleFormPhotoUpload(files);
                  }}
                />
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragOver(false);
                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
                    if (files.length > 0) handleFormPhotoUpload(files);
                  }}
                  onClick={() => formFileRef.current?.click()}
                  className={`border-2 border-dashed rounded-none cursor-pointer transition-colors flex flex-col items-center justify-center py-8 gap-3 ${
                    dragOver ? "border-primary bg-primary/5" : "border-white/10 hover:border-primary/50 hover:bg-white/2"
                  }`}
                >
                  {formPhotoSaving ? (
                    <>
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-white/50 text-sm font-sans">Загружаю...</p>
                    </>
                  ) : (
                    <>
                      <Camera size={28} className="text-primary/50" />
                      <div className="text-center">
                        <p className="text-white/70 text-sm font-sans">Перетащи фото сюда или <span className="text-primary">нажми для выбора</span></p>
                        <p className="text-white/30 text-xs font-sans mt-1">JPG, PNG, WebP — до 20 МБ каждый, максимум 30 фото</p>
                      </div>
                    </>
                  )}
                </div>
                {formPhotoError && <p className="text-red-400 text-xs font-sans mt-2">{formPhotoError}</p>}

                {/* Preview thumbnails */}
                {formPhotos.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2 mt-3">
                    {formPhotos.map((url, i) => (
                      <div key={i} className="relative group/thumb aspect-square">
                        <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={e => { e.stopPropagation(); setFormPhotos(prev => prev.filter((_, j) => j !== i)); }}
                          className="absolute inset-0 bg-background/70 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Image URL (если нет загруженных фото)</label>
                <input className={inputCls} placeholder="https://..." value={form.image} onChange={e => setF("image", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Confidential notes for qualified buyers..." value={form.description} onChange={e => setF("description", e.target.value)} />
              </div>
            </div>
          </div>

          {formError && <p className="text-red-400 text-xs font-sans">{formError}</p>}
          {successMsg && <p className="text-green-400 text-xs font-sans">{successMsg}</p>}
          <div className="flex gap-3 pt-2">
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              disabled={saving}
              className="bg-primary text-background px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Save Changes" : "Save to Database"}
            </button>
            <button
              onClick={() => { setShowForm(false); setFormError(""); setEditingId(null); setForm(EMPTY_FORM); setFormPhotos([]); setFormIsPrivate(false); setAiNote(null); }}
              className="border border-white/10 text-white/50 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-white/30 hover:text-white/70 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-[#0f1d33] border border-white/5 flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[#0f1d33] border border-white/5">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Vessel</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden md:table-cell">Builder</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden lg:table-cell">Location</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Price</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Photos</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {yachts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-white/30 text-sm font-sans">
                    No listings yet. Click "Add Yacht" to create the first one.
                  </td>
                </tr>
              )}
              {yachts.map((yacht) => (
                <Fragment key={yacht.id}>
                  <tr className="border-b border-white/5 hover:bg-white/2 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 overflow-hidden flex-shrink-0 hidden sm:block">
                          <img src={yacht.image || yacht.photos?.[0]} alt={yacht.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-white font-medium font-sans text-sm">{yacht.name}</p>
                          <p className="text-white/40 text-xs">{yacht.length}{yacht.length && yacht.year ? " · " : ""}{yacht.year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/60 text-sm hidden md:table-cell">{yacht.builder}</td>
                    <td className="px-6 py-4 text-white/60 text-sm hidden lg:table-cell">{yacht.location}</td>
                    <td className="px-6 py-4 text-primary text-sm font-medium">{yacht.price}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setExpandedPhotoYacht(expandedPhotoYacht === yacht.id ? null : yacht.id);
                            setExpandedDocYacht(null);
                            setNewPhotoUrl("");
                            setUploadError("");
                          }}
                          className={`flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            expandedPhotoYacht === yacht.id
                              ? "border-primary text-primary bg-primary/10"
                              : "border-white/10 text-white/50 hover:border-primary hover:text-primary"
                          }`}
                        >
                          <Camera size={11} />
                          {(yacht.photos?.length || 0)} Photos
                        </button>
                        <button
                          onClick={() => {
                            setExpandedDocYacht(expandedDocYacht === yacht.id ? null : yacht.id);
                            setExpandedPhotoYacht(null);
                            setDocError("");
                          }}
                          className={`flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            expandedDocYacht === yacht.id
                              ? "border-primary text-primary bg-primary/10"
                              : "border-white/10 text-white/50 hover:border-primary hover:text-primary"
                          }`}
                        >
                          <FileText size={11} />
                          {(yacht.documents?.length || 0)} Docs
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={
                        yacht.status === "Distressed Sale" ? "review" :
                        yacht.status === "Confidential" ? "pending" : "active"
                      } />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(yacht)}
                          className="text-white/30 hover:text-primary transition-colors"
                          title="Edit listing"
                        >
                          <PenLine size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(yacht.id)}
                          className="text-white/20 hover:text-red-400 transition-colors"
                          title="Delete listing"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Photo management panel */}
                  {expandedPhotoYacht === yacht.id && (
                    <tr>
                      <td colSpan={7} className="bg-[#070f1a] border-b border-white/5 px-6 py-5">
                        <p className="text-primary text-[10px] uppercase tracking-widest font-bold mb-4">
                          Photo Gallery — {yacht.name} ({yacht.photos?.length || 0} / 30)
                        </p>

                        {/* Thumbnail grid */}
                        {yacht.photos && yacht.photos.length > 0 ? (
                          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2 mb-4">
                            {yacht.photos.map((url, i) => (
                              <div key={i} className="relative group/photo aspect-square">
                                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    onClick={() => handleRemovePhoto(yacht, url)}
                                    className="w-6 h-6 bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                                <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] text-white/50 bg-background/50 py-0.5">{i + 1}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-white/20 text-xs font-sans mb-4">No photos yet. Add the first one below.</p>
                        )}

                        {/* Add photo — upload or URL */}
                        {(yacht.photos?.length || 0) < 30 ? (
                          <div className="space-y-2">
                            {/* Row 1: file upload button */}
                            <div className="flex items-center gap-2">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={async e => {
                                  const files = Array.from(e.target.files || []);
                                  if (files.length > 0) await handleFileUpload(yacht, files);
                                }}
                              />
                              <button
                                onClick={() => { setUploadError(""); fileInputRef.current?.click(); }}
                                disabled={photoSaving}
                                className="flex items-center gap-2 border border-primary/50 text-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-background transition-colors disabled:opacity-40 whitespace-nowrap"
                              >
                                <Camera size={13} />
                                {photoSaving ? "Uploading..." : "Upload Files"}
                              </button>
                              <span className="text-white/20 text-xs font-sans">or paste a URL below</span>
                            </div>

                            {/* Row 2: URL paste */}
                            <div className="flex gap-2">
                              <input
                                value={newPhotoUrl}
                                onChange={e => setNewPhotoUrl(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleAddPhotoUrl(yacht)}
                                placeholder="https://example.com/photo.jpg"
                                className="flex-1 bg-background border border-white/10 text-white px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-white/20"
                              />
                              <button
                                onClick={() => handleAddPhotoUrl(yacht)}
                                disabled={photoSaving || !newPhotoUrl.trim()}
                                className="flex items-center gap-2 bg-primary text-background px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-40 whitespace-nowrap"
                              >
                                <ImagePlus size={13} />
                                Add URL
                              </button>
                            </div>

                            {/* Error */}
                            {uploadError && (
                              <p className="text-red-400 text-xs font-sans">{uploadError}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-yellow-400/60 text-xs font-sans">Maximum of 30 photos reached.</p>
                        )}
                      </td>
                    </tr>
                  )}

                  {/* Document management panel */}
                  {expandedDocYacht === yacht.id && (
                    <tr>
                      <td colSpan={7} className="bg-[#070f1a] border-b border-white/5 px-6 py-5">
                        <p className="text-primary text-[10px] uppercase tracking-widest font-bold mb-4">
                          Deal Room Documents — {yacht.name} ({yacht.documents?.length || 0} files)
                        </p>

                        {/* Document list */}
                        {yacht.documents && yacht.documents.length > 0 ? (
                          <div className="border border-white/5 mb-4">
                            {yacht.documents.map((doc, i) => (
                              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/2 group/doc">
                                <FileText size={14} className="text-primary/50 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <input
                                    defaultValue={doc.name}
                                    onBlur={e => {
                                      const newName = e.target.value.trim();
                                      if (newName && newName !== doc.name) handleRenameDoc(yacht, doc.url, newName);
                                    }}
                                    className="bg-transparent text-white/80 text-sm font-sans w-full focus:outline-none focus:text-white border-b border-transparent focus:border-white/20 transition-colors"
                                  />
                                  <p className="text-white/30 text-[10px] font-sans mt-0.5">
                                    {doc.type} {doc.size ? `· ${doc.size}` : ""}
                                  </p>
                                </div>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-white/20 hover:text-primary transition-colors opacity-0 group-hover/doc:opacity-100"
                                  title="Open file"
                                >
                                  <Eye size={14} />
                                </a>
                                <button
                                  onClick={() => handleRemoveDoc(yacht, doc.url)}
                                  className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover/doc:opacity-100"
                                  title="Remove document"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-white/20 text-xs font-sans mb-4">No documents yet. Upload files below.</p>
                        )}

                        {/* Upload documents */}
                        <div className="flex items-center gap-2">
                          <input
                            ref={docFileRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,.png,.jpg"
                            multiple
                            className="hidden"
                            onChange={async e => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 0) await handleDocUpload(yacht, files);
                            }}
                          />
                          <button
                            onClick={() => { setDocError(""); docFileRef.current?.click(); }}
                            disabled={docSaving}
                            className="flex items-center gap-2 border border-primary/50 text-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-background transition-colors disabled:opacity-40 whitespace-nowrap"
                          >
                            <FileText size={13} />
                            {docSaving ? "Uploading..." : "Upload Documents"}
                          </button>
                          <span className="text-white/20 text-xs font-sans">PDF, DOC, XLS, ZIP и другие форматы</span>
                        </div>
                        {docError && <p className="text-red-400 text-xs font-sans mt-2">{docError}</p>}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InvestorsView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white font-bold">Investors</h1>
          <p className="text-white/50 text-sm font-sans mt-1">{INVESTOR_REQUESTS.length} access requests</p>
        </div>
      </div>
      <div className="bg-[#0f1d33] border border-white/5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Name</th>
              <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden md:table-cell">Company</th>
              <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden lg:table-cell">Capacity</th>
              <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Date</th>
              <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {INVESTOR_REQUESTS.map((req) => (
              <tr key={req.id} className="hover:bg-white/2 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-xs font-bold">{req.name.split(" ").map(n => n[0]).join("").slice(0,2)}</span>
                    </div>
                    <p className="text-white font-medium font-sans text-sm">{req.name}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-white/60 text-sm hidden md:table-cell">{req.company}</td>
                <td className="px-6 py-4 text-white/60 text-sm hidden lg:table-cell">{req.capacity}</td>
                <td className="px-6 py-4 text-white/40 text-sm">{req.date}</td>
                <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {req.status === "pending" && (
                      <button className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 font-bold uppercase tracking-wider hover:bg-green-500/20 transition-colors">
                        Approve
                      </button>
                    )}
                    <button className="text-white/30 hover:text-primary transition-colors"><ChevronRight size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BrokersView() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white font-bold">Brokers</h1>
          <p className="text-white/50 text-sm font-sans mt-1">{BROKER_SUBMISSIONS.length} submissions pending</p>
        </div>
      </div>
      <div className="space-y-4">
        {BROKER_SUBMISSIONS.map((sub) => (
          <div key={sub.id} className="bg-[#0f1d33] border border-white/5 hover:border-primary/20 transition-colors p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Ship size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-white font-medium font-sans">{sub.yacht}</p>
                <p className="text-white/40 text-xs">{sub.length} · {sub.year} · Submitted by {sub.broker}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-primary font-medium font-sans text-sm">{sub.price}</p>
              <StatusBadge status={sub.status} />
              <button className="text-white/30 hover:text-primary transition-colors"><Eye size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentsView() {
  const typeColors: Record<string, string> = {
    Survey: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    Legal: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    Financial: "text-green-400 bg-green-500/10 border-green-500/20",
    NDA: "text-primary bg-primary/10 border-primary/20",
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white font-bold">Documents</h1>
          <p className="text-white/50 text-sm font-sans mt-1">{DOCUMENTS.length} documents in deal room</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-primary/80 transition-colors">
          <Plus size={14} /> Upload
        </button>
      </div>
      <div className="bg-[#0f1d33] border border-white/5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Document</th>
              <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden sm:table-cell">Type</th>
              <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden md:table-cell">Yacht</th>
              <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden lg:table-cell">Date</th>
              <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden lg:table-cell">Size</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {DOCUMENTS.map((doc) => (
              <tr key={doc.id} className="hover:bg-white/2 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-white/30 flex-shrink-0" />
                    <p className="text-white font-medium font-sans text-sm">{doc.name}</p>
                  </div>
                </td>
                <td className="px-6 py-4 hidden sm:table-cell">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${typeColors[doc.type] || ""}`}>{doc.type}</span>
                </td>
                <td className="px-6 py-4 text-white/60 text-sm hidden md:table-cell">{doc.yacht}</td>
                <td className="px-6 py-4 text-white/40 text-sm hidden lg:table-cell">{doc.date}</td>
                <td className="px-6 py-4 text-white/40 text-sm hidden lg:table-cell">{doc.size}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-white/30 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MessagesView() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white font-bold">Messages</h1>
        <p className="text-white/50 text-sm font-sans mt-1">{MESSAGES.filter(m => !m.read).length} unread messages</p>
      </div>
      <div className="bg-[#0f1d33] border border-white/5 divide-y divide-white/5">
        {MESSAGES.map((msg) => (
          <div
            key={msg.id}
            onClick={() => setSelected(selected === msg.id ? null : msg.id)}
            className="px-6 py-5 hover:bg-white/2 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${msg.read ? "bg-white/10" : "bg-primary"}`}></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className={`text-sm font-sans ${msg.read ? "text-white/60" : "text-white font-medium"}`}>{msg.from}</p>
                  <span className="text-white/30 text-xs flex-shrink-0">{msg.date}</span>
                </div>
                <p className={`text-sm mb-1 ${msg.read ? "text-white/40" : "text-white/80"}`}>{msg.subject}</p>
                <p className="text-white/40 text-xs line-clamp-1">{msg.preview}</p>
                {selected === msg.id && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-white/60 text-sm leading-relaxed">{msg.preview} We look forward to proceeding with the next steps as discussed. Please confirm availability for a call this week.</p>
                    <div className="flex gap-2 mt-4">
                      <button className="text-xs bg-primary text-primary-foreground px-4 py-2 font-bold uppercase tracking-wider hover:bg-primary/80 transition-colors">Reply</button>
                      <button className="text-xs border border-white/10 text-white/60 px-4 py-2 font-bold uppercase tracking-wider hover:border-white/30 transition-colors">Archive</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivateDealsView() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white font-bold">Private Deals</h1>
        <p className="text-white/50 text-sm font-sans mt-1">Confidential transactions under NDA</p>
      </div>
      <div className="space-y-4">
        {[
          { name: "52m Superyacht", location: "Mediterranean", stage: "Due Diligence", ndas: 3, asking: "Confidential" },
          { name: "Benetti 46m", location: "Monaco", stage: "NDA Signed", ndas: 1, asking: "€22M" },
          { name: "Feadship 58m", location: "Fort Lauderdale", stage: "Offer Received", ndas: 5, asking: "€45M" },
        ].map((deal, i) => (
          <div key={i} className="bg-[#0f1d33] border border-white/5 hover:border-primary/20 transition-colors p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <Lock size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-white font-medium font-sans">{deal.name}</p>
                  <p className="text-white/40 text-xs">{deal.location} · {deal.ndas} NDA{deal.ndas > 1 ? "s" : ""} active</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Asking</p>
                  <p className="text-primary text-sm font-medium">{deal.asking}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Stage</p>
                  <p className="text-white/80 text-sm">{deal.stage}</p>
                </div>
                <button className="text-white/30 hover:text-primary transition-colors"><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function applyFormat(tag: string, value: string, onChange: (v: string) => void, ref: React.RefObject<HTMLTextAreaElement | HTMLInputElement>) {
  const el = ref.current;
  if (!el) return;
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const newVal = value.slice(0, start) + `<${tag}>${value.slice(start, end)}</${tag}>` + value.slice(end);
  onChange(newVal);
  setTimeout(() => { el.focus(); }, 0);
}

const fmtButtons = [
  { tag: "b", label: "B", cls: "font-bold" },
  { tag: "i", label: "I", cls: "italic" },
  { tag: "u", label: "U", cls: "underline" },
];

function FormatBar({ onApply }: { onApply: (tag: string) => void }) {
  return (
    <div className="flex gap-1 mb-1.5">
      {fmtButtons.map(({ tag, label, cls }) => (
        <button
          key={tag}
          type="button"
          onMouseDown={e => { e.preventDefault(); onApply(tag); }}
          className={`bg-[#050c16] border border-white/10 hover:border-primary text-white/60 hover:text-primary w-8 h-8 text-sm transition-colors ${cls}`}
          title={tag === "b" ? "Bold" : tag === "i" ? "Italic" : "Underline"}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function RichTextInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      {label && <label className="block text-white/60 text-xs uppercase tracking-widest mb-2 font-sans">{label}</label>}
      <FormatBar onApply={tag => applyFormat(tag, value, onChange, ref as React.RefObject<HTMLTextAreaElement | HTMLInputElement>)} />
      <input ref={ref} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-background border border-white/10 text-white px-4 py-3 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}

function RichTextArea({ value, onChange, label, rows = 3 }: { value: string; onChange: (v: string) => void; label?: string; rows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <div>
      {label && <label className="block text-white/60 text-xs uppercase tracking-widest mb-2 font-sans">{label}</label>}
      <FormatBar onApply={tag => applyFormat(tag, value, onChange, ref as React.RefObject<HTMLTextAreaElement | HTMLInputElement>)} />
      <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)} rows={rows}
        className="w-full bg-background border border-white/10 text-white px-4 py-3 text-sm font-sans focus:outline-none focus:border-primary transition-colors resize-none"
      />
    </div>
  );
}

function ContentView() {
  const pages = [
    { key: "yachts", label: "Yachts Page" },
    { key: "access", label: "Investor Access Page" },
    { key: "private", label: "Private Deals Page" },
    { key: "brokers", label: "Brokers Page" },
    { key: "dealroom", label: "Deal Room Page" },
  ];
  const [activePage, setActivePage] = useState("yachts");
  const [fields, setFields] = useState(() => getPageContent(activePage));
  const [saved, setSaved] = useState(false);

  const switchPage = (key: string) => {
    setActivePage(key);
    setFields(getPageContent(key));
    setSaved(false);
  };

  const handleSave = () => {
    savePageContent(activePage, fields);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    const defaults = PAGE_DEFAULTS[activePage];
    setFields({ ...defaults });
    savePageContent(activePage, defaults);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white font-bold">Page Content</h1>
        <p className="text-white/50 text-sm font-sans mt-1">Edit headings and subtitles across all public pages</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {pages.map(p => (
          <button
            key={p.key}
            onClick={() => switchPage(p.key)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              activePage === p.key
                ? "bg-primary text-background"
                : "border border-white/10 text-white/50 hover:border-primary hover:text-primary"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="bg-[#0f1d33] border border-white/5 p-6 space-y-4">
        <RichTextInput label="Heading" value={fields.heading} onChange={v => setFields(f => ({ ...f, heading: v }))} />
        <RichTextArea label="Subtitle" value={fields.subheading} onChange={v => setFields(f => ({ ...f, subheading: v }))} rows={3} />
        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} className="bg-primary text-background px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors">
            {saved ? "Saved ✓" : "Save Changes"}
          </button>
          <button onClick={handleReset} className="border border-white/10 text-white/50 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-white/30 hover:text-white/70 transition-colors">
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsView() {
  const init = getHeroContent();
  const [heroTitle, setHeroTitle] = useState(init.title);
  const [heroSubtitle, setHeroSubtitle] = useState(init.subtitle);
  const [titleFont, setTitleFont] = useState(init.titleFont);
  const [titleSize, setTitleSize] = useState(init.titleSize);
  const [saved, setSaved] = useState(false);

  const [customFonts, setCustomFonts] = useState<CustomFont[]>(getCustomFonts);
  const [newFontName, setNewFontName] = useState("");
  const [fontError, setFontError] = useState("");
  const [fontAdded, setFontAdded] = useState(false);

  const fontOptions = [
    ...DEFAULT_FONT_OPTIONS,
    ...customFonts.map(f => ({ label: `${f.name} (Custom)`, value: f.family })),
  ];

  const handleSave = () => {
    saveHeroContent({ title: heroTitle, subtitle: heroSubtitle, titleFont, titleSize });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setHeroTitle(HERO_DEFAULTS.title);
    setHeroSubtitle(HERO_DEFAULTS.subtitle);
    setTitleFont(HERO_DEFAULTS.titleFont);
    setTitleSize(HERO_DEFAULTS.titleSize);
    saveHeroContent(HERO_DEFAULTS);
  };

  const handleAddFont = () => {
    const name = newFontName.trim();
    if (!name) { setFontError("Please enter a font name."); return; }
    if (customFonts.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      setFontError("This font has already been added."); return;
    }
    const family = `'${name}', sans-serif`;
    const updated = [...customFonts, { name, family }];
    saveCustomFonts(updated);
    setCustomFonts(updated);
    injectGoogleFont(name);
    setNewFontName("");
    setFontError("");
    setFontAdded(true);
    setTimeout(() => setFontAdded(false), 2500);
  };

  const handleRemoveFont = (name: string) => {
    const updated = customFonts.filter(f => f.name !== name);
    saveCustomFonts(updated);
    setCustomFonts(updated);
    if (titleFont === `'${name}', sans-serif`) setTitleFont(HERO_DEFAULTS.titleFont);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white font-bold">Settings</h1>
        <p className="text-white/50 text-sm font-sans mt-1">Platform configuration</p>
      </div>

      <div className="space-y-6">
        <div className="bg-[#0f1d33] border border-white/5 p-6">
          <h2 className="font-display text-lg text-white mb-1">Homepage Hero</h2>
          <p className="text-white/40 text-xs mb-6 font-sans">Edit the headline, subtitle, font, and size displayed on the homepage hero.</p>
          <div className="space-y-4">
            <RichTextInput label="Headline" value={heroTitle} onChange={setHeroTitle} />
            <RichTextArea label="Subtitle" value={heroSubtitle} onChange={setHeroSubtitle} rows={3} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-widest mb-2 font-sans">Font</label>
                <select
                  value={titleFont}
                  onChange={e => setTitleFont(e.target.value)}
                  className="w-full bg-background border border-white/10 text-white px-4 py-3 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                >
                  {fontOptions.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-widest mb-2 font-sans">Size</label>
                <select
                  value={titleSize}
                  onChange={e => setTitleSize(e.target.value)}
                  className="w-full bg-background border border-white/10 text-white px-4 py-3 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
                >
                  {SIZE_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} className="bg-primary text-background px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors">
                {saved ? "Saved ✓" : "Save Changes"}
              </button>
              <button onClick={handleReset} className="border border-white/10 text-white/50 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-white/30 hover:text-white/70 transition-colors">
                Reset to Default
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#0f1d33] border border-white/5 p-6">
          <h2 className="font-display text-lg text-white mb-1">Custom Fonts</h2>
          <p className="text-white/40 text-xs mb-6 font-sans">Search from 1,400+ Google Fonts. Start typing to see suggestions, select one, then click Add Font. It becomes available in the Font selector above.</p>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  list="google-fonts-list"
                  value={newFontName}
                  onChange={e => { setNewFontName(e.target.value); setFontError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleAddFont()}
                  placeholder="Search Google Fonts… e.g. Playfair Display"
                  className="w-full bg-background border border-white/10 text-white px-4 py-3 text-sm font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-white/20"
                />
                <datalist id="google-fonts-list">
                  {GOOGLE_FONTS.map(f => <option key={f} value={f} />)}
                </datalist>
              </div>
              <button
                onClick={handleAddFont}
                className="bg-primary text-background px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                {fontAdded ? "Added ✓" : "Add Font"}
              </button>
            </div>
            {fontError && <p className="text-red-400 text-xs font-sans">{fontError}</p>}
            {customFonts.length > 0 && (
              <div className="space-y-2 pt-1">
                {customFonts.map(f => (
                  <div key={f.name} className="flex items-center justify-between bg-background/50 border border-white/5 px-4 py-3">
                    <div>
                      <span className="text-white text-sm font-sans" style={{ fontFamily: f.family }}>{f.name}</span>
                      <span className="text-white/30 text-xs font-sans ml-3">{f.family}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveFont(f.name)}
                      className="text-white/30 hover:text-red-400 text-xs uppercase tracking-widest font-bold font-sans transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            {customFonts.length === 0 && (
              <p className="text-white/20 text-xs font-sans italic">No custom fonts added yet.</p>
            )}
          </div>
        </div>

        <div className="bg-[#0f1d33] border border-white/5 p-6">
          <h2 className="font-display text-lg text-white mb-4">Platform</h2>
          <div className="space-y-4">
            {[
              { label: "Admin Email", value: "admin@pdye.com", desc: "Used for system notifications" },
              { label: "NDA Template", value: "PDYE_NDA_v3.pdf", desc: "Default NDA sent to investors" },
              { label: "Access Mode", value: "Invitation Only", desc: "Controls who can register" },
            ].map((setting, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-white font-medium font-sans text-sm">{setting.label}</p>
                  <p className="text-white/40 text-xs mt-0.5">{setting.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-white/70 text-sm font-mono">{setting.value}</p>
                  <button className="text-xs border border-white/10 text-white/50 px-3 py-1 hover:border-primary hover:text-primary transition-colors font-bold uppercase tracking-wider">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const views: Record<string, JSX.Element> = {
  dashboard: <Dashboard />,
  yachts: <YachtsView />,
  private: <PrivateDealsView />,
  investors: <InvestorsView />,
  brokers: <BrokersView />,
  documents: <DocumentsView />,
  messages: <MessagesView />,
  content: <ContentView />,
  settings: <SettingsView />,
};

export default function Admin() {
  const [activeView, setActiveView] = useState("dashboard");
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#070f1a] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#050c16] border-r border-white/5 flex flex-col">
        <div className="px-6 py-6 border-b border-white/5">
          <Link href="/">
            <div className="flex items-center gap-2 group cursor-pointer">
              <Anchor size={24} className="text-primary group-hover:text-white transition-colors flex-shrink-0" strokeWidth={2} />
              <span className="font-display font-normal text-2xl tracking-widest text-white group-hover:text-primary transition-colors">
                PDYE
              </span>
            </div>
          </Link>
          <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1 font-sans">Admin Console</p>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1 text-sm font-medium transition-all duration-200 text-left group ${
                  active
                    ? "bg-primary/10 text-primary border-l-2 border-primary pl-[10px]"
                    : "text-white/50 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                }`}
              >
                <item.icon size={16} className={active ? "text-primary" : "text-white/40 group-hover:text-white/70"} />
                {item.label}
                {item.id === "messages" && MESSAGES.filter(m => !m.read).length > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {MESSAGES.filter(m => !m.read).length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          <Link href="/">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/40 hover:text-white/70 transition-colors">
              <LogOut size={16} />
              Back to Site
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-white/5 bg-[#070f1a] flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-sm font-sans capitalize">{activeView}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-white/30 hover:text-white transition-colors p-1"
            >
              <Search size={16} />
            </button>
            <button className="relative text-white/30 hover:text-white transition-colors p-1">
              <Bell size={16} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-primary text-xs font-bold">AD</span>
              </div>
              <span className="text-white/60 text-sm hidden sm:block">Administrator</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {views[activeView]}
        </main>
      </div>
    </div>
  );
}
