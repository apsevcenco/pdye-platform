import React, { useState, useRef, useEffect, useMemo, Fragment, useCallback } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { type Yacht, type YachtDocument } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { archiveUserAction, confirmAndDeleteUserInteractive } from "@/lib/userAdminActions";
import { useAuth } from "@/context/AuthContext";
import { dealRoomApi } from "@/lib/dealRoomApi";
import { CabinetLayout } from "@/components/layout/CabinetLayout";
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
  EyeOff,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
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
  MapPin,
  Building2,
  Calendar,
  Star,
  RefreshCw,
  Menu,
  Type,
  ShieldCheck,
  Upload,
  AlertTriangle,
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

// Navigation moved to CabinetLayout sidebar (collapsible Dashboard / Admin
// Menu accordions). Items below are kept here only so unused-icon imports
// don't trigger lint warnings — actual navigation lives in CabinetLayout.

type UserRecord = { id: string; email: string; role: string; approved: boolean; created_at: string; company?: string; phone?: string; notes?: string; name?: string; budget?: string; yacht_type?: string; location?: string; archived?: boolean; archived_at?: string | null };
type DealRoomDoc = { id: string; deal_room_id: string; uploaded_by: string; file_name: string; file_url: string; file_type?: string; file_size?: number; visible_to_roles?: string[]; created_at: string };
type DealRoomMsg = { id: string; deal_room_id: string; sender_id: string; message: string; is_system: boolean; created_at: string };

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    approved: "bg-green-500/10 text-green-400 border-green-500/20",
    review: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    active: "bg-green-500/10 text-green-400 border-green-500/20",
  };
  const icons: Record<string, React.ReactElement> = {
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
    // Phase 1: load fast, lightweight stats and reveal the dashboard UI as
    // soon as they resolve. Previously the dashboard waited for getMessages
    // × 3 deal rooms + audit logs (deferred to phase 2) before showing
    // ANYTHING — slowest query blocked the entire page (often >2s).
    async function loadPrimary() {
      try {
        const [yRes, uRes, arRes, lRes, allRoomsRes] = await Promise.all([
          supabase.from("yachts").select("*", { count: "exact", head: true }),
          supabase.from("users").select("id, email, role, approved"),
          supabase.from("access_requests").select("id, requester_id, yacht_id, status, role, created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("leads").select("*", { count: "exact", head: true }),
          dealRoomApi.list().catch(() => []),
        ]);
        const users = (uRes.data || []) as any[];
        const allRooms = (allRoomsRes || []) as any[];
        setStats({
          yachts: yRes.count || 0,
          buyers: users.filter(u => u.role === "investor" || u.role === "buyer").length,
          brokers: users.filter(u => u.role === "broker").length,
          owners: users.filter(u => u.role === "owner").length,
          pendingRequests: (arRes.data || []).filter((r: any) => r.status === "pending").length,
          dealRooms: allRooms.length,
          leads: lRes.count || 0,
        });
        const reqs = arRes.data || [];
        const reqUserIds = [...new Set(reqs.map((r: any) => r.requester_id))];
        let reqEmails: Record<string, string> = {};
        if (reqUserIds.length) {
          const { data: ru } = await supabase.from("users").select("id, email").in("id", reqUserIds);
          (ru || []).forEach((u: any) => { reqEmails[u.id] = u.email; });
        }
        setRecentRequests(reqs.map((r: any) => ({ ...r, email: reqEmails[r.requester_id] || r.requester_id?.slice(0, 8) })));
        // Reveal dashboard UI immediately. Phase 2 (recent messages /
        // recent activity) fills in below the fold without blocking.
        setLoading(false);
        return allRooms;
      } catch (e) {
        console.error("Dashboard primary load error:", e);
        setLoading(false);
        return [];
      }
    }

    async function loadSecondary(allRooms: any[]) {
      if (!allRooms.length) return;
      try {
        const roomIds = allRooms.slice(0, 10).map((r: any) => r.id);
        const [msgsArrays, actArrays] = await Promise.all([
          Promise.all(roomIds.slice(0, 3).map((rid: string) => dealRoomApi.getMessages(rid).catch(() => []))),
          dealRoomApi.getAuditLogs("deal_room", roomIds[0]).catch(() => []),
        ]);
        const recentMsgs = msgsArrays.flat()
          .filter((m: any) => !m.is_system)
          .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))
          .slice(0, 5);
        const msgSenderIds = [...new Set(recentMsgs.map((m: any) => m.sender_id))];
        let senderEmails: Record<string, string> = {};
        if (msgSenderIds.length) {
          const { data: su } = await supabase.from("users").select("id, email").in("id", msgSenderIds);
          (su || []).forEach((u: any) => { senderEmails[u.id] = u.email; });
        }
        setRecentMessages(recentMsgs.map((m: any) => ({ ...m, sender_email: senderEmails[m.sender_id] || "System" })));
        setRecentActivity(((actArrays as any[]) || []).slice(0, 8));
      } catch (e) {
        console.error("Dashboard secondary load error:", e);
      }
    }

    (async () => {
      const allRooms = await loadPrimary();
      // Don't await — let primary stats render first; secondary fills in.
      void loadSecondary(allRooms);
    })();
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
          <div key={i} className="bg-white/[0.02] border border-white/5 p-6 hover:border-primary/20 transition-colors">
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
        <div className="bg-white/[0.02] border border-white/5">
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

        <div className="bg-white/[0.02] border border-white/5">
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
          <div className="bg-white/[0.02] border border-white/5 xl:col-span-2">
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
  const { user: authUser } = useAuth();
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
    location: "", price: "", market_price: "",
    image: "", description: "",
  };
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [formPhotoSaving, setFormPhotoSaving] = useState(false);
  const [formPhotoError, setFormPhotoError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [photoDraggedIdx, setPhotoDraggedIdx] = useState<number | null>(null);
  const formFileRef = useRef<HTMLInputElement>(null);
  const [formIsPrivate, setFormIsPrivate] = useState(false);
  // PDF documents attached to the listing — stored in yachts.documents JSONB.
  const [formDocs, setFormDocs] = useState<YachtDocument[]>([]);
  const [formDocSaving, setFormDocSaving] = useState(false);
  const [formDocError, setFormDocError] = useState("");
  const [formDocDragOver, setFormDocDragOver] = useState(false);
  const formDocFileRef = useRef<HTMLInputElement>(null);
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

  const unitInputCls = "w-full bg-[#0a1628] border border-white/10 text-white pl-4 pr-14 py-2.5 font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-white/20";
  const specInputCls = "w-full bg-[#0a1628] border border-white/10 text-white px-4 py-2.5 font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-white/20";
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
      const apiBase = import.meta.env.VITE_API_URL || "https://pdye-platform.onrender.com/api";
      const res = await fetch(`${apiBase}/estimate-market-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setF("market_price", data.market_price);
      setAiNote({ reasoning: data.reasoning, confidence: data.confidence, comparables: 0, sources: data.sources });
    } catch (e: unknown) {
      setFormError("AI estimate failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setAiEstimating(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    // Pull listing-moderation columns too; gracefully fall back if the migration hasn't run yet
    let { data, error } = await supabase.from("yachts").select("*");
    if (error && /column .* does not exist|Could not find the .* column/i.test(error.message)) {
      const retry = await supabase.from("yachts").select("id,name,builder,length,year,type,location,price,status,is_private,is_featured,is_locked,deal_status,owner_id,main_image,image,photos,documents,created_at");
      data = retry.data as any;
    }
    setYachts((data as Yacht[]) || []);
    setLoading(false);
  }

  function setF(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function uploadFilesToServer(files: File[], _yachtId?: string): Promise<string[]> {
    const urls: string[] = [];
    const apiBase = import.meta.env.VITE_API_URL || "https://pdye-platform.onrender.com/api";
    // Bearer token required by requireUser middleware on /upload-photo.
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Your session has expired — please sign in again.");
    for (const file of files) {
      const form = new FormData();
      // /upload-photo body schema is z.object({}).strict() — DO NOT append any
      // text fields (yachtId, folder, etc.) or the request 400s before multer
      // even sees the file. The yacht association is recorded later via the
      // yachts.photos JSONB column when the form is saved.
      form.append("photo", file);
      const res = await fetch(`${apiBase}/upload-photo`, {
        method: "POST",
        body: form,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Upload failed");
      }
      const { url } = await res.json();
      urls.push(url);
    }
    return urls;
  }

  /** Upload a batch of PDFs through /api/upload-document. Mirrors
   *  uploadFilesToServer but targets the document endpoint and returns
   *  ready-to-store YachtDocument records. */
  async function uploadDocsToServer(files: File[]): Promise<YachtDocument[]> {
    const out: YachtDocument[] = [];
    const apiBase = import.meta.env.VITE_API_URL || "https://pdye-platform.onrender.com/api";
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Your session has expired — please sign in again.");
    for (const file of files) {
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      if (!isPdf) throw new Error(`${file.name}: only PDF documents are allowed.`);
      const fd = new FormData();
      // Same `.strict()` Zod rule as /upload-photo — only the file field.
      fd.append("document", file);
      const res = await fetch(`${apiBase}/upload-document`, {
        method: "POST",
        body: fd,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Upload failed");
      }
      const { url } = await res.json();
      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
      out.push({
        name: file.name.replace(/\.[^/.]+$/, ""),
        url,
        size: sizeStr,
        type: "PDF",
      });
    }
    return out;
  }

  async function handleFormPhotoUpload(files: File[]) {
    if (formPhotos.length + files.length > 30) {
      setFormPhotoError(`30 photos max. You can add ${30 - formPhotos.length} more.`);
      return;
    }
    setFormPhotoSaving(true);
    setFormPhotoError("");
    try {
      const newUrls = await uploadFilesToServer(files);
      setFormPhotos(prev => [...prev, ...newUrls]);
    } catch (e: any) {
      setFormPhotoError(e.message || "Upload error");
    } finally {
      setFormPhotoSaving(false);
      if (formFileRef.current) formFileRef.current.value = "";
    }
  }

  /** Upload PDFs into the in-progress yacht form. The resulting YachtDocument
   *  records are persisted alongside the rest of the listing on save. */
  async function handleFormDocUpload(files: File[]) {
    const MAX_FORM_DOCS = 10;
    if (formDocs.length + files.length > MAX_FORM_DOCS) {
      setFormDocError(`${MAX_FORM_DOCS} documents max. You can add ${MAX_FORM_DOCS - formDocs.length} more.`);
      return;
    }
    setFormDocSaving(true);
    setFormDocError("");
    try {
      const newDocs = await uploadDocsToServer(files);
      setFormDocs(prev => [...prev, ...newDocs]);
    } catch (e: any) {
      setFormDocError(e.message || "Upload error");
    } finally {
      setFormDocSaving(false);
      if (formDocFileRef.current) formDocFileRef.current.value = "";
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
      image: str(form.image) || (formPhotos[0] ?? ""),
      description: str(form.description),
      photos: formPhotos.length > 0 ? formPhotos : null,
      main_image: formPhotos[0] || str(form.image) || null,
      documents: formDocs.length > 0 ? formDocs : null,
      is_private: formIsPrivate,
      // Admin acts as the seller for listings created here, and admin posts go
      // live immediately (admin is the moderator — no self-review needed).
      owner_id: authUser?.id ?? null,
      listing_status: "approved",
    };

    let { error } = await supabase.from("yachts").insert([payload]);
    // Graceful fallback when migrations/008_yacht_documents.sql hasn't been
    // applied yet — retry without the documents column so the listing still
    // saves; the docs themselves are already uploaded to storage.
    if (error && isMissingDocumentsColumn(error)) {
      console.warn("[Admin] yachts.documents column missing — saving without documents.");
      const { documents: _omit, ...rest } = payload;
      ({ error } = await supabase.from("yachts").insert([rest]));
    }
    setSaving(false);
    if (error) {
      setFormError(error.message);
    } else {
      setSuccessMsg("Yacht added to database.");
      setTimeout(() => setSuccessMsg(""), 3000);
      setForm(EMPTY_FORM);
      setFormPhotos([]);
      setFormDocs([]);
      setFormDocError("");
      setFormIsPrivate(false);
      setShowForm(false);
      load();
    }
  }

  /** Detect "documents column is missing" Postgres errors so we can fall back
   *  to inserting without that field. Mirrors the same check used in
   *  AddYacht.tsx (broker self-serve form). */
  function isMissingDocumentsColumn(err: unknown): boolean {
    const msg = (err as any)?.message ?? String(err ?? "");
    return /documents/i.test(msg) && /schema cache|column .* does not exist/i.test(msg);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this listing from the database?")) return;
    await supabase.from("yachts").delete().eq("id", id);
    load();
  }

  async function toggleFeatured(id: string, current: boolean) {
    await supabase.from("yachts").update({ is_featured: !current }).eq("id", id);
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
      image: yacht.image || "",
      description: yacht.description || "",
    });
    setFormPhotos(yacht.photos || []);
    setFormDocs(Array.isArray(yacht.documents) ? yacht.documents : []);
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
      image: str(form.image) || (formPhotos[0] ?? null),
      description: str(form.description),
      photos: formPhotos.length > 0 ? formPhotos : null,
      main_image: formPhotos[0] || str(form.image) || null,
      documents: formDocs.length > 0 ? formDocs : null,
      is_private: formIsPrivate,
    };

    let { error } = await supabase.from("yachts").update(payload).eq("id", editingId);
    if (error && isMissingDocumentsColumn(error)) {
      console.warn("[Admin] yachts.documents column missing — updating without documents.");
      const { documents: _omit, ...rest } = payload;
      ({ error } = await supabase.from("yachts").update(rest).eq("id", editingId));
    }
    setSaving(false);
    if (error) {
      setFormError(error.message);
    } else {
      setSuccessMsg("Yacht updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
      setForm(EMPTY_FORM);
      setFormPhotos([]);
      setFormDocs([]);
      setFormDocError("");
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
    await supabase.from("yachts").update({ photos }).eq("id", yachtId);
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
      setUploadError(`You can add ${30 - current.length} more photos — 30 max.`);
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
    await supabase.from("yachts").update({ documents: docs }).eq("id", yachtId);
    load();
  }

  async function handleDocUpload(yacht: Yacht, files: File[]) {
    setDocSaving(true);
    setDocError("");
    try {
      const current: YachtDocument[] = yacht.documents || [];
      // Route through /upload-document so the PDF magic-byte check + 25MB
      // limit apply. The previous implementation reused /upload-photo which
      // rejects every PDF at the multer mime allow-list (image/* only).
      const newDocs = await uploadDocsToServer(files);
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

  const inputCls = "w-full bg-[#0a1628] border border-white/10 text-white px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-primary transition-colors placeholder:text-white/20";
  const labelCls = "block text-white/50 text-[10px] uppercase tracking-widest mb-1.5 font-sans";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white font-bold">Yachts</h1>
          <p className="text-white/50 text-sm font-sans mt-1">{loading ? "Loading..." : `${yachts.length} listings in database`}</p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setFormError(""); setEditingId(null); setForm(EMPTY_FORM); setFormPhotos([]); setFormDocs([]); setFormDocError(""); setFormIsPrivate(false); setAiNote(null); }}
          className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-primary text-primary px-4 py-2.5 text-sm font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300"
        >
          <Plus size={14} /> {showForm ? "Cancel" : "Add Yacht"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white/[0.02] border border-white/5 p-6 mb-6 space-y-6">
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

          <div className="bg-[#0f1d33] border border-white/8 p-4 space-y-6">
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
                {formPhotoError && <p className="text-red-400 text-xs font-sans mt-2">{formPhotoError}</p>}

                {/* Preview thumbnails */}
                {formPhotos.length > 0 && (
                  <>
                    <p className="text-white/30 text-[10px] font-sans mt-3 mb-2 tracking-wider uppercase">Drag to reorder · the first photo is the main one</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2">
                      {formPhotos.map((url, i) => (
                        <div
                          key={url + i}
                          draggable
                          onDragStart={() => setPhotoDraggedIdx(i)}
                          onDragOver={e => { e.preventDefault(); }}
                          onDrop={e => {
                            e.preventDefault();
                            if (photoDraggedIdx !== null && photoDraggedIdx !== i) {
                              setFormPhotos(prev => {
                                const next = [...prev];
                                const [moved] = next.splice(photoDraggedIdx, 1);
                                next.splice(i, 0, moved);
                                return next;
                              });
                            }
                            setPhotoDraggedIdx(null);
                          }}
                          onDragEnd={() => setPhotoDraggedIdx(null)}
                          className={`relative group/thumb aspect-square cursor-move transition-opacity ${
                            photoDraggedIdx === i ? "opacity-40" : "opacity-100"
                          }`}
                        >
                          <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />
                          {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-center bg-primary text-background text-[8px] font-bold uppercase tracking-widest py-0.5">Main</span>}
                          {i > 0 && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setFormPhotos(prev => {
                                  const next = [...prev];
                                  const [moved] = next.splice(i, 1);
                                  next.splice(i - 1, 0, moved);
                                  return next;
                                });
                              }}
                              title="Move left"
                              className="absolute top-1 left-1 bg-background/80 hover:bg-primary text-white hover:text-background w-5 h-5 flex items-center justify-center transition-colors z-10"
                            >
                              <ChevronLeft size={12} />
                            </button>
                          )}
                          {i < formPhotos.length - 1 && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setFormPhotos(prev => {
                                  const next = [...prev];
                                  const [moved] = next.splice(i, 1);
                                  next.splice(i + 1, 0, moved);
                                  return next;
                                });
                              }}
                              title="Move right"
                              className="absolute top-1 right-1 bg-background/80 hover:bg-primary text-white hover:text-background w-5 h-5 flex items-center justify-center transition-colors z-10"
                            >
                              <ChevronRight size={12} />
                            </button>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); setFormPhotos(prev => prev.filter((_, j) => j !== i)); }}
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

              {/* PDF documents — surveys, specs, brochures, registration. Saved into
               *  yachts.documents JSONB on submit and surfaced in the Deal Room
               *  Documents tab once a buyer signs the NDA. Mirrors the broker
               *  self-serve form in /add-yacht so admin and broker uploads are
               *  identical in shape. */}
              <div>
                <label className={labelCls}>Documents — PDF ({formDocs.length}/10)</label>
                <p className="text-white/40 text-xs font-sans mb-3">
                  Surveys, specifications, brochures, registration. These appear in the Deal Room Documents tab for buyers who have signed the NDA.
                </p>
                <input
                  ref={formDocFileRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  className="hidden"
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) handleFormDocUpload(files);
                  }}
                />
                <div
                  onDragOver={e => { e.preventDefault(); setFormDocDragOver(true); }}
                  onDragLeave={() => setFormDocDragOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setFormDocDragOver(false);
                    const files = Array.from(e.dataTransfer.files).filter(
                      f => f.type === "application/pdf" || /\.pdf$/i.test(f.name)
                    );
                    if (files.length > 0) handleFormDocUpload(files);
                  }}
                  onClick={() => formDocFileRef.current?.click()}
                  className={`border-2 border-dashed rounded-none cursor-pointer transition-colors flex flex-col items-center justify-center py-8 gap-3 ${
                    formDocDragOver ? "border-primary bg-primary/5" : "border-white/10 hover:border-primary/50 hover:bg-white/5"
                  }`}
                >
                  {formDocSaving ? (
                    <>
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-white/50 text-sm font-sans">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload size={28} className="text-primary/50" />
                      <div className="text-center">
                        <p className="text-white/70 text-sm font-sans">Drag PDFs here or <span className="text-primary">click to choose</span></p>
                        <p className="text-white/30 text-xs font-sans mt-1">PDF only — up to 25 MB each, 10 files max</p>
                      </div>
                    </>
                  )}
                </div>
                {formDocError && <p className="text-red-400 text-xs font-sans mt-2">{formDocError}</p>}

                {formDocs.length > 0 && (
                  <div className="border border-white/5 mt-3">
                    {formDocs.map((doc, i) => (
                      <div key={doc.url + i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/2 group/doc">
                        <FileText size={14} className="text-primary/50 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <input
                            value={doc.name}
                            onChange={e => {
                              const newName = e.target.value;
                              setFormDocs(prev => prev.map((d, j) => j === i ? { ...d, name: newName } : d));
                            }}
                            className="bg-transparent text-white/80 text-sm font-sans w-full focus:outline-none focus:text-white border-b border-transparent focus:border-white/20 transition-colors"
                          />
                          <p className="text-white/30 text-[10px] font-sans mt-0.5">
                            {doc.type}{doc.size ? ` · ${doc.size}` : ""}
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
                          type="button"
                          onClick={() => setFormDocs(prev => prev.filter((_, j) => j !== i))}
                          className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover/doc:opacity-100"
                          title="Remove document"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
              className="bg-white/5 backdrop-blur-md border border-primary text-primary px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Save Changes" : "Save to Database"}
            </button>
            <button
              onClick={() => { setShowForm(false); setFormError(""); setEditingId(null); setForm(EMPTY_FORM); setFormPhotos([]); setFormDocs([]); setFormDocError(""); setFormIsPrivate(false); setAiNote(null); }}
              className="border border-white/10 text-white/50 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-white/30 hover:text-white/70 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pending review banner */}
      {(() => {
        const pending = yachts.filter((y: any) => y.listing_status === "pending");
        if (pending.length === 0) return null;
        return (
          <div className="bg-yellow-500/8 border border-yellow-500/25 px-5 py-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-yellow-400" />
              <div>
                <p className="text-yellow-400 text-sm font-medium">{pending.length} listing{pending.length === 1 ? "" : "s"} awaiting your review</p>
                <p className="text-white/50 text-xs font-sans">Owners are waiting for approval before their yachts go live in the catalogue.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {pending.slice(0, 3).map((y: any) => (
                <a
                  key={y.id}
                  href={`/admin/yachts/${y.id}`}
                  className="inline-flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/40 text-yellow-300 hover:bg-yellow-400/20 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 transition-colors"
                >
                  <Eye size={11} /> {(y.name || "Untitled").slice(0, 20)}
                </a>
              ))}
              {pending.length > 3 && (
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">+ {pending.length - 3} more</span>
              )}
            </div>
          </div>
        );
      })()}

      {loading ? (
        <div className="bg-white/[0.02] border border-white/5 flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Vessel</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden md:table-cell">Builder</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold hidden lg:table-cell">Location</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Price</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Photos</th>
                <th className="text-left px-6 py-4 text-white/40 text-xs uppercase tracking-wider font-bold">Listing</th>
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
                      {(() => {
                        const ls = ((yacht as any).listing_status || "approved") as string;
                        const cfg: Record<string, { label: string; cls: string }> = {
                          draft:    { label: "Draft",    cls: "text-white/40 border-white/15 bg-white/5" },
                          pending:  { label: "Pending",  cls: "text-yellow-400 border-yellow-500/30 bg-yellow-500/8" },
                          approved: { label: "Live",     cls: "text-green-400 border-green-500/25 bg-green-500/8" },
                          rejected: { label: "Rejected", cls: "text-red-400 border-red-500/25 bg-red-500/8" },
                        };
                        const c = cfg[ls] || cfg.approved;
                        return (
                          <a
                            href={`/admin/yachts/${yacht.id}`}
                            className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border hover:opacity-80 transition-opacity ${c.cls}`}
                            title="Open moderation review"
                          >
                            {c.label}
                          </a>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={
                        yacht.status === "Distressed Sale" ? "review" :
                        yacht.status === "Confidential" ? "pending" : "active"
                      } />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {/* Review button — only for pending listings, always visible */}
                        {(yacht as any).listing_status === "pending" && (
                          <a
                            href={`/admin/yachts/${yacht.id}`}
                            className="inline-flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/40 text-yellow-300 hover:bg-yellow-400/20 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 transition-colors"
                            title="Open moderation review"
                          >
                            <Eye size={11} /> Review
                          </a>
                        )}
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
                      <td colSpan={7} className="bg-[#0a1628] border-b border-white/5 px-6 py-5">
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
                                className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-primary text-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300 disabled:opacity-40 whitespace-nowrap"
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
                      <td colSpan={7} className="bg-[#0a1628] border-b border-white/5 px-6 py-5">
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
                          <span className="text-white/20 text-xs font-sans">PDF, DOC, XLS, ZIP and other formats</span>
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
  const [, setLocation] = useLocation();
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
  const [blocks, setBlocks] = useState<Record<string, boolean>>({});
  const [blocksLoading, setBlocksLoading] = useState(false);

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
        const { data: owners } = await supabase.from("users").select("id, email").in("id", ownerIds);
        ownerMap = Object.fromEntries((owners || []).map((u: any) => [u.id, u.email]));
      }
      setYachtOptions(list.map(y => ({ ...y, owner_email: y.owner_id ? ownerMap[y.owner_id] || "" : "" })));
    })();
  }, []);

  async function createDealRoom() {
    const { buyerEmail, yachtId, notes } = createForm;
    if (!yachtId) { setCreateError("Please select a yacht."); return; }
    if (!buyerEmail.trim()) { setCreateError("Please enter the buyer email."); return; }
    setCreating(true);
    setCreateError("");

    try {
      // Buyer side: admin enters email manually (existing flow).
      const { data: bu } = await supabase.from("users").select("id").eq("email", buyerEmail.trim().toLowerCase()).maybeSingle();
      if (!bu) { setCreateError(`Buyer email "${buyerEmail}" not found. The user must register first.`); setCreating(false); return; }
      const buyerUserId = bu.id;

      // Seller side: NOT sent — backend auto-resolves from yachts.owner_id
      // and handles participant + NDA envelope + nda_pending status itself.
      const room = await dealRoomApi.create({
        yacht_id: yachtId,
        created_by_admin_id: user?.id || "",
        status: "draft",
        buyer_user_id: buyerUserId,
        nda_required: true,
        notes: notes.trim() || null,
      });

      if (!room?.id) throw new Error("Failed to create room");

      // Buyer participant + audit log + creation system message.
      await dealRoomApi.addParticipant(room.id, { user_id: buyerUserId, role: "buyer", side: "buyer", can_view: true, can_message: true, can_download: true });

      await dealRoomApi.sendMessage(room.id, {
        sender_id: user?.id || "",
        message: `Deal room created. Buyer: ${buyerEmail}.`,
        is_system: true,
      });

      await dealRoomApi.createAuditLog({
        entity_type: "deal_room",
        entity_id: room.id,
        user_id: user?.id || "",
        action: "deal_room_created",
        meta: { buyer_email: buyerEmail, yacht_id: yachtId },
      });

      // Buyer-side NDA envelope + status flip. Seller side is handled by
      // the backend during POST /deal-rooms (auto-resolved from yacht owner).
      let ndaSentOk = true;
      try {
        const now = new Date().toISOString();
        await dealRoomApi.createNdaEnvelope({
          deal_room_id: room.id,
          user_id: buyerUserId,
          side: "buyer",
          provider: "internal",
          status: "sent",
          sent_at: now,
        });
        await dealRoomApi.update(room.id, {
          status: "nda_pending",
          buyer_nda_status: "sent",
          buyer_nda_sent_at: now,
        });
        await dealRoomApi.createAuditLog({
          entity_type: "deal_room",
          entity_id: room.id,
          user_id: user?.id || "",
          action: "nda_sent_by_admin",
          meta: { buyer: true, auto: true },
        });
        await dealRoomApi.sendMessage(room.id, {
          sender_id: user?.id || "",
          message: "NDA invitation sent to Buyer. Seller (vessel owner) was auto-attached and notified by the system.",
          is_system: true,
        });
      } catch (ndaErr: any) {
        ndaSentOk = false;
        console.warn("[Admin] buyer-side NDA send failed:", ndaErr);
        setCreateError(
          `Deal room created, but buyer NDA send failed: ${ndaErr?.message || "Unknown error"}. Open the room and click "Send NDA" to retry.`
        );
      }

      if (ndaSentOk) {
        setShowCreate(false);
        setCreateForm({ buyerEmail: "", sellerEmail: "", yachtId: "", notes: "" });
      }
      await load();
    } catch (e: any) {
      setCreateError(e.message || "Error creating deal room.");
    }
    setCreating(false);
  }

  const [loadError, setLoadError] = useState<string>("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const allRooms = (await dealRoomApi.list({ includeArchived: true })) as DealRoom[];

      if (allRooms.length > 0) {
        const userIds = [...new Set([...allRooms.map(r => r.buyer_user_id), ...allRooms.map(r => r.seller_user_id)].filter(Boolean))];
        const { data: users } = await supabase.from("users").select("id, email").in("id", userIds as string[]);
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
    } catch (e: any) {
      console.error("[DealsManageView] load failed:", e);
      setLoadError(e?.message || "Failed to load deal rooms. Please refresh the page or check your connection.");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }

  const [restoreRoomId] = useState<string | null>(() => {
    const id = sessionStorage.getItem("pdye_admin_room_id");
    if (id) sessionStorage.removeItem("pdye_admin_room_id");
    return id;
  });

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!loading && restoreRoomId && rooms.length > 0 && !selectedRoom) {
      const found = rooms.find(r => r.id === restoreRoomId);
      if (found) openRoom(found);
    }
  }, [loading, rooms]);

  async function openRoom(room: RoomWithDetails) {
    setSelectedRoom(room);
    setEditNotes(room.notes || "");
    setNotesDirty(false);
    setBlocksLoading(true);
    const [logsResult, blocksData] = await Promise.all([
      supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "deal_room")
        .eq("entity_id", room.id)
        .order("created_at", { ascending: false }),
      dealRoomApi.getBlocks(room.id).catch(() => []),
    ]);
    setActivity((logsResult.data as AuditLog[]) || []);
    const bMap: Record<string, boolean> = {};
    if (blocksData && typeof blocksData === "object") {
      Object.entries(blocksData).forEach(([key, val]: [string, any]) => {
        bMap[key] = !!val?.is_unlocked;
      });
    }
    setBlocks(bMap);
    setBlocksLoading(false);
  }

  async function sendNda(room: RoomWithDetails) {
    setActionLoading(true);
    try {
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
      setSelectedRoom(null);
    } catch (e: any) {
      // Without this catch, any failed await above (network, 4xx, 5xx) would
      // leave actionLoading=true → admin stares at "Send NDA (Simulation)"
      // button stuck spinning forever, can never deliver NDA to participants,
      // which then looks to participants like "the deal NDA never arrives".
      console.error("[Admin] sendNda failed:", e);
      alert(`Failed to send NDA: ${e?.message || "Unknown error"}`);
    } finally {
      setActionLoading(false);
    }
    // Reload outside try so a slow reload can't keep the button spinning.
    try { load(); } catch {}
  }

  async function closeRoom(room: RoomWithDetails) {
    setActionLoading(true);
    try {
      await dealRoomApi.update(room.id, { status: "closed" });
      await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user?.id || "", action: "deal_room_closed", meta: {} });
      // Keep the room selected so admin can still see Archive / Reopen buttons.
      setSelectedRoom({ ...room, status: "closed" });
    } catch (e: any) {
      console.error("[Admin] closeRoom failed:", e);
      alert(`Failed to close room: ${e?.message || "Unknown error"}`);
    } finally {
      setActionLoading(false);
    }
    try { load(); } catch {}
  }

  async function cancelRoom(room: RoomWithDetails) {
    if (!confirm("Cancel this deal room?")) return;
    setActionLoading(true);
    try {
      await dealRoomApi.update(room.id, { status: "cancelled" });
      await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user?.id || "", action: "deal_room_cancelled", meta: {} });
      setSelectedRoom(null);
    } catch (e: any) {
      console.error("[Admin] cancelRoom failed:", e);
      alert(`Failed to cancel room: ${e?.message || "Unknown error"}`);
    } finally {
      setActionLoading(false);
    }
    try { load(); } catch {}
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
    // Allow manual "Send NDA" not only in the initial 'draft' state but
    // also in 'nda_pending' when any side is still 'not_sent'. This is the
    // recovery path for the auto-send-on-create flow: if the per-side
    // envelope/status writes succeeded but the room-level status flip or
    // a later step failed (or vice-versa), admin can re-trigger sending
    // for whichever side is still missing.
    const canSendNda = (selectedRoom.status === "draft" || selectedRoom.status === "nda_pending") &&
      (selectedRoom.buyer_nda_status === "not_sent" ||
        (selectedRoom.seller_user_id && selectedRoom.seller_nda_status === "not_sent"));
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
            { label: "Buyer Commission", value: selectedRoom.buyer_commission_status === "signed" ? "Signed" : selectedRoom.buyer_commission_status === "sent" ? "Sent" : "Not Sent", ok: selectedRoom.buyer_commission_status === "signed" },
            { label: "Seller Commission", value: selectedRoom.seller_commission_status === "signed" ? "Signed" : selectedRoom.seller_commission_status === "sent" ? "Sent" : "Not Sent", ok: selectedRoom.seller_commission_status === "signed" },
            { label: "Activated", value: selectedRoom.fully_activated_at ? new Date(selectedRoom.fully_activated_at).toLocaleDateString("en-GB") : "Pending", ok: !!selectedRoom.fully_activated_at },
            { label: "Identities", value: selectedRoom.identities_revealed ? "Revealed" : "Hidden", ok: !!selectedRoom.identities_revealed },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.02] border border-white/5 p-3 text-center">
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-sm font-bold ${s.ok ? "text-green-400" : "text-yellow-400"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/[0.02] border border-white/8 p-5 mb-6">
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
            <button onClick={() => { sessionStorage.setItem("pdye_origin", "admin"); sessionStorage.setItem("pdye_admin_room_id", selectedRoom.id); setLocation(`/dealroom/${selectedRoom.id}`); }} className="border border-primary/30 text-primary px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors">
              Open Full View →
            </button>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/8 p-5 mb-6">
          <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Data Access Control</h3>
          {blocksLoading ? (
            <p className="text-white/30 text-xs font-sans">Loading blocks...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: "specs", label: "Specifications" },
                { key: "photos", label: "Photos" },
                { key: "documents", label: "Documents" },
                { key: "chat", label: "Chat" },
                { key: "location", label: "Location" },
                { key: "yacht_name", label: "Yacht Name" },
                { key: "identities", label: "Identities" },
              ].map(block => {
                const unlocked = !!blocks[block.key];
                return (
                  <button
                    key={block.key}
                    disabled={blocksLoading}
                    onClick={async () => {
                      setBlocksLoading(true);
                      const newVal = !unlocked;
                      await dealRoomApi.setBlock(selectedRoom.id, block.key, { is_unlocked: newVal, admin_id: user?.id || "" });
                      await dealRoomApi.createAuditLog({
                        entity_type: "deal_room",
                        entity_id: selectedRoom.id,
                        user_id: user?.id || "",
                        action: newVal ? "block_unlocked" : "block_locked",
                        meta: { block: block.key },
                      });
                      setBlocks(prev => ({ ...prev, [block.key]: newVal }));
                      setBlocksLoading(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all ${
                      unlocked
                        ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                        : "bg-red-500/5 text-red-400/60 border-red-500/10 hover:bg-red-500/10"
                    }`}
                  >
                    <span>{block.label}</span>
                    {unlocked ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-white/20 text-[10px] font-sans mt-3">Toggle blocks to control what participants can see. Changes are saved immediately.</p>
        </div>

        <div className="bg-white/[0.02] border border-white/8 p-5 mb-6">
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

        <div className="bg-white/[0.02] border border-white/8 p-5 mb-6">
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
          <div className="bg-white/[0.02] border border-white/8 p-5">
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
        <button onClick={() => { setShowCreate(true); setCreateError(""); }} className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-primary text-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300">
          <Plus size={14} /> Create Deal Room
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="bg-white/[0.02] border border-white/10 w-full max-w-lg mx-4 p-0 shadow-2xl">
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
                <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5 font-bold">Seller (auto)</label>
                <input
                  type="email"
                  value={createForm.yachtId ? (yachtOptions.find(y => y.id === createForm.yachtId)?.owner_email || "—") : ""}
                  readOnly
                  disabled
                  className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-white/60 text-sm font-sans cursor-not-allowed"
                  placeholder="Will be auto-attached from selected yacht"
                />
                <p className="text-white/30 text-[10px] mt-1 font-sans">
                  The vessel owner is auto-attached as Seller and receives the NDA automatically. No manual entry needed.
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
              <button onClick={createDealRoom} disabled={creating} className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-primary text-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300 disabled:opacity-50">
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

      {loadError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle size={32} className="text-red-400 mb-3" />
          <p className="text-red-400 text-sm font-sans mb-2">Could not load deal rooms</p>
          <p className="text-white/40 text-xs font-sans max-w-md mb-4">{loadError}</p>
          <button
            onClick={() => load()}
            className="border border-primary/40 text-primary px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-white/30 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <TrendingUp size={36} className="mb-3 opacity-20" />
          <p className="text-sm">No deal rooms {statusFilter !== "all" ? "with this status" : "yet"}.</p>
          <p className="text-xs text-white/20 mt-2">Create deal rooms from approved access requests.</p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold">Yacht</th>
                <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold hidden md:table-cell">Buyer</th>
                <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold hidden md:table-cell">Seller</th>
                <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold">Buyer NDA</th>
                <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold">Seller NDA</th>
                <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold hidden lg:table-cell">Buyer Comm.</th>
                <th className="text-left px-5 py-3 text-white/40 text-[10px] uppercase tracking-wider font-bold hidden lg:table-cell">Seller Comm.</th>
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
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${ndaStyle(room.buyer_commission_status)}`}>
                        {room.buyer_commission_status === "signed" ? "✓ Signed" : room.buyer_commission_status === "sent" ? "Sent" : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${ndaStyle(room.seller_commission_status)}`}>
                        {room.seller_commission_status === "signed" ? "✓ Signed" : room.seller_commission_status === "sent" ? "Sent" : "—"}
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

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "investor", label: "Private Buyer" },
  { value: "broker", label: "Broker" },
  { value: "owner", label: "Yacht Owner" },
];

function inferRoleFromYachtType(yachtType?: string | null): string {
  const t = (yachtType || "").toLowerCase();
  if (t.includes("broker")) return "broker";
  if (t.includes("owner")) return "owner";
  return "investor";
}

function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approveResult, setApproveResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [chosenRole, setChosenRole] = useState<string>("investor");

  useEffect(() => {
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setLoadErr(error.message);
        setLeads((data as Lead[]) || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selected) {
      setChosenRole(inferRoleFromYachtType(selected.yacht_type));
      setApproveResult(null);
    }
  }, [selected]);

  async function deleteLead(id: number) {
    if (!window.confirm("Delete this lead? This cannot be undone.")) return;
    setDeletingId(id);
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      setLoadErr(error.message);
      setDeletingId(null);
      return;
    }
    setLeads(prev => prev.filter(l => l.id !== id));
    if (selected?.id === id) setSelected(null);
    setDeletingId(null);
  }

  async function approveLead(lead: Lead, role: string) {
    if (!lead.email) {
      setApproveResult({ ok: false, message: "Lead has no email address." });
      return;
    }
    if (!window.confirm(
      `Create account for ${lead.email} as ${ROLE_OPTIONS.find(r => r.value === role)?.label || role} and email login credentials?`
    )) return;
    setApprovingId(lead.id);
    setApproveResult(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "https://pdye-platform.onrender.com/api";
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const res = await fetch(`${baseUrl}/leads/${lead.id}/approve`, {
        method: "POST",
        headers,
        body: JSON.stringify({ role, siteUrl: window.location.origin }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setApproveResult({ ok: false, message: data.error || `Request failed (${res.status})` });
      } else {
        setApproveResult({ ok: true, message: `Account created and credentials emailed to ${data.email}.` });
        setLeads(prev => prev.filter(l => l.id !== lead.id));
        if (selected?.id === lead.id) setSelected(null);
      }
    } catch (e: any) {
      setApproveResult({ ok: false, message: e?.message || "Network error" });
    } finally {
      setApprovingId(null);
      setTimeout(() => setApproveResult(null), 8000);
    }
  }

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
                  ? "bg-primary text-[#0a1628]"
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
          <div className="bg-white/[0.02] border border-white/5">
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                          disabled={deletingId === lead.id}
                          className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all disabled:opacity-50"
                          title="Delete lead"
                          data-testid={`button-delete-lead-${lead.id}`}
                        >
                          <Trash2 size={14} />
                        </button>
                        <ChevronRight size={14} className="text-white/20 group-hover:text-primary transition-colors" />
                      </div>
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
        <div className="w-80 flex-shrink-0 bg-[#0a1628] border border-white/8 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${LEAD_TYPE_STYLES[selected.yacht_type] || "text-white/50 bg-white/5 border-white/10"}`}>
              {selected.yacht_type}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => deleteLead(selected.id)}
                disabled={deletingId === selected.id}
                className="text-xs border border-red-500/30 text-red-400 px-3 py-1.5 font-bold uppercase tracking-wider hover:bg-red-500/10 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                title="Delete lead"
                data-testid="button-delete-lead-detail"
              >
                <Trash2 size={12} /> Delete
              </button>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
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

          {/* Approve & send credentials */}
          {selected.email && (
            <div className="mt-6 pt-5 border-t border-white/8">
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Grant Access</p>
              <label className="text-white/50 text-[11px] block mb-1.5">Assign Role</label>
              <select
                value={chosenRole}
                onChange={e => setChosenRole(e.target.value)}
                className="w-full bg-[#0f1d33] border border-white/10 px-3 py-2 text-white text-xs font-sans mb-3 focus:border-primary/50 focus:outline-none"
                data-testid="select-approve-role"
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <button
                onClick={() => approveLead(selected, chosenRole)}
                disabled={approvingId === selected.id}
                className="w-full bg-white/5 backdrop-blur-md border border-primary text-primary hover:bg-primary/10 hover:text-white hover:border-white py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                data-testid="button-approve-lead"
              >
                <Mail size={13} />
                {approvingId === selected.id ? "Sending…" : "Approve & Send Credentials"}
              </button>
              <p className="text-white/30 text-[10px] mt-2 leading-relaxed">
                Generates a temporary password and emails sign-in details. The lead will be removed once delivered.
              </p>
              {approveResult && (
                <div className={`mt-3 px-3 py-2 text-xs font-sans border ${
                  approveResult.ok
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`} data-testid="text-approve-result">
                  {approveResult.message}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InvestorsView() {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ company: "", phone: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [requestCounts, setRequestCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [busyRow, setBusyRow] = useState<string | null>(null);

  async function archiveRow(user: UserRecord, e: React.MouseEvent) {
    e.stopPropagation();
    const next = !user.archived;
    if (!confirm(next ? `Archive ${user.email}? The user can be restored later.` : `Restore ${user.email} from archive?`)) return;
    setBusyRow(user.id);
    const r = await archiveUserAction(user.id, next);
    if (!r.ok) alert(r.errorKind === "migration_missing" ? r.error : "Failed: " + r.error);
    else setUsers(prev => prev.map(u => u.id === user.id ? { ...u, archived: next, archived_at: next ? new Date().toISOString() : null } : u));
    setBusyRow(null);
  }

  async function deleteRow(user: UserRecord, e: React.MouseEvent) {
    e.stopPropagation();
    setBusyRow(user.id);
    const ok = await confirmAndDeleteUserInteractive(user.id, user.email);
    if (ok) setUsers(prev => prev.filter(u => u.id !== user.id));
    setBusyRow(null);
  }

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("users").select("*").in("role", ["investor", "buyer"]).order("created_at", { ascending: false });
    const u = (data || []) as UserRecord[];
    setUsers(u);
    if (u.length) {
      const { data: reqs } = await supabase.from("access_requests").select("requester_id").in("requester_id", u.map(x => x.id));
      const counts: Record<string, number> = {};
      (reqs || []).forEach((r: any) => { counts[r.requester_id] = (counts[r.requester_id] || 0) + 1; });
      setRequestCounts(counts);
    }
    setLoading(false);
  }

  async function toggleApproval(user: UserRecord) {
    await supabase.from("users").update({ approved: !user.approved }).eq("id", user.id);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, approved: !u.approved } : u));
    if (selected?.id === user.id) setSelected({ ...user, approved: !user.approved });
  }

  async function saveEdit() {
    if (!selected) return;
    setSaving(true);
    await supabase.from("users").update({ company: editForm.company || null, phone: editForm.phone || null, notes: editForm.notes || null }).eq("id", selected.id);
    const updated = { ...selected, ...editForm };
    setUsers(prev => prev.map(u => u.id === selected.id ? updated : u));
    setSelected(updated);
    setEditing(false);
    setSaving(false);
  }

  async function deleteUser(id: string) {
    const target = users.find(u => u.id === id);
    const ok = await confirmAndDeleteUserInteractive(id, target?.email || "(unknown)");
    if (!ok) return;
    setUsers(prev => prev.filter(u => u.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const baseUsers = showArchived ? users : users.filter(u => !u.archived);
  const filtered = filter === "all" ? baseUsers : filter === "approved" ? baseUsers.filter(u => u.approved) : baseUsers.filter(u => !u.approved);
  const archivedCount = users.filter(u => u.archived).length;
  const initials = (email: string) => email.split("@")[0].slice(0, 2).toUpperCase();

  if (loading) return <div className="flex items-center justify-center py-20 text-white/30 text-sm">Loading…</div>;

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-white font-bold">Private Buyers</h1>
            <p className="text-white/50 text-sm font-sans mt-1">{baseUsers.length} {showArchived ? "total (incl. archived)" : "active"}{archivedCount > 0 && !showArchived ? ` · ${archivedCount} archived hidden` : ""}</p>
          </div>
          <button onClick={() => setShowArchived(s => !s)} className={`text-[10px] px-3 py-1.5 font-bold uppercase tracking-wider transition-colors border ${showArchived ? "bg-primary/20 text-primary border-primary/40" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"}`}>
            {showArchived ? "Hide archived" : `Show archived${archivedCount > 0 ? ` (${archivedCount})` : ""}`}
          </button>
        </div>

        <div className="flex gap-1 mb-6 bg-white/3 border border-white/8 p-1">
          {(["all", "approved", "pending"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-2 px-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-150 font-sans ${filter === f ? "bg-primary text-[#0a1628]" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
              {f === "all" ? `All (${baseUsers.length})` : f === "approved" ? `Approved (${baseUsers.filter(u => u.approved).length})` : `Pending (${baseUsers.filter(u => !u.approved).length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <Users size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No buyers found</p>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/5">
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
                  <tr key={user.id} onClick={() => setLocation(`/admin/users/${user.id}`)} className={`cursor-pointer transition-colors group ${user.archived ? "opacity-50" : ""} ${selected?.id === user.id ? "bg-primary/8 border-l-2 border-primary" : "hover:bg-white/2"}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-bold">{initials(user.email)}</span>
                        </div>
                        <p className="text-white font-medium font-sans text-sm">
                          {user.email}
                          {user.archived && <span className="ml-2 text-[9px] text-white/40 uppercase tracking-widest">Archived</span>}
                        </p>
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
                        <button onClick={e => archiveRow(user, e)} disabled={busyRow === user.id} className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider transition-colors border bg-white/5 text-white/60 border-white/10 hover:bg-white/10 disabled:opacity-50">
                          {user.archived ? "Restore" : "Archive"}
                        </button>
                        <button onClick={e => deleteRow(user, e)} disabled={busyRow === user.id} className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider transition-colors border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 disabled:opacity-50">
                          Delete
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
        <div className="w-80 flex-shrink-0 bg-[#0a1628] border border-white/8 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <StatusBadge status={selected.approved ? "approved" : "pending"} />
            <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white transition-colors"><X size={16} /></button>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <span className="text-primary text-sm font-bold">{initials(selected.email)}</span>
          </div>
          <h2 className="font-display text-xl text-white mb-1 break-all">{selected.name || selected.email}</h2>
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
                <button onClick={() => { setEditForm({ company: selected.company || "", phone: selected.phone || "", notes: selected.notes || "" }); setEditing(true); }} className="text-xs bg-white/5 backdrop-blur-md border border-primary text-primary px-4 py-2 font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300">Edit</button>
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
                <input value={editForm.company} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} className="w-full bg-[#0a1628] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Phone</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-[#0a1628] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Notes</label>
                <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={4} className="w-full bg-[#0a1628] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving} className="text-xs bg-white/5 backdrop-blur-md border border-primary text-primary px-4 py-2 font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
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
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ company: "", phone: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [busyRow, setBusyRow] = useState<string | null>(null);

  async function archiveRow(user: UserRecord, e: React.MouseEvent) {
    e.stopPropagation();
    const next = !user.archived;
    if (!confirm(next ? `Archive ${user.email}? The user can be restored later.` : `Restore ${user.email} from archive?`)) return;
    setBusyRow(user.id);
    const r = await archiveUserAction(user.id, next);
    if (!r.ok) alert(r.errorKind === "migration_missing" ? r.error : "Failed: " + r.error);
    else setUsers(prev => prev.map(u => u.id === user.id ? { ...u, archived: next, archived_at: next ? new Date().toISOString() : null } : u));
    setBusyRow(null);
  }

  async function deleteRow(user: UserRecord, e: React.MouseEvent) {
    e.stopPropagation();
    setBusyRow(user.id);
    const ok = await confirmAndDeleteUserInteractive(user.id, user.email);
    if (ok) setUsers(prev => prev.filter(u => u.id !== user.id));
    setBusyRow(null);
  }

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("users").select("*").eq("role", "broker").order("created_at", { ascending: false });
    const u = (data || []) as UserRecord[];
    setUsers(u);
    setLoading(false);
  }

  async function toggleApproval(user: UserRecord) {
    await supabase.from("users").update({ approved: !user.approved }).eq("id", user.id);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, approved: !u.approved } : u));
    if (selected?.id === user.id) setSelected({ ...user, approved: !user.approved });
  }

  async function saveEdit() {
    if (!selected) return;
    setSaving(true);
    await supabase.from("users").update({ company: editForm.company || null, phone: editForm.phone || null, notes: editForm.notes || null }).eq("id", selected.id);
    const updated = { ...selected, ...editForm };
    setUsers(prev => prev.map(u => u.id === selected.id ? updated : u));
    setSelected(updated);
    setEditing(false);
    setSaving(false);
  }

  async function deleteUser(id: string) {
    const target = users.find(u => u.id === id);
    const ok = await confirmAndDeleteUserInteractive(id, target?.email || "(unknown)");
    if (!ok) return;
    setUsers(prev => prev.filter(u => u.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const visibleUsers = showArchived ? users : users.filter(u => !u.archived);
  const archivedCount = users.filter(u => u.archived).length;
  const initials = (email: string) => email.split("@")[0].slice(0, 2).toUpperCase();

  if (loading) return <div className="flex items-center justify-center py-20 text-white/30 text-sm">Loading…</div>;

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-white font-bold">Brokers</h1>
            <p className="text-white/50 text-sm font-sans mt-1">{visibleUsers.length} {showArchived ? "total (incl. archived)" : "active"}{archivedCount > 0 && !showArchived ? ` · ${archivedCount} archived hidden` : ""}</p>
          </div>
          <button onClick={() => setShowArchived(s => !s)} className={`text-[10px] px-3 py-1.5 font-bold uppercase tracking-wider transition-colors border ${showArchived ? "bg-primary/20 text-primary border-primary/40" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"}`}>
            {showArchived ? "Hide archived" : `Show archived${archivedCount > 0 ? ` (${archivedCount})` : ""}`}
          </button>
        </div>

        {visibleUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <Briefcase size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No brokers registered</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleUsers.map(user => (
              <div key={user.id} onClick={() => setLocation(`/admin/users/${user.id}`)} className={`bg-white/[0.02] border hover:border-primary/20 transition-colors p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${user.archived ? "opacity-50" : ""} ${selected?.id === user.id ? "border-primary/30 bg-primary/5" : "border-white/5"}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 rounded-full">
                    <span className="text-primary text-xs font-bold">{initials(user.email)}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium font-sans text-sm">
                      {user.email}
                      {user.archived && <span className="ml-2 text-[9px] text-white/40 uppercase tracking-widest">Archived</span>}
                    </p>
                    <p className="text-white/40 text-xs">{user.company || "No company"} · Registered {new Date(user.created_at).toLocaleDateString("ru-RU")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={user.approved ? "approved" : "pending"} />
                  <button onClick={e => { e.stopPropagation(); toggleApproval(user); }} className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider transition-colors border ${user.approved ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"}`}>
                    {user.approved ? "Revoke" : "Approve"}
                  </button>
                  <button onClick={e => archiveRow(user, e)} disabled={busyRow === user.id} className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider transition-colors border bg-white/5 text-white/60 border-white/10 hover:bg-white/10 disabled:opacity-50">
                    {user.archived ? "Restore" : "Archive"}
                  </button>
                  <button onClick={e => deleteRow(user, e)} disabled={busyRow === user.id} className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider transition-colors border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 disabled:opacity-50">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="w-80 flex-shrink-0 bg-[#0a1628] border border-white/8 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <StatusBadge status={selected.approved ? "approved" : "pending"} />
            <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white transition-colors"><X size={16} /></button>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <span className="text-primary text-sm font-bold">{initials(selected.email)}</span>
          </div>
          <h2 className="font-display text-xl text-white mb-1 break-all">{selected.name || selected.email}</h2>
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
                <button onClick={() => { setEditForm({ company: selected.company || "", phone: selected.phone || "", notes: selected.notes || "" }); setEditing(true); }} className="text-xs bg-white/5 backdrop-blur-md border border-primary text-primary px-4 py-2 font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300">Edit</button>
                <button onClick={() => deleteUser(selected.id)} className="text-xs border border-red-500/30 text-red-400 px-3 py-2 font-bold uppercase tracking-wider hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Company</label>
                <input value={editForm.company} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} className="w-full bg-[#0a1628] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Phone</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-[#0a1628] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Notes</label>
                <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={4} className="w-full bg-[#0a1628] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving} className="text-xs bg-white/5 backdrop-blur-md border border-primary text-primary px-4 py-2 font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
                <button onClick={() => setEditing(false)} className="text-xs border border-white/10 text-white/60 px-4 py-2 font-bold uppercase tracking-wider hover:border-white/30 transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OwnersView() {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", company: "", phone: "", location: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [busyRow, setBusyRow] = useState<string | null>(null);

  async function archiveRow(user: UserRecord, e: React.MouseEvent) {
    e.stopPropagation();
    const next = !user.archived;
    if (!confirm(next ? `Archive ${user.email}? The user can be restored later.` : `Restore ${user.email} from archive?`)) return;
    setBusyRow(user.id);
    const r = await archiveUserAction(user.id, next);
    if (!r.ok) alert(r.errorKind === "migration_missing" ? r.error : "Failed: " + r.error);
    else setUsers(prev => prev.map(u => u.id === user.id ? { ...u, archived: next, archived_at: next ? new Date().toISOString() : null } : u));
    setBusyRow(null);
  }

  async function deleteRow(user: UserRecord, e: React.MouseEvent) {
    e.stopPropagation();
    setBusyRow(user.id);
    const ok = await confirmAndDeleteUserInteractive(user.id, user.email);
    if (ok) setUsers(prev => prev.filter(u => u.id !== user.id));
    setBusyRow(null);
  }

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("users").select("*").eq("role", "owner").order("created_at", { ascending: false });
    const u = (data || []) as UserRecord[];
    setUsers(u);
    setLoading(false);
  }

  async function toggleApproval(user: UserRecord) {
    await supabase.from("users").update({ approved: !user.approved }).eq("id", user.id);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, approved: !u.approved } : u));
    if (selected?.id === user.id) setSelected({ ...user, approved: !user.approved });
  }

  async function saveEdit() {
    if (!selected) return;
    setSaving(true);
    const patch: Record<string, any> = {
      name: editForm.name || null,
      company: editForm.company || null,
      phone: editForm.phone || null,
      location: editForm.location || null,
      notes: editForm.notes || null,
    };
    let { error } = await supabase.from("users").update(patch).eq("id", selected.id);
    if (error && /column .* does not exist|Could not find the .* column/i.test(error.message)) {
      // Strip unknown columns, retry with what's left (graceful for un-migrated schemas)
      const safe = { company: patch.company, phone: patch.phone, notes: patch.notes };
      const r = await supabase.from("users").update(safe).eq("id", selected.id);
      error = r.error;
    }
    if (error) { window.alert("Save failed: " + error.message); setSaving(false); return; }
    const updated = { ...selected, ...patch } as UserRecord;
    setUsers(prev => prev.map(u => u.id === selected.id ? updated : u));
    setSelected(updated);
    setEditing(false);
    setSaving(false);
  }

  async function deleteUser(id: string) {
    const target = users.find(u => u.id === id);
    const ok = await confirmAndDeleteUserInteractive(id, target?.email || "(unknown)");
    if (!ok) return;
    setUsers(prev => prev.filter(u => u.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const baseUsers = showArchived ? users : users.filter(u => !u.archived);
  const filtered = filter === "all" ? baseUsers : filter === "approved" ? baseUsers.filter(u => u.approved) : baseUsers.filter(u => !u.approved);
  const archivedCount = users.filter(u => u.archived).length;
  const initials = (rec: UserRecord) => (rec.name || rec.email).split(/[\s@]/)[0].slice(0, 2).toUpperCase();

  if (loading) return <div className="flex items-center justify-center py-20 text-white/30 text-sm">Loading…</div>;

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-white font-bold">Boat Owners</h1>
            <p className="text-white/50 text-sm font-sans mt-1">{baseUsers.length} {showArchived ? "total (incl. archived)" : "active"}{archivedCount > 0 && !showArchived ? ` · ${archivedCount} archived hidden` : ""}</p>
          </div>
          <button onClick={() => setShowArchived(s => !s)} className={`text-[10px] px-3 py-1.5 font-bold uppercase tracking-wider transition-colors border ${showArchived ? "bg-primary/20 text-primary border-primary/40" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"}`}>
            {showArchived ? "Hide archived" : `Show archived${archivedCount > 0 ? ` (${archivedCount})` : ""}`}
          </button>
        </div>

        <div className="flex gap-1 mb-6 bg-white/3 border border-white/8 p-1">
          {(["all", "approved", "pending"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-2 px-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-150 font-sans ${filter === f ? "bg-primary text-[#0a1628]" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
              {f === "all" ? `All (${baseUsers.length})` : f === "approved" ? `Approved (${baseUsers.filter(u => u.approved).length})` : `Pending (${baseUsers.filter(u => !u.approved).length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <Anchor size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No owners found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(user => (
              <div key={user.id} onClick={() => setLocation(`/admin/users/${user.id}`)} className={`bg-white/[0.02] border hover:border-primary/20 transition-colors p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${user.archived ? "opacity-50" : ""} ${selected?.id === user.id ? "border-primary/30 bg-primary/5" : "border-white/5"}`}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 rounded-full">
                    <span className="text-primary text-xs font-bold">{initials(user)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium font-sans text-sm truncate">
                      {user.name || user.email}
                      {user.archived && <span className="ml-2 text-[9px] text-white/40 uppercase tracking-widest">Archived</span>}
                    </p>
                    <p className="text-white/40 text-xs truncate">{[user.budget, user.location].filter(Boolean).join(" · ") || user.email} · Registered {new Date(user.created_at).toLocaleDateString("ru-RU")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <StatusBadge status={user.approved ? "approved" : "pending"} />
                  <button onClick={e => { e.stopPropagation(); toggleApproval(user); }} className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider transition-colors border ${user.approved ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"}`}>
                    {user.approved ? "Revoke" : "Approve"}
                  </button>
                  <button onClick={e => archiveRow(user, e)} disabled={busyRow === user.id} className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider transition-colors border bg-white/5 text-white/60 border-white/10 hover:bg-white/10 disabled:opacity-50">
                    {user.archived ? "Restore" : "Archive"}
                  </button>
                  <button onClick={e => deleteRow(user, e)} disabled={busyRow === user.id} className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider transition-colors border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 disabled:opacity-50">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="w-80 flex-shrink-0 bg-[#0a1628] border border-white/8 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <StatusBadge status={selected.approved ? "approved" : "pending"} />
            <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white transition-colors"><X size={16} /></button>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <span className="text-primary text-sm font-bold">{initials(selected)}</span>
          </div>
          <h2 className="font-display text-xl text-white mb-1 break-all">{selected.name || selected.email}</h2>
          <p className="text-white/40 text-xs mb-5">Registered {new Date(selected.created_at).toLocaleString("ru-RU")}</p>

          {!editing ? (
            <>
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-sm"><Mail size={13} className="text-primary flex-shrink-0" /><span className="text-white/70 break-all">{selected.email}</span></div>
                {selected.phone && <div className="flex items-center gap-2 text-sm"><Phone size={13} className="text-primary flex-shrink-0" /><span className="text-white/70">{selected.phone}</span></div>}
                {selected.company && <div className="flex items-center gap-2 text-sm"><Building2 size={13} className="text-primary flex-shrink-0" /><span className="text-white/70">{selected.company}</span></div>}
                {selected.location && <div className="flex items-center gap-2 text-sm"><MapPin size={13} className="text-primary flex-shrink-0" /><span className="text-white/70">{selected.location}</span></div>}
              </div>
              {(selected.budget || selected.yacht_type) && (
                <div className="mb-5 pt-5 border-t border-white/8 space-y-2">
                  {selected.yacht_type && (<div><p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Type</p><p className="text-white/80 text-sm">{selected.yacht_type}</p></div>)}
                  {selected.budget && (<div><p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Vessel / Budget</p><p className="text-white/80 text-sm">{selected.budget}</p></div>)}
                </div>
              )}
              {selected.notes && (
                <div className="mb-5 pt-5 border-t border-white/8">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Notes</p>
                  <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{selected.notes}</p>
                </div>
              )}
              <div className="flex gap-2 mt-5">
                <button onClick={() => { setEditForm({ name: selected.name || "", company: selected.company || "", phone: selected.phone || "", location: selected.location || "", notes: selected.notes || "" }); setEditing(true); }} className="text-xs bg-white/5 backdrop-blur-md border border-primary text-primary px-4 py-2 font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300">Edit</button>
                <button onClick={() => toggleApproval(selected)} className={`text-xs px-4 py-2 font-bold uppercase tracking-wider transition-colors border ${selected.approved ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10" : "border-green-500/30 text-green-400 hover:bg-green-500/10"}`}>
                  {selected.approved ? "Revoke" : "Approve"}
                </button>
                <button onClick={() => deleteUser(selected.id)} className="text-xs border border-red-500/30 text-red-400 px-3 py-2 font-bold uppercase tracking-wider hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-[#0a1628] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Company</label>
                <input value={editForm.company} onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))} className="w-full bg-[#0a1628] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Phone</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-[#0a1628] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Location</label>
                <input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} className="w-full bg-[#0a1628] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Notes</label>
                <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={4} className="w-full bg-[#0a1628] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving} className="text-xs bg-white/5 backdrop-blur-md border border-primary text-primary px-4 py-2 font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
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
        const { data: users } = await supabase.from("users").select("id, email").in("id", uploaderIds);
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
          const { data: yachts } = await supabase.from("yachts").select("id, name").in("id", yachtIds);
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
        <div className="bg-white/[0.02] border border-white/5">
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
        const { data: users } = await supabase.from("users").select("id, email").in("id", senderIds);
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
          const { data: yachts } = await supabase.from("yachts").select("id, name").in("id", yachtIds);
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
          <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-2 px-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-150 font-sans ${filter === f ? "bg-primary text-[#0a1628]" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
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
        <div className="bg-white/[0.02] border border-white/5 divide-y divide-white/5">
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
          className="bg-white/5 backdrop-blur-md border border-primary text-primary px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300 flex-shrink-0"
        >
          Save All Sections
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6 bg-[#06101e] border border-white/5 p-1.5">
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
        {activePage === "home" && <HomepageHeroEditor />}
        {currentPage?.sections.map((section: any) => {
          const isOpen = openSections[section.id] !== false;
          const isSaved = savedSections[section.id];
          const fields = sectionData[section.id] || {};
          const fieldCount = section.fields.length;

          return (
            <div key={section.id} className="bg-white/[0.02] border border-white/5 overflow-hidden">
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
                      className="bg-white/5 backdrop-blur-md border border-primary text-primary px-5 py-2 text-xs font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300"
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

function HomepageHeroEditor() {
  const init = getHeroContent();
  const [heroTitle, setHeroTitle] = useState(init.title);
  const [heroSubtitle, setHeroSubtitle] = useState(init.subtitle);
  const [titleFont, setTitleFont] = useState(init.titleFont);
  const [titleSize, setTitleSize] = useState(init.titleSize);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(true);

  const customFonts = getCustomFonts();
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

  return (
    <div className="bg-white/[0.02] border border-white/5 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronRight
            size={14}
            className={`text-primary transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          />
          <span className="font-display text-lg text-white">Hero — Headline & Style</span>
          <span className="text-white/20 text-xs font-sans">title, subtitle, font, size</span>
        </div>
        {saved && (
          <span className="text-green-400 text-xs font-bold uppercase tracking-wider font-sans flex items-center gap-1">
            <CheckCircle size={12} /> Saved
          </span>
        )}
      </button>

      {open && (
        <div className="px-6 pb-6 pt-2 border-t border-white/5">
          <div className="space-y-4">
            <RichTextInput label="Headline" value={heroTitle} onChange={setHeroTitle} />
            <RichTextArea label="Subtitle" value={heroSubtitle} onChange={setHeroSubtitle} rows={3} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-widest mb-2 font-sans">Headline Font</label>
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
                <label className="block text-white/60 text-xs uppercase tracking-widest mb-2 font-sans">Headline Size</label>
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
          </div>
          <div className="flex gap-3 pt-5 mt-4 border-t border-white/5">
            <button onClick={handleSave} className="bg-white/5 backdrop-blur-md border border-primary text-primary px-5 py-2 text-xs font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300">
              {saved ? "Saved ✓" : "Save Section"}
            </button>
            <button onClick={handleReset} className="border border-white/10 text-white/40 px-5 py-2 text-xs font-bold uppercase tracking-widest hover:border-white/30 hover:text-white/60 transition-colors">
              Reset to Default
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FontsView() {
  const [customFonts, setCustomFonts] = useState<CustomFont[]>(getCustomFonts);
  const [newFontName, setNewFontName] = useState("");
  const [fontError, setFontError] = useState("");
  const [fontAdded, setFontAdded] = useState(false);

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
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white font-bold">Fonts</h1>
        <p className="text-white/50 text-sm font-sans mt-1">Manage custom Google Fonts available in Page Content editors.</p>
      </div>

      <div className="bg-white/[0.02] border border-white/5 p-6">
        <h2 className="font-display text-lg text-white mb-1">Custom Fonts</h2>
        <p className="text-white/40 text-xs mb-6 font-sans">Search from 1,400+ Google Fonts. Start typing to see suggestions, select one, then click Add Font. Added fonts appear in the Headline Font selector inside Page Content → Home.</p>
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
              className="bg-white/5 backdrop-blur-md border border-primary text-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300 whitespace-nowrap"
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
    </div>
  );
}

const views: Record<string, React.ReactElement> = {
  dashboard: <Dashboard />,
  yachts: <YachtsView />,
  dealroom: <DealsManageView />,
  leads: <LeadsView />,
  investors: <InvestorsView />,
  brokers: <BrokersView />,
  owners: <OwnersView />,
  documents: <DocumentsView />,
  messages: <MessagesView />,
  content: <ContentView />,
  fonts: <FontsView />,
};

export default function Admin() {
  const search = useSearch();
  const viewFromUrl = useMemo(() => {
    const fromHook = new URLSearchParams(search || "").get("view");
    if (fromHook) return fromHook;
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("view");
    }
    return null;
  }, [search]);
  const [activeView, setActiveView] = useState(() => {
    if (typeof window !== "undefined") {
      const fromUrl = new URLSearchParams(window.location.search).get("view");
      if (fromUrl) return fromUrl;
    }
    const origin = sessionStorage.getItem("pdye_origin");
    if (origin === "admin") {
      sessionStorage.removeItem("pdye_origin");
      return "dealroom";
    }
    const adminView = sessionStorage.getItem("pdye_admin_view");
    if (adminView) {
      sessionStorage.removeItem("pdye_admin_view");
      return adminView;
    }
    return "dashboard";
  });
  useEffect(() => {
    // URL is the source of truth ONLY when `?view=` is explicitly present.
    // Bare `/admin` (e.g. Dashboard's "Open Deal Room" card which sets
    // sessionStorage `pdye_admin_view` then navigates to `/admin`) must NOT
    // be force-reset to "dashboard" — that would override the stored intent
    // captured by the activeView initializer. So we only react when the
    // URL actually carries a view param.
    if (viewFromUrl && viewFromUrl !== activeView) setActiveView(viewFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewFromUrl]);
  const [, setLocation] = useLocation();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  // Only fire the dashboard banner-count queries when the dashboard view is
  // actually visible. Other admin views (yachts/dealroom/etc.) don't need
  // these counts, so skipping them on those views avoids wasted round-trips
  // on every navigation. Removed the previous `/deal-room-messages-all`
  // fetch entirely — it was used only by the old top sub-tab badge which
  // no longer exists, and on rooms with many messages it could add 1+s of
  // load time on every admin page mount.
  useEffect(() => {
    if (activeView !== "dashboard") return;
    supabase
      .from("access_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .then(({ count }) => { if (count !== null) setPendingRequestsCount(count); });
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("approved", false)
      .then(({ count }) => { if (count !== null) setPendingUsersCount(count); });
  }, [activeView]);

  return (
    <CabinetLayout>
      <div className="min-h-screen bg-background">
        {/* Page Content */}
        <main className="max-w-7xl mx-auto p-3 sm:p-6 md:p-8">
          {pendingUsersCount > 0 && activeView === "dashboard" && (
            <div className="mb-4 flex items-center justify-between gap-4 bg-red-500/10 border border-red-500/30 px-5 py-3 flex-wrap">
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
            <div className="mb-6 flex items-center justify-between gap-4 bg-amber-500/10 border border-amber-500/30 px-5 py-3 flex-wrap">
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
          {views[activeView] ?? views.dashboard}
        </main>
      </div>
    </CabinetLayout>
  );
}
