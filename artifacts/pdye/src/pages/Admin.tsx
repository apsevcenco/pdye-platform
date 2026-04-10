import { useState, useRef, useEffect, Fragment, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { type Yacht, type YachtDocument } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { useAuth } from "@/context/AuthContext";
import { dealRoomApi } from "@/lib/dealRoomApi";
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
  Inbox,
  Phone,
  Mail,
  Building2,
  Calendar,
  Star,
  RefreshCw,
  Menu,
} from "lucide-react";
import { GOOGLE_FONTS } from "@/lib/googleFonts";
import {
  WordToolbar,
  stylesToCSS,
  loadSpecStyles,
  saveSpecStyles,
  DEFAULT_TOOLBAR_STYLES,
  type ToolbarStyles,
} from "@/components/ui/WordToolbar";
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
import {
  SITE_PAGES,
  getSiteSectionData,
  saveSiteSection,
  resetSiteSection,
  type SitePage,
  type SiteSection,
  type SiteTextBlock,
} from "@/lib/siteContent";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "yachts", label: "Yachts", icon: Ship },
  { id: "dealroom", label: "Deal Room", icon: TrendingUp },
  { id: "leads", label: "Leads", icon: Inbox },
  { id: "investors", label: "Private Buyers", icon: Users },
  { id: "brokers", label: "Brokers", icon: Briefcase },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "content", label: "Page Content", icon: PenLine },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "requests-link", label: "Access Requests", icon: CheckCircle, href: "/admin-requests" },
  { id: "users-link", label: "User Management", icon: Users, href: "/admin-users" },
];

type UserRecord = { id: string; email: string; role: string; approved: boolean; created_at: string; company?: string; phone?: string; notes?: string };
type DealRoomDoc = { id: string; deal_room_id: string; uploaded_by: string; file_name: string; file_url: string; file_type?: string; file_size?: number; visible_to_roles?: string[]; created_at: string };
type DealRoomMsg = { id: string; deal_room_id: string; sender_id: string; message: string; is_system: boolean; created_at: string };

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
  const [stats, setStats] = useState({ yachts: 0, buyers: 0, brokers: 0, owners: 0, pendingRequests: 0, dealRooms: 0, leads: 0 });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [yRes, uRes, arRes, lRes, allRooms] = await Promise.all([
          supabaseAdmin.from("yachts").select("*", { count: "exact", head: true }),
          supabaseAdmin.from("users").select("id, email, role, approved"),
          supabaseAdmin.from("access_requests").select("id, requester_id, yacht_id, status, role, created_at").order("created_at", { ascending: false }).limit(5),
          supabaseAdmin.from("leads").select("*", { count: "exact", head: true }),
          dealRoomApi.list().catch(() => []),
        ]);
        const users = (uRes.data || []) as any[];
        setStats({
          yachts: yRes.count || 0,
          buyers: users.filter(u => u.role === "investor" || u.role === "buyer").length,
          brokers: users.filter(u => u.role === "broker").length,
          owners: users.filter(u => u.role === "owner").length,
          pendingRequests: (arRes.data || []).filter((r: any) => r.status === "pending").length,
          dealRooms: (allRooms || []).length,
          leads: lRes.count || 0,
        });
        const reqs = arRes.data || [];
        const reqUserIds = [...new Set(reqs.map((r: any) => r.requester_id))];
        let reqEmails: Record<string, string> = {};
        if (reqUserIds.length) {
          const { data: ru } = await supabaseAdmin.from("users").select("id, email").in("id", reqUserIds);
          (ru || []).forEach((u: any) => { reqEmails[u.id] = u.email; });
        }
        setRecentRequests(reqs.map((r: any) => ({ ...r, email: reqEmails[r.requester_id] || r.requester_id?.slice(0, 8) })));

        let recentMsgs: any[] = [];
        let recentAct: any[] = [];
        if ((allRooms || []).length > 0) {
          const roomIds = (allRooms || []).slice(0, 10).map((r: any) => r.id);
          const [msgsArrays, actArrays] = await Promise.all([
            Promise.all(roomIds.slice(0, 3).map((rid: string) => dealRoomApi.getMessages(rid).catch(() => []))),
            dealRoomApi.getAuditLogs("deal_room", roomIds[0]).catch(() => []),
          ]);
          recentMsgs = msgsArrays.flat().filter((m: any) => !m.is_system).sort((a: any, b: any) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
          recentAct = (actArrays || []).slice(0, 8);
        }
        const msgSenderIds = [...new Set(recentMsgs.map((m: any) => m.sender_id))];
        let senderEmails: Record<string, string> = {};
        if (msgSenderIds.length) {
          const { data: su } = await supabaseAdmin.from("users").select("id, email").in("id", msgSenderIds);
          (su || []).forEach((u: any) => { senderEmails[u.id] = u.email; });
        }
        setRecentMessages(recentMsgs.map((m: any) => ({ ...m, sender_email: senderEmails[m.sender_id] || "System" })));
        setRecentActivity(recentAct);
      } catch (e) {
        console.error("Dashboard load error:", e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const today = new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

  const statItems = [
    { label: "Active Yachts", value: stats.yachts, icon: Ship, color: "text-primary" },
    { label: "Private Buyers", value: stats.buyers, icon: Users, color: "text-green-400" },
    { label: "Brokers", value: stats.brokers, icon: Briefcase, color: "text-blue-400" },
    { label: "Pending Requests", value: stats.pendingRequests, icon: Clock, color: "text-yellow-400" },
    { label: "Deal Rooms", value: stats.dealRooms, icon: TrendingUp, color: "text-purple-400" },
    { label: "Leads", value: stats.leads, icon: Inbox, color: "text-orange-400" },
  ];

  if (loading) return <div className="flex items-center justify-center py-20 text-white/30 text-sm">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white font-bold">Dashboard</h1>
          <p className="text-white/50 text-sm font-sans mt-1">Welcome back, Administrator</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-xs font-sans">{today}</span>
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary text-xs font-bold">AD</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
        {statItems.map((stat, i) => (
          <div key={i} className="bg-[#0f1d33] border border-white/5 p-6 hover:border-primary/20 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <stat.icon size={20} className={`${stat.color} opacity-80`} />
              <ArrowUpRight size={14} className="text-white/20" />
            </div>
            <p className={`text-4xl font-display font-bold ${stat.color} mb-1`}>{stat.value}</p>
            <p className="text-white/80 text-sm font-sans font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#0f1d33] border border-white/5">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="font-display text-lg text-white">Recent Access Requests</h2>
          </div>
          <div className="divide-y divide-white/5">
            {recentRequests.length === 0 ? (
              <div className="px-6 py-8 text-center text-white/30 text-sm">No requests yet</div>
            ) : recentRequests.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/2 transition-colors">
                <div>
                  <p className="text-white text-sm font-medium font-sans">{req.email}</p>
                  <p className="text-white/40 text-xs font-sans">{req.role} · {new Date(req.created_at).toLocaleDateString("ru-RU")}</p>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0f1d33] border border-white/5">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="font-display text-lg text-white">Recent Messages</h2>
          </div>
          <div className="divide-y divide-white/5">
            {recentMessages.length === 0 ? (
              <div className="px-6 py-8 text-center text-white/30 text-sm">No messages yet</div>
            ) : recentMessages.map((msg: any) => (
              <div key={msg.id} className="flex items-start gap-3 px-6 py-4 hover:bg-white/2 transition-colors">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-primary"></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-sans truncate text-white font-medium">{msg.sender_email}</p>
                    <span className="text-white/30 text-xs flex-shrink-0">{new Date(msg.created_at).toLocaleDateString("ru-RU")}</span>
                  </div>
                  <p className="text-white/40 text-xs font-sans truncate">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {recentActivity.length > 0 && (
          <div className="bg-[#0f1d33] border border-white/5 xl:col-span-2">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-display text-lg text-white">Recent Activity</h2>
            </div>
            <div className="divide-y divide-white/5">
              {recentActivity.map((act: any) => (
                <div key={act.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/2 transition-colors">
                  <div>
                    <p className="text-white/80 text-sm font-sans">{act.action.replace(/_/g, " ")}</p>
                    <p className="text-white/30 text-xs">{act.entity_type} · {act.entity_id?.slice(0, 8)}</p>
                  </div>
                  <span className="text-white/30 text-xs">{new Date(act.created_at).toLocaleDateString("ru-RU")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  const [specStyles, setSpecStyles] = useState<ToolbarStyles>(loadSpecStyles);
  const specCSS = stylesToCSS(specStyles);
  const handleSpecStyleChange = useCallback((s: ToolbarStyles) => {
    setSpecStyles(s);
    saveSpecStyles(s);
  }, []);

  const M = unitSystem === "metric";

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

  const unitInputCls = "w-full bg-[#070f1a] border border-white/10 text-white pl-4 pr-14 py-2.5 font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-white/20";
  const specInputCls = "w-full bg-[#070f1a] border border-white/10 text-white px-4 py-2.5 font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-white/20";
  function UnitBadge({ unit }: { unit: string }) {
    return (
      <span className="absolute right-0 top-0 bottom-0 flex items-center px-3 text-[10px] font-bold text-primary/60 border-l border-white/10 pointer-events-none select-none tracking-wider">
        {unit}
      </span>
    );
  }

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

  async function toggleFeatured(id: string, current: boolean) {
    await supabaseAdmin.from("yachts").update({ is_featured: !current }).eq("id", id);
    setYachts(prev => prev.map(y => y.id === id ? { ...y, is_featured: !current } : y));
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
    setUnitSystem("metric");
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
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-white">{editingId ? "Edit Listing" : "New Listing"}</h2>
            <button
              type="button"
              onClick={toggleUnits}
              className="flex items-center gap-2 border border-white/10 hover:border-primary/50 px-3 py-1.5 transition-colors group"
            >
              <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${M ? "text-primary" : "text-white/30"}`}>Metric</span>
              <span className="text-white/20 text-[10px]">/</span>
              <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${!M ? "text-primary" : "text-white/30"}`}>Imperial</span>
            </button>
          </div>

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

          <div className="bg-[#0a1426] border border-white/8 p-4 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-primary text-[10px] uppercase tracking-widest font-bold font-sans flex items-center gap-2">
                <PenLine size={12} />
                Shared Spec Formatting
              </p>
              <WordToolbar
                mode="style"
                styles={specStyles}
                onStyleChange={handleSpecStyleChange}
                compact
              />
            </div>

          {/* Builder */}
          <div>
            <p className="text-primary text-[10px] uppercase tracking-widest font-bold mb-3 border-b border-white/5 pb-2">Builder & Year</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Builder / Brand</label>
                <input style={specCSS} className={specInputCls} placeholder="e.g. Sunseeker" value={form.builder} onChange={e => setF("builder", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Year Built</label>
                <input style={specCSS} className={specInputCls} type="number" placeholder="e.g. 2019" value={form.year} onChange={e => setF("year", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Last Refit</label>
                <input style={specCSS} className={specInputCls} type="number" placeholder="e.g. 2022" value={form.refit} onChange={e => setF("refit", e.target.value)} />
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
                  <input style={specCSS} className={unitInputCls} placeholder={M ? "38.5" : "126.3"} value={form.length} onChange={e => setF("length", e.target.value)} />
                  <UnitBadge unit={M ? "m" : "ft"} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Beam</label>
                <div className="relative">
                  <input style={specCSS} className={unitInputCls} placeholder={M ? "7.6" : "24.9"} value={form.beam} onChange={e => setF("beam", e.target.value)} />
                  <UnitBadge unit={M ? "m" : "ft"} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Draft</label>
                <div className="relative">
                  <input style={specCSS} className={unitInputCls} placeholder={M ? "1.9" : "6.2"} value={form.draft} onChange={e => setF("draft", e.target.value)} />
                  <UnitBadge unit={M ? "m" : "ft"} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Displacement</label>
                <div className="relative">
                  <input style={specCSS} className={unitInputCls} placeholder={M ? "145" : "142.7"} value={form.displacement} onChange={e => setF("displacement", e.target.value)} />
                  <UnitBadge unit={M ? "t" : "LT"} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Gross Tonnage</label>
                <div className="relative">
                  <input style={specCSS} className={unitInputCls} placeholder="420" value={form.gross_tonnage} onChange={e => setF("gross_tonnage", e.target.value)} />
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
                <select style={specCSS} className={specInputCls} value={form.hull_material} onChange={e => setF("hull_material", e.target.value)}>
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
                <select style={specCSS} className={specInputCls} value={form.hull_type} onChange={e => setF("hull_type", e.target.value)}>
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
                <input style={specCSS} className={specInputCls} placeholder="e.g. Twin MTU 16V 2000 M94" value={form.engines} onChange={e => setF("engines", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>No. of Engines</label>
                <input style={specCSS} className={specInputCls} type="number" placeholder="2" value={form.engine_count} onChange={e => setF("engine_count", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Total Horsepower</label>
                <div className="relative">
                  <input style={specCSS} className={unitInputCls} placeholder="2 × 1450" value={form.horse_power} onChange={e => setF("horse_power", e.target.value)} />
                  <UnitBadge unit="hp" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Fuel Type</label>
                <select style={specCSS} className={specInputCls} value={form.fuel_type} onChange={e => setF("fuel_type", e.target.value)}>
                  <option>Diesel</option>
                  <option>Gasoline</option>
                  <option>Electric</option>
                  <option>Hybrid</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Fuel Capacity</label>
                <div className="relative">
                  <input style={specCSS} className={unitInputCls} placeholder={M ? "28000" : "7396"} value={form.fuel_capacity} onChange={e => setF("fuel_capacity", e.target.value)} />
                  <UnitBadge unit={M ? "L" : "gal"} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Water Capacity</label>
                <div className="relative">
                  <input style={specCSS} className={unitInputCls} placeholder={M ? "4000" : "1057"} value={form.water_capacity} onChange={e => setF("water_capacity", e.target.value)} />
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
                  <input style={specCSS} className={unitInputCls} placeholder="18" value={form.max_speed} onChange={e => setF("max_speed", e.target.value)} />
                  <UnitBadge unit="kn" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Cruise Speed</label>
                <div className="relative">
                  <input style={specCSS} className={unitInputCls} placeholder="14" value={form.cruise_speed} onChange={e => setF("cruise_speed", e.target.value)} />
                  <UnitBadge unit="kn" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Range</label>
                <div className="relative">
                  <input style={specCSS} className={unitInputCls} placeholder="3200" value={form.range} onChange={e => setF("range", e.target.value)} />
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
                <input style={specCSS} className={specInputCls} type="number" placeholder="5" value={form.cabins} onChange={e => setF("cabins", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Heads (Bathrooms)</label>
                <input style={specCSS} className={specInputCls} type="number" placeholder="5" value={form.heads} onChange={e => setF("heads", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Berths</label>
                <input style={specCSS} className={specInputCls} type="number" placeholder="10" value={form.berths} onChange={e => setF("berths", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Crew Cabins</label>
                <input style={specCSS} className={specInputCls} type="number" placeholder="4" value={form.crew} onChange={e => setF("crew", e.target.value)} />
              </div>
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
              <RichTextArea
                label="Description"
                value={form.description}
                onChange={v => setF("description", v)}
                rows={3}
              />
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
                <th className="px-6 py-4 text-right">
                  <span className="flex items-center justify-end gap-1 text-white/30 text-[10px] uppercase tracking-wider font-bold">
                    <Star size={10} fill="currentColor" /> Featured
                  </span>
                </th>
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
                      <div className="flex items-center justify-end gap-3">
                        {/* Featured toggle — always visible */}
                        <button
                          onClick={() => toggleFeatured(yacht.id, !!yacht.is_featured)}
                          title={yacht.is_featured ? "Remove from Featured" : "Mark as Featured"}
                          className={`transition-colors ${yacht.is_featured ? "text-primary" : "text-white/15 hover:text-primary/60"}`}
                        >
                          <Star size={15} fill={yacht.is_featured ? "currentColor" : "none"} />
                        </button>
                        {/* Edit / Delete — appear on row hover */}
                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
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

import {
  type DealRoom, type AuditLog,
  DEAL_ROOM_STATUS_CONFIG, DEAL_ROOM_STATUSES,
} from "@/lib/dealTypes";

type RoomWithDetails = DealRoom & {
  yacht_name?: string;
  buyer_email?: string;
  seller_email?: string;
};

function DealsManageView() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithDetails | null>(null);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ buyerEmail: "", sellerEmail: "", yachtId: "", notes: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [yachtOptions, setYachtOptions] = useState<{ id: string; name: string; owner_id: string | null; owner_email?: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: yachts } = await supabase.from("yachts").select("id, name, owner_id").order("name");
      const list = (yachts || []) as { id: string; name: string; owner_id: string | null }[];
      const ownerIds = [...new Set(list.map(y => y.owner_id).filter(Boolean))] as string[];
      let ownerMap: Record<string, string> = {};
      if (ownerIds.length > 0) {
        const { data: owners } = await supabaseAdmin.from("users").select("id, email").in("id", ownerIds);
        ownerMap = Object.fromEntries((owners || []).map((u: any) => [u.id, u.email]));
      }
      setYachtOptions(list.map(y => ({ ...y, owner_email: y.owner_id ? ownerMap[y.owner_id] || "" : "" })));
    })();
  }, []);

  async function createDealRoom() {
    const { buyerEmail, sellerEmail, yachtId, notes } = createForm;
    if (!yachtId) { setCreateError("Please select a yacht."); return; }
    if (!buyerEmail.trim() && !sellerEmail.trim()) { setCreateError("Enter at least one participant email."); return; }
    setCreating(true);
    setCreateError("");

    try {
      let buyerUserId: string | null = null;
      let sellerUserId: string | null = null;

      if (buyerEmail.trim()) {
        const { data: bu } = await supabaseAdmin.from("users").select("id").eq("email", buyerEmail.trim().toLowerCase()).maybeSingle();
        if (!bu) { setCreateError(`Buyer email "${buyerEmail}" not found. The user must register first.`); setCreating(false); return; }
        buyerUserId = bu.id;
      }
      if (sellerEmail.trim()) {
        const { data: su } = await supabaseAdmin.from("users").select("id").eq("email", sellerEmail.trim().toLowerCase()).maybeSingle();
        if (!su) { setCreateError(`Seller email "${sellerEmail}" not found. The user must register first.`); setCreating(false); return; }
        sellerUserId = su.id;
      }

      const room = await dealRoomApi.create({
        yacht_id: yachtId,
        created_by_admin_id: user?.id || "",
        status: "draft",
        buyer_user_id: buyerUserId,
        seller_user_id: sellerUserId,
        nda_required: true,
        notes: notes.trim() || null,
      });

      if (!room?.id) throw new Error("Failed to create room");

      if (buyerUserId) {
        await dealRoomApi.addParticipant(room.id, { user_id: buyerUserId, role: "buyer", side: "buyer", can_view: true, can_message: true, can_download: true });
      }
      if (sellerUserId) {
        await dealRoomApi.addParticipant(room.id, { user_id: sellerUserId, role: "seller", side: "seller", can_view: true, can_message: true, can_download: true });
      }

      await dealRoomApi.sendMessage(room.id, {
        sender_id: user?.id || "",
        message: `Deal room created. ${buyerEmail ? "Buyer: " + buyerEmail + ". " : ""}${sellerEmail ? "Seller: " + sellerEmail + "." : ""}`,
        is_system: true,
      });

      await dealRoomApi.createAuditLog({
        entity_type: "deal_room",
        entity_id: room.id,
        user_id: user?.id || "",
        action: "deal_room_created",
        meta: { buyer_email: buyerEmail || null, seller_email: sellerEmail || null, yacht_id: yachtId },
      });

      setShowCreate(false);
      setCreateForm({ buyerEmail: "", sellerEmail: "", yachtId: "", notes: "" });
      await load();
    } catch (e: any) {
      setCreateError(e.message || "Error creating deal room.");
    }
    setCreating(false);
  }

  async function load() {
    setLoading(true);
    const allRooms = (await dealRoomApi.list({ includeArchived: true })) as DealRoom[];

    if (allRooms.length > 0) {
      const userIds = [...new Set([...allRooms.map(r => r.buyer_user_id), ...allRooms.map(r => r.seller_user_id)].filter(Boolean))];
      const { data: users } = await supabaseAdmin.from("users").select("id, email").in("id", userIds as string[]);
      const userMap = Object.fromEntries((users || []).map((u: any) => [u.id, u.email]));

      const yachtIds = [...new Set(allRooms.map(r => r.yacht_id).filter(Boolean))];
      const { data: yachts } = yachtIds.length > 0
        ? await supabase.from("yachts").select("id, name").in("id", yachtIds)
        : { data: [] };
      const yachtMap = Object.fromEntries((yachts || []).map((y: any) => [y.id, y.name]));

      setRooms(allRooms.map(r => ({
        ...r,
        yacht_name: yachtMap[r.yacht_id] || "Unknown",
        buyer_email: r.buyer_user_id ? userMap[r.buyer_user_id] || "—" : "—",
        seller_email: r.seller_user_id ? userMap[r.seller_user_id] || "—" : "—",
      })));
    } else {
      setRooms([]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function openRoom(room: RoomWithDetails) {
    setSelectedRoom(room);
    setEditNotes(room.notes || "");
    setNotesDirty(false);
    const { data: logs } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .eq("entity_type", "deal_room")
      .eq("entity_id", room.id)
      .order("created_at", { ascending: false });
    setActivity((logs as AuditLog[]) || []);
  }

  async function sendNda(room: RoomWithDetails) {
    setActionLoading(true);
    const now = new Date().toISOString();
    const updates: Record<string, any> = { updated_at: now };
    if (room.buyer_nda_status === "not_sent") {
      updates.buyer_nda_status = "sent";
      updates.buyer_nda_sent_at = now;
    }
    if (room.seller_nda_status === "not_sent" && room.seller_user_id) {
      updates.seller_nda_status = "sent";
      updates.seller_nda_sent_at = now;
    }
    if (room.status === "draft") updates.status = "nda_pending";

    await dealRoomApi.update(room.id, updates);

    if (room.buyer_nda_status === "not_sent") {
      await dealRoomApi.createNdaEnvelope({ deal_room_id: room.id, user_id: room.buyer_user_id, side: "buyer", provider: "internal", status: "sent", sent_at: now });
    }
    if (room.seller_nda_status === "not_sent" && room.seller_user_id) {
      await dealRoomApi.createNdaEnvelope({ deal_room_id: room.id, user_id: room.seller_user_id, side: "seller", provider: "internal", status: "sent", sent_at: now });
    }

    await dealRoomApi.createAuditLog({
      entity_type: "deal_room",
      entity_id: room.id,
      user_id: room.created_by_admin_id || "",
      action: "nda_sent_by_admin",
      meta: { buyer: room.buyer_nda_status === "not_sent", seller: room.seller_nda_status === "not_sent" && !!room.seller_user_id },
    });
    await dealRoomApi.sendMessage(room.id, {
      sender_id: room.created_by_admin_id || "",
      message: "[SIMULATION] NDA documents sent to both parties for review and signature. Participants can sign from their Deal Room → Legal tab.",
      is_system: true,
    });
    setActionLoading(false);
    setSelectedRoom(null);
    load();
  }

  async function closeRoom(room: RoomWithDetails) {
    setActionLoading(true);
    await dealRoomApi.update(room.id, { status: "closed" });
    await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user?.id || "", action: "deal_room_closed", meta: {} });
    setActionLoading(false);
    setSelectedRoom(null);
    load();
  }

  async function cancelRoom(room: RoomWithDetails) {
    if (!confirm("Cancel this deal room?")) return;
    setActionLoading(true);
    await dealRoomApi.update(room.id, { status: "cancelled" });
    await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user?.id || "", action: "deal_room_cancelled", meta: {} });
    setActionLoading(false);
    setSelectedRoom(null);
    load();
  }

  const baseRooms = rooms.filter(r => showArchived ? r.archived : !r.archived);
  const filtered = statusFilter === "all"
    ? baseRooms
    : baseRooms.filter(r => r.status === statusFilter);

  const archivedCount = rooms.filter(r => r.archived).length;

  const statusCounts = baseRooms.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  async function deleteRoom(room: RoomWithDetails) {
    if (!confirm("Permanently delete this deal room and all its data? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      await dealRoomApi.remove(room.id);
      await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user?.id || "", action: "deal_room_deleted", meta: { yacht: room.yacht_name } });
    } catch (e) {}
    setActionLoading(false);
    setSelectedRoom(null);
    load();
  }

  if (selectedRoom) {
    const cfg = DEAL_ROOM_STATUS_CONFIG[selectedRoom.status] || DEAL_ROOM_STATUS_CONFIG.draft;
    const canSendNda = selectedRoom.status === "draft" && (selectedRoom.buyer_nda_status === "not_sent" || (selectedRoom.seller_user_id && selectedRoom.seller_nda_status === "not_sent"));
    const isTerminal = selectedRoom.status === "closed" || selectedRoom.status === "cancelled";
    return (
      <div>
        <button onClick={() => { setSelectedRoom(null); setNotesDirty(false); }} className="text-white/40 hover:text-primary text-sm mb-4 flex items-center gap-1 transition-colors">
          ← Back to Deal Rooms
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl text-white">{selectedRoom.yacht_name}</h1>
            <p className="text-white/40 text-sm font-sans mt-1">Buyer: {selectedRoom.buyer_email} · Seller: {selectedRoom.seller_email}</p>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border ${cfg.color} border-current/20`}>
            {cfg.label}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {[
            { label: "Buyer NDA", value: selectedRoom.buyer_nda_status === "signed" ? "Signed" : selectedRoom.buyer_nda_status === "sent" ? "Sent" : "Not Sent", ok: selectedRoom.buyer_nda_status === "signed" },
            { label: "Seller NDA", value: selectedRoom.seller_nda_status === "signed" ? "Signed" : selectedRoom.seller_nda_status === "sent" ? "Sent" : "Not Sent", ok: selectedRoom.seller_nda_status === "signed" },
            { label: "Room Status", value: cfg.label, ok: selectedRoom.status === "active" },
            { label: "Commission", value: selectedRoom.identities_revealed ? "Fully Signed" : selectedRoom.commission_status === "pending" ? "Pending" : "Not Started", ok: !!selectedRoom.identities_revealed },
            { label: "Activated", value: selectedRoom.fully_activated_at ? new Date(selectedRoom.fully_activated_at).toLocaleDateString("en-GB") : "Pending", ok: !!selectedRoom.fully_activated_at },
            { label: "Identities", value: selectedRoom.identities_revealed ? "Revealed" : "Hidden", ok: !!selectedRoom.identities_revealed },
          ].map(s => (
            <div key={s.label} className="bg-[#0f1d33] border border-white/5 p-3 text-center">
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-sm font-bold ${s.ok ? "text-green-400" : "text-yellow-400"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#0f1d33] border border-white/8 p-5 mb-6">
          <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Deal Room Actions</h3>
          <div className="flex flex-wrap gap-3">
            {canSendNda && (
              <div className="flex flex-col gap-2">
                <div className="bg-yellow-500/5 border border-yellow-500/20 px-3 py-2">
                  <p className="text-yellow-400/70 text-[9px] font-bold uppercase tracking-widest">Simulation — No DocuSign</p>
                  <p className="text-white/30 text-[10px] font-sans">NDA will appear in each participant's Deal Room for internal signing</p>
                </div>
                <button disabled={actionLoading} onClick={() => sendNda(selectedRoom)} className="bg-orange-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-orange-700 disabled:opacity-50 transition-colors">
                  Send NDA (Simulation)
                </button>
              </div>
            )}
            {selectedRoom.status === "active" && selectedRoom.commission_status === "not_started" && (
              <button disabled={actionLoading} onClick={async () => {
                setActionLoading(true);
                await dealRoomApi.sendCommission(selectedRoom.id, user?.id || "");
                await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: selectedRoom.id, user_id: user?.id || "", action: "commission_sent", meta: {} });
                setActionLoading(false);
                setSelectedRoom(null);
                load();
              }} className="bg-purple-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-purple-700 disabled:opacity-50 transition-colors">
                Send Commission Agreement
              </button>
            )}
            {!isTerminal && (
              <button disabled={actionLoading} onClick={() => closeRoom(selectedRoom)} className="border border-white/10 text-white/50 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:border-white/30 disabled:opacity-50 transition-colors">
                Close Room
              </button>
            )}
            {isTerminal && (
              <button disabled={actionLoading} onClick={async () => {
                setActionLoading(true);
                await dealRoomApi.update(selectedRoom.id, { status: "active" });
                await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: selectedRoom.id, user_id: user?.id || "", action: "deal_room_reopened", meta: {} });
                await dealRoomApi.sendMessage(selectedRoom.id, { sender_id: user?.id || "", message: "Deal room has been reopened by admin.", is_system: true });
                setActionLoading(false);
                setSelectedRoom(null);
                load();
              }} className="border border-green-500/30 text-green-400 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-green-500/10 disabled:opacity-50 transition-colors">
                Reopen Room
              </button>
            )}
            <button disabled={actionLoading} onClick={async () => {
              setActionLoading(true);
              const newArchived = !selectedRoom.archived;
              await dealRoomApi.archive(selectedRoom.id, newArchived);
              await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: selectedRoom.id, user_id: user?.id || "", action: newArchived ? "deal_room_archived" : "deal_room_unarchived", meta: {} });
              setActionLoading(false);
              setSelectedRoom(null);
              load();
            }} className="border border-white/5 text-white/30 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:border-white/20 disabled:opacity-50 transition-colors">
              {selectedRoom.archived ? "Unarchive" : "Archive"}
            </button>
            <Link href={`/dealroom/${selectedRoom.id}`} className="border border-primary/30 text-primary px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors">
              Open Full View →
            </Link>
          </div>
        </div>

        <div className="bg-[#0f1d33] border border-white/8 p-5 mb-6">
          <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">Notes</h3>
          <textarea
            value={editNotes}
            onChange={e => { setEditNotes(e.target.value); setNotesDirty(true); }}
            rows={3}
            className="w-full bg-background border border-white/10 focus:border-primary px-4 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder:text-white/20 font-sans resize-none mb-3"
            placeholder="Internal notes about this deal..."
          />
          {notesDirty && <p className="text-orange-400 text-[10px] font-bold uppercase tracking-widest mb-3">Unsaved changes</p>}
        </div>

        <div className="bg-[#0f1d33] border border-white/8 p-5 mb-6">
          <div className="flex items-center justify-between">
            <button
              disabled={!notesDirty || savingNotes}
              onClick={async () => {
                setSavingNotes(true);
                await dealRoomApi.update(selectedRoom.id, { notes: editNotes.trim() || null });
                await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: selectedRoom.id, user_id: user?.id || "", action: "notes_updated", meta: {} });
                setNotesDirty(false);
                setSavingNotes(false);
                setSelectedRoom({ ...selectedRoom, notes: editNotes.trim() || null });
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-colors disabled:opacity-30"
            >
              {savingNotes ? <><RefreshCw size={11} className="animate-spin" /> Saving...</> : <><CheckCircle size={13} /> Save Deal Room Changes</>}
            </button>
            <button
              disabled={actionLoading}
              onClick={() => deleteRoom(selectedRoom)}
              className="flex items-center gap-2 bg-red-600/80 text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <Trash2 size={13} /> Delete Deal Room
            </button>
          </div>
        </div>

        {activity.length > 0 && (
          <div className="bg-[#0f1d33] border border-white/8 p-5">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Audit Log</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {activity.map(log => (
                <div key={log.id} className="flex items-start gap-3 text-xs font-sans">
                  <span className="text-white/20 flex-shrink-0 w-32">
                    {new Date(log.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-primary/60">{log.action.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-white font-bold">Deal Rooms</h1>
          <p className="text-white/50 text-sm font-sans mt-1">{rooms.length} room{rooms.length !== 1 ? "s" : ""} total</p>
        </div>
        <button onClick={() => { setShowCreate(true); setCreateError(""); }} className="flex items-center gap-2 bg-primary text-background px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors">
          <Plus size={14} /> Create Deal Room
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="bg-[#0f1d33] border border-white/10 w-full max-w-lg mx-4 p-0 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="font-display text-xl text-white">Create Deal Room</h2>
              <button onClick={() => setShowCreate(false)} className="text-white/30 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5 font-bold">Yacht *</label>
                <select value={createForm.yachtId} onChange={e => {
                  const yId = e.target.value;
                  const yacht = yachtOptions.find(y => y.id === yId);
                  setCreateForm(f => ({ ...f, yachtId: yId, sellerEmail: yacht?.owner_email || "" }));
                }} className="w-full bg-background border border-white/10 focus:border-primary px-4 py-2.5 text-white text-sm focus:outline-none transition-colors font-sans">
                  <option value="">Select yacht...</option>
                  {yachtOptions.map(y => <option key={y.id} value={y.id}>{y.name}{y.owner_email ? ` — ${y.owner_email}` : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5 font-bold">Buyer Email</label>
                <input type="email" value={createForm.buyerEmail} onChange={e => setCreateForm(f => ({ ...f, buyerEmail: e.target.value }))} className="w-full bg-background border border-white/10 focus:border-primary px-4 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder:text-white/20 font-sans" placeholder="buyer@example.com" />
                <p className="text-white/20 text-[10px] mt-1 font-sans">Must be a registered user</p>
              </div>
              <div>
                <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5 font-bold">Seller Email</label>
                <input type="email" value={createForm.sellerEmail} onChange={e => setCreateForm(f => ({ ...f, sellerEmail: e.target.value }))} className="w-full bg-background border border-white/10 focus:border-primary px-4 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder:text-white/20 font-sans" placeholder="seller@example.com" />
                <p className="text-white/20 text-[10px] mt-1 font-sans">
                  {createForm.yachtId && yachtOptions.find(y => y.id === createForm.yachtId)?.owner_email
                    ? "Auto-filled from yacht owner"
                    : "Must be a registered user (optional — can be added later)"}
                </p>
              </div>
              <div>
                <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5 font-bold">Notes (optional)</label>
                <textarea value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full bg-background border border-white/10 focus:border-primary px-4 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder:text-white/20 font-sans resize-none" placeholder="Internal notes about this deal..." />
              </div>
              {createError && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3 py-2">
                  <AlertCircle size={14} /> {createError}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-white/40 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
              <button onClick={createDealRoom} disabled={creating} className="flex items-center gap-2 bg-primary text-background px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50">
                {creating ? "Creating…" : "Create Room"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button onClick={() => setStatusFilter("all")} className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border transition-colors ${statusFilter === "all" ? "border-primary text-primary" : "border-white/10 text-white/30 hover:border-white/20"}`}>
          All ({baseRooms.length})
        </button>
        {DEAL_ROOM_STATUSES.filter(s => statusCounts[s]).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border transition-colors ${statusFilter === s ? "border-primary text-primary" : "border-white/10 text-white/30 hover:border-white/20"}`}>
            {DEAL_ROOM_STATUS_CONFIG[s].label} ({statusCounts[s]})
          </button>
        ))}
        <div className="ml-auto">
          <button onClick={() => setShowArchived(!showArchived)} className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border transition-colors ${showArchived ? "border-primary text-primary" : "border-white/10 text-white/30 hover:border-white/20"}`}>
            {showArchived ? "Show Active" : `Archived (${archivedCount})`}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/30 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <TrendingUp size={36} className="mb-3 opacity-20" />
          <p className="text-sm">No deal rooms {statusFilter !== "all" ? "with this status" : "yet"}.</p>
          <p className="text-xs text-white/20 mt-2">Create deal rooms from approved access requests.</p>
        </div>
      ) : (
        <div className="bg-[#0f1d33] border border-white/5">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold">Yacht</th>
                <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold hidden md:table-cell">Buyer</th>
                <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold hidden md:table-cell">Seller</th>
                <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold">Buyer NDA</th>
                <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold">Seller NDA</th>
                <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold">Status</th>
                <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold hidden md:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(room => {
                const cfg = DEAL_ROOM_STATUS_CONFIG[room.status] || DEAL_ROOM_STATUS_CONFIG.draft;
                const ndaStyle = (s: string) => s === "signed" ? "text-green-400" : s === "sent" ? "text-orange-400" : "text-white/25";
                return (
                  <tr key={room.id} onClick={() => openRoom(room)} className="hover:bg-white/2 transition-colors cursor-pointer group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium text-sm">{room.yacht_name}</p>
                        {room.room_number && <span className="text-primary/40 text-[10px] font-mono">DR-{String(room.room_number).padStart(6, "0")}</span>}
                        {room.archived && <span className="text-[9px] text-white/20 bg-white/5 px-1 py-0.5">ARC</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-white/50 text-sm hidden md:table-cell">{room.buyer_email}</td>
                    <td className="px-5 py-3.5 text-white/50 text-sm hidden md:table-cell">{room.seller_email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${ndaStyle(room.buyer_nda_status)}`}>
                        {room.buyer_nda_status === "signed" ? "✓ Signed" : room.buyer_nda_status === "sent" ? "Sent" : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${ndaStyle(room.seller_nda_status)}`}>
                        {room.seller_nda_status === "signed" ? "✓ Signed" : room.seller_nda_status === "sent" ? "Sent" : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${cfg.color} border-current/20`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-white/30 text-xs hidden md:table-cell">
                      {new Date(room.created_at).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type Lead = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  yacht_type: string;
  budget: string | null;
  message: string | null;
  created_at: string;
};

const LEAD_TYPE_STYLES: Record<string, string> = {
  "Private Buyer Application": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "Investor Application": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "Broker Application":   "text-purple-400 bg-purple-500/10 border-purple-500/20",
  "Owner Submission":     "text-green-400 bg-green-500/10 border-green-500/20",
};

function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Lead | null>(null);

  useEffect(() => {
    supabaseAdmin
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setLoadErr(error.message);
        setLeads((data as Lead[]) || []);
        setLoading(false);
      });
  }, []);

  const types = ["all", "Private Buyer Application", "Broker Application", "Owner Submission"];
  const filtered = filter === "all" ? leads : leads.filter(l => l.yacht_type === filter);

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-white font-bold">Leads</h1>
            <p className="text-white/50 text-sm font-sans mt-1">{leads.length} incoming requests</p>
          </div>
        </div>

        {loadErr && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            Error: {loadErr}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-white/3 border border-white/8 p-1">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`flex-1 py-2 px-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-150 font-sans ${
                filter === t
                  ? "bg-primary text-[#070f1a]"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {t === "all" ? "All" : t.split(" ")[0]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/30 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <Inbox size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No leads yet</p>
          </div>
        ) : (
          <div className="bg-[#0f1d33] border border-white/5">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold">Name</th>
                  <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold hidden md:table-cell">Type</th>
                  <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold hidden lg:table-cell">Details</th>
                  <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold">Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelected(lead)}
                    className={`cursor-pointer transition-colors group ${
                      selected?.id === lead.id ? "bg-primary/8 border-l-2 border-primary" : "hover:bg-white/2"
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-[11px] font-bold">
                            {lead.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{lead.name}</p>
                          {lead.email && <p className="text-white/40 text-xs">{lead.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${LEAD_TYPE_STYLES[lead.yacht_type] || "text-white/50 bg-white/5 border-white/10"}`}>
                        {lead.yacht_type?.split(" ")[0]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-white/50 text-xs hidden lg:table-cell max-w-[180px] truncate">{lead.budget || "—"}</td>
                    <td className="px-5 py-3.5 text-white/40 text-xs">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString("ru-RU") : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ChevronRight size={14} className="text-white/20 group-hover:text-primary transition-colors ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-80 flex-shrink-0 bg-[#0a1629] border border-white/8 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${LEAD_TYPE_STYLES[selected.yacht_type] || "text-white/50 bg-white/5 border-white/10"}`}>
              {selected.yacht_type}
            </span>
            <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <span className="text-primary text-sm font-bold">
              {selected.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
            </span>
          </div>

          <h2 className="font-display text-xl text-white mb-1">{selected.name}</h2>
          <p className="text-white/40 text-xs mb-5">
            {selected.created_at ? new Date(selected.created_at).toLocaleString("ru-RU") : ""}
          </p>

          <div className="space-y-3">
            {selected.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail size={13} className="text-primary flex-shrink-0" />
                <span className="text-white/70">{selected.email}</span>
              </div>
            )}
            {selected.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={13} className="text-primary flex-shrink-0" />
                <span className="text-white/70">{selected.phone}</span>
              </div>
            )}
          </div>

          {selected.budget && (
            <div className="mt-5 pt-5 border-t border-white/8">
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Details</p>
              <p className="text-white/70 text-sm leading-relaxed">{selected.budget}</p>
            </div>
          )}

          {selected.message && (
            <div className="mt-5 pt-5 border-t border-white/8">
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Message</p>
              <p className="text-white/60 text-sm leading-relaxed">{selected.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InvestorsView() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ company: "", phone: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [requestCounts, setRequestCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabaseAdmin.from("users").select("*").in("role", ["investor", "buyer"]).order("created_at", { ascending: false });
    const u = (data || []) as UserRecord[];
    setUsers(u);
    if (u.length) {
      const { data: reqs } = await supabaseAdmin.from("access_requests").select("requester_id").in("requester_id", u.map(x => x.id));
      const counts: Record<string, number> = {};
      (reqs || []).forEach((r: any) => { counts[r.requester_id] = (counts[r.requester_id] || 0) + 1; });
      setRequestCounts(counts);
    }
    setLoading(false);
  }

  async function toggleApproval(user: UserRecord) {
    await supabaseAdmin.from("users").update({ approved: !user.approved }).eq("id", user.id);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, approved: !u.approved } : u));
    if (selected?.id === user.id) setSelected({ ...user, approved: !user.approved });
  }

  async function saveEdit() {
    if (!selected) return;
    setSaving(true);
    await supabaseAdmin.from("users").update({ company: editForm.company || null, phone: editForm.phone || null, notes: editForm.notes || null }).eq("id", selected.id);
    const updated = { ...selected, ...editForm };
    setUsers(prev => prev.map(u => u.id === selected.id ? updated : u));
    setSelected(updated);
    setEditing(false);
    setSaving(false);
  }

  async function deleteUser(id: string) {
    if (!window.confirm("Remove this user? This cannot be undone.")) return;
    await supabaseAdmin.from("users").delete().eq("id", id);
    setUsers(prev => prev.filter(u => u.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const filtered = filter === "all" ? users : filter === "approved" ? users.filter(u => u.approved) : users.filter(u => !u.approved);
  const initials = (email: string) => email.split("@")[0].slice(0, 2).toUpperCase();

  if (loading) return <div className="flex items-center justify-center py-20 text-white/30 text-sm">Loading…</div>;

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-white font-bold">Private Buyers</h1>
            <p className="text-white/50 text-sm font-sans mt-1">{users.length} registered buyers</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-white/3 border border-white/8 p-1">
          {(["all", "approved", "pending"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-2 px-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-150 font-sans ${filter === f ? "bg-primary text-[#070f1a]" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
              {f === "all" ? `All (${users.length})` : f === "approved" ? `Approved (${users.filter(u => u.approved).length})` : `Pending (${users.filter(u => !u.approved).length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <Users size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No buyers found</p>
          </div>
        ) : (
          <div className="bg-[#0f1d33] border border-white/5">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Email</th>
                  <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden md:table-cell">Company</th>
                  <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden lg:table-cell">Requests</th>
                  <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Registered</th>
                  <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(user => (
                  <tr key={user.id} onClick={() => { setSelected(user); setEditing(false); }} className={`cursor-pointer transition-colors group ${selected?.id === user.id ? "bg-primary/8 border-l-2 border-primary" : "hover:bg-white/2"}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-bold">{initials(user.email)}</span>
                        </div>
                        <p className="text-white font-medium font-sans text-sm">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/60 text-sm hidden md:table-cell">{user.company || "—"}</td>
                    <td className="px-6 py-4 text-white/60 text-sm hidden lg:table-cell">{requestCounts[user.id] || 0}</td>
                    <td className="px-6 py-4 text-white/40 text-sm">{new Date(user.created_at).toLocaleDateString("ru-RU")}</td>
                    <td className="px-6 py-4"><StatusBadge status={user.approved ? "approved" : "pending"} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); toggleApproval(user); }} className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider transition-colors border ${user.approved ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20" : "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"}`}>
                          {user.approved ? "Revoke" : "Approve"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="w-80 flex-shrink-0 bg-[#0a1629] border border-white/8 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <StatusBadge status={selected.approved ? "approved" : "pending"} />
            <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white transition-colors"><X size={16} /></button>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <span className="text-primary text-sm font-bold">{initials(selected.email)}</span>
          </div>
          <h2 className="font-display text-xl text-white mb-1 break-all">{selected.email}</h2>
          <p className="text-white/40 text-xs mb-5">Registered {new Date(selected.created_at).toLocaleString("ru-RU")}</p>

          {!editing ? (
            <>
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-sm"><Mail size={13} className="text-primary flex-shrink-0" /><span className="text-white/70">{selected.email}</span></div>
                {selected.phone && <div className="flex items-center gap-2 text-sm"><Phone size={13} className="text-primary flex-shrink-0" /><span className="text-white/70">{selected.phone}</span></div>}
                {selected.company && <div className="flex items-center gap-2 text-sm"><Building2 size={13} className="text-primary flex-shrink-0" /><span className="text-white/70">{selected.company}</span></div>}
              </div>
              {selected.notes && (
                <div className="mb-5 pt-5 border-t border-white/8">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Notes</p>
                  <p className="text-white/60 text-sm leading-relaxed">{selected.notes}</p>
                </div>
              )}
              <div className="pt-5 border-t border-white/8">
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Access Requests</p>
                <p className="text-primary font-bold text-lg">{requestCounts[selected.id] || 0}</p>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => { setEditForm({ company: selected.company || "", phone: selected.phone || "", notes: selected.notes || "" }); setEditing(true); }} className="text-xs bg-primary text-primary-foreground px-4 py-2 font-bold uppercase tracking-wider hover:bg-primary/80 transition-colors">Edit</button>
                <button onClick={() => toggleApproval(selected)} className={`text-xs px-4 py-2 font-bold uppercase tracking-wider transition-colors border ${selected.approved ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10" : "border-green-500/30 text-green-400 hover:bg-green-500/10"}`}>
                  {selected.approved ? "Revoke" : "Approve"}
                </button>
                <button onClick={() => deleteUser(selected.id)} className="text-xs border border-red-500/30 text-red-400 px-3 py-2 font-bold uppercase tracking-wider hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Company</label>
                <input value={editForm.company} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} className="w-full bg-[#070f1a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Phone</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-[#070f1a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Notes</label>
                <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={4} className="w-full bg-[#070f1a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving} className="text-xs bg-primary text-primary-foreground px-4 py-2 font-bold uppercase tracking-wider hover:bg-primary/80 transition-colors disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
                <button onClick={() => setEditing(false)} className="text-xs border border-white/10 text-white/60 px-4 py-2 font-bold uppercase tracking-wider hover:border-white/30 transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BrokersView() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ company: "", phone: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabaseAdmin.from("users").select("*").eq("role", "broker").order("created_at", { ascending: false });
    const u = (data || []) as UserRecord[];
    setUsers(u);
    setLoading(false);
  }

  async function toggleApproval(user: UserRecord) {
    await supabaseAdmin.from("users").update({ approved: !user.approved }).eq("id", user.id);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, approved: !u.approved } : u));
    if (selected?.id === user.id) setSelected({ ...user, approved: !user.approved });
  }

  async function saveEdit() {
    if (!selected) return;
    setSaving(true);
    await supabaseAdmin.from("users").update({ company: editForm.company || null, phone: editForm.phone || null, notes: editForm.notes || null }).eq("id", selected.id);
    const updated = { ...selected, ...editForm };
    setUsers(prev => prev.map(u => u.id === selected.id ? updated : u));
    setSelected(updated);
    setEditing(false);
    setSaving(false);
  }

  async function deleteUser(id: string) {
    if (!window.confirm("Remove this broker? This cannot be undone.")) return;
    await supabaseAdmin.from("users").delete().eq("id", id);
    setUsers(prev => prev.filter(u => u.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const initials = (email: string) => email.split("@")[0].slice(0, 2).toUpperCase();

  if (loading) return <div className="flex items-center justify-center py-20 text-white/30 text-sm">Loading…</div>;

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-white font-bold">Brokers</h1>
            <p className="text-white/50 text-sm font-sans mt-1">{users.length} registered brokers</p>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <Briefcase size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No brokers registered</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} onClick={() => { setSelected(user); setEditing(false); }} className={`bg-[#0f1d33] border hover:border-primary/20 transition-colors p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${selected?.id === user.id ? "border-primary/30 bg-primary/5" : "border-white/5"}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 rounded-full">
                    <span className="text-primary text-xs font-bold">{initials(user.email)}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium font-sans text-sm">{user.email}</p>
                    <p className="text-white/40 text-xs">{user.company || "No company"} · Registered {new Date(user.created_at).toLocaleDateString("ru-RU")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={user.approved ? "approved" : "pending"} />
                  <button onClick={e => { e.stopPropagation(); toggleApproval(user); }} className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider transition-colors border ${user.approved ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"}`}>
                    {user.approved ? "Revoke" : "Approve"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="w-80 flex-shrink-0 bg-[#0a1629] border border-white/8 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <StatusBadge status={selected.approved ? "approved" : "pending"} />
            <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white transition-colors"><X size={16} /></button>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <span className="text-primary text-sm font-bold">{initials(selected.email)}</span>
          </div>
          <h2 className="font-display text-xl text-white mb-1 break-all">{selected.email}</h2>
          <p className="text-white/40 text-xs mb-5">Registered {new Date(selected.created_at).toLocaleString("ru-RU")}</p>

          {!editing ? (
            <>
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-sm"><Mail size={13} className="text-primary flex-shrink-0" /><span className="text-white/70">{selected.email}</span></div>
                {selected.phone && <div className="flex items-center gap-2 text-sm"><Phone size={13} className="text-primary flex-shrink-0" /><span className="text-white/70">{selected.phone}</span></div>}
                {selected.company && <div className="flex items-center gap-2 text-sm"><Building2 size={13} className="text-primary flex-shrink-0" /><span className="text-white/70">{selected.company}</span></div>}
              </div>
              {selected.notes && (
                <div className="mb-5 pt-5 border-t border-white/8">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Notes</p>
                  <p className="text-white/60 text-sm leading-relaxed">{selected.notes}</p>
                </div>
              )}
              <div className="flex gap-2 mt-5">
                <button onClick={() => { setEditForm({ company: selected.company || "", phone: selected.phone || "", notes: selected.notes || "" }); setEditing(true); }} className="text-xs bg-primary text-primary-foreground px-4 py-2 font-bold uppercase tracking-wider hover:bg-primary/80 transition-colors">Edit</button>
                <button onClick={() => deleteUser(selected.id)} className="text-xs border border-red-500/30 text-red-400 px-3 py-2 font-bold uppercase tracking-wider hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Company</label>
                <input value={editForm.company} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} className="w-full bg-[#070f1a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Phone</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-[#070f1a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Notes</label>
                <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={4} className="w-full bg-[#070f1a] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving} className="text-xs bg-primary text-primary-foreground px-4 py-2 font-bold uppercase tracking-wider hover:bg-primary/80 transition-colors disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
                <button onClick={() => setEditing(false)} className="text-xs border border-white/10 text-white/60 px-4 py-2 font-bold uppercase tracking-wider hover:border-white/30 transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentsView() {
  const [docs, setDocs] = useState<DealRoomDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploaderEmails, setUploaderEmails] = useState<Record<string, string>>({});
  const [dealRoomNames, setDealRoomNames] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const d = (await dealRoomApi.listAllDocuments().catch(() => [])) as DealRoomDoc[];
      setDocs(d);

      const uploaderIds = [...new Set(d.map(x => x.uploaded_by).filter(Boolean))];
      if (uploaderIds.length) {
        const { data: users } = await supabaseAdmin.from("users").select("id, email").in("id", uploaderIds);
        const map: Record<string, string> = {};
        (users || []).forEach((u: any) => { map[u.id] = u.email; });
        setUploaderEmails(map);
      }

      const roomIds = [...new Set(d.map(x => x.deal_room_id))];
      if (roomIds.length) {
        const allRooms = await dealRoomApi.list().catch(() => []);
        const roomMap = Object.fromEntries((allRooms || []).map((r: any) => [r.id, r]));
        const relevantRooms = roomIds.map(id => roomMap[id]).filter(Boolean);
        const yachtIds = [...new Set(relevantRooms.map((r: any) => r.yacht_id).filter(Boolean))];
        let yachtNames: Record<string, string> = {};
        if (yachtIds.length) {
          const { data: yachts } = await supabaseAdmin.from("yachts").select("id, name").in("id", yachtIds);
          (yachts || []).forEach((y: any) => { yachtNames[y.id] = y.name; });
        }
        const rn: Record<string, string> = {};
        relevantRooms.forEach((r: any) => { rn[r.id] = yachtNames[r.yacht_id] || r.id.slice(0, 8); });
        setDealRoomNames(rn);
      }

      setLoading(false);
    }
    load();
  }, []);

  async function deleteDoc(id: string) {
    if (!window.confirm("Delete this document?")) return;
    await dealRoomApi.deleteDocument(id);
    setDocs(prev => prev.filter(d => d.id !== id));
  }

  function fmtSize(bytes?: number) {
    if (!bytes) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-white/30 text-sm">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white font-bold">Documents</h1>
          <p className="text-white/50 text-sm font-sans mt-1">{docs.length} documents across all deal rooms</p>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <FileText size={36} className="mb-3 opacity-30" />
          <p className="text-sm">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="bg-[#0f1d33] border border-white/5">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Document</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden sm:table-cell">Deal Room</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden md:table-cell">Uploaded By</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden lg:table-cell">Date</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden lg:table-cell">Size</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {docs.map(doc => (
                <tr key={doc.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-white/30 flex-shrink-0" />
                      <p className="text-white font-medium font-sans text-sm">{doc.file_name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/60 text-sm hidden sm:table-cell">{dealRoomNames[doc.deal_room_id] || doc.deal_room_id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-white/60 text-sm hidden md:table-cell">{uploaderEmails[doc.uploaded_by] || "—"}</td>
                  <td className="px-6 py-4 text-white/40 text-sm hidden lg:table-cell">{new Date(doc.created_at).toLocaleDateString("ru-RU")}</td>
                  <td className="px-6 py-4 text-white/40 text-sm hidden lg:table-cell">{fmtSize(doc.file_size)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-primary transition-colors"><Eye size={16} /></a>
                      )}
                      <button onClick={() => deleteDoc(doc.id)} className="text-white/30 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MessagesView() {
  const [messages, setMessages] = useState<DealRoomMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [senderEmails, setSenderEmails] = useState<Record<string, string>>({});
  const [dealRoomNames, setDealRoomNames] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "user" | "system">("all");

  useEffect(() => {
    async function load() {
      const msgs = (await dealRoomApi.listAllMessages().catch(() => [])) as DealRoomMsg[];
      setMessages(msgs);

      const senderIds = [...new Set(msgs.map(m => m.sender_id).filter(Boolean))];
      if (senderIds.length) {
        const { data: users } = await supabaseAdmin.from("users").select("id, email").in("id", senderIds);
        const map: Record<string, string> = {};
        (users || []).forEach((u: any) => { map[u.id] = u.email; });
        setSenderEmails(map);
      }

      const roomIds = [...new Set(msgs.map(m => m.deal_room_id))];
      if (roomIds.length) {
        const allRooms = await dealRoomApi.list().catch(() => []);
        const roomMap = Object.fromEntries((allRooms || []).map((r: any) => [r.id, r]));
        const relevantRooms = roomIds.map(id => roomMap[id]).filter(Boolean);
        const yachtIds = [...new Set(relevantRooms.map((r: any) => r.yacht_id).filter(Boolean))];
        let yNames: Record<string, string> = {};
        if (yachtIds.length) {
          const { data: yachts } = await supabaseAdmin.from("yachts").select("id, name").in("id", yachtIds);
          (yachts || []).forEach((y: any) => { yNames[y.id] = y.name; });
        }
        const rn: Record<string, string> = {};
        relevantRooms.forEach((r: any) => { rn[r.id] = yNames[r.yacht_id] || r.id.slice(0, 8); });
        setDealRoomNames(rn);
      }

      setLoading(false);
    }
    load();
  }, []);

  async function deleteMsg(id: string) {
    if (!window.confirm("Delete this message?")) return;
    await dealRoomApi.deleteMessage(id);
    setMessages(prev => prev.filter(m => m.id !== id));
  }

  const filtered = filter === "all" ? messages : filter === "system" ? messages.filter(m => m.is_system) : messages.filter(m => !m.is_system);

  if (loading) return <div className="flex items-center justify-center py-20 text-white/30 text-sm">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-white font-bold">Messages</h1>
          <p className="text-white/50 text-sm font-sans mt-1">{messages.length} messages across deal rooms</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white/3 border border-white/8 p-1">
        {(["all", "user", "system"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-2 px-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-150 font-sans ${filter === f ? "bg-primary text-[#070f1a]" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
            {f === "all" ? `All (${messages.length})` : f === "user" ? `User (${messages.filter(m => !m.is_system).length})` : `System (${messages.filter(m => m.is_system).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <MessageSquare size={36} className="mb-3 opacity-30" />
          <p className="text-sm">No messages yet</p>
        </div>
      ) : (
        <div className="bg-[#0f1d33] border border-white/5 divide-y divide-white/5">
          {filtered.map(msg => (
            <div key={msg.id} onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)} className="px-6 py-5 hover:bg-white/2 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${msg.is_system ? "bg-blue-400" : "bg-primary"}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-sans text-white font-medium">
                      {msg.is_system ? "System" : senderEmails[msg.sender_id] || msg.sender_id?.slice(0, 8)}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-white/20 text-[10px]">{dealRoomNames[msg.deal_room_id] || ""}</span>
                      <span className="text-white/30 text-xs">{new Date(msg.created_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                  </div>
                  <p className={`text-sm ${expandedId === msg.id ? "text-white/80" : "text-white/40 line-clamp-1"}`}>{msg.message}</p>
                  {expandedId === msg.id && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={e => { e.stopPropagation(); deleteMsg(msg.id); }} className="text-xs border border-red-500/20 text-red-400 px-3 py-1.5 font-bold uppercase tracking-wider hover:bg-red-500/10 transition-colors">Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function applyFormat(tag: string, value: string, onChange: (v: string) => void, ref: React.RefObject<HTMLTextAreaElement | HTMLInputElement>) {
  const el = ref.current;
  if (!el) return;
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const baseTag = tag.split(" ")[0];
  const newVal = value.slice(0, start) + `<${tag}>${value.slice(start, end)}</${baseTag}>` + value.slice(end);
  onChange(newVal);
  setTimeout(() => { el.focus(); }, 0);
}

function RichTextInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [tbStyles, setTbStyles] = useState<ToolbarStyles>({ ...DEFAULT_TOOLBAR_STYLES });
  return (
    <div>
      {label && <label className="block text-white/60 text-xs uppercase tracking-widest mb-2 font-sans">{label}</label>}
      <WordToolbar
        mode="richtext"
        styles={tbStyles}
        onStyleChange={setTbStyles}
        onFormat={tag => applyFormat(tag, value, onChange, ref as React.RefObject<HTMLTextAreaElement | HTMLInputElement>)}
      />
      <input ref={ref} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-background border border-white/10 text-white px-4 py-3 text-sm font-sans focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}

function RichTextArea({ value, onChange, label, rows = 3 }: { value: string; onChange: (v: string) => void; label?: string; rows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tbStyles, setTbStyles] = useState<ToolbarStyles>({ ...DEFAULT_TOOLBAR_STYLES });
  return (
    <div>
      {label && <label className="block text-white/60 text-xs uppercase tracking-widest mb-2 font-sans">{label}</label>}
      <WordToolbar
        mode="richtext"
        styles={tbStyles}
        onStyleChange={setTbStyles}
        onFormat={tag => applyFormat(tag, value, onChange, ref as React.RefObject<HTMLTextAreaElement | HTMLInputElement>)}
      />
      <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)} rows={rows}
        className="w-full bg-background border border-white/10 text-white px-4 py-3 text-sm font-sans focus:outline-none focus:border-primary transition-colors resize-none"
      />
    </div>
  );
}

function ContentView() {
  const [activePage, setActivePage] = useState(SITE_PAGES[0].id);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [sectionData, setSectionData] = useState<Record<string, Record<string, string>>>({});
  const [savedSections, setSavedSections] = useState<Record<string, boolean>>({});

  const currentPage = SITE_PAGES.find((p: any) => p.id === activePage);

  useEffect(() => {
    if (!currentPage) return;
    const data: Record<string, Record<string, string>> = {};
    const opens: Record<string, boolean> = {};
    currentPage.sections.forEach((s: any) => {
      data[s.id] = getSiteSectionData(activePage, s.id);
      opens[s.id] = true;
    });
    setSectionData(data);
    setOpenSections(opens);
    setSavedSections({});
  }, [activePage]);

  const updateField = (sectionId: string, key: string, value: string) => {
    setSectionData(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [key]: value },
    }));
    setSavedSections(prev => ({ ...prev, [sectionId]: false }));
  };

  const handleSaveSection = (sectionId: string) => {
    saveSiteSection(activePage, sectionId, sectionData[sectionId]);
    setSavedSections(prev => ({ ...prev, [sectionId]: true }));
    setTimeout(() => setSavedSections(prev => ({ ...prev, [sectionId]: false })), 2500);
  };

  const handleResetSection = (sectionId: string) => {
    const defaults = resetSiteSection(activePage, sectionId);
    setSectionData(prev => ({ ...prev, [sectionId]: defaults }));
  };

  const handleSaveAll = () => {
    if (!currentPage) return;
    currentPage.sections.forEach((s: any) => {
      saveSiteSection(activePage, s.id, sectionData[s.id]);
    });
    const allSaved: Record<string, boolean> = {};
    currentPage.sections.forEach((s: any) => { allSaved[s.id] = true; });
    setSavedSections(allSaved);
    setTimeout(() => setSavedSections({}), 2500);
  };

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white font-bold">Page Content</h1>
          <p className="text-white/50 text-sm font-sans mt-1">Edit all text blocks across every page of the website</p>
        </div>
        <button
          onClick={handleSaveAll}
          className="bg-primary text-background px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          Save All Sections
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6 bg-[#050c16] border border-white/5 p-1.5">
        {SITE_PAGES.map((p: any) => (
          <button
            key={p.id}
            onClick={() => setActivePage(p.id)}
            className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
              activePage === p.id
                ? "bg-primary text-background shadow-[0_0_12px_rgba(200,164,107,0.2)]"
                : "text-white/45 hover:text-white hover:bg-white/5"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {currentPage?.sections.map((section: any) => {
          const isOpen = openSections[section.id] !== false;
          const isSaved = savedSections[section.id];
          const fields = sectionData[section.id] || {};
          const fieldCount = section.fields.length;

          return (
            <div key={section.id} className="bg-[#0f1d33] border border-white/5 overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ChevronRight
                    size={14}
                    className={`text-primary transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                  />
                  <span className="font-display text-lg text-white">{section.label}</span>
                  <span className="text-white/20 text-xs font-sans">{fieldCount} fields</span>
                </div>
                <div className="flex items-center gap-2">
                  {isSaved && (
                    <span className="text-green-400 text-xs font-bold uppercase tracking-wider font-sans flex items-center gap-1">
                      <CheckCircle size={12} /> Saved
                    </span>
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-white/5">
                  <div className="space-y-4">
                    {section.fields.map((field: any) => (
                      <div key={field.key}>
                        {field.type === "textarea" ? (
                          <RichTextArea
                            label={field.label}
                            value={fields[field.key] || ""}
                            onChange={v => updateField(section.id, field.key, v)}
                            rows={field.rows || 3}
                          />
                        ) : (
                          <RichTextInput
                            label={field.label}
                            value={fields[field.key] || ""}
                            onChange={v => updateField(section.id, field.key, v)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-5 mt-4 border-t border-white/5">
                    <button
                      onClick={() => handleSaveSection(section.id)}
                      className="bg-primary text-background px-5 py-2 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
                    >
                      {isSaved ? "Saved ✓" : "Save Section"}
                    </button>
                    <button
                      onClick={() => handleResetSection(section.id)}
                      className="border border-white/10 text-white/40 px-5 py-2 text-xs font-bold uppercase tracking-widest hover:border-white/30 hover:text-white/60 transition-colors"
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
  dealroom: <DealsManageView />,
  leads: <LeadsView />,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  useEffect(() => {
    supabaseAdmin
      .from("access_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .then(({ count }) => { if (count !== null) setPendingRequestsCount(count); });
    supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("approved", false)
      .then(({ count }) => { if (count !== null) setPendingUsersCount(count); });
    supabaseAdmin
      .from("deal_room_messages")
      .select("*", { count: "exact", head: true })
      .eq("is_system", false)
      .then(({ count }) => { if (count !== null) setUnreadMsgCount(Math.min(count, 9)); });
  }, []);

  const sidebarContent = (
    <nav className="flex-1 px-3 py-4 overflow-y-auto">
      {navItems.map((item) => {
        const active = activeView === item.id;
        const hasHref = "href" in item && item.href;
        return (
          <button
            key={item.id}
            onClick={() => { hasHref ? setLocation(item.href as string) : setActiveView(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1 text-sm font-medium transition-all duration-200 text-left group ${
              active && !hasHref
                ? "bg-primary/10 text-primary border-l-2 border-primary pl-[10px]"
                : "text-white/50 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
            }`}
          >
            <item.icon size={16} className={active && !hasHref ? "text-primary" : "text-white/40 group-hover:text-white/70"} />
            {item.label}
            {item.id === "messages" && unreadMsgCount > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadMsgCount}
              </span>
            )}
            {item.id === "requests-link" && pendingRequestsCount > 0 && (
              <span className="ml-auto bg-amber-500 text-black text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
            {item.id === "users-link" && pendingUsersCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                {pendingUsersCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-[#070f1a] font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-[#050c16] border-r border-white/5 flex-col">
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
        {sidebarContent}
        <div className="px-3 py-4 border-t border-white/5">
          <Link href="/">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/40 hover:text-white/70 transition-colors">
              <LogOut size={16} />
              Back to Site
            </button>
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#050c16] border-r border-white/5 flex flex-col z-10">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Anchor size={20} className="text-primary" strokeWidth={2} />
                <span className="font-display text-xl tracking-widest text-white">PDYE</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white p-1"><X size={20} /></button>
            </div>
            {sidebarContent}
            <div className="px-3 py-4 border-t border-white/5">
              <Link href="/">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/40 hover:text-white/70 transition-colors">
                  <LogOut size={16} />
                  Back to Site
                </button>
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-white/5 bg-[#070f1a] flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-white/40 hover:text-white p-1">
              <Menu size={20} />
            </button>
            <span className="text-white/30 text-sm font-sans capitalize">{activeView}</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
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
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-primary text-xs font-bold">AD</span>
              </div>
              <span className="text-white/60 text-sm">Administrator</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8">
          {pendingUsersCount > 0 && activeView === "dashboard" && (
            <div className="mb-4 flex items-center justify-between gap-4 bg-red-500/10 border border-red-500/30 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <span className="text-red-300 text-sm font-sans">
                  <span className="font-bold">{pendingUsersCount}</span> new {pendingUsersCount === 1 ? "member" : "members"} awaiting approval
                </span>
              </div>
              <button
                onClick={() => setLocation("/admin-users")}
                className="flex items-center gap-2 text-red-300 border border-red-500/40 hover:bg-red-500/20 text-xs font-bold uppercase tracking-widest px-3 py-1.5 transition-colors flex-shrink-0"
              >
                Approve Now <CheckCircle size={12} />
              </button>
            </div>
          )}
          {pendingRequestsCount > 0 && activeView === "dashboard" && (
            <div className="mb-6 flex items-center justify-between gap-4 bg-amber-500/10 border border-amber-500/30 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                <span className="text-amber-300 text-sm font-sans">
                  <span className="font-bold">{pendingRequestsCount}</span> pending access {pendingRequestsCount === 1 ? "request" : "requests"} awaiting review
                </span>
              </div>
              <button
                onClick={() => setLocation("/admin-requests")}
                className="flex items-center gap-2 text-amber-300 border border-amber-500/40 hover:bg-amber-500/20 text-xs font-bold uppercase tracking-widest px-3 py-1.5 transition-colors flex-shrink-0"
              >
                Review Now <CheckCircle size={12} />
              </button>
            </div>
          )}
          {views[activeView]}
        </main>
      </div>
    </div>
  );
}
