import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { User, Lock, Mail, Shield, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { BuyerDashboard, ListingsDashboard, OwnerDashboard } from "./Dashboard";

const ROLE_LABELS: Record<string, string> = {
  investor: "Private Buyer",
  buyer: "Private Buyer",
  broker: "Broker",
  owner: "Yacht Owner",
  admin: "Administrator",
};

export default function Profile() {
  const { user, userProfile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!user || !userProfile) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setSaving(true);

    // Verify current password by re-authenticating
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    });
    if (signInErr) {
      setError("Current password is incorrect.");
      setSaving(false);
      return;
    }

    // Update password
    const { error: updErr } = await supabase.auth.updateUser({ password: newPassword });
    if (updErr) {
      setError(updErr.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSaving(false);
    setTimeout(() => setSuccess(false), 5000);
  }

  const role = userProfile.role || "";
  const roleLabel = ROLE_LABELS[role] || role || "Member";

  const isAdmin = role === "admin";

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-3 sm:px-6">
          <div className="mb-10">
            <p className="text-primary text-xs font-bold tracking-[0.25em] uppercase mb-2">Account</p>
            <h1 className="font-display text-4xl text-white font-normal">My Profile</h1>
            <p className="text-white/50 font-sans text-sm mt-2">{user.email}</p>
          </div>

          {/* Role-specific workspace (non-admin only — admin uses /dashboard) */}
          {!isAdmin && (
            <div className="mb-10">
              {role === "broker" && <ListingsDashboard userId={user.id} role={role} />}
              {(role === "investor" || role === "buyer") && <BuyerDashboard userId={user.id} />}
              {role === "owner" && <OwnerDashboard userId={user.id} />}
            </div>
          )}

          {/* Account info */}
          <div className="bg-[#0f1d33] border border-white/8 p-8 mb-6">
            <h2 className="font-display text-lg text-white mb-6 flex items-center gap-2">
              <User size={18} className="text-primary" /> Account Information
            </h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <Mail size={16} className="text-primary/60 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Email</p>
                  <p className="text-white text-sm font-sans" data-testid="text-profile-email">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Shield size={16} className="text-primary/60 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Role</p>
                  <p className="text-white text-sm font-sans" data-testid="text-profile-role">{roleLabel}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle2 size={16} className={userProfile.approved ? "text-green-400 mt-1 flex-shrink-0" : "text-yellow-400 mt-1 flex-shrink-0"} />
                <div className="flex-1 min-w-0">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Status</p>
                  <p className={`text-sm font-sans ${userProfile.approved ? "text-green-400" : "text-yellow-400"}`}>
                    {userProfile.approved ? "Approved" : "Under Review"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="bg-[#0f1d33] border border-white/8 p-8">
            <h2 className="font-display text-lg text-white mb-2 flex items-center gap-2">
              <Lock size={18} className="text-primary" /> Change Password
            </h2>
            <p className="text-white/50 text-xs font-sans mb-6">
              For security reasons, please verify your current password before setting a new one.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label className="text-white/40 text-[10px] uppercase tracking-widest mb-2 block">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full bg-[#0a1426] border border-white/10 px-4 py-3 pr-12 text-white text-sm font-sans focus:border-primary/50 focus:outline-none"
                    data-testid="input-current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-white/40 text-[10px] uppercase tracking-widest mb-2 block">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full bg-[#0a1426] border border-white/10 px-4 py-3 pr-12 text-white text-sm font-sans focus:border-primary/50 focus:outline-none"
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-white/30 text-xs mt-1.5">Minimum 6 characters.</p>
              </div>

              <div>
                <label className="text-white/40 text-[10px] uppercase tracking-widest mb-2 block">Confirm New Password</label>
                <input
                  type={showNew ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full bg-[#0a1426] border border-white/10 px-4 py-3 text-white text-sm font-sans focus:border-primary/50 focus:outline-none"
                  data-testid="input-confirm-password"
                />
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-sans" data-testid="text-error">
                  {error}
                </div>
              )}
              {success && (
                <div className="px-4 py-3 bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-sans flex items-center gap-2" data-testid="text-success">
                  <CheckCircle2 size={16} /> Password updated successfully.
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="bg-primary text-[#070f1a] px-8 py-3 font-bold tracking-widest uppercase text-xs hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-change-password"
              >
                {saving ? "Updating…" : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
