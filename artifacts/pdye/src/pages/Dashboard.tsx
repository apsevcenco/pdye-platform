import { useEffect, useState, useCallback } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { dealRoomApi } from "@/lib/dealRoomApi";
import { yachtModerationApi, LISTING_STATUS_LABEL, LISTING_STATUS_STYLE, type ListingStatus } from "@/lib/yachtModerationApi";
import { Layout } from "@/components/layout/Layout";
import type { DealRoom } from "@/lib/dealTypes";
import {
  User, Clock, CheckCircle, XCircle, Ship, Plus, TrendingUp,
  LayoutDashboard, ArrowRight, FileText, Lock, ShieldCheck,
  Trash2, Eye, Send, AlertTriangle, ChevronRight, RefreshCw, Pencil,
  Anchor, Calculator, BadgeCheck, Handshake, CircleDot, MessageSquareWarning,
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
  listing_status: string | null;
  listing_review_comment: string | null;
};

/* ─── Status helpers ─── */
const REQ_STATUS: Record<string, { label: string; icon: React.ReactNode; style: string }> = {
  pending:       { label: "Under Review",    icon: <Clock size={11} />,       style: "text-yellow-400 border-yellow-500/20 bg-yellow-500/8" },
  approved:      { label: "Under Review",    icon: <Clock size={11} />,       style: "text-yellow-400 border-yellow-500/20 bg-yellow-500/8" },
  approved_spec: { label: "Under Review",    icon: <Clock size={11} />,       style: "text-yellow-400 border-yellow-500/20 bg-yellow-500/8" },
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
export function BuyerDashboard({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [dealRoomCount, setDealRoomCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    // Fetch access requests + active deal rooms in parallel.
    const [rqsRes, roomsRes] = await Promise.all([
      supabase
        .from("access_requests")
        .select("id, yacht_id, status, created_at")
        .eq("requester_id", userId)
        .order("created_at", { ascending: false }),
      dealRoomApi.byUser(userId).catch(() => []),
    ]);

    const rqs = rqsRes.data;
    const activeRooms = (roomsRes || []).filter(
      (r: any) => r.status !== "cancelled" && !r.archived
    );
    setDealRoomCount(activeRooms.length);

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

  // Legacy "approved" / "approved_spec" records are now treated as pending
  // (Spec Access flow has been retired) — count them in Under Review.
  const isUnderReview = (s: string) =>
    s === "pending" || s === "approved" || s === "approved_spec";
  const underReview = requests.filter(r => isUnderReview(r.status));
  // "In Deal Room" reflects the actual deal_rooms (access requests are deleted
  // once a room is created). We add any legacy escalated records as a fallback
  // so historical counts don't drop to zero.
  const legacyEscalated = requests.filter(r => r.status === "escalated").length;
  const inDealRoomCount = Math.max(dealRoomCount, legacyEscalated);
  const rejected = requests.filter(r => r.status === "rejected");

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
        {[
          { label: "Total Requests", value: requests.length, icon: <Ship size={16} /> },
          { label: "Under Review",   value: underReview.length, icon: <Clock size={16} /> },
          { label: "In Deal Room",   value: inDealRoomCount, icon: <CheckCircle size={16} /> },
          { label: "Rejected",       value: rejected.length, icon: <XCircle size={16} /> },
        ].map(s => (
          <div key={s.label} className="bg-background flex flex-col items-center justify-center gap-1.5 py-4 sm:py-6 text-center">
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
                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4">
                  <div>
                    <p className="text-white text-sm font-medium">{req.yacht_name}</p>
                    <p className="text-white/30 text-xs font-sans mt-0.5">{new Date(req.created_at).toLocaleDateString("en-GB")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border ${cfg.style}`}>
                      {cfg.icon} {cfg.label}
                    </span>
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
  const [rooms, setRooms] = useState<(DealRoom & { yacht_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [, setLocation] = useLocation();

  function goToRoom(roomId: string) {
    sessionStorage.setItem("pdye_origin", "dashboard");
    setLocation(`/dealroom/${roomId}`);
  }

  useEffect(() => {
    async function loadRooms() {
      try {
        const allRooms = await dealRoomApi.byUser(userId);
        const filtered = (allRooms || []).filter((r: any) => r.status !== "cancelled");
        if (filtered.length > 0) {
          const yachtIds = [...new Set(filtered.map((r: any) => r.yacht_id))];
          const { data: yachts } = await supabase.from("yachts").select("id, name").in("id", yachtIds);
          const yachtMap = Object.fromEntries((yachts || []).map((y: any) => [y.id, y.name]));
          setRooms(filtered.map((r: any) => ({ ...r, yacht_name: yachtMap[r.yacht_id] || "Vessel" })));
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

  const visibleRooms = rooms.filter(r => showArchived ? r.archived : !r.archived);
  const archivedCount = rooms.filter(r => r.archived).length;

  function getRoomStatusLabel(room: DealRoom & { yacht_name?: string }) {
    if (room.identities_revealed) return { label: "Fully Unlocked", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/8" };
    if (room.commission_status === "pending" || room.buyer_commission_status === "sent" || room.seller_commission_status === "sent")
      return { label: "Commission Pending", color: "text-purple-400 border-purple-500/20 bg-purple-500/8" };
    return ROOM_STYLE[room.status] || ROOM_STYLE.draft;
  }

  const roomLabel = (r: DealRoom) => r.room_number ? `DR-${String(r.room_number).padStart(6, "0")}` : "";

  return (
    <Block
      title="My Deal Rooms"
      action={archivedCount > 0 ? (
        <button onClick={() => setShowArchived(!showArchived)} className="text-white/30 hover:text-primary text-[10px] font-bold uppercase tracking-widest transition-colors">
          {showArchived ? "Hide Archived" : `Archived (${archivedCount})`}
        </button>
      ) : undefined}
    >
      {visibleRooms.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-white/20 text-sm font-sans">
          {showArchived ? "No archived rooms" : "No active rooms"}
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {visibleRooms.map(room => {
            const cfg = getRoomStatusLabel(room);
            const needsNda = room.status === "nda_pending" || room.status === "partially_signed";
            const needsCommission = room.buyer_commission_status === "sent" || room.seller_commission_status === "sent";
            const label = roomLabel(room);
            return (
              <div key={room.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white text-sm font-medium">{room.yacht_name}</p>
                    {label && <span className="text-primary/50 text-[10px] font-mono">{label}</span>}
                    {room.archived && <span className="text-[9px] text-white/20 bg-white/5 px-1.5 py-0.5">ARCHIVED</span>}
                  </div>
                  <p className="text-white/30 text-xs font-sans mt-0.5">{new Date(room.created_at).toLocaleDateString("en-GB")}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {needsNda && (
                    <button onClick={() => goToRoom(room.id)} className="flex items-center gap-1 bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider px-3 py-1.5 hover:bg-orange-500/30 transition-colors">
                      Sign NDA <ChevronRight size={11} />
                    </button>
                  )}
                  {needsCommission && (
                    <button onClick={() => goToRoom(room.id)} className="flex items-center gap-1 bg-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider px-3 py-1.5 hover:bg-purple-500/30 transition-colors">
                      Sign Commission <ChevronRight size={11} />
                    </button>
                  )}
                  {room.status === "active" && !needsCommission && (
                    <button onClick={() => goToRoom(room.id)} className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider hover:underline">
                      Open Room <ChevronRight size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Block>
  );
}

/* ─── BROKER / OWNER VIEW ─── */
export function ListingsDashboard({ userId, role }: { userId: string; role: string }) {
  const [yachts, setYachts] = useState<MyYacht[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    // Try with the moderation columns; fall back gracefully if the migration hasn't been run yet.
    let { data, error } = await supabase
      .from("yachts")
      .select("id, name, builder, length, year, status, deal_status, is_private, created_at, main_image, image, listing_status, listing_review_comment")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    if (error && /column .* does not exist|Could not find the .* column/i.test(error.message)) {
      const retry = await supabase
        .from("yachts")
        .select("id, name, builder, length, year, status, deal_status, is_private, created_at, main_image, image")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });
      data = retry.data as any;
    }
    setYachts((data as MyYacht[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function submitForApproval(yachtId: string) {
    setSubmitting(yachtId);
    setSubmitError(null);
    try {
      await yachtModerationApi.submit(yachtId);
      setYachts(prev => prev.map(y => y.id === yachtId
        ? { ...y, listing_status: "pending", listing_review_comment: null }
        : y));
    } catch (e: any) {
      setSubmitError(e?.message || "Could not submit listing for approval");
    } finally {
      setSubmitting(null);
    }
  }

  async function deleteYacht(yachtId: string) {
    if (!confirm("Delete this yacht listing? This cannot be undone.")) return;
    setDeleting(yachtId);
    await supabase.from("yachts").delete().eq("id", yachtId).eq("owner_id", userId);
    setYachts(prev => prev.filter(y => y.id !== yachtId));
    setDeleting(null);
  }

  function listingCfg(s: string | null | undefined) {
    const key = (s || "draft") as ListingStatus;
    return {
      label: LISTING_STATUS_LABEL[key] ?? "Draft",
      style: LISTING_STATUS_STYLE[key] ?? LISTING_STATUS_STYLE.draft,
    };
  }

  const label = role === "broker" ? "My Listings" : "My Yachts";

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
        {[
          { label: "Total Listings",   value: yachts.length },
          { label: "Live in Catalogue", value: yachts.filter(y => (y.listing_status || "approved") === "approved").length },
          { label: "Awaiting Review",  value: yachts.filter(y => y.listing_status === "pending").length },
          { label: "Changes Requested", value: yachts.filter(y => y.listing_status === "rejected").length },
        ].map(s => (
          <div key={s.label} className="bg-background flex flex-col items-center justify-center gap-1.5 py-6 text-center">
            <span className="font-display text-3xl text-white">{s.value}</span>
            <span className="text-white/30 text-[10px] uppercase tracking-widest font-sans">{s.label}</span>
          </div>
        ))}
      </div>

      {submitError && (
        <div className="bg-red-500/8 border border-red-500/20 px-4 py-3 text-red-400 text-xs font-sans flex items-center justify-between">
          <span>{submitError}</span>
          <button onClick={() => setSubmitError(null)} className="text-red-400/60 hover:text-red-400 text-base leading-none">×</button>
        </div>
      )}

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
              const lst = listingCfg(yacht.listing_status);
              const lstKey = (yacht.listing_status || "draft") as ListingStatus;
              // New listings are auto-submitted from the AddYacht form, so
              // most listings will already be 'pending' here. Still allow
              // submit for 'draft' (legacy data, or fallback when auto-submit
              // failed) and 'rejected' (owner edited and resubmits).
              const canSubmit = lstKey === "draft" || lstKey === "rejected";
              const thumb = yacht.main_image || yacht.image;
              return (
                <div key={yacht.id} className="flex flex-col gap-2 px-6 py-4 hover:bg-white/2 transition-colors group">
                  <div className="flex items-center gap-4">
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

                    {/* Listing status (publication) */}
                    <span className={`hidden sm:flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${lst.style}`} title="Publication status">
                      {lst.label}
                    </span>

                    {/* Deal status */}
                    <span className={`hidden lg:flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${dealCfg.style}`} title="Deal Room status">
                      {dealCfg.label}
                    </span>

                    {/* Private badge */}
                    {yacht.is_private && (
                      <span className="hidden xl:flex items-center gap-1 text-[10px] text-primary/60 border border-primary/20 px-2 py-0.5">
                        <Lock size={9} /> Private
                      </span>
                    )}

                    {/* Actions — always visible (mobile-friendly) */}
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/yacht/${yacht.id}`}
                        className="flex items-center gap-1.5 px-2 py-1.5 text-white/60 hover:text-primary hover:bg-primary/5 transition-colors text-xs uppercase tracking-wider font-bold"
                        title="View"
                      >
                        <Eye size={13} />
                        <span className="hidden md:inline">View</span>
                      </Link>
                      <Link
                        href={`/add-yacht?edit=${yacht.id}`}
                        className="flex items-center gap-1.5 px-2 py-1.5 text-primary hover:bg-primary hover:text-background transition-colors text-xs uppercase tracking-wider font-bold border border-primary/30"
                        title="Edit listing"
                      >
                        <Pencil size={13} />
                        <span className="hidden md:inline">Edit</span>
                      </Link>
                      {canSubmit && (
                        <button
                          onClick={() => submitForApproval(yacht.id)}
                          disabled={submitting === yacht.id}
                          className="flex items-center gap-1.5 px-2 py-1.5 text-yellow-400 hover:bg-yellow-400/10 transition-colors disabled:opacity-30 text-xs uppercase tracking-wider font-bold"
                          title={lstKey === "rejected" ? "Resubmit for Approval" : "Submit for Approval"}
                        >
                          <Send size={13} />
                          <span className="hidden md:inline">{lstKey === "rejected" ? "Resubmit" : "Submit"}</span>
                        </button>
                      )}
                      <button
                        onClick={() => deleteYacht(yacht.id)}
                        disabled={deleting === yacht.id}
                        className="flex items-center px-2 py-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-30"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Rejection comment (visible on the row) */}
                  {lstKey === "rejected" && yacht.listing_review_comment && (
                    <div className="ml-[72px] flex items-start gap-2 border-l-2 border-red-400/40 bg-red-400/5 px-3 py-2">
                      <MessageSquareWarning size={13} className="text-red-400/80 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-red-400/90 text-[10px] uppercase tracking-widest font-bold mb-1">Admin requested changes</p>
                        <p className="text-white/70 text-xs font-sans whitespace-pre-wrap">{yacht.listing_review_comment}</p>
                      </div>
                    </div>
                  )}
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
  const [rooms, setRooms] = useState<(DealRoom & { yacht_name?: string; my_side?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [, setLocation] = useLocation();

  function goToRoom(roomId: string) {
    sessionStorage.setItem("pdye_origin", "dashboard");
    setLocation(`/dealroom/${roomId}`);
  }

  useEffect(() => {
    async function load() {
      try {
        const allRooms = await dealRoomApi.byUser(userId);
        const filtered = (allRooms || []).filter((r: any) => r.status !== "cancelled");
        if (filtered.length > 0) {
          const yachtIds = [...new Set(filtered.map((r: any) => r.yacht_id))];
          const { data: yachts } = await supabase.from("yachts").select("id, name").in("id", yachtIds);
          const yachtMap = Object.fromEntries((yachts || []).map((y: any) => [y.id, y.name]));
          setRooms(filtered.map((r: any) => ({
            ...r,
            yacht_name: yachtMap[r.yacht_id] || "Vessel",
            my_side: r.buyer_user_id === userId ? "Buyer" : r.seller_user_id === userId ? "Seller" : "—",
          })));
        }
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading || rooms.length === 0) return null;

  const visibleRooms = rooms.filter(r => showArchived ? r.archived : !r.archived);
  const archivedCount = rooms.filter(r => r.archived).length;
  const needsAction = rooms.filter(r => !r.archived && (
    (r.buyer_user_id === userId && (r.buyer_nda_status === "sent" || r.buyer_commission_status === "sent")) ||
    (r.seller_user_id === userId && (r.seller_nda_status === "sent" || r.seller_commission_status === "sent"))
  ));

  const roomLabel = (r: DealRoom) => r.room_number ? `DR-${String(r.room_number).padStart(6, "0")}` : "";

  return (
    <>
      {needsAction.length > 0 && (
        <div className="bg-orange-500/5 border border-orange-500/20 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-orange-500/15 flex items-center justify-center"><AlertTriangle size={16} className="text-orange-400" /></div>
            <div>
              <p className="text-orange-400 text-sm font-bold">Action Required</p>
              <p className="text-white/40 text-xs font-sans">You have documents waiting for your signature</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {needsAction.map(room => {
              const isNda = (room.buyer_user_id === userId && room.buyer_nda_status === "sent") || (room.seller_user_id === userId && room.seller_nda_status === "sent");
              return (
                <div key={room.id} onClick={() => goToRoom(room.id)}
                  className="flex items-center justify-between px-3 py-2 bg-orange-500/5 hover:bg-orange-500/10 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{room.yacht_name}</span>
                    {roomLabel(room) && <span className="text-primary/40 text-[10px] font-mono">{roomLabel(room)}</span>}
                  </div>
                  <span className="text-orange-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:underline">
                    {isNda ? "Sign NDA" : "Sign Commission"} <ChevronRight size={11} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Block
        title="My Deal Rooms"
        action={archivedCount > 0 ? (
          <button onClick={() => setShowArchived(!showArchived)} className="text-white/30 hover:text-primary text-[10px] font-bold uppercase tracking-widest transition-colors">
            {showArchived ? "Hide Archived" : `Archived (${archivedCount})`}
          </button>
        ) : undefined}
      >
        {visibleRooms.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-white/20 text-sm font-sans">
            {showArchived ? "No archived rooms" : "No active rooms"}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {visibleRooms.map(room => {
              const isActive = room.status === "active";
              return (
                <div key={room.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-sm font-medium">{room.yacht_name}</p>
                      {roomLabel(room) && <span className="text-primary/40 text-[10px] font-mono">{roomLabel(room)}</span>}
                      <span className="text-[9px] text-white/20 bg-white/5 px-1.5 py-0.5">{room.my_side}</span>
                      {room.archived && <span className="text-[9px] text-white/20 bg-white/5 px-1.5 py-0.5">ARCHIVED</span>}
                    </div>
                    <p className="text-white/30 text-xs font-sans mt-0.5">{new Date(room.created_at).toLocaleDateString("en-GB")}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border ${isActive ? "text-green-400 border-green-500/20" : room.identities_revealed ? "text-emerald-400 border-emerald-500/20" : "text-white/40 border-white/10"}`}>
                      {room.identities_revealed ? "Fully Unlocked" : room.status.replace(/_/g, " ")}
                    </span>
                    <button onClick={() => goToRoom(room.id)} className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider hover:underline">
                      Open <ChevronRight size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Block>
    </>
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

export function OwnerDashboard({ userId }: { userId: string }) {
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

        <MyDealRoomsSection userId={userId} />

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
                  <Link
                    href={`/yacht/${activeYacht.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 border border-white/10 text-white/60 hover:text-primary hover:border-primary/30 transition-colors text-xs uppercase tracking-wider font-bold"
                    title="View"
                  >
                    <Eye size={13} /> View
                  </Link>
                  <Link
                    href={`/add-yacht?edit=${activeYacht.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 border border-primary/30 text-primary hover:bg-primary hover:text-background transition-colors text-xs uppercase tracking-wider font-bold"
                    title="Edit listing"
                  >
                    <Pencil size={13} /> Edit
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

      <MyDealRoomsSection userId={userId} />

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
  const [, setLocation] = useLocation();
  const items = [
    { href: "/admin", icon: <LayoutDashboard size={18} />, label: "Admin Panel", desc: "Full dashboard with all management tools" },
    { href: "/admin-requests", icon: <CheckCircle size={18} />, label: "Access Requests", desc: "Approve or reject buyer access requests" },
    { href: "/admin-users", icon: <User size={18} />, label: "User Management", desc: "Manage roles and account approval" },
    { id: "dealroom", icon: <TrendingUp size={18} />, label: "Deal Room", desc: "View all active deal room listings" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(item => {
          const isDealRoom = "id" in item && item.id === "dealroom";
          return (
            <div
              key={isDealRoom ? "dealroom" : item.href}
              onClick={() => {
                if (isDealRoom) {
                  sessionStorage.setItem("pdye_admin_view", "dealroom");
                  setLocation("/admin");
                } else {
                  setLocation(item.href!);
                }
              }}
              className="flex items-center gap-4 bg-[#0f1d33] border border-white/5 hover:border-primary/30 p-5 transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 border border-white/10 flex items-center justify-center text-primary/60 group-hover:border-primary/30 group-hover:text-primary transition-all flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-white/30 text-xs font-sans mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight size={14} className="ml-auto text-white/20 group-hover:text-primary transition-colors" />
            </div>
          );
        })}
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

  // Dashboard is admin-only. All other roles see their workspace inside Profile.
  if (role !== "admin") return <Redirect to="/profile" />;

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
        <div className="max-w-5xl mx-auto px-3 sm:px-6">

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

          {/* Admin content (other roles redirected to /profile above) */}
          <AdminDashboard />

        </div>
      </div>
    </Layout>
  );
}
