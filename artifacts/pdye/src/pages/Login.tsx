import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Anchor } from "lucide-react";

export default function Login() {
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const { error } = await register(email, password);
      if (error) {
        setError(error);
      } else {
        setSuccess("Registration successful. Check your email to confirm your account, then login.");
        setMode("login");
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-white/70 text-xs font-bold uppercase tracking-widest">Password</label>
                </div>
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
                  : (mode === "login" ? "Access Portal" : "Create Account")
                }
              </button>
            </form>
          </div>

          <p className="text-center mt-8 text-white/30 text-xs font-sans tracking-wide">
            {mode === "login"
              ? <>Not registered? <button onClick={() => setMode("register")} className="text-primary hover:underline">Create account</button></>
              : <>Already have an account? <button onClick={() => setMode("login")} className="text-primary hover:underline">Sign in</button></>
            }
          </p>
          <p className="text-center mt-4 text-white/20 text-xs font-sans">
            Need access? <a href="/access" className="text-primary/70 hover:text-primary transition-colors">Request invitation</a>
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
