import { useState, useEffect } from "react";
import { Link } from "wouter";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { UserProfile } from "@/context/AuthContext";
import { ArrowLeft, CheckCircle, XCircle, Clock, Users, RefreshCw } from "lucide-react";

type UserRow = UserProfile & { created_at: string };

const ROLE_COLORS: Record<string, string> = {
  investor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  broker:   "text-purple-400 bg-purple-400/10 border-purple-400/20",
  owner:    "text-amber-400 bg-amber-400/10 border-amber-400/20",
  admin:    "text-primary bg-primary/10 border-primary/20",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabaseAdmin.from("users").select("*").order("created_at", { ascending: false });
    setUsers((data as UserRow[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleApproval(user: UserRow) {
    setUpdating(user.id);
    await supabaseAdmin.from("users").update({ approved: !user.approved }).eq("id", user.id);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, approved: !u.approved } : u));
    setUpdating(null);
  }

  async function setRole(user: UserRow, role: string) {
    setUpdating(user.id);
    await supabaseAdmin.from("users").update({ role }).eq("id", user.id);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role } : u));
    setUpdating(null);
  }

  const approved = users.filter(u => u.approved).length;
  const pending  = users.filter(u => !u.approved).length;

  return (
    <div className="min-h-screen bg-[#070f1a] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-sans">
            <ArrowLeft size={14} />
            Admin Panel
          </Link>
          <span className="text-white/15">/</span>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <span className="font-display text-lg text-white">User Management</span>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-white/40 hover:text-primary transition-colors text-sm font-sans">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Users", value: users.length, color: "text-white" },
            { label: "Approved",    value: approved,     color: "text-green-400" },
            { label: "Pending",     value: pending,      color: "text-yellow-400" },
          ].map(s => (
            <div key={s.label} className="bg-[#0f1d33] border border-white/5 px-6 py-5">
              <p className={`font-display text-3xl ${s.color}`}>{s.value}</p>
              <p className="text-white/40 text-xs uppercase tracking-widest font-sans mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[#0f1d33] border border-white/5">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="font-display text-base text-white">Registered Users</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-white/30 font-sans text-sm">
              No registered users yet.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-3 text-white/35 text-[10px] uppercase tracking-wider font-bold">Email</th>
                  <th className="text-left px-6 py-3 text-white/35 text-[10px] uppercase tracking-wider font-bold hidden sm:table-cell">Role</th>
                  <th className="text-left px-6 py-3 text-white/35 text-[10px] uppercase tracking-wider font-bold hidden md:table-cell">Registered</th>
                  <th className="text-left px-6 py-3 text-white/35 text-[10px] uppercase tracking-wider font-bold">Status</th>
                  <th className="px-6 py-3 text-right text-white/35 text-[10px] uppercase tracking-wider font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white text-sm font-sans">{u.email}</p>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <select
                        value={u.role || ""}
                        disabled={updating === u.id}
                        onChange={e => setRole(u, e.target.value)}
                        className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-transparent focus:outline-none cursor-pointer transition-colors ${ROLE_COLORS[u.role || ""] || "text-white/50 bg-white/5 border-white/10"}`}
                      >
                        <option value="investor">Investor</option>
                        <option value="broker">Broker</option>
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-white/40 text-xs font-sans">
                        {new Date(u.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {u.approved ? (
                        <span className="flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase tracking-wider">
                          <CheckCircle size={12} /> Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleApproval(u)}
                        disabled={updating === u.id}
                        className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
                          u.approved
                            ? "border border-red-400/30 text-red-400 hover:bg-red-400/10"
                            : "border border-green-400/30 text-green-400 hover:bg-green-400/10"
                        }`}
                      >
                        {updating === u.id ? "..." : u.approved ? "Revoke" : "Approve"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Help text */}
        <p className="text-white/20 text-xs font-sans mt-6 text-center tracking-wide">
          Changes take effect immediately. Users are notified on next page load.
        </p>
      </div>
    </div>
  );
}
