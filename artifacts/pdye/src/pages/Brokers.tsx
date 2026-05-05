import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Briefcase, DollarSign, Globe, Shield, ChevronRight, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSiteSectionData } from "@/lib/siteContent";

const ICONS = [DollarSign, Globe, Briefcase, Shield];

const EXPERIENCE_OPTIONS = ["Under 2 years", "2–5 years", "5–10 years", "10+ years"];
const TYPE_OPTIONS = ["Co-brokerage only", "Direct buyer introductions", "Both"];

export default function Brokers() {
  const [t, setT] = useState({
    hero: getSiteSectionData("brokers", "hero"),
    benefits: getSiteSectionData("brokers", "benefits"),
    process: getSiteSectionData("brokers", "process"),
    form: getSiteSectionData("brokers", "form"),
  });

  useEffect(() => {
    setT({
      hero: getSiteSectionData("brokers", "hero"),
      benefits: getSiteSectionData("brokers", "benefits"),
      process: getSiteSectionData("brokers", "process"),
      form: getSiteSectionData("brokers", "form"),
    });
  }, []);

  const benefits = [
    { icon: ICONS[0], title: t.benefits.item1_title, desc: t.benefits.item1_desc },
    { icon: ICONS[1], title: t.benefits.item2_title, desc: t.benefits.item2_desc },
    { icon: ICONS[2], title: t.benefits.item3_title, desc: t.benefits.item3_desc },
    { icon: ICONS[3], title: t.benefits.item4_title, desc: t.benefits.item4_desc },
  ];

  const steps = [
    { num: "01", label: t.process.step1 },
    { num: "02", label: t.process.step2 },
    { num: "03", label: t.process.step3 },
    { num: "04", label: t.process.step4 },
  ];

  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", address: "", license: "", experience: "", type: "", message: "",
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
      const payload: Record<string, any> = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        company: form.company || null,
        location: form.address || null,
        budget: `${form.experience}${form.company ? " · " + form.company : ""}${form.license ? " · License: " + form.license : ""}`,
        yacht_type: "Broker Application",
        message: `Partnership type: ${form.type || "—"}. ${form.message}`,
      };
      let { error: insertErr } = await supabase.from("leads").insert([payload]);
      // Older lead schemas may not have the `location` or `company` columns yet —
      // fall back to embedding them in the message so the data isn't lost.
      if (insertErr && /column .* does not exist|Could not find the .* column/i.test(insertErr.message)) {
        const fallback = { ...payload };
        delete fallback.location;
        delete fallback.company;
        fallback.message = `Partnership type: ${form.type || "—"}. ${form.message}\n\nCompany: ${form.company || "—"}\nAddress: ${form.address || "—"}`;
        const retry = await supabase.from("leads").insert([fallback]);
        insertErr = retry.error;
      }
      if (insertErr) console.warn("[brokers] lead insert failed:", insertErr.message);
    } catch (_) {}
    setSending(false);
    setSubmitted(true);
  }

  const inputClass = "w-full bg-[#070f1a] border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors placeholder:text-white/20 font-sans text-sm";
  const labelClass = "block text-white/50 text-[10px] uppercase tracking-widest mb-2 font-sans font-bold";

  return (
    <Layout>
      <div className="pt-32 pb-20 bg-[#070f1a] relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-0 w-96 h-96 bg-primary/4 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block border border-primary/30 text-primary text-[10px] font-bold tracking-[0.25em] uppercase px-5 py-2 mb-8" dangerouslySetInnerHTML={{ __html: t.hero.tag }} />
            <h1 className="font-display text-5xl md:text-6xl text-white mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: t.hero.title }} />
            <p className="text-white/50 font-sans text-lg max-w-2xl mx-auto leading-relaxed" dangerouslySetInnerHTML={{ __html: t.hero.desc }} />
          </motion.div>
        </div>
      </div>

      <section className="py-20 bg-[#070f1a]">
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
                  className="bg-[#0f1d33] border border-white/5 p-8 group hover:border-primary/20 transition-colors">
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

      <section className="py-16 bg-[#0a1426] border-t border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl text-white" dangerouslySetInnerHTML={{ __html: t.process.title }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className="text-center">
                <p className="font-display text-4xl text-primary/30 mb-3">{s.num}</p>
                <p className="text-white/60 font-sans text-sm leading-snug" dangerouslySetInnerHTML={{ __html: s.label }} />
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

      <section className="py-20 bg-[#070f1a]">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-primary text-[10px] font-bold tracking-[0.25em] uppercase block mb-4" dangerouslySetInnerHTML={{ __html: t.form.tag }} />
            <h2 className="font-display text-3xl text-white mb-3" dangerouslySetInnerHTML={{ __html: t.form.title }} />
            <p className="text-white/40 font-sans text-sm" dangerouslySetInnerHTML={{ __html: t.form.desc }} />
          </div>

          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0f1d33] border border-primary/20 p-12 text-center">
              <CheckCircle size={40} className="text-primary mx-auto mb-5" strokeWidth={1.5} />
              <h3 className="font-display text-2xl text-white mb-3" dangerouslySetInnerHTML={{ __html: t.form.success_title }} />
              <p className="text-white/50 font-sans text-sm leading-relaxed max-w-sm mx-auto" dangerouslySetInnerHTML={{ __html: t.form.success_desc }} />
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
                <div>
                  <label className={labelClass}>Address</label>
                  <input value={form.address} onChange={e => setF("address", e.target.value)} className={inputClass} placeholder="Via dei Marinai 12, 80133 Napoli, Italy" />
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
