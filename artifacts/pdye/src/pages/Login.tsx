import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Anchor, Loader2, Eye, EyeOff } from "lucide-react";

const inp = "w-full bg-background border border-white/10 focus:border-primary px-4 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder:text-white/20 font-sans";
const lbl = "block text-white/50 text-[9.5px] uppercase tracking-widest mb-1.5 font-sans font-bold";

export default function Login() {
  const { login, user, userProfile, ndaStatus, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // If the visitor is already authenticated (direct URL, back button, or
  // late-firing onAuthStateChange after login), route them where they belong:
  //   - admin → /admin
  //   - non-admin & not approved → /yachts (ProtectedRoute will show UnderReview)
  //   - non-admin & approved & CNCA not signed → /platform-nda
  //   - non-admin & approved & CNCA signed → /yachts
  useEffect(() => {
    if (authLoading || !user) return;
    if (!userProfile) return;
    if (userProfile.role === "admin") { setLocation("/admin"); return; }
    if (!userProfile.approved) { setLocation("/yachts"); return; }
    if (ndaStatus === null) return; // still loading CNCA status
    setLocation(ndaStatus.signed ? "/yachts" : "/platform-nda");
  }, [authLoading, user, userProfile, ndaStatus, setLocation]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await login(email, password);
    if (error) setError(error);
    setLoading(false);
    // On success the useEffect above routes the user.
  }

  return (
    <Layout>
      <div className="min-h-[88vh] flex items-center justify-center bg-background py-28 px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-[80px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full relative z-10 max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Anchor size={26} className="text-primary" strokeWidth={1.8} />
              <span className="font-display font-normal text-4xl tracking-widest text-white">PDYE</span>
            </div>
            <p className="text-white/35 font-sans tracking-widest uppercase text-[10px]">Secure Client Portal</p>
          </div>

          {/* Single-mode header (no register tab — applications are handled at /access) */}
          <div className="border-b border-white/10 mb-6 pb-3">
            <p className="text-center text-primary text-[10px] font-bold tracking-widest uppercase">Sign In</p>
          </div>

          <div className="bg-card border border-white/10 p-7 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={lbl}>Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inp}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className={lbl}>Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    minLength={6}
                    className={`${inp} pr-11`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-primary transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-right mt-1.5">
                  <Link href="/forgot-password" className="text-primary/60 hover:text-primary text-[11px] font-sans transition-colors">Forgot password?</Link>
                </p>
              </div>

              {error && (
                <div className="border border-red-500/30 bg-red-500/5 px-4 py-3">
                  <p className="text-red-400 text-xs font-sans leading-relaxed">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white/5 backdrop-blur-md border border-primary text-primary hover:bg-primary/10 hover:text-white hover:border-white font-bold uppercase tracking-widest py-3.5 mt-1 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /><span>Signing in...</span></>
                  : <span>Access Portal</span>
                }
              </button>
            </form>
          </div>

          <p className="text-center mt-6 text-white/40 text-xs font-sans">
            Don't have an account?{" "}
            <a href="#/access" className="text-primary/80 hover:text-primary transition-colors">
              Request access →
            </a>
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
