import { Layout } from "@/components/layout/Layout";
import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryReady(true);
        setRecoveryError(null);
      } else if (event === "SIGNED_IN" && session) {
        setRecoveryReady(true);
      }
    });

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session) {
        setRecoveryReady(true);
      } else {
        setTimeout(() => {
          if (!mounted) return;
          if (!recoveryReady) {
            setRecoveryError("Invalid or expired reset link. Please request a new one.");
          }
        }, 2500);
      }
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => setLocation("/dashboard"), 2000);
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-32 pb-20 flex items-start justify-center">
        <div className="w-full max-w-md px-6">
          <div className="bg-white/[0.02] border border-white/8 p-8">
            <p className="text-primary text-xs font-bold tracking-[0.25em] uppercase mb-2">Account Recovery</p>
            <h1 className="font-display text-3xl text-white font-normal mb-3">Set New Password</h1>
            <p className="text-white/50 text-sm font-sans mb-8">
              Choose a strong password for your account. You'll be signed in automatically afterwards.
            </p>

            {recoveryError && (
              <div className="px-4 py-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-sans flex items-start gap-3 mb-4">
                <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">Link is invalid or expired</p>
                  <p className="text-red-400/80 text-xs"><Link href="/forgot-password" className="text-primary hover:underline">Request a new reset link</Link></p>
                </div>
              </div>
            )}

            {done ? (
              <div className="px-4 py-4 bg-green-500/10 border border-green-500/30 text-green-300 text-sm font-sans flex items-start gap-3">
                <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">Password updated</p>
                  <p className="text-green-300/80 text-xs">Redirecting to your dashboard…</p>
                </div>
              </div>
            ) : !recoveryError && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-white/50 text-[9.5px] uppercase tracking-widest mb-1.5 font-bold">New Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      autoFocus
                      placeholder="••••••••"
                      disabled={!recoveryReady}
                      className="w-full bg-background border border-white/10 focus:border-primary pl-10 pr-11 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder:text-white/20 font-sans disabled:opacity-50"
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)} aria-label="Toggle password visibility"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-primary transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-white/30 text-xs mt-1.5">Minimum 6 characters.</p>
                </div>

                <div>
                  <label className="block text-white/50 text-[9.5px] uppercase tracking-widest mb-1.5 font-bold">Confirm Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    disabled={!recoveryReady}
                    className="w-full bg-background border border-white/10 focus:border-primary px-4 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder:text-white/20 font-sans disabled:opacity-50"
                  />
                </div>

                {error && (
                  <div className="border border-red-500/30 bg-red-500/5 px-4 py-3">
                    <p className="text-red-400 text-xs font-sans leading-relaxed">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !recoveryReady}
                  className="w-full bg-white/5 backdrop-blur-md border border-primary text-primary hover:bg-primary/10 hover:text-white hover:border-white py-3 font-bold tracking-[0.18em] uppercase text-[11px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {!recoveryReady ? "Verifying link…" : loading ? "Updating…" : "Update Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
