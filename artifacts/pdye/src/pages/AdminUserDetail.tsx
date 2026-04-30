import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Download,
  Shield,
  User as UserIcon,
  Anchor,
  Briefcase,
  Users,
  RefreshCw,
  Pencil,
  X,
  Save,
  Archive,
  ArchiveRestore,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { platformNdaApi, triggerBlobDownload, type PlatformNdaSignature } from "@/lib/platformNdaApi";
import { archiveUserAction, confirmAndDeleteUserInteractive } from "@/lib/userAdminActions";

type UserRecord = {
  id: string;
  email: string;
  role: string;
  approved: boolean;
  created_at: string;
  company?: string | null;
  phone?: string | null;
  notes?: string | null;
  name?: string | null;
  budget?: string | null;
  yacht_type?: string | null;
  location?: string | null;
  archived?: boolean | null;
  archived_at?: string | null;
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function initials(s: string) {
  const t = (s || "").trim();
  if (!t) return "?";
  const parts = t.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

function roleMeta(role: string) {
  switch (role) {
    case "broker":   return { label: "Broker",        icon: Briefcase, color: "text-blue-300",   bg: "bg-blue-500/10",   border: "border-blue-500/20"   };
    case "owner":    return { label: "Boat Owner",    icon: Anchor,    color: "text-amber-300",  bg: "bg-amber-500/10",  border: "border-amber-500/20"  };
    case "investor":
    case "buyer":    return { label: "Private Buyer", icon: Users,     color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    case "admin":    return { label: "Admin",         icon: Shield,    color: "text-primary",    bg: "bg-primary/10",    border: "border-primary/20"    };
    default:         return { label: role || "User",  icon: UserIcon,  color: "text-white/70",   bg: "bg-white/5",       border: "border-white/10"      };
  }
}

export default function AdminUserDetail() {
  const [, params] = useRoute<{ id: string }>("/admin/users/:id");
  const [, setLocation] = useLocation();
  const userId = params?.id || "";

  const [user, setUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signatures, setSignatures] = useState<PlatformNdaSignature[]>([]);
  const [ndaLoading, setNdaLoading] = useState(true);
  const [savingApproval, setSavingApproval] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingSigId, setDeletingSigId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", company: "", phone: "", location: "", notes: "" });
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function toggleArchive() {
    if (!user) return;
    const next = !user.archived;
    if (!confirm(next ? `Archive ${user.email}? The user can be restored later.` : `Restore ${user.email} from archive?`)) return;
    setArchiving(true);
    const r = await archiveUserAction(user.id, next);
    if (!r.ok) {
      alert(r.errorKind === "migration_missing" ? r.error : "Failed: " + r.error);
    } else {
      setUser({ ...user, archived: next, archived_at: next ? new Date().toISOString() : null });
    }
    setArchiving(false);
  }

  async function deleteUser() {
    if (!user) return;
    setDeleting(true);
    const ok = await confirmAndDeleteUserInteractive(user.id, user.email);
    if (ok) setLocation("/admin");
    else setDeleting(false);
  }

  function startEdit() {
    if (!user) return;
    setEditForm({
      name: user.name || "",
      company: user.company || "",
      phone: user.phone || "",
      location: user.location || "",
      notes: user.notes || "",
    });
    setEditing(true);
  }

  async function saveEdit() {
    if (!user) return;
    setSavingEdit(true);
    const patch = {
      name: editForm.name.trim() || null,
      company: editForm.company.trim() || null,
      phone: editForm.phone.trim() || null,
      location: editForm.location.trim() || null,
      notes: editForm.notes.trim() || null,
    };
    const { error: e } = await supabase.from("users").update(patch).eq("id", user.id);
    if (e) {
      alert("Failed to save: " + e.message);
    } else {
      setUser({ ...user, ...patch });
      setEditing(false);
    }
    setSavingEdit(false);
  }

  async function loadUser() {
    setLoading(true);
    setError("");
    const { data, error: dbErr } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (dbErr) setError(dbErr.message);
    setUser((data as UserRecord) || null);
    setLoading(false);
  }

  async function loadSignatures(forUser: UserRecord) {
    setNdaLoading(true);
    try {
      const all = await platformNdaApi.adminListSignatures();
      const mine = all.filter(s =>
        (s.user_id && s.user_id === forUser.id) ||
        (s.user_email && s.user_email.toLowerCase() === forUser.email.toLowerCase())
      ).sort((a, b) => new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime());
      setSignatures(mine);
    } catch (e: any) {
      console.error("Failed to load NDA signatures", e);
      setSignatures([]);
    }
    setNdaLoading(false);
  }

  useEffect(() => { if (userId) loadUser(); }, [userId]);
  useEffect(() => { if (user) loadSignatures(user); }, [user?.id]);

  async function toggleApproval() {
    if (!user) return;
    setSavingApproval(true);
    const { error: e } = await supabase
      .from("users")
      .update({ approved: !user.approved })
      .eq("id", user.id);
    if (e) {
      alert("Failed to update approval: " + e.message);
    } else {
      setUser({ ...user, approved: !user.approved });
    }
    setSavingApproval(false);
  }

  async function downloadNdaPdf(sig: PlatformNdaSignature) {
    setDownloadingId(sig.id);
    try {
      const blob = await platformNdaApi.downloadSignedPdf(sig.id);
      const safeEmail = (user?.email || "user").replace(/[^a-z0-9_.-]/gi, "_");
      triggerBlobDownload(blob, `platform-nda-${safeEmail}-${sig.document_version}.pdf`);
    } catch (e: any) {
      alert("Failed to download PDF: " + (e.message || e));
    }
    setDownloadingId(null);
  }

  async function deleteNdaSignature(sig: PlatformNdaSignature) {
    const isOrphan = !!(user && sig.user_id && sig.user_id !== user.id);
    const ok = window.confirm(
      `Permanently delete this NDA signature?\n\n` +
      `User:    ${sig.user_email || "(unknown email)"}\n` +
      `Signed:  ${sig.signature_name}\n` +
      `Version: ${sig.document_version}\n` +
      `Date:    ${fmtDate(sig.signed_at)}\n` +
      (isOrphan
        ? `\nThis appears to be a "ghost" signature left over from a previously deleted account that used the same email. Removing it is safe.\n`
        : `\nThis is the active user's signature. They will be required to sign the NDA again on next login.\n`) +
      `\nThis cannot be undone.`
    );
    if (!ok) return;
    setDeletingSigId(sig.id);
    try {
      await platformNdaApi.adminDeleteSignature(sig.id);
      setSignatures(prev => prev.filter(x => x.id !== sig.id));
    } catch (e: any) {
      alert("Failed to delete signature: " + (e.message || e));
    } finally {
      setDeletingSigId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070f1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#070f1a] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-white/60 mb-6">{error || "User not found."}</p>
          <button
            onClick={() => setLocation("/admin")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors text-sm font-sans uppercase tracking-wider"
          >
            <ArrowLeft size={14} /> Back to Admin
          </button>
        </div>
      </div>
    );
  }

  const meta = roleMeta(user.role);
  const RoleIcon = meta.icon;
  const latestNda = signatures[0] || null;
  const ndaSigned = !!latestNda;

  return (
    <div className="min-h-screen bg-[#070f1a] text-white">
      {/* Top bar with Back */}
      <div className="border-b border-white/5 bg-[#0a1426] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => setLocation("/admin")}
            className="inline-flex items-center gap-2 px-3 py-2 text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-colors text-xs font-sans uppercase tracking-wider"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="text-white/30 text-xs font-sans uppercase tracking-widest">
            Client File · {meta.label}
          </div>
          <button
            onClick={() => { loadUser(); if (user) loadSignatures(user); }}
            className="inline-flex items-center gap-2 px-3 py-2 text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition-colors text-xs font-sans uppercase tracking-wider"
            title="Refresh"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        {/* Identity header */}
        <div className="bg-[#0f1d33] border border-white/8 p-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-full ${meta.bg} border ${meta.border} flex items-center justify-center flex-shrink-0`}>
                <span className={`${meta.color} text-base font-bold tracking-wider`}>{initials(user.name || user.email)}</span>
              </div>
              <div>
                <h1 className="font-display text-2xl text-white">{user.name || user.email}</h1>
                <div className="mt-1 text-white/50 text-sm font-sans">{user.email}</div>
                <div className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 ${meta.bg} border ${meta.border} ${meta.color} text-xs font-sans uppercase tracking-wider`}>
                  <RoleIcon size={11} /> {meta.label}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-3">
              <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-sans uppercase tracking-wider ${user.approved ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}`}>
                  {user.approved ? <CheckCircle size={11} /> : <Clock size={11} />}
                  {user.approved ? "Approved" : "Pending Approval"}
                </div>
                {user.archived && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border bg-white/5 text-white/50 border-white/10 text-xs font-sans uppercase tracking-wider">
                    <Archive size={11} /> Archived
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                <button
                  onClick={toggleApproval}
                  disabled={savingApproval}
                  className={`px-4 py-2 text-xs font-sans uppercase tracking-wider transition-colors disabled:opacity-50 ${user.approved ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20" : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"}`}
                >
                  {savingApproval ? "Saving…" : user.approved ? "Revoke Access" : "Approve Account"}
                </button>
                <button
                  onClick={toggleArchive}
                  disabled={archiving || deleting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-sans uppercase tracking-wider transition-colors disabled:opacity-50 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                >
                  {user.archived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
                  {archiving ? "…" : user.archived ? "Restore" : "Archive"}
                </button>
                <button
                  onClick={deleteUser}
                  disabled={archiving || deleting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-sans uppercase tracking-wider transition-colors disabled:opacity-50 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                >
                  <Trash2 size={12} /> {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Two-column: Contact info + Application */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0f1d33] border border-white/8 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/40 text-xs font-sans uppercase tracking-widest">Contact &amp; Profile</div>
              {!editing ? (
                <button
                  onClick={startEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans uppercase tracking-wider text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
                >
                  <Pencil size={11} /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    disabled={savingEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans uppercase tracking-wider text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-colors disabled:opacity-50"
                  >
                    <X size={11} /> Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={savingEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans uppercase tracking-wider text-primary border border-primary/30 hover:bg-primary/10 transition-colors disabled:opacity-50"
                  >
                    <Save size={11} /> {savingEdit ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>

            {!editing ? (
              <dl className="space-y-3 text-sm">
                <InfoRow icon={UserIcon} label="Full Name" value={user.name || "—"} />
                <InfoRow icon={Mail} label="Email" value={user.email} />
                <InfoRow icon={Phone} label="Phone" value={user.phone || "—"} />
                <InfoRow icon={Building2} label="Company" value={user.company || "—"} />
                <InfoRow icon={MapPin} label="Location" value={user.location || "—"} />
                <InfoRow icon={Calendar} label="Registered" value={fmtDate(user.created_at)} />
              </dl>
            ) : (
              <div className="space-y-4 text-sm">
                <EditField label="Full Name" value={editForm.name} onChange={v => setEditForm(f => ({ ...f, name: v }))} />
                <div>
                  <div className="text-white/40 text-[11px] font-sans uppercase tracking-wider mb-1.5">Email</div>
                  <div className="text-white/50 text-sm font-sans">{user.email} <span className="text-white/30 text-xs">(read-only)</span></div>
                </div>
                <EditField label="Phone" value={editForm.phone} onChange={v => setEditForm(f => ({ ...f, phone: v }))} />
                <EditField label="Company" value={editForm.company} onChange={v => setEditForm(f => ({ ...f, company: v }))} />
                <EditField label="Location" value={editForm.location} onChange={v => setEditForm(f => ({ ...f, location: v }))} />
                <EditField label="Notes" value={editForm.notes} onChange={v => setEditForm(f => ({ ...f, notes: v }))} multiline />
              </div>
            )}
          </div>

          <div className="bg-[#0f1d33] border border-white/8 p-6">
            <div className="text-white/40 text-xs font-sans uppercase tracking-widest mb-4">Application Profile</div>
            <dl className="space-y-3 text-sm">
              <InfoRow icon={FileText} label="Application Type" value={user.yacht_type || "—"} />
              <InfoRow icon={Briefcase} label="Background" value={user.budget || "—"} />
              <div>
                <div className="flex items-center gap-2 text-white/40 text-xs font-sans uppercase tracking-wider mb-1.5">
                  <FileText size={12} /> Notes
                </div>
                <div className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">{user.notes || "—"}</div>
              </div>
            </dl>
          </div>
        </div>

        {/* Platform NDA section */}
        <div className="bg-[#0f1d33] border border-white/8 p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Shield size={16} className="text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg text-white">Platform NDA</h2>
                <p className="text-white/40 text-xs font-sans">Account-level confidentiality agreement</p>
              </div>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-sans uppercase tracking-wider ${ndaSigned ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-white/5 text-white/50 border-white/10"}`}>
              {ndaSigned ? <CheckCircle size={11} /> : <Clock size={11} />}
              {ndaSigned ? "Signed" : "Not Signed"}
            </div>
          </div>

          {ndaLoading ? (
            <div className="text-white/40 text-sm font-sans">Loading…</div>
          ) : signatures.length === 0 ? (
            <div className="bg-[#070f1a] border border-white/5 p-5 text-white/50 text-sm font-sans">
              This user has not signed the platform NDA yet. They will be required to sign on next login before reaching protected pages.
            </div>
          ) : (
            <div className="space-y-3">
              {signatures.map(sig => (
                <div key={sig.id} className="bg-[#070f1a] border border-white/5 p-5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-white text-sm font-medium font-sans">Version {sig.document_version}</span>
                        <span className="text-white/30 text-xs font-sans">·</span>
                        <span className="text-white/50 text-xs font-sans">{fmtDate(sig.signed_at)}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-sans">
                        <KV k="Signed by" v={sig.signature_name} />
                        <KV k="Email" v={sig.user_email || "—"} />
                        <KV k="IP" v={sig.ip || "—"} />
                        <KV k="Document hash" v={sig.document_hash} mono />
                      </div>
                      {sig.user_agent && (
                        <div className="text-white/30 text-[11px] font-sans truncate">UA: {sig.user_agent}</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => downloadNdaPdf(sig)}
                        disabled={downloadingId === sig.id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors text-xs font-sans uppercase tracking-wider disabled:opacity-50"
                        data-testid={`button-download-signature-${sig.id}`}
                      >
                        <Download size={12} />
                        {downloadingId === sig.id ? "Preparing…" : "Download PDF"}
                      </button>
                      <button
                        onClick={() => deleteNdaSignature(sig)}
                        disabled={deletingSigId === sig.id}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-sans uppercase tracking-wider disabled:opacity-50"
                        title={
                          user && sig.user_id && sig.user_id !== user.id
                            ? "Delete this ghost signature (left over from a deleted account that re-used this email)"
                            : "Permanently delete this signature — the user will need to sign again"
                        }
                        data-testid={`button-delete-signature-${sig.id}`}
                      >
                        <Trash2 size={12} />
                        {deletingSigId === sig.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Placeholder for future sections */}
        <div className="bg-[#0f1d33]/50 border border-dashed border-white/8 p-6 text-center">
          <p className="text-white/30 text-xs font-sans uppercase tracking-widest mb-2">Coming Soon</p>
          <p className="text-white/40 text-sm font-sans">
            Deal rooms, deal-level NDAs, commission agreements and activity history for this client will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={14} className="text-white/30 mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-white/40 text-[11px] font-sans uppercase tracking-wider">{label}</div>
        <div className="text-white text-sm font-sans break-words">{value}</div>
      </div>
    </div>
  );
}

function KV({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <span className="text-white/40 uppercase tracking-wider text-[10px] mr-2">{k}:</span>
      <span className={`text-white/80 ${mono ? "font-mono text-[11px] break-all" : ""}`}>{v}</span>
    </div>
  );
}

function EditField({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div>
      <div className="text-white/40 text-[11px] font-sans uppercase tracking-wider mb-1.5">{label}</div>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={4}
          className="w-full bg-[#070f1a] border border-white/10 text-white px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-[#070f1a] border border-white/10 text-white px-3 py-2 text-sm font-sans focus:outline-none focus:border-primary"
        />
      )}
    </div>
  );
}
