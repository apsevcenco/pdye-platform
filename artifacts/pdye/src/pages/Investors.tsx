import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { TrendingUp, Lock, Globe, Users, ChevronRight, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSiteSectionData } from "@/lib/siteContent";

const ICONS = [TrendingUp, Lock, Globe, Users];

const CAPACITY_OPTIONS = [
  "Up to €1M",
  "€1M – €5M",
  "€5M – €20M",
  "€20M – €50M",
  "€50M+",
  "Deal by deal",
];

export default function Investors() {
  const [t, setT] = useState({
    hero: getSiteSectionData("buyers", "hero"),
    stats: getSiteSectionData("buyers", "stats"),
    benefits: getSiteSectionData("buyers", "benefits"),
    form: getSiteSectionData("buyers", "form"),
  });

  useEffect(() => {
    setT({
      hero: getSiteSectionData("buyers", "hero"),
      stats: getSiteSectionData("buyers", "stats"),
      benefits: getSiteSectionData("buyers", "benefits"),
      form: getSiteSectionData("buyers", "form"),
    });
  }, []);

  const benefits = [
    { icon: ICONS[0], title: t.benefits.item1_title, desc: t.benefits.item1_desc },
    { icon: ICONS[1], title: t.benefits.item2_title, desc: t.benefits.item2_desc },
    { icon: ICONS[2], title: t.benefits.item3_title, desc: t.benefits.item3_desc },
    { icon: ICONS[3], title: t.benefits.item4_title, desc: t.benefits.item4_desc },
  ];

  const stats = [
    { value: t.stats.stat1_val, label: t.stats.stat1_label },
    { value: t.stats.stat2_val, label: t.stats.stat2_label },
    { value: t.stats.stat3_val, label: t.stats.stat3_label },
    { value: t.stats.stat4_val, label: t.stats.stat4_label },
  ];

  const badges = [t.hero.badge1, t.hero.badge2, t.hero.badge3, t.hero.badge4].filter(Boolean);

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
        yacht_type: "Private Buyer Application",
        message: `Focus: ${form.focus || "—"}. ${form.message}`,
      }]);
    } catch (_) {}
    setSending(false);
    setSubmitted(true);
  }

  const inputClass = "w-full bg-[#0a1628] border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors placeholder:text-white/20 font-sans text-sm";
  const labelClass = "block text-white/50 text-[10px] uppercase tracking-widest mb-2 font-sans font-bold";

  return (
    <Layout>
      <div className="pt-32 pb-20 bg-[#0a1628] relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block border border-primary/30 text-primary text-[10px] font-bold tracking-[0.25em] uppercase px-5 py-2 mb-8" dangerouslySetInnerHTML={{ __html: t.hero.tag }} />
            <h1 className="font-display text-5xl md:text-6xl text-white mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: t.hero.title }} />
            <p className="text-white/50 font-sans text-lg max-w-2xl mx-auto leading-relaxed" dangerouslySetInnerHTML={{ __html: t.hero.desc }} />
            <div className="flex flex-wrap gap-3 justify-center mt-8">
              {badges.map(txt => (
                <span key={txt} className="border border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-widest px-4 py-2">{txt}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="bg-[#0f1d33] border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                className="px-6 py-8 text-center">
                <p className="font-display text-3xl text-primary mb-1">{s.value}</p>
                <p className="text-white/35 text-[10px] uppercase tracking-widest font-sans">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <section className="py-20 bg-[#0a1628]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl text-white mb-3" dangerouslySetInnerHTML={{ __html: t.benefits.title }} />
            <p className="text-white/40 font-sans text-sm" dangerouslySetInnerHTML={{ __html: t.benefits.subtitle }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-white/[0.02] border border-white/5 p-8 group hover:border-primary/20 transition-colors">
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:border-primary/40 transition-colors">
                      <Icon size={20} className="text-primary" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-white mb-2" dangerouslySetInnerHTML={{ __html: b.title }} />
                      <p className="text-white/45 font-sans text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: b.desc }} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0f1d33] border-t border-white/5">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-primary text-[10px] font-bold tracking-[0.25em] uppercase block mb-4" dangerouslySetInnerHTML={{ __html: t.form.tag }} />
            <h2 className="font-display text-3xl text-white mb-3" dangerouslySetInnerHTML={{ __html: t.form.title }} />
            <p className="text-white/40 font-sans text-sm" dangerouslySetInnerHTML={{ __html: t.form.desc }} />
          </div>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white/[0.02] border border-primary/20 p-12 text-center">
              <CheckCircle size={40} className="text-primary mx-auto mb-5" strokeWidth={1.5} />
              <h3 className="font-display text-2xl text-white mb-3" dangerouslySetInnerHTML={{ __html: t.form.success_title }} />
              <p className="text-white/50 font-sans text-sm leading-relaxed max-w-sm mx-auto" dangerouslySetInnerHTML={{ __html: t.form.success_desc }} />
            </motion.div>
          ) : (
            <div className="bg-white/[0.02] border border-white/5 p-8 md:p-10">
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
                  className="w-full bg-white/5 backdrop-blur-md border border-primary text-primary hover:bg-primary/10 hover:text-white hover:border-white font-bold uppercase tracking-widest py-4 mt-2 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">
                  {sending ? "Submitting..." : <><span>{t.form.submit_btn}</span><ChevronRight size={16} /></>}
                </button>
                <p className="text-white/20 text-[11px] text-center font-sans" dangerouslySetInnerHTML={{ __html: t.form.disclaimer }} />
              </form>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
