import { useState, useRef, useEffect, Fragment } from "react";
import { Link } from "wouter";
import { ALL_YACHTS, type Yacht } from "@/lib/data";
import { supabase } from "@/lib/supabase";
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
      image: str(form.image) || "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800&q=80",
      description: str(form.description),
    };

    const { error } = await supabase.from("yachts").insert([payload]);
    setSaving(false);
    if (error) {
      setFormError(error.message);
    } else {
      setSuccessMsg("Yacht added to database.");
      setTimeout(() => setSuccessMsg(""), 3000);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this listing from the database?")) return;
    await supabase.from("yachts").delete().eq("id", id);
    load();
  }

  const [expandedPhotoYacht, setExpandedPhotoYacht] = useState<string | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [photoSaving, setPhotoSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BUCKET = "yacht-photos";

  async function ensureBucket() {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error && !error.message.includes("already exists")) throw error;
  }

  async function handleAddPhotoUrl(yacht: Yacht) {
    const url = newPhotoUrl.trim();
    if (!url) return;
    const current: string[] = yacht.photos || [];
    if (current.length >= 30) { setUploadError("Maximum 30 photos per yacht."); return; }
    setPhotoSaving(true);
    setUploadError("");
    await supabase.from("yachts").update({ photos: [...current, url] }).eq("id", yacht.id);
    setNewPhotoUrl("");
    setPhotoSaving(false);
    load();
  }

  async function handleFileUpload(yacht: Yacht, file: File) {
    const current: string[] = yacht.photos || [];
    if (current.length >= 30) { setUploadError("Maximum 30 photos per yacht."); return; }
    setPhotoSaving(true);
    setUploadError("");
    try {
      await ensureBucket();
      const ext = file.name.split(".").pop();
      const path = `${yacht.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = data.publicUrl;
      await supabase.from("yachts").update({ photos: [...current, publicUrl] }).eq("id", yacht.id);
      load();
    } catch (e: any) {
      setUploadError(e.message || "Upload failed. Ensure the 'yacht-photos' bucket exists in Supabase Storage.");
    } finally {
      setPhotoSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemovePhoto(yacht: Yacht, url: string) {
    const updated = (yacht.photos || []).filter(p => p !== url);
    await supabase.from("yachts").update({ photos: updated }).eq("id", yacht.id);
    load();
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
          onClick={() => { setShowForm(s => !s); setFormError(""); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-primary/80 transition-colors"
        >
          <Plus size={14} /> {showForm ? "Cancel" : "Add Yacht"}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#0f1d33] border border-white/5 p-6 mb-6 space-y-6">
          <h2 className="font-display text-lg text-white">New Listing</h2>

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
              <div>
                <label className={labelCls}>Market Price</label>
                <input className={inputCls} placeholder="€ 18,000,000" value={form.market_price} onChange={e => setF("market_price", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Distressed Price</label>
                <input className={inputCls} placeholder="€ 10,000,000" value={form.distressed_price} onChange={e => setF("distressed_price", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Media & Description */}
          <div>
            <p className="text-primary text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-white/5 pb-2">Media & Description</p>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Image URL (leave blank for default)</label>
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
              onClick={handleAdd}
              disabled={saving}
              className="bg-primary text-background px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save to Database"}
            </button>
            <button
              onClick={() => { setShowForm(false); setFormError(""); }}
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
                      <button
                        onClick={() => {
                          setExpandedPhotoYacht(expandedPhotoYacht === yacht.id ? null : yacht.id);
                          setNewPhotoUrl("");
                        }}
                        className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                          expandedPhotoYacht === yacht.id ? "text-primary" : "text-white/40 hover:text-primary"
                        }`}
                      >
                        <Camera size={13} />
                        {(yacht.photos?.length || 0)}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={
                        yacht.status === "Distressed Sale" ? "review" :
                        yacht.status === "Confidential" ? "pending" : "active"
                      } />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(yacht.id)}
                        className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete listing"
                      >
                        <Trash2 size={15} />
                      </button>
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
                                  for (const f of files) await handleFileUpload(yacht, f);
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
