import { useEffect, useState, useCallback } from "react";
import { Link, Redirect } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { dealRoomApi } from "@/lib/dealRoomApi";
import { Layout } from "@/components/layout/Layout";
import type { DealRoom } from "@/lib/dealTypes";
import {
  User, Clock, CheckCircle, XCircle, Ship, Plus, TrendingUp,
  LayoutDashboard, ArrowRight, FileText, Lock, ShieldCheck,
  Trash2, Eye, Send, AlertTriangle, ChevronRight, RefreshCw,
  Anchor, Calculator, BadgeCheck, Handshake, CircleDot,
} from "lucide-react";

/* ─── Types ─── */
type AccessRequest = {
  id: string;
  yacht_id: string;
  status: "pending" | "approved" | "approved_spec" | "escalated" | "rejected" | "archived";
  created_at: string;
  yacht_name?: string;
};

type MyYacht = {
  id: string;
  name: string;
  builder: string | null;
  length: string | null;
  year: string | null;
  status: string | null;
  deal_status: string | null;
  is_private: boolean;
  created_at: string;
  main_image: string | null;
  image: string | null;
};

/* ─── Status helpers ─── */
const REQ_STATUS: Record<string, { label: string; icon: React.ReactNode; style: string }> = {
  pending:       { label: "Under Review",    icon: <Clock size={11} />,       style: "text-yellow-400 border-yellow-500/20 bg-yellow-500/8" },
  approved:      { label: "Spec Access",     icon: <Eye size={11} />,         style: "text-blue-400   border-blue-500/20  bg-blue-500/8" },
  approved_spec: { label: "Spec Access",     icon: <Eye size={11} />,         style: "text-blue-400   border-blue-500/20  bg-blue-500/8" },
  rejected:      { label: "Declined",        icon: <XCircle size={11} />,     style: "text-red-400    border-red-500/20    bg-red-500/8" },
  escalated:     { label: "In Deal Room",    icon: <CheckCircle size={11} />, style: "text-green-400  border-green-500/20  bg-green-500/8" },
};

const DEAL_STATUS: Record<string, { label: string; style: string }> = {
  none:     { label: "Not Submitted",    style: "text-white/30 border-white/10 bg-white/3" },
  pending:  { label: "Awaiting Review",  style: "text-yellow-400 border-yellow-500/20 bg-yellow-500/8" },
  approved: { label: "In Deal Room",     style: "text-green-400 border-green-500/20 bg-green-500/8" },
  rejected: { label: "Rejected",         style: "text-red-400 border-red-500/20 bg-red-500/8" },
};

/* ─── Reusable block ─── */
function Block({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-[#0f1d33] border border-white/5">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{title}</p>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ─── PRIVATE BUYER VIEW ─── */
function BuyerDashboard({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rqs } = await supabase
      .from("access_requests")
      .select("id, yacht_id, status, created_at")
      .eq("requester_id", userId)
      .order("created_at", { ascending: false });

    if (!rqs || rqs.length === 0) { setRequests([]); setLoading(false); return; }

    const yachtIds = rqs.map((r: any) => r.yacht_id).filter(Boolean);
    const { data: yachts } = yachtIds.length
      ? await supabase.from("yachts").select("id, name").in("id", yachtIds)
      : { data: [] };

    const yachtMap = Object.fromEntries((yachts || []).map((y: any) => [y.id, y.name]));
    setRequests(rqs.map((r: any) => ({ ...r, yacht_name: yachtMap[r.yacht_id] || "Unknown Vessel" })));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const specAccess = requests.filter(r => r.status === "approved" || r.status === "approved_spec");
  const inDealRoom = requests.filter(r => r.status === "escalated");

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-px bg-white/5">
        {[
          { label: "Total Requests", value: requests.length, icon: <Ship size={16} /> },
          { label: "Under Review",   value: requests.filter(r => r.status === "pending").length, icon: <Clock size={16} /> },
          { label: "Spec Access",    value: specAccess.length, icon: <Eye size={16} /> },
          { label: "In Deal Room",   value: inDealRoom.length, icon: <CheckCircle size={16} /> },
        ].map(s => (
          <div key={s.label} className="bg-background flex flex-col items-center justify-center gap-1.5 py-6 text-center">
            <span className="text-primary/60">{s.icon}</span>
            <span className="font-display text-3xl text-white">{s.value}</span>
            <span className="text-white/30 text-[10px] uppercase tracking-widest font-sans">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Access Requests */}
      <Block
        title="My Access Requests"
        action={
          <button onClick={load} className="text-white/30 hover:text-primary transition-colors">
            <RefreshCw size={13} />
          </button>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-10 text-white/20 text-sm">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Lock size={28} className="text-white/10" />
            <p className="text-white/30 text-sm font-sans">No requests yet.</p>
            <Link href="/yachts" className="text-primary text-xs font-bold uppercase tracking-widest hover:underline mt-1">
              Browse Listings <ChevronRight size={11} className="inline" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {requests.map(req => {
              const cfg = REQ_STATUS[req.status] || REQ_STATUS.pending;
              return (
                <div key={req.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-white text-sm font-medium">{req.yacht_name}</p>
                    <p className="text-white/30 text-xs font-sans mt-0.5">{new Date(req.created_at).toLocaleDateString("en-GB")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border ${cfg.style}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    {(req.status === "approved" || req.status === "approved_spec") && (
                      <Link href={`/yacht/${req.yacht_id}`} className="flex items-center gap-1 text-blue-400 text-xs font-bold uppercase tracking-wider hover:underline">
                        View Specs <ChevronRight size={11} />
                      </Link>
                    )}
                    {req.status === "escalated" && (
                      <Link href="/dealroom" className="flex items-center gap-1 text-green-400 text-xs font-bold uppercase tracking-wider hover:underline">
                        Deal Room <ChevronRight size={11} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Block>

      <MyDealRoomsSection userId={userId} />

      <Link href="/dealroom">
        <div className="bg-primary/5 border border-primary/20 p-6 flex items-center justify-between cursor-pointer hover:bg-primary/8 transition-colors">
          <div>
            <p className="text-white font-display text-lg mb-1">Deal Room</p>
            <p className="text-white/50 text-sm font-sans">View all your deals and access deal rooms.</p>
          </div>
          <div className="flex items-center gap-2 bg-primary text-background px-5 py-3 font-bold text-xs uppercase tracking-widest">
            Enter Deal Room <ArrowRight size={13} />
          </div>
        </div>
      </Link>
    </div>
  );
}

function MyDealRoomsSection({ userId }: { userId: string }) {
  const [rooms, setRooms] = useState<{ id: string; yacht_id: string; status: string; buyer_nda_status: string; seller_nda_status: string; created_at: string; yacht_name?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRooms() {
      try {
        const allRooms = await dealRoomApi.byUser(userId);
        const activeRooms = (allRooms || []).filter((r: any) => r.status !== "cancelled");
        if (activeRooms.length > 0) {
          const yachtIds = [...new Set(activeRooms.map((r: any) => r.yacht_id))];
          const { data: yachts } = await supabase.from("yachts").select("id, name").in("id", yachtIds);
          const yachtMap = Object.fromEntries((yachts || []).map((y: any) => [y.id, y.name]));
          setRooms(activeRooms.map((r: any) => ({ ...r, yacht_name: yachtMap[r.yacht_id] || "Vessel" })));
        }
      } catch (e) {}
      setLoading(false);
    }
    loadRooms();
  }, [userId]);

  if (loading || rooms.length === 0) return null;

  const ROOM_STYLE: Record<string, { label: string; color: string }> = {
    draft:            { label: "Draft",            color: "text-white/40 border-white/10" },
    nda_pending:      { label: "NDA Pending",      color: "text-orange-400 border-orange-500/20" },
    partially_signed: { label: "Partially Signed", color: "text-yellow-400 border-yellow-500/20" },
    active:           { label: "Active",           color: "text-green-400 border-green-500/20" },
    closed:           { label: "Closed",           color: "text-white/30 border-white/10" },
  };

  return (
    <Block title="My Deal Rooms">
      <div className="divide-y divide-white/5">
        {rooms.map(room => {
          const cfg = ROOM_STYLE[room.status] || ROOM_STYLE.draft;
          const needsNda = room.status === "nda_pending" || room.status === "partially_signed";
          return (
            <div key={room.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-white text-sm font-medium">{room.yacht_name}</p>
                <p className="text-white/30 text-xs font-sans mt-0.5">{new Date(room.created_at).toLocaleDateString("en-GB")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border ${cfg.color}`}>
                  {cfg.label}
                </span>
                {needsNda && (
                  <Link href={`/dealroom/${room.id}`} className="flex items-center gap-1 bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider px-3 py-1.5 hover:bg-orange-500/30 transition-colors">
                    Sign NDA <ChevronRight size={11} />
                  </Link>
                )}
                {room.status === "active" && (
                  <Link href={`/dealroom/${room.id}`} className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider hover:underline">
                    Open Room <ChevronRight size={11} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Block>
  );
}

/* ─── BROKER / OWNER VIEW ─── */
function ListingsDashboard({ userId, role }: { userId: string; role: string }) {
  const [yachts, setYachts] = useState<MyYacht[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("yachts")
      .select("id, name, builder, length, year, status, deal_status, is_private, created_at, main_image, image")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    setYachts((data as MyYacht[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function submitToDealRoom(yachtId: string) {
    setSubmitting(yachtId);
    await supabase.from("yachts").update({ deal_status: "pending" }).eq("id", yachtId).eq("owner_id", userId);
    setYachts(prev => prev.map(y => y.id === yachtId ? { ...y, deal_status: "pending" } : y));
    setSubmitting(null);
  }

  async function deleteYacht(yachtId: string) {
    if (!confirm("Delete this yacht listing? This cannot be undone.")) return;
    setDeleting(yachtId);
    await supabase.from("yachts").delete().eq("id", yachtId).eq("owner_id", userId);
    setYachts(prev => prev.filter(y => y.id !== yachtId));
    setDeleting(null);
  }

  const label = role === "broker" ? "My Listings" : "My Yachts";

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-white/5">
        {[
          { label: "Total Listings", value: yachts.length },
          { label: "In Deal Room",   value: yachts.filter(y => y.deal_status === "approved").length },
          { label: "Pending Review", value: yachts.filter(y => y.deal_status === "pending").length },
        ].map(s => (
          <div key={s.label} className="bg-background flex flex-col items-center justify-center gap-1.5 py-6 text-center">
            <span className="font-display text-3xl text-white">{s.value}</span>
            <span className="text-white/30 text-[10px] uppercase tracking-widest font-sans">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Listings */}
      <Block
        title={label}
        action={
          <Link href="/add-yacht" className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">
            <Plus size={12} /> Add Listing
          </Link>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-10 text-white/20 text-sm">Loading…</div>
        ) : yachts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Ship size={28} className="text-white/10" />
            <p className="text-white/30 text-sm font-sans">No listings yet.</p>
            <Link href="/add-yacht" className="flex items-center gap-2 border border-primary/40 text-primary text-xs font-bold uppercase tracking-widest px-4 py-2 hover:bg-primary/10 transition-colors">
              <Plus size={12} /> Add Your First Listing
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {yachts.map(yacht => {
              const dealCfg = DEAL_STATUS[yacht.deal_status || "none"] || DEAL_STATUS.none;
              const thumb = yacht.main_image || yacht.image;
              return (
                <div key={yacht.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/2 transition-colors group">
                  {/* Thumb */}
                  <div className="w-14 h-10 bg-white/5 border border-white/5 overflow-hidden flex-shrink-0">
                    {thumb ? <img src={thumb} alt={yacht.name} className="w-full h-full object-cover" /> : <Ship size={16} className="m-auto mt-2 text-white/20" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{yacht.name}</p>
                    <p className="text-white/40 text-xs font-sans truncate">
                      {[yacht.builder, yacht.length, yacht.year].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  {/* Deal status */}
                  <span className={`hidden sm:flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${dealCfg.style}`}>
                    {dealCfg.label}
                  </span>

                  {/* Private badge */}
                  {yacht.is_private && (
                    <span className="hidden md:flex items-center gap-1 text-[10px] text-primary/60 border border-primary/20 px-2 py-0.5">
                      <Lock size={9} /> Private
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/yacht/${yacht.id}`} className="p-1.5 text-white/30 hover:text-primary transition-colors" title="View">
                      <Eye size={14} />
                    </Link>
                    <Link href={`/add-yacht?edit=${yacht.id}`} className="p-1.5 text-white/30 hover:text-primary transition-colors" title="Edit">
                      <FileText size={14} />
                    </Link>
                    {(!yacht.deal_status || yacht.deal_status === "none" || yacht.deal_status === "rejected") && (
                      <button
                        onClick={() => submitToDealRoom(yacht.id)}
                        disabled={submitting === yacht.id}
                        className="p-1.5 text-white/30 hover:text-green-400 transition-colors disabled:opacity-30"
                        title="Submit to Deal Room"
                      >
                        <Send size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteYacht(yacht.id)}
                      disabled={deleting === yacht.id}
                      className="p-1.5 text-white/30 hover:text-red-400 transition-colors disabled:opacity-30"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Block>

      {role === "broker" && <BrokerDealRoomsSection userId={userId} />}
    </div>
  );
}

function BrokerDealRoomsSection({ userId }: { userId: string }) {
  const [rooms, setRooms] = useState<{ id: string; yacht_id: string; status: string; created_at: string; yacht_name?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabaseAdmin
        .from("deal_rooms")
        .select("id, yacht_id, status, created_at")
        .eq("seller_user_id", userId)
        .not("status", "in", '("cancelled")')
        .order("created_at", { ascending: false });

      const allRooms = data || [];
      if (allRooms.length > 0) {
        const yachtIds = [...new Set(allRooms.map((r: any) => r.yacht_id))];
        const { data: yachts } = await supabase.from("yachts").select("id, name").in("id", yachtIds);
        const yachtMap = Object.fromEntries((yachts || []).map((y: any) => [y.id, y.name]));
        setRooms(allRooms.map((r: any) => ({ ...r, yacht_name: yachtMap[r.yacht_id] || "Vessel" })));
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading || rooms.length === 0) return null;

  return (
    <Block title="Deal Rooms (as Seller)">
      <div className="divide-y divide-white/5">
        {rooms.map(room => (
          <div key={room.id} className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-white text-sm font-medium">{room.yacht_name}</p>
              <p className="text-white/30 text-xs font-sans mt-0.5">{new Date(room.created_at).toLocaleDateString("en-GB")}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border ${room.status === "active" ? "text-green-400 border-green-500/20" : "text-white/40 border-white/10"}`}>
                {room.status.replace(/_/g, " ")}
              </span>
              <Link href={`/dealroom/${room.id}`} className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider hover:underline">
                Open <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Block>
  );
}

/* ─── OWNER VIEW ─── */
const PIPELINE = [
  { key: "submitted",  label: "Submitted",       icon: <Send size={14} />,        desc: "Your vessel is in our system." },
  { key: "review",     label: "Under Review",     icon: <Clock size={14} />,       desc: "Our team is verifying details." },
  { key: "deal_room",  label: "Deal Room",         icon: <Anchor size={14} />,      desc: "Vessel is live for qualified buyers." },
  { key: "offer",      label: "Offer Received",   icon: <Handshake size={14} />,   desc: "A qualified buyer has made an offer." },
  { key: "closed",     label: "Closed",           icon: <BadgeCheck size={14} />,  desc: "Transaction successfully completed." },
];

function dealStatusToStep(dealStatus: string | null): number {
  if (!dealStatus || dealStatus === "none") return -1;
  if (dealStatus === "pending") return 1;
  if (dealStatus === "approved") return 2;
  if (dealStatus === "rejected") return -1;
  return 0;
}

function OwnerDashboard({ userId }: { userId: string }) {
  const [yachts, setYachts] = useState<MyYacht[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("yachts")
      .select("id, name, builder, length, year, status, deal_status, is_private, created_at, main_image, image")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    const list = (data as MyYacht[]) || [];
    setYachts(list);
    if (list.length > 0 && !selected) setSelected(list[0].id);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const activeYacht = yachts.find(y => y.id === selected) || yachts[0] || null;

  async function submitToDealRoom(yachtId: string) {
    setSubmitting(yachtId);
    await supabase.from("yachts").update({ deal_status: "pending" }).eq("id", yachtId).eq("owner_id", userId);
    setYachts(prev => prev.map(y => y.id === yachtId ? { ...y, deal_status: "pending" } : y));
    setSubmitting(null);
  }

  async function deleteYacht(yachtId: string) {
    if (!confirm("Delete this yacht listing? This cannot be undone.")) return;
    setDeleting(yachtId);
    await supabase.from("yachts").delete().eq("id", yachtId).eq("owner_id", userId);
    setYachts(prev => prev.filter(y => y.id !== yachtId));
    if (selected === yachtId) setSelected(null);
    setDeleting(null);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-white/20 text-sm">Loading…</div>;
  }

  /* ── Empty state ── */
  if (yachts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Hero CTA */}
        <div className="relative bg-[#0f1d33] border border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,164,107,0.06),transparent_60%)]" />
          <div className="relative px-8 py-12 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Anchor size={28} className="text-primary/60" />
            </div>
            <h2 className="font-display text-3xl text-white mb-3">Submit Your Vessel</h2>
            <p className="text-white/40 text-sm font-sans leading-relaxed mb-8">
              List your yacht on PDYE's exclusive off-market exchange. Your listing remains confidential —
              only verified buyers approved by our team will gain access.
            </p>
            <Link
              href="/add-yacht"
              className="inline-flex items-center gap-2 bg-primary text-background px-8 py-4 font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors"
            >
              <Plus size={14} /> Submit Your Yacht
            </Link>
          </div>
        </div>

        {/* Process steps */}
        <div className="bg-[#0f1d33] border border-white/5 p-6">
          <p className="text-white/30 text-[10px] uppercase tracking-widest mb-6 font-sans">How It Works</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
            {[
              { step: "01", title: "Submit Details",  desc: "Fill in your vessel's specifications, photos, and your asking price." },
              { step: "02", title: "We Verify",       desc: "Our team reviews the submission and lists it in the Deal Room." },
              { step: "03", title: "Qualified Buyers", desc: "UHNW buyers request access and make private, NDA-protected approaches." },
            ].map(s => (
              <div key={s.step} className="px-6 py-4 first:pl-0 last:pr-0">
                <span className="font-display text-4xl text-primary/15 block mb-2">{s.step}</span>
                <p className="text-white text-sm font-medium mb-1">{s.title}</p>
                <p className="text-white/30 text-xs font-sans leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Valuation CTA */}
        <div className="flex items-center justify-between border border-white/5 bg-white/2 px-6 py-4">
          <div className="flex items-center gap-3">
            <Calculator size={16} className="text-primary/50" />
            <div>
              <p className="text-white text-sm font-medium">Not sure of your vessel's value?</p>
              <p className="text-white/30 text-xs font-sans">Use our AI-powered yacht valuation tool.</p>
            </div>
          </div>
          <Link href="/valuation" className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest hover:underline flex-shrink-0">
            Estimate Value <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    );
  }

  /* ── Has yachts ── */
  const step = dealStatusToStep(activeYacht?.deal_status ?? null);
  const thumb = activeYacht?.main_image || activeYacht?.image;

  return (
    <div className="space-y-6">

      {/* Vessel selector (if multiple) */}
      {yachts.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {yachts.map(y => (
            <button
              key={y.id}
              onClick={() => setSelected(y.id)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
                selected === y.id
                  ? "border-primary/50 text-primary bg-primary/8"
                  : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/70"
              }`}
            >
              {y.name || "Unnamed Vessel"}
            </button>
          ))}
        </div>
      )}

      {/* Active vessel card */}
      {activeYacht && (
        <div className="bg-[#0f1d33] border border-white/5 overflow-hidden">
          <div className="flex items-stretch gap-0">
            {/* Image */}
            <div className="hidden sm:block w-40 flex-shrink-0 bg-white/3">
              {thumb
                ? <img src={thumb} alt={activeYacht.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Ship size={24} className="text-white/10" /></div>
              }
            </div>
            {/* Info */}
            <div className="flex-1 p-6 flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white font-display text-xl mb-0.5">{activeYacht.name}</p>
                  <p className="text-white/40 text-xs font-sans">
                    {[activeYacht.builder, activeYacht.length, activeYacht.year].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/add-yacht?edit=${activeYacht.id}`} className="p-2 border border-white/10 text-white/30 hover:text-primary hover:border-primary/30 transition-colors" title="Edit">
                    <FileText size={13} />
                  </Link>
                  <button
                    onClick={() => deleteYacht(activeYacht.id)}
                    disabled={deleting === activeYacht.id}
                    className="p-2 border border-white/10 text-white/30 hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-30"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Status + action */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {activeYacht.deal_status === "rejected" ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 border border-red-400/20 bg-red-400/5 px-3 py-1.5">
                    <XCircle size={10} /> Submission Rejected
                  </span>
                ) : activeYacht.deal_status === "approved" ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-400 border border-green-400/20 bg-green-400/5 px-3 py-1.5">
                    <CheckCircle size={10} /> Live in Deal Room
                  </span>
                ) : activeYacht.deal_status === "pending" ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400 border border-yellow-400/20 bg-yellow-400/5 px-3 py-1.5">
                    <Clock size={10} /> Awaiting Review
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30 border border-white/10 bg-white/3 px-3 py-1.5">
                    <CircleDot size={10} /> Not Submitted
                  </span>
                )}

                {(!activeYacht.deal_status || activeYacht.deal_status === "none" || activeYacht.deal_status === "rejected") && (
                  <button
                    onClick={() => submitToDealRoom(activeYacht.id)}
                    disabled={submitting === activeYacht.id}
                    className="flex items-center gap-2 bg-primary text-background px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {submitting === activeYacht.id ? "Submitting…" : <><Send size={11} /> Submit to Deal Room</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline tracker */}
      <div className="bg-[#0f1d33] border border-white/5 p-6">
        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-6 font-sans">Sale Pipeline</p>
        <div className="relative">
          {/* Connector line */}
          <div className="absolute top-5 left-5 right-5 h-px bg-white/5" />
          <div className="flex justify-between relative z-10">
            {PIPELINE.map((p, i) => {
              const done = step >= i;
              const active = step === i;
              return (
                <div key={p.key} className="flex flex-col items-center gap-2 flex-1">
                  <div className={`w-10 h-10 border flex items-center justify-center transition-all ${
                    done
                      ? active
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-primary/30 bg-primary/5 text-primary/60"
                      : "border-white/10 bg-background text-white/15"
                  }`}>
                    {p.icon}
                  </div>
                  <p className={`text-[9px] font-bold uppercase tracking-wider text-center leading-tight ${done ? "text-primary/70" : "text-white/20"}`}>
                    {p.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        {step >= 0 && (
          <p className="text-white/30 text-xs font-sans mt-5 text-center">
            {PIPELINE[step]?.desc}
          </p>
        )}
        {step < 0 && (
          <p className="text-white/20 text-xs font-sans mt-5 text-center">Submit your vessel to begin the pipeline.</p>
        )}
      </div>

      {/* Add another / valuation row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/add-yacht" className="flex items-center gap-3 border border-white/5 hover:border-primary/30 bg-[#0f1d33] px-5 py-4 transition-all group">
          <div className="w-9 h-9 border border-white/10 group-hover:border-primary/30 flex items-center justify-center text-primary/50 transition-all">
            <Plus size={16} />
          </div>
          <div>
            <p className="text-white text-sm font-medium">Add Another Vessel</p>
            <p className="text-white/30 text-xs font-sans">Submit an additional yacht listing.</p>
          </div>
          <ChevronRight size={13} className="ml-auto text-white/20 group-hover:text-primary transition-colors" />
        </Link>

        <Link href="/valuation" className="flex items-center gap-3 border border-white/5 hover:border-primary/30 bg-[#0f1d33] px-5 py-4 transition-all group">
          <div className="w-9 h-9 border border-white/10 group-hover:border-primary/30 flex items-center justify-center text-primary/50 transition-all">
            <Calculator size={16} />
          </div>
          <div>
            <p className="text-white text-sm font-medium">AI Valuation</p>
            <p className="text-white/30 text-xs font-sans">Estimate your vessel's current market value.</p>
          </div>
          <ChevronRight size={13} className="ml-auto text-white/20 group-hover:text-primary transition-colors" />
        </Link>
      </div>

    </div>
  );
}

/* ─── ADMIN VIEW ─── */
function AdminDashboard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { href: "/admin", icon: <LayoutDashboard size={18} />, label: "Admin Panel", desc: "Full dashboard with all management tools" },
          { href: "/admin-requests", icon: <CheckCircle size={18} />, label: "Access Requests", desc: "Approve or reject buyer access requests" },
          { href: "/admin-users", icon: <User size={18} />, label: "User Management", desc: "Manage roles and account approval" },
          { href: "/dealroom", icon: <TrendingUp size={18} />, label: "Deal Room", desc: "View all active deal room listings" },
        ].map(item => (
          <Link key={item.href} href={item.href} className="flex items-center gap-4 bg-[#0f1d33] border border-white/5 hover:border-primary/30 p-5 transition-all group">
            <div className="w-10 h-10 border border-white/10 flex items-center justify-center text-primary/60 group-hover:border-primary/30 group-hover:text-primary transition-all flex-shrink-0">
              {item.icon}
            </div>
            <div>
              <p className="text-white text-sm font-medium">{item.label}</p>
              <p className="text-white/30 text-xs font-sans mt-0.5">{item.desc}</p>
            </div>
            <ChevronRight size={14} className="ml-auto text-white/20 group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── MAIN DASHBOARD ─── */
export default function Dashboard() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;

  const role = userProfile?.role || "investor";
  const approved = userProfile?.approved;
  const email = userProfile?.email || user.email || "";

  const ROLE_DISPLAY: Record<string, { label: string; style: string }> = {
    investor: { label: "Private Buyer", style: "text-blue-400 border-blue-400/30 bg-blue-400/8" },
    broker:   { label: "Broker",        style: "text-purple-400 border-purple-400/30 bg-purple-400/8" },
    owner:    { label: "Yacht Owner",   style: "text-yellow-400 border-yellow-400/30 bg-yellow-400/8" },
    admin:    { label: "Administrator", style: "text-primary border-primary/30 bg-primary/8" },
  };
  const roleDisplay = ROLE_DISPLAY[role] || ROLE_DISPLAY.investor;

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-6">

          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-white/40 text-xs font-sans tracking-widest uppercase mb-1">Dashboard</p>
              <h1 className="font-display text-3xl md:text-4xl text-white">Welcome back</h1>
              <p className="text-white/50 font-sans text-sm mt-1">{email}</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Role badge */}
              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border ${roleDisplay.style}`}>
                {roleDisplay.label}
              </span>
              {/* Status badge */}
              {approved ? (
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-400 border border-green-500/20 bg-green-500/8 px-3 py-1.5">
                  <ShieldCheck size={11} /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400 border border-yellow-500/20 bg-yellow-500/8 px-3 py-1.5">
                  <Clock size={11} /> Under Review
                </span>
              )}
            </div>
          </div>

          {/* Under review notice */}
          {!approved && role !== "admin" && (
            <div className="mb-6 flex items-start gap-3 border border-yellow-500/20 bg-yellow-500/5 px-5 py-4">
              <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-white/60 text-sm font-sans leading-relaxed">
                Your account is under review. Some features are restricted until our team verifies your profile.
                Typical review time: 24–48 hours.
              </p>
            </div>
          )}

          {/* Role-based content */}
          {role === "admin" && <AdminDashboard />}
          {role === "broker" && <ListingsDashboard userId={user.id} role={role} />}
          {(role === "investor" || role === "buyer") && <BuyerDashboard userId={user.id} />}
          {role === "owner" && <OwnerDashboard userId={user.id} />}

        </div>
      </div>
    </Layout>
  );
}
