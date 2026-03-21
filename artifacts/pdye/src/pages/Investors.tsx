import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useState } from "react";
import { TrendingUp, Lock, Globe, Users, ChevronRight, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const benefits = [
  {
    icon: TrendingUp,
    title: "Off-Market Deal Flow",
    desc: "First access to distressed and motivated-seller yachts before they reach the open market. Average discount: 18–34% below market value.",
  },
  {
    icon: Lock,
    title: "Private Deal Room",
    desc: "Exclusive access to our secure deal room with full financial documentation, surveys, and valuation reports under NDA.",
  },
  {
    icon: Globe,
    title: "Global Network",
    desc: "Sourcing from Mediterranean, Caribbean, and Asia-Pacific markets. Active relationships with 200+ distressed asset handlers.",
  },
  {
    icon: Users,
    title: "Curated Introductions",
    desc: "We only match qualified investors with relevant opportunities. No noise — only deals that match your stated parameters.",
  },
];

const stats = [
  { value: "€2.4B+", label: "Transactions Facilitated" },
  { value: "18–34%", label: "Average Discount to Market" },
  { value: "48h", label: "Deal Introduction Time" },
  { value: "100%", label: "Confidential Process" },
];

const CAPACITY_OPTIONS = [
  "Up to €1M",
  "€1M – €5M",
  "€5M – €20M",
  "€20M – €50M",
  "€50M+",
  "Deal by deal",
];

export default function Investors() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", capacity: "", focus: "", message: "",
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
        budget: `${form.capacity}${form.company ? " · " + form.company : ""}`,
        yacht_type: "Investor Application",
        message: `Focus: ${form.focus || "—"}. ${form.message}`,
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block border border-primary/30 text-primary text-[10px] font-bold tracking-[0.25em] uppercase px-5 py-2 mb-8">
              Investor Membership
            </span>
            <h1 className="font-display text-5xl md:text-6xl text-white mb-6 leading-tight">
              Access <span className="text-primary">Off-Market</span><br />Yacht Acquisitions
            </h1>
            <p className="text-white/50 font-sans text-lg max-w-2xl mx-auto leading-relaxed">
              PDYE connects qualified investors with motivated sellers and distressed yacht assets — exclusively, privately, and at significant discounts to market value.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-8">
              {["UHNW Individuals", "Family Offices", "Fund Managers", "Asset Managers"].map(t => (
                <span key={t} className="border border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-widest px-4 py-2">{t}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-[#0a1426] border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                className="px-6 py-8 text-center">
                <p className="font-display text-3xl text-primary mb-1">{s.value}</p>
                <p className="text-white/35 text-[10px] uppercase tracking-widest font-sans">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <section className="py-20 bg-[#070f1a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl text-white mb-3">Why Investors Choose PDYE</h2>
            <p className="text-white/40 font-sans text-sm">Institutional-grade deal flow in the private yacht market</p>
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

      {/* Application Form */}
      <section className="py-20 bg-[#0a1426] border-t border-white/5">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-primary text-[10px] font-bold tracking-[0.25em] uppercase block mb-4">Apply for Membership</span>
            <h2 className="font-display text-3xl text-white mb-3">Investor Application</h2>
            <p className="text-white/40 font-sans text-sm">Submit your profile. Our team reviews each application within 48 hours.</p>
          </div>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0f1d33] border border-primary/20 p-12 text-center">
              <CheckCircle size={40} className="text-primary mx-auto mb-5" strokeWidth={1.5} />
              <h3 className="font-display text-2xl text-white mb-3">Application Received</h3>
              <p className="text-white/50 font-sans text-sm leading-relaxed max-w-sm mx-auto">
                Our team will review your profile and reach out within 48 hours to discuss next steps and set up your private access.
              </p>
            </motion.div>
          ) : (
            <div className="bg-[#0f1d33] border border-white/5 p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input value={form.name} onChange={e => setF("name", e.target.value)} required className={inputClass} placeholder="Jean-Pierre Moreau" />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address *</label>
                    <input type="email" value={form.email} onChange={e => setF("email", e.target.value)} required className={inputClass} placeholder="jp@moreau-capital.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Phone / WhatsApp</label>
                    <input value={form.phone} onChange={e => setF("phone", e.target.value)} className={inputClass} placeholder="+33 6 00 00 00 00" />
                  </div>
                  <div>
                    <label className={labelClass}>Company / Fund</label>
                    <input value={form.company} onChange={e => setF("company", e.target.value)} className={inputClass} placeholder="Moreau Capital" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Investment Capacity</label>
                  <select value={form.capacity} onChange={e => setF("capacity", e.target.value)} className={inputClass + " cursor-pointer"}>
                    <option value="">Select range...</option>
                    {CAPACITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Asset Focus</label>
                  <input value={form.focus} onChange={e => setF("focus", e.target.value)} className={inputClass} placeholder="e.g. Motor yachts 30m+, Mediterranean, distressed only" />
                </div>
                <div>
                  <label className={labelClass}>Additional Information</label>
                  <textarea value={form.message} onChange={e => setF("message", e.target.value)} rows={4}
                    className={inputClass + " resize-none"} placeholder="Investment timeline, preferred deal structure, any specific requirements..." />
                </div>
                {error && <p className="text-red-400 text-xs font-sans">{error}</p>}
                <button type="submit" disabled={sending}
                  className="w-full bg-primary hover:bg-white text-[#070f1a] font-bold uppercase tracking-widest py-4 mt-2 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">
                  {sending ? "Submitting..." : <><span>Submit Application</span><ChevronRight size={16} /></>}
                </button>
                <p className="text-white/20 text-[11px] text-center font-sans">All information is kept strictly confidential under NDA.</p>
              </form>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
