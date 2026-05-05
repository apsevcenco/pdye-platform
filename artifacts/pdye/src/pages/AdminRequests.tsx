import { useEffect, useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { dealRoomApi } from "@/lib/dealRoomApi";
import {
  CheckCircle, XCircle, Clock, ArrowLeft, Ship, User,
  Calendar, Filter, RefreshCw, Eye, Plus, ArrowRight, Users,
} from "lucide-react";
import type { AccessRequestStatus, DealRoom } from "@/lib/dealTypes";
import { ACCESS_STATUS_CONFIG } from "@/lib/dealTypes";
import { useAuth } from "@/context/AuthContext";

type FilterTab = "all" | "pending" | "rejected" | "escalated";

type AccessRequest = {
  id: string;
  yacht_id: string;
  requester_id: string;
  role: string;
  status: string;
  approved_spec_access: boolean;
  approved_spec_access_at: string | null;
  escalated_to_deal_room: boolean;
  deal_room_id: string | null;
  created_at: string;
  updated_at: string;
  yacht_name?: string;
  user_email?: string;
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock size={12} />,
  approved_spec: <Clock size={12} />,
  approved: <Clock size={12} />,
  rejected: <XCircle size={12} />,
  escalated: <CheckCircle size={12} />,
  archived: <XCircle size={12} />,
};

const STATUS_STYLE: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  approved_spec: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  approved: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  rejected: "text-red-400 bg-red-500/10 border-red-500/20",
  escalated: "text-green-400 bg-green-500/10 border-green-500/20",
  archived: "text-white/30 bg-white/5 border-white/10",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Under Review",
  approved_spec: "Under Review",
  approved: "Under Review",
  rejected: "Rejected",
  escalated: "In Deal Room",
  archived: "Archived",
};

export default function AdminRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creatingRoom, setCreatingRoom] = useState<string | null>(null);
  const [sellerModal, setSellerModal] = useState<{ reqId: string; yachtId: string } | null>(null);
  const [sellerEmail, setSellerEmail] = useState("");
  const [sellerType, setSellerType] = useState<"broker" | "owner">("broker");
  const [allUsers, setAllUsers] = useState<{ id: string; email: string; role: string }[]>([]);
  const [rejectModal, setRejectModal] = useState<{ reqId: string; userEmail: string; yachtName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  async function load() {
    setLoading(true);
    const { data: rqs, error } = await supabase
      .from("access_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !rqs) { setLoading(false); return; }

    const yachtIds = [...new Set(rqs.map((r: any) => r.yacht_id).filter(Boolean))];
    const userIds = [...new Set(rqs.map((r: any) => r.requester_id).filter(Boolean))];

    const [{ data: yachts }, { data: users }] = await Promise.all([
      yachtIds.length ? supabase.from("yachts").select("id, name").in("id", yachtIds) : Promise.resolve({ data: [] }),
      userIds.length ? supabase.from("users").select("id, email").in("id", userIds) : Promise.resolve({ data: [] }),
    ]);

    const yachtMap = Object.fromEntries((yachts || []).map((y: any) => [y.id, y.name]));
    const userMap = Object.fromEntries((users || []).map((u: any) => [u.id, u.email]));

    const enriched: AccessRequest[] = rqs.map((r: any) => ({
      ...r,
      approved_spec_access: r.approved_spec_access ?? false,
      escalated_to_deal_room: r.escalated_to_deal_room ?? false,
      deal_room_id: r.deal_room_id ?? null,
      yacht_name: yachtMap[r.yacht_id] || "Unknown Vessel",
      user_email: userMap[r.requester_id] || "—",
    }));

    setRequests(enriched);
    setLoading(false);
  }

  async function loadUsers() {
    const { data } = await supabase.from("users").select("id, email, role").order("email");
    setAllUsers(data || []);
  }

  useEffect(() => { load(); loadUsers(); }, []);

  function normalizeStatus(status: string): string {
    // Legacy "approved" / "approved_spec" records are now treated as "pending"
    // since the spec-access flow has been retired.
    if (status === "approved" || status === "approved_spec") return "pending";
    return status;
  }

  function openRejectModal(id: string) {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    setRejectModal({
      reqId: id,
      userEmail: req.user_email || "—",
      yachtName: req.yacht_name || "Unknown Vessel",
    });
    setRejectReason("");
    setRejectError("");
  }

  async function submitReject() {
    if (!rejectModal) return;
    const id = rejectModal.reqId;
    setUpdating(id);
    setRejectError("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setRejectError("Authentication expired. Please re-login.");
        setUpdating(null);
        return;
      }

      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const resp = await fetch(`${apiBase}/access-requests/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: rejectReason.trim(),
          siteUrl: window.location.origin,
        }),
      });

      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setRejectError(body?.error || `Server error (${resp.status})`);
        setUpdating(null);
        return;
      }

      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
      setRejectModal(null);
      setRejectReason("");

      if (body?.warning) {
        // Surface non-fatal issue (e.g. email failed but DB updated).
        console.warn("[reject]", body.warning);
        alert(body.warning);
      }
    } catch (err: any) {
      setRejectError(err?.message || "Network error");
    } finally {
      setUpdating(null);
    }
  }

  function openCreateRoomModal(reqId: string, yachtId: string) {
    setSellerModal({ reqId, yachtId });
    setSellerEmail("");
    setSellerType("broker");
  }

  async function createDealRoom() {
    if (!sellerModal || !user) return;
    setCreatingRoom(sellerModal.reqId);
    const req = requests.find(r => r.id === sellerModal.reqId);
    if (!req) { setCreatingRoom(null); return; }

    const sellerUser = allUsers.find(u => u.email === sellerEmail);
    const now = new Date().toISOString();

    const room = await dealRoomApi.create({
      yacht_id: req.yacht_id,
      created_by_admin_id: user.id,
      buyer_user_id: req.requester_id,
      seller_user_id: sellerUser?.id || null,
      notes: "",
      status: "draft",
      nda_required: true,
    });

    if (!room?.id) { setCreatingRoom(null); return; }

    await dealRoomApi.addParticipant(room.id, { user_id: req.requester_id, role: "buyer", side: "buyer", can_view: false, can_message: false, can_download: false });
    await dealRoomApi.addParticipant(room.id, { user_id: user.id, role: "admin", side: "platform", can_view: true, can_message: true, can_download: true });
    if (sellerUser) {
      await dealRoomApi.addParticipant(room.id, { user_id: sellerUser.id, role: sellerType, side: "seller", can_view: false, can_message: false, can_download: false });
    }

    // Write the audit log FIRST so provenance from deal_room → access_request
    // is durable even if the subsequent delete fails or is interrupted.
    await dealRoomApi.createAuditLog({
      entity_type: "deal_room",
      entity_id: room.id,
      user_id: user.id,
      action: "deal_room_created",
      meta: {
        yacht_id: req.yacht_id,
        buyer_id: req.requester_id,
        seller_id: sellerUser?.id,
        access_request_id: req.id,
        created_at: now,
      },
    });

    await dealRoomApi.sendMessage(room.id, {
      sender_id: user.id,
      message: "Deal room created. NDA will be sent to both parties for review and signature.",
      is_system: true,
    });

    // Last step: delete the access request now that all dependent records exist
    // (same pattern as leads on approve). Best-effort — if it fails we keep the
    // row in the UI so the admin can retry, and we record the failure in audit.
    const { error: delErr } = await supabase
      .from("access_requests")
      .delete()
      .eq("id", req.id);

    if (delErr) {
      console.warn(
        "[AdminRequests] failed to delete access_request after deal room creation:",
        delErr.message
      );
      try {
        await dealRoomApi.createAuditLog({
          entity_type: "access_request",
          entity_id: req.id,
          user_id: user.id,
          action: "access_request_delete_failed",
          meta: { deal_room_id: room.id, error: delErr.message },
        });
      } catch {}
      // Keep the row visible so admin sees something needs attention.
    } else {
      setRequests(prev => prev.filter(r => r.id !== req.id));
    }

    setSellerModal(null);
    setCreatingRoom(null);
  }

  const filtered = (() => {
    if (filter === "all") return requests;
    return requests.filter(r => {
      const ns = normalizeStatus(r.status);
      return ns === filter;
    });
  })();

  const counts = {
    all: requests.length,
    pending: requests.filter(r => normalizeStatus(r.status) === "pending").length,
    rejected: requests.filter(r => r.status === "rejected").length,
    escalated: requests.filter(r => r.status === "escalated").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-white/5 bg-secondary">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2 text-white/40 hover:text-white text-sm font-sans transition-colors">
              <ArrowLeft size={14} /> Admin
            </Link>
            <span className="text-white/20 text-sm">/</span>
            <h1 className="font-display text-2xl text-white">Access Requests</h1>
          </div>
          <button onClick={load} className="flex items-center gap-2 text-white/30 hover:text-primary text-xs font-sans uppercase tracking-widest transition-colors">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        <div className="flex gap-2 mb-8 border-b border-white/5 pb-4 flex-wrap">
          {([
            { key: "all", label: "All", icon: <Filter size={11} /> },
            { key: "pending", label: "Pending", icon: <Clock size={11} /> },
            { key: "escalated", label: "In Deal Room", icon: <CheckCircle size={11} /> },
            { key: "rejected", label: "Rejected", icon: <XCircle size={11} /> },
          ] as { key: FilterTab; label: string; icon: React.ReactNode }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                filter === tab.key ? "text-primary border border-primary/30 bg-primary/5" : "text-white/40 border border-transparent hover:text-white/70"
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-sm ${filter === tab.key ? "bg-primary/20 text-primary" : "bg-white/5 text-white/30"}`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-white/30">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-sans">Loading requests…</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/30">
            <Clock size={36} className="mb-3 opacity-20" />
            <p className="text-sm font-sans">No {filter === "all" ? "" : filter.replace("_", " ")} requests.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(req => {
              const ns = normalizeStatus(req.status);
              const style = STATUS_STYLE[ns] || STATUS_STYLE.pending;
              const icon = STATUS_ICON[ns] || <Clock size={12} />;
              const label = STATUS_LABEL[ns] || req.status;
              const isExpanded = expanded === req.id;
              // Pending (incl. legacy approved/approved_spec) can be rejected or sent to a Deal Room.
              const canReject = ns === "pending";
              const canCreateRoom = ns === "pending" && !req.escalated_to_deal_room;

              return (
                <div key={req.id} className="bg-[#0f1d33] border border-white/5 hover:border-white/10 transition-colors">
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : req.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <User size={14} className="text-white/40" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{req.user_email}</p>
                        <p className="text-white/40 text-xs font-sans truncate capitalize">{req.role || "—"}</p>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2 flex-1 min-w-0">
                      <Ship size={13} className="text-primary/40 flex-shrink-0" />
                      <span className="text-white/60 text-sm font-sans truncate">{req.yacht_name}</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1 text-white/30 text-xs font-sans flex-shrink-0 w-28">
                      <Calendar size={11} />
                      {new Date(req.created_at).toLocaleDateString("en-GB")}
                    </div>

                    <div className="flex-shrink-0">
                      <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 border ${style}`}>
                        {icon} {label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {canReject && (
                        <button
                          onClick={e => { e.stopPropagation(); openRejectModal(req.id); }}
                          disabled={updating === req.id}
                          className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase tracking-wider px-3 py-1.5 transition-colors disabled:opacity-40"
                        >
                          <XCircle size={11} /> Reject
                        </button>
                      )}
                      {canCreateRoom && (
                        <button
                          onClick={e => { e.stopPropagation(); openCreateRoomModal(req.id, req.yacht_id); }}
                          disabled={creatingRoom === req.id}
                          className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 text-xs font-bold uppercase tracking-wider px-3 py-1.5 transition-colors disabled:opacity-40"
                        >
                          <Plus size={11} /> Create Deal Room
                        </button>
                      )}
                      {req.deal_room_id && (
                        <Link
                          href={`/dealroom/${req.deal_room_id}`}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 text-xs font-bold uppercase tracking-wider px-3 py-1.5 transition-colors"
                        >
                          <ArrowRight size={11} /> View Room
                        </Link>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-white/5 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Request ID</p>
                          <p className="text-white/60 font-sans text-xs break-all">{req.id}</p>
                        </div>
                        <div>
                          <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Yacht ID</p>
                          <p className="text-white/60 font-sans text-xs break-all">{req.yacht_id}</p>
                        </div>
                        <div>
                          <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Submitted</p>
                          <p className="text-white/60 font-sans text-xs">{new Date(req.created_at).toLocaleString("en-GB")}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {rejectModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={() => setRejectModal(null)}>
          <div className="bg-[#0f1d33] border border-red-500/30 max-w-md w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <XCircle size={18} className="text-red-400" />
              </div>
              <h3 className="font-display text-xl text-white">Reject Access Request</h3>
            </div>
            <div className="bg-white/3 border border-white/10 px-4 py-3 space-y-1">
              <p className="text-white/40 text-[10px] uppercase tracking-widest">Requester</p>
              <p className="text-white text-sm font-sans break-all">{rejectModal.userEmail}</p>
              <p className="text-white/40 text-[10px] uppercase tracking-widest pt-2">Yacht</p>
              <p className="text-white text-sm font-sans">{rejectModal.yachtName}</p>
            </div>
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-2 font-sans">
                Reason / Comment <span className="text-white/25 normal-case">(optional — included in the email)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Insufficient verification, vessel no longer available, …"
                rows={4}
                maxLength={1000}
                className="w-full bg-background border border-white/10 px-4 py-3 text-white text-sm font-sans focus:outline-none focus:border-red-400/40 resize-y"
              />
              <p className="text-white/25 text-[10px] font-sans mt-1">{rejectReason.length}/1000</p>
            </div>
            {rejectError && (
              <div className="bg-red-500/10 border border-red-500/30 px-4 py-2 text-red-300 text-xs font-sans">
                {rejectError}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={submitReject}
                disabled={updating === rejectModal.reqId}
                className="flex-1 bg-red-500 text-white py-3 font-bold text-xs uppercase tracking-widest hover:bg-red-500/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {updating === rejectModal.reqId
                  ? <><RefreshCw size={12} className="animate-spin" /> Rejecting…</>
                  : <><XCircle size={12} /> Reject & Notify</>}
              </button>
              <button
                onClick={() => setRejectModal(null)}
                disabled={updating === rejectModal.reqId}
                className="px-6 py-3 border border-white/10 text-white/50 text-xs uppercase tracking-widest hover:text-white hover:border-white/30 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {sellerModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={() => setSellerModal(null)}>
          <div className="bg-[#0f1d33] border border-white/10 max-w-md w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl text-white">Create Deal Room</h3>
            <p className="text-white/50 text-sm font-sans">
              This will create a dedicated deal room. The buyer (requester) is added automatically.
              Assign the seller below. NDA will be sent to both parties.
            </p>

            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-2 font-sans">Seller Type</label>
              <div className="flex gap-2">
                {(["broker", "owner"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setSellerType(t)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
                      sellerType === t ? "bg-primary/20 border-primary/40 text-primary" : "border-white/10 text-white/40 hover:text-white/70"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-2 font-sans">Seller Email (Platform User)</label>
              <input
                value={sellerEmail}
                onChange={e => setSellerEmail(e.target.value)}
                placeholder="seller@example.com"
                className="w-full bg-background border border-white/10 px-4 py-3 text-white text-sm font-sans focus:outline-none focus:border-primary/40"
                list="user-emails"
              />
              <datalist id="user-emails">
                {allUsers.filter(u => u.role !== "admin").map(u => (
                  <option key={u.id} value={u.email}>{u.email} ({u.role})</option>
                ))}
              </datalist>
              <p className="text-white/25 text-xs font-sans mt-1">Leave empty if seller is not yet on the platform.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={createDealRoom}
                disabled={!!creatingRoom}
                className="flex-1 bg-primary text-background py-3 font-bold text-xs uppercase tracking-widest hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {creatingRoom ? <><RefreshCw size={12} className="animate-spin" /> Creating…</> : <><Plus size={12} /> Create Deal Room</>}
              </button>
              <button
                onClick={() => setSellerModal(null)}
                className="px-6 py-3 border border-white/10 text-white/50 text-xs uppercase tracking-widest hover:text-white hover:border-white/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
