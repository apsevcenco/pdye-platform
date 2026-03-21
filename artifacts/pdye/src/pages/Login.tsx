import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Anchor, TrendingUp, Briefcase, Ship } from "lucide-react";

const ROLES = [
  { key: "investor", label: "Investor",    icon: TrendingUp, desc: "Access private listings & deal room" },
  { key: "broker",   label: "Broker",      icon: Briefcase,  desc: "List and manage yacht transactions" },
  { key: "owner",    label: "Yacht Owner", icon: Ship,       desc: "Sell your vessel confidentially" },
];

export default function Login() {
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("investor");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await login(email, password);
      if (error) {
        setError(error);
      } else {
        setLocation("/yachts");
      }
    } else {
      const { error } = await register(email, password, role);
      if (error) {
        setError(error);
      } else {
        import("@/lib/supabase").then(({ supabase }) => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              setLocation("/yachts");
            } else {
              setSuccess("Registration successful. Your application is under review.");
              setMode("login");
            }
          });
        });
      }
    }
    setLoading(false);
  }

  return (
    <Layout>
      <div className="min-h-[85vh] flex items-center justify-center bg-background py-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-[80px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Anchor size={28} className="text-primary" strokeWidth={2} />
              <span className="font-display font-normal text-4xl tracking-widest text-white">PDYE</span>
            </div>
            <p className="text-white/40 font-sans tracking-widest uppercase text-xs">Secure Client Portal</p>
          </div>

          {/* Mode tabs */}
          <div className="flex border-b border-white/10 mb-8">
            <button
              onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              className={`flex-1 pb-3 text-xs font-bold tracking-widest uppercase transition-colors ${
                mode === "login" ? "text-primary border-b-2 border-primary -mb-px" : "text-white/40 hover:text-white/70"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
              className={`flex-1 pb-3 text-xs font-bold tracking-widest uppercase transition-colors ${
                mode === "register" ? "text-primary border-b-2 border-primary -mb-px" : "text-white/40 hover:text-white/70"
              }`}
            >
              Register
            </button>
          </div>

          <div className="bg-card border border-white/10 p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Role selector (register only) */}
              {mode === "register" && (
                <div>
                  <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-3 font-sans">I am a</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map(r => {
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => setRole(r.key)}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 border transition-all duration-200 ${
                            role === r.key
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-white/10 text-white/40 hover:border-white/25 hover:text-white/60"
                          }`}
                        >
                          <Icon size={16} strokeWidth={1.5} />
                          <span className="text-[9px] font-bold uppercase tracking-widest leading-tight text-center">{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-white/70 text-xs font-bold mb-2 uppercase tracking-widest">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-background border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors placeholder:text-white/20"
                  placeholder="investor@example.com"
                />
              </div>

              <div>
                <label className="block text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={6}
                  className="w-full bg-background border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors placeholder:text-white/20"
                  placeholder="••••••••"
                />
                {mode === "register" && (
                  <p className="text-white/30 text-[11px] mt-1.5 font-sans">Minimum 6 characters</p>
                )}
              </div>

              {error && (
                <div className="border border-red-500/30 bg-red-500/5 px-4 py-3">
                  <p className="text-red-400 text-xs font-sans leading-relaxed">{error}</p>
                </div>
              )}
              {success && (
                <div className="border border-primary/30 bg-primary/5 px-4 py-3">
                  <p className="text-primary text-xs font-sans leading-relaxed">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-white text-background font-bold uppercase tracking-widest py-4 mt-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? (mode === "login" ? "Signing In..." : "Registering...")
                  : (mode === "login" ? "Access Portal" : "Submit Application")
                }
              </button>
            </form>
          </div>

          <p className="text-center mt-8 text-white/30 text-xs font-sans tracking-wide">
            {mode === "login"
              ? <><button onClick={() => setMode("register")} className="text-primary hover:underline">Create account</button></>
              : <><button onClick={() => setMode("login")} className="text-primary hover:underline">Already have an account? Sign in</button></>
            }
          </p>
          <p className="text-center mt-4 text-white/20 text-xs font-sans">
            Need access? <a href="#/access" className="text-primary/70 hover:text-primary transition-colors">Request invitation</a>
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
