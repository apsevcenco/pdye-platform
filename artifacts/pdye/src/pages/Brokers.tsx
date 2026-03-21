import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useState } from "react";
import { Briefcase, DollarSign, Globe, Shield, ChevronRight, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const benefits = [
  {
    icon: DollarSign,
    title: "Co-Brokerage Network",
    desc: "Partner on closed listings with full commission protection. We work under formal co-brokerage agreements — your client relationships remain yours.",
  },
  {
    icon: Globe,
    title: "Off-Market Buyer Access",
    desc: "Tap into our verified pool of motivated buyers who cannot be found through public channels. Discretion guaranteed at every stage.",
  },
  {
    icon: Briefcase,
    title: "Qualified Deal Flow",
    desc: "Access to motivated sellers with urgent timelines — distressed assets, estate sales, forced disposals, and pre-bankruptcy listings.",
  },
  {
    icon: Shield,
    title: "Legal & Documentation",
    desc: "Full support with MOU, purchase agreements, flag state transfer, and escrow coordination through our maritime legal partners.",
  },
];

const steps = [
  { num: "01", label: "Submit your broker application" },
  { num: "02", label: "Profile review within 48 hours" },
  { num: "03", label: "Access broker portal and deal pipeline" },
  { num: "04", label: "Submit and co-broker listings confidentially" },
];

const EXPERIENCE_OPTIONS = ["Under 2 years", "2–5 years", "5–10 years", "10+ years"];
const TYPE_OPTIONS = ["Co-brokerage only", "Direct buyer introductions", "Both"];

export default function Brokers() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", license: "", experience: "", type: "", message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  function setF(k: string, v: string) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) { setError("Name and email are required."); return; }
    setError("");
    setSending(true);
    try {
      await supabase.from("leads").insert([{
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        budget: `${form.experience}${form.company ? " · " + form.company : ""}${form.license ? " · License: " + form.license : ""}`,
        yacht_type: "Broker Application",
        message: `Partnership type: ${form.type || "—"}. ${form.message}`,
      }]);
    } catch (_) {}
    setSending(false);
    setSubmitted(true);
  }

  const inputClass = "w-full bg-[#070f1a] border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors placeholder:text-white/20 font-sans text-sm";
  const labelClass = "block text-white/50 text-[10px] uppercase tracking-widest mb-2 font-sans font-bold";

  return (
    <Layout>
      {/* Hero */}
      <div className="pt-32 pb-20 bg-[#070f1a] relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-0 w-96 h-96 bg-primary/4 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block border border-primary/30 text-primary text-[10px] font-bold tracking-[0.25em] uppercase px-5 py-2 mb-8">
              Broker Partnership
            </span>
            <h1 className="font-display text-5xl md:text-6xl text-white mb-6 leading-tight">
              Partner With <span className="text-primary">PDYE</span><br />as a Broker
            </h1>
            <p className="text-white/50 font-sans text-lg max-w-2xl mx-auto leading-relaxed">
              Join our exclusive broker network and gain access to off-market listings, motivated sellers, and qualified buyers — with full commission protection at every step.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Benefits */}
      <section className="py-20 bg-[#070f1a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl text-white mb-3">Why Brokers Partner with PDYE</h2>
            <p className="text-white/40 font-sans text-sm">Private deal flow that doesn't appear on public listing platforms</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div key={b.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-[#0f1d33] border border-white/5 p-8 group hover:border-primary/20 transition-colors">
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:border-primary/40 transition-colors">
                      <Icon size={20} className="text-primary" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-white mb-2">{b.title}</h3>
                      <p className="text-white/45 font-sans text-sm leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-[#0a1426] border-t border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl text-white">How It Works</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className="text-center">
                <p className="font-display text-4xl text-primary/30 mb-3">{s.num}</p>
                <p className="text-white/60 font-sans text-sm leading-snug">{s.label}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute mt-[-28px] ml-[90%] text-white/15">
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-20 bg-[#070f1a]">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-primary text-[10px] font-bold tracking-[0.25em] uppercase block mb-4">Apply for Partnership</span>
            <h2 className="font-display text-3xl text-white mb-3">Broker Application</h2>
            <p className="text-white/40 font-sans text-sm">We review every application personally. Response within 48 hours.</p>
          </div>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0f1d33] border border-primary/20 p-12 text-center">
              <CheckCircle size={40} className="text-primary mx-auto mb-5" strokeWidth={1.5} />
              <h3 className="font-display text-2xl text-white mb-3">Application Received</h3>
              <p className="text-white/50 font-sans text-sm leading-relaxed max-w-sm mx-auto">
                Our partnerships team will review your profile and contact you within 48 hours to discuss co-brokerage terms and portal access.
              </p>
            </motion.div>
          ) : (
            <div className="bg-[#0f1d33] border border-white/5 p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input value={form.name} onChange={e => setF("name", e.target.value)} required className={inputClass} placeholder="Roberto Sforza" />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address *</label>
                    <input type="email" value={form.email} onChange={e => setF("email", e.target.value)} required className={inputClass} placeholder="r.sforza@brokerage.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Phone / WhatsApp</label>
                    <input value={form.phone} onChange={e => setF("phone", e.target.value)} className={inputClass} placeholder="+39 02 000 0000" />
                  </div>
                  <div>
                    <label className={labelClass}>Agency / Company</label>
                    <input value={form.company} onChange={e => setF("company", e.target.value)} className={inputClass} placeholder="Sforza Maritime" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Broker License / MLS No.</label>
                    <input value={form.license} onChange={e => setF("license", e.target.value)} className={inputClass} placeholder="Optional" />
                  </div>
                  <div>
                    <label className={labelClass}>Years of Experience</label>
                    <select value={form.experience} onChange={e => setF("experience", e.target.value)} className={inputClass + " cursor-pointer"}>
                      <option value="">Select...</option>
                      {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Partnership Type</label>
                  <select value={form.type} onChange={e => setF("type", e.target.value)} className={inputClass + " cursor-pointer"}>
                    <option value="">Select...</option>
                    {TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Additional Information</label>
                  <textarea value={form.message} onChange={e => setF("message", e.target.value)} rows={4}
                    className={inputClass + " resize-none"} placeholder="Specialization, markets, current portfolio, any specific requirements..." />
                </div>
                {error && <p className="text-red-400 text-xs font-sans">{error}</p>}
                <button type="submit" disabled={sending}
                  className="w-full bg-primary hover:bg-white text-[#070f1a] font-bold uppercase tracking-widest py-4 mt-2 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">
                  {sending ? "Submitting..." : <><span>Submit Partnership Application</span><ChevronRight size={16} /></>}
                </button>
                <p className="text-white/20 text-[11px] text-center font-sans">All information is kept strictly confidential.</p>
              </form>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
