import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Anchor, TrendingUp, Briefcase, Ship, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ROLES = [
  { key: "investor", label: "Private Buyer", icon: TrendingUp, desc: "Access private listings & deal room" },
  { key: "broker",   label: "Broker",        icon: Briefcase,  desc: "List and manage yacht transactions" },
  { key: "owner",    label: "Yacht Owner",   icon: Ship,       desc: "Sell your vessel confidentially" },
];

const CAPACITY_OPTIONS = ["Up to €1M", "€1M – €5M", "€5M – €20M", "€20M – €50M", "€50M+", "Deal by deal"];
const EXPERIENCE_OPTIONS = ["Under 2 years", "2–5 years", "5–10 years", "10+ years"];
const BROKER_TYPE_OPTIONS = ["Co-brokerage only", "Direct buyer introductions", "Both"];

const inp = "w-full bg-background border border-white/10 focus:border-primary px-4 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder:text-white/20 font-sans";
const sel = "w-full bg-background border border-white/10 focus:border-primary px-4 py-2.5 text-white text-sm focus:outline-none transition-colors font-sans cursor-pointer";
const lbl = "block text-white/50 text-[9.5px] uppercase tracking-widest mb-1.5 font-sans font-bold";

export default function Login() {
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState("investor");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Shared
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // Investor
  const [company, setCompany] = useState("");
  const [capacity, setCapacity] = useState("");
  const [focus, setFocus] = useState("");

  // Broker
  const [bCompany, setBCompany] = useState("");
  const [license, setLicense] = useState("");
  const [experience, setExperience] = useState("");
  const [brokerType, setBrokerType] = useState("");

  // Owner
  const [vessel, setVessel] = useState("");
  const [length, setLength] = useState("");
  const [year, setYear] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function resetFields() {
    setEmail(""); setPassword(""); setName(""); setPhone(""); setMessage("");
    setCompany(""); setCapacity(""); setFocus("");
    setBCompany(""); setLicense(""); setExperience(""); setBrokerType("");
    setVessel(""); setLength(""); setYear("");
    setError(""); setSuccess("");
  }

  function switchMode(m: "login" | "register") {
    resetFields();
    setMode(m);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await login(email, password);
      if (error) setError(error);
      else setLocation("/yachts");
    } else {
      if (!name.trim()) { setError("Full name is required."); setLoading(false); return; }

      const { error } = await register(email, password, role);
      if (error) {
        setError(error);
      } else {
        // Save extended profile to leads
        try {
          let budget = "";
          let yacht_type = "";
          let leadMsg = "";

          if (role === "investor") {
            budget = capacity ? `${capacity}${company ? " · " + company : ""}` : company;
            yacht_type = "Private Buyer Application";
            leadMsg = `Focus: ${focus || "—"}. ${message}`;
          } else if (role === "broker") {
            budget = `${experience}${bCompany ? " · " + bCompany : ""}${license ? " · Lic: " + license : ""}`;
            yacht_type = "Broker Application";
            leadMsg = `Partnership: ${brokerType || "—"}. ${message}`;
          } else {
            budget = `${vessel}${length ? " · " + length : ""}${year ? " · " + year : ""}`;
            yacht_type = "Owner Submission";
            leadMsg = message;
          }

          const { error: leadErr } = await supabase.from("leads").insert([{
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            budget,
            yacht_type,
            message: leadMsg.trim() || null,
          }]);
          if (leadErr) console.warn("Leads insert error:", leadErr.message);
        } catch (e) { console.warn("Leads insert failed:", e); }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setLocation("/yachts");
        } else {
          setSuccess("Your application has been submitted and is under review. We'll contact you within 48 hours.");
          switchMode("login");
        }
      }
    }
    setLoading(false);
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
          className={`w-full relative z-10 transition-all duration-300 ${mode === "register" ? "max-w-lg" : "max-w-md"}`}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Anchor size={26} className="text-primary" strokeWidth={1.8} />
              <span className="font-display font-normal text-4xl tracking-widest text-white">PDYE</span>
            </div>
            <p className="text-white/35 font-sans tracking-widest uppercase text-[10px]">Secure Client Portal</p>
          </div>

          {/* Mode tabs */}
          <div className="flex border-b border-white/10 mb-6">
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => switchMode(m)}
                className={`flex-1 pb-3 text-[10px] font-bold tracking-widest uppercase transition-colors ${
                  mode === m ? "text-primary border-b-2 border-primary -mb-px" : "text-white/35 hover:text-white/60"
                }`}>
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <div className="bg-card border border-white/10 p-7 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ── REGISTER MODE ── */}
              {mode === "register" && (
                <>
                  {/* Role selector */}
                  <div>
                    <label className={lbl}>I am a</label>
                    <div className="grid grid-cols-3 gap-2">
                      {ROLES.map(r => {
                        const Icon = r.icon;
                        return (
                          <button key={r.key} type="button" onClick={() => setRole(r.key)}
                            className={`flex flex-col items-center gap-1.5 py-3 px-2 border transition-all duration-200 ${
                              role === r.key
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-white/10 text-white/40 hover:border-white/25 hover:text-white/60"
                            }`}>
                            <Icon size={15} strokeWidth={1.5} />
                            <span className="text-[9px] font-bold uppercase tracking-widest leading-tight text-center">{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="h-px bg-white/6" />

                  {/* Shared: full name */}
                  <div>
                    <label className={lbl}>Full Name *</label>
                    <input value={name} onChange={e => setName(e.target.value)} required className={inp} placeholder="Jean-Pierre Moreau" />
                  </div>

                  <AnimatePresence mode="wait">
                    {/* ── INVESTOR fields ── */}
                    {role === "investor" && (
                      <motion.div key="investor" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={lbl}>Company / Fund</label>
                            <input value={company} onChange={e => setCompany(e.target.value)} className={inp} placeholder="Family Office LLC" />
                          </div>
                          <div>
                            <label className={lbl}>Phone</label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inp} placeholder="+33 6 00 00 00" />
                          </div>
                        </div>
                        <div>
                          <label className={lbl}>Investment Capacity *</label>
                          <select value={capacity} onChange={e => setCapacity(e.target.value)} required className={sel}>
                            <option value="">Select budget range...</option>
                            {CAPACITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={lbl}>Preferred Yacht Type / Region</label>
                          <input value={focus} onChange={e => setFocus(e.target.value)} className={inp} placeholder="Motor Yacht 30–50m, Mediterranean..." />
                        </div>
                        <div>
                          <label className={lbl}>Message (optional)</label>
                          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} className={inp + " resize-none"} placeholder="Specific requirements or timeline..." />
                        </div>
                      </motion.div>
                    )}

                    {/* ── BROKER fields ── */}
                    {role === "broker" && (
                      <motion.div key="broker" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={lbl}>Company / Brokerage</label>
                            <input value={bCompany} onChange={e => setBCompany(e.target.value)} className={inp} placeholder="Burgess Yachts" />
                          </div>
                          <div>
                            <label className={lbl}>Phone</label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inp} placeholder="+44 20 0000 0000" />
                          </div>
                        </div>
                        <div>
                          <label className={lbl}>License / Certification</label>
                          <input value={license} onChange={e => setLicense(e.target.value)} className={inp} placeholder="MYBA, ABYA, IYBA, national license..." />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={lbl}>Experience</label>
                            <select value={experience} onChange={e => setExperience(e.target.value)} className={sel}>
                              <option value="">Select...</option>
                              {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={lbl}>Partnership Type</label>
                            <select value={brokerType} onChange={e => setBrokerType(e.target.value)} className={sel}>
                              <option value="">Select...</option>
                              {BROKER_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className={lbl}>Message (optional)</label>
                          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} className={inp + " resize-none"} placeholder="Current deal flow, specialisation..." />
                        </div>
                      </motion.div>
                    )}

                    {/* ── OWNER fields ── */}
                    {role === "owner" && (
                      <motion.div key="owner" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="space-y-4">
                        <div>
                          <label className={lbl}>Phone</label>
                          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inp} placeholder="+1 000 000 0000" />
                        </div>
                        <div>
                          <label className={lbl}>Vessel Description *</label>
                          <input value={vessel} onChange={e => setVessel(e.target.value)} required className={inp} placeholder="e.g. Motor Yacht, Ferretti 881, 2015..." />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={lbl}>Length (approx.)</label>
                            <input value={length} onChange={e => setLength(e.target.value)} className={inp} placeholder="e.g. 27m / 88ft" />
                          </div>
                          <div>
                            <label className={lbl}>Build Year</label>
                            <input type="number" value={year} onChange={e => setYear(e.target.value)} min={1950} max={2025} className={inp} placeholder="e.g. 2015" />
                          </div>
                        </div>
                        <div>
                          <label className={lbl}>Additional Information</label>
                          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} className={inp + " resize-none"} placeholder="Condition, refit history, reason for sale..." />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="h-px bg-white/6" />
                </>
              )}

              {/* ── EMAIL & PASSWORD ── */}
              <div>
                <label className={lbl}>Email Address *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                  className={inp} placeholder="you@example.com" />
              </div>

              <div>
                <label className={lbl}>Password *</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                    autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6}
                    className={`${inp} pr-11`} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-primary transition-colors p-1">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {mode === "register" && <p className="text-white/25 text-[10px] mt-1 font-sans">Minimum 6 characters</p>}
                {mode === "login" && (
                  <p className="text-right mt-1.5">
                    <Link href="/forgot-password" className="text-primary/60 hover:text-primary text-[11px] font-sans transition-colors">Forgot password?</Link>
                  </p>
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

              <button type="submit" disabled={loading}
                className="w-full bg-primary hover:bg-white text-[#070f1a] font-bold uppercase tracking-widest py-3.5 mt-1 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /><span>{mode === "login" ? "Signing in..." : "Submitting..."}</span></>
                  : <span>{mode === "login" ? "Access Portal" : "Submit Application"}</span>
                }
              </button>
            </form>
          </div>

          <p className="text-center mt-6 text-white/30 text-xs font-sans">
            {mode === "login"
              ? <button onClick={() => switchMode("register")} className="text-primary/70 hover:text-primary transition-colors">Create account →</button>
              : <button onClick={() => switchMode("login")} className="text-primary/70 hover:text-primary transition-colors">Already have an account? Sign in</button>
            }
          </p>
          <p className="text-center mt-3 text-white/20 text-[10px] font-sans">
            Need access? <a href="#/access" className="text-primary/60 hover:text-primary transition-colors">Request invitation</a>
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
