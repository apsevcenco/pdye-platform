import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Shield, EyeOff, Globe, TrendingUp, CheckCircle, ArrowRight, Anchor, LayoutDashboard } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { getSiteSectionData } from "@/lib/siteContent";

const ICONS = [EyeOff, Globe, TrendingUp, Shield];

export default function BoatOwners() {
  const { user, userProfile } = useAuth();
  const isOwner = user && (userProfile?.role === "owner" || userProfile?.role === "admin");

  const [t, setT] = useState({
    hero: getSiteSectionData("owners", "hero"),
    benefits: getSiteSectionData("owners", "benefits"),
    process: getSiteSectionData("owners", "process"),
    form: getSiteSectionData("owners", "form"),
  });

  useEffect(() => {
    setT({
      hero: getSiteSectionData("owners", "hero"),
      benefits: getSiteSectionData("owners", "benefits"),
      process: getSiteSectionData("owners", "process"),
      form: getSiteSectionData("owners", "form"),
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

  const stats = [
    [t.hero.stat1_val, t.hero.stat1_label],
    [t.hero.stat2_val, t.hero.stat2_label],
    [t.hero.stat3_val, t.hero.stat3_label],
  ];

  const [form, setForm] = useState({ name: "", email: "", phone: "", vessel: "", length: "", year: "", location: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  function setF(k: string, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.vessel) {
      setError("Please fill in your name, email and vessel name.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await supabase.from("leads").insert([{
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        budget: `${form.vessel}${form.length ? " · " + form.length : ""}${form.year ? " · " + form.year : ""}`,
        yacht_type: "Owner Submission",
        message: `Location: ${form.location || "—"}. ${form.message}`,
      }]);
    } catch (_) {}
    setSending(false);
    setSubmitted(true);
  }

  const inputCls = "w-full bg-background border border-white/10 focus:border-primary px-4 py-3 text-white text-sm font-sans focus:outline-none transition-colors placeholder:text-white/20";
  const labelCls = "block text-white/50 text-[10px] uppercase tracking-widest mb-1.5 font-sans";

  return (
    <Layout>
      <div className="relative pt-40 pb-24 bg-secondary border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(200,164,107,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="text-primary font-bold tracking-[0.25em] text-[10px] uppercase mb-5 block" dangerouslySetInnerHTML={{ __html: t.hero.tag }} />
            <h1 className="font-display text-5xl md:text-6xl text-white mb-6 leading-tight">
              <span dangerouslySetInnerHTML={{ __html: t.hero.title }} /><br />
              <span className="text-primary" dangerouslySetInnerHTML={{ __html: t.hero.title_accent }} />
            </h1>
            <p className="text-white/55 font-sans text-lg leading-relaxed max-w-2xl mx-auto" dangerouslySetInnerHTML={{ __html: t.hero.desc }} />
            <div className="flex items-center justify-center gap-8 mt-10">
              {stats.map(([val, lbl]) => (
                <div key={lbl} className="text-center">
                  <p className="font-display text-3xl text-primary">{val}</p>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-sans mt-1">{lbl}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-primary font-bold tracking-[0.2em] text-[10px] uppercase mb-4 block" dangerouslySetInnerHTML={{ __html: t.benefits.tag }} />
            <h2 className="font-display text-3xl md:text-4xl text-white" dangerouslySetInnerHTML={{ __html: t.benefits.title }} />
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white/[0.02] border border-white/5 p-8 group hover:border-primary/20 transition-colors"
              >
                <b.icon size={28} className="text-primary mb-5" strokeWidth={1.5} />
                <h3 className="font-display text-xl text-white mb-3" dangerouslySetInnerHTML={{ __html: b.title }} />
                <p className="text-white/50 font-sans text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: b.desc }} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-20 bg-secondary border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="text-primary font-bold tracking-[0.2em] text-[10px] uppercase mb-4 block" dangerouslySetInnerHTML={{ __html: t.process.tag }} />
            <h2 className="font-display text-3xl md:text-4xl text-white" dangerouslySetInnerHTML={{ __html: t.process.title }} />
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                <div className="font-display text-5xl text-primary/15 mb-4 leading-none">{s.num}</div>
                <p className="text-white/70 font-sans text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: s.label }} />
                {i < steps.length - 1 && (
                  <ArrowRight size={16} className="text-primary/30 absolute -right-4 top-4 hidden lg:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-24 bg-background">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-primary font-bold tracking-[0.2em] text-[10px] uppercase mb-4 block" dangerouslySetInnerHTML={{ __html: t.form.tag }} />
            <h2 className="font-display text-3xl md:text-4xl text-white mb-4" dangerouslySetInnerHTML={{ __html: t.form.title }} />
            <p className="text-white/50 font-sans text-sm" dangerouslySetInnerHTML={{ __html: t.form.desc }} />
          </motion.div>

          {isOwner ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8 bg-primary/5 border border-primary/20 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="text-center sm:text-left">
                <p className="text-white font-display text-lg mb-0.5">Your Owner Account is Active</p>
                <p className="text-white/40 text-sm font-sans">
                  Manage your listings, track deal status and submit to Deal Room from your personal dashboard.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-primary text-primary px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-primary/10 hover:text-white hover:border-white transition-all duration-300 flex-shrink-0"
              >
                <LayoutDashboard size={13} /> My Dashboard
              </Link>
            </motion.div>
          ) : user ? (
            <div className="mb-8 border border-white/8 bg-white/2 px-5 py-4 flex items-center justify-between gap-4">
              <p className="text-white/40 text-sm font-sans">Already a member? You can also submit directly from your dashboard.</p>
              <Link href="/dashboard" className="text-primary text-xs font-bold uppercase tracking-widest hover:underline flex-shrink-0 flex items-center gap-1">
                Dashboard <ArrowRight size={11} />
              </Link>
            </div>
          ) : (
            <div className="mb-8 border border-white/8 bg-white/2 px-5 py-4 flex items-center justify-between gap-4">
              <p className="text-white/40 text-sm font-sans">Already a registered vessel owner? Sign in to access your dashboard.</p>
              <Link href="/login" className="text-primary text-xs font-bold uppercase tracking-widest hover:underline flex-shrink-0 flex items-center gap-1">
                Sign In <ArrowRight size={11} />
              </Link>
            </div>
          )}

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/[0.02] border border-primary/20 p-12 text-center"
            >
              <CheckCircle size={40} className="text-primary mx-auto mb-5" strokeWidth={1.5} />
              <h3 className="font-display text-2xl text-white mb-3" dangerouslySetInnerHTML={{ __html: t.form.success_title }} />
              <p className="text-white/50 font-sans text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: t.form.success_desc }} />
              <div className="flex items-center justify-center gap-2 mt-6 text-primary/60 text-xs font-sans tracking-widest uppercase">
                <Anchor size={12} />
                <span>PDYE Confidential</span>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white/[0.02] border border-white/5 p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Your Name *</label>
                  <input className={inputCls} placeholder="Jean-Pierre Moreau" value={form.name} onChange={e => setF("name", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input className={inputCls} type="email" placeholder="owner@example.com" value={form.email} onChange={e => setF("email", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Phone</label>
                  <input className={inputCls} placeholder="+33 6 00 00 00 00" value={form.phone} onChange={e => setF("phone", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Vessel Name *</label>
                  <input className={inputCls} placeholder="AURELIA" value={form.vessel} onChange={e => setF("vessel", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className={labelCls}>Length (m)</label>
                  <input className={inputCls} placeholder="38.5 m" value={form.length} onChange={e => setF("length", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Year Built</label>
                  <input className={inputCls} placeholder="2018" value={form.year} onChange={e => setF("year", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Current Location</label>
                  <input className={inputCls} placeholder="Monaco" value={form.location} onChange={e => setF("location", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Additional Details</label>
                <textarea
                  className={inputCls + " resize-none h-28"}
                  placeholder="Builder, asking price expectations, urgency, and any relevant notes..."
                  value={form.message}
                  onChange={e => setF("message", e.target.value)}
                />
              </div>
              {error && <p className="text-red-400 text-xs font-sans">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-white/5 backdrop-blur-md border border-primary text-primary hover:bg-primary/10 hover:text-white hover:border-white py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 disabled:opacity-50"
              >
                {sending ? "Submitting..." : t.form.submit_btn}
              </button>
              <p className="text-white/25 text-[10px] font-sans text-center tracking-wide" dangerouslySetInnerHTML={{ __html: t.form.disclaimer }} />
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
