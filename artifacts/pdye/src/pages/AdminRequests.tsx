import { useEffect, useState } from "react";
import { Link } from "wouter";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  CheckCircle, XCircle, Clock, ArrowLeft, Ship, User,
  Calendar, Filter, RefreshCw,
} from "lucide-react";

type RequestStatus = "pending" | "approved" | "rejected";
type FilterTab = "all" | "pending" | "approved" | "rejected";

type AccessRequest = {
  id: string;
  yacht_id: string;
  requester_id: string;
  role: string;
  status: RequestStatus;
  created_at: string;
  yacht_name?: string;
  user_email?: string;
  user_name?: string;
};

const STATUS_CONFIG: Record<RequestStatus, { label: string; icon: React.ReactNode; style: string }> = {
  pending: { label: "Under Review", icon: <Clock size={12} />, style: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  approved: { label: "Approved", icon: <CheckCircle size={12} />, style: "text-green-400 bg-green-500/10 border-green-500/20" },
  rejected: { label: "Rejected", icon: <XCircle size={12} />, style: "text-red-400 bg-red-500/10 border-red-500/20" },
};

export default function AdminRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data: rqs, error } = await supabaseAdmin
      .from("access_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("access_requests error:", error.message);
      setLoading(false);
      return;
    }
    if (!rqs) { setLoading(false); return; }

    // Enrich with yacht names
    const yachtIds = [...new Set(rqs.map((r: any) => r.yacht_id).filter(Boolean))];
    const userIds = [...new Set(rqs.map((r: any) => r.requester_id).filter(Boolean))];

    const [{ data: yachts }, { data: users }] = await Promise.all([
      yachtIds.length ? supabaseAdmin.from("yachts").select("id, name").in("id", yachtIds) : Promise.resolve({ data: [] }),
      userIds.length ? supabaseAdmin.from("users").select("id, email").in("id", userIds) : Promise.resolve({ data: [] }),
    ]);

    const yachtMap = Object.fromEntries((yachts || []).map((y: any) => [y.id, y.name]));
    const userMap = Object.fromEntries((users || []).map((u: any) => [u.id, { email: u.email }]));

    const enriched: AccessRequest[] = rqs.map((r: any) => ({
      ...r,
      yacht_name: yachtMap[r.yacht_id] || "Unknown Vessel",
      user_email: userMap[r.requester_id]?.email || "—",
      user_name: userMap[r.requester_id]?.email || "—",
    }));

    setRequests(enriched);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: RequestStatus) {
    setUpdating(id);
    await supabaseAdmin.from("access_requests").update({ status }).eq("id", id);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    setUpdating(null);
  }

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

        {/* Filter tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/5 pb-4">
          {(["all", "pending", "approved", "rejected"] as FilterTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                filter === tab ? "text-primary border border-primary/30 bg-primary/5" : "text-white/40 border border-transparent hover:text-white/70"
              }`}
            >
              {tab === "pending" && <Clock size={11} />}
              {tab === "approved" && <CheckCircle size={11} />}
              {tab === "rejected" && <XCircle size={11} />}
              {tab === "all" && <Filter size={11} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-sm ${filter === tab ? "bg-primary/20 text-primary" : "bg-white/5 text-white/30"}`}>
                {counts[tab]}
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
            <p className="text-sm font-sans">No {filter === "all" ? "" : filter} requests.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(req => {
              const cfg = STATUS_CONFIG[req.status];
              const isExpanded = expanded === req.id;

              return (
                <div key={req.id} className="bg-[#0f1d33] border border-white/5 hover:border-white/10 transition-colors">
                  {/* Row */}
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : req.id)}
                  >
                    {/* User */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <User size={14} className="text-white/40" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{req.user_name !== "—" ? req.user_name : req.user_email}</p>
                        <p className="text-white/40 text-xs font-sans truncate">{req.user_email}</p>
                      </div>
                    </div>

                    {/* Yacht */}
                    <div className="hidden md:flex items-center gap-2 flex-1 min-w-0">
                      <Ship size={13} className="text-primary/40 flex-shrink-0" />
                      <span className="text-white/60 text-sm font-sans truncate">{req.yacht_name}</span>
                    </div>

                    {/* Role */}
                    <div className="hidden lg:block w-24 flex-shrink-0">
                      <span className="text-white/40 text-xs font-sans capitalize">{req.role || "—"}</span>
                    </div>

                    {/* Date */}
                    <div className="hidden sm:flex items-center gap-1 text-white/30 text-xs font-sans flex-shrink-0 w-28">
                      <Calendar size={11} />
                      {new Date(req.created_at).toLocaleDateString("en-GB")}
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 border ${cfg.style}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {req.status !== "approved" && (
                        <button
                          onClick={e => { e.stopPropagation(); updateStatus(req.id, "approved"); }}
                          disabled={updating === req.id}
                          className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 text-xs font-bold uppercase tracking-wider px-3 py-1.5 transition-colors disabled:opacity-40"
                        >
                          <CheckCircle size={11} /> Approve
                        </button>
                      )}
                      {req.status !== "rejected" && (
                        <button
                          onClick={e => { e.stopPropagation(); updateStatus(req.id, "rejected"); }}
                          disabled={updating === req.id}
                          className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase tracking-wider px-3 py-1.5 transition-colors disabled:opacity-40"
                        >
                          <XCircle size={11} /> Reject
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-white/5 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Request ID</p>
                          <p className="text-white/60 font-sans text-xs">{req.id}</p>
                        </div>
                        <div>
                          <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Yacht ID</p>
                          <p className="text-white/60 font-sans text-xs">{req.yacht_id}</p>
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
    </div>
  );
}
