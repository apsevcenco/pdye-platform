import React, { useState } from "react";
import { DollarSign, Globe, Briefcase, Shield, ChevronRight, CheckCircle } from "lucide-react";

const ICONS = [DollarSign, Globe, Briefcase, Shield];
const EXPERIENCE_OPTIONS = ["Under 2 years", "2–5 years", "5–10 years", "10+ years"];
const TYPE_OPTIONS = ["Co-brokerage only", "Direct buyer introductions", "Both"];

export function DistressedCharcoal() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", address: "", license: "", experience: "", type: "", message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function setF(k: string, v: string) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 800);
  }

  // Styles
  const colors = {
    bg: "#131313",
    surface: "#1a1a1a",
    border: "rgba(255,255,255,0.06)",
    text: "#ededed",
    muted: "rgba(237,237,237,0.5)",
    accent: "#d97706"
  };

  const inputClass = "w-full bg-transparent border-b border-[rgba(255,255,255,0.06)] focus:border-[#d97706] py-3 text-[#ededed] focus:outline-none transition-colors placeholder:text-[rgba(237,237,237,0.3)] font-sans text-sm rounded-none appearance-none";
  const labelClass = "block text-[#d97706] text-[10px] uppercase tracking-[0.15em] mb-1 font-mono";

  return (
    <div style={{ backgroundColor: colors.bg, minHeight: "100vh", color: colors.text, fontFamily: "'Inter', sans-serif" }}>
      <div dangerouslySetInnerHTML={{
        __html: `
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
        <style>
          .font-display { font-family: 'Bodoni Moda', serif; }
          .font-sans { font-family: 'Inter', sans-serif; }
          .font-mono { font-family: 'JetBrains Mono', monospace; }
        </style>
        `
      }} />

      {/* 1. HERO */}
      <section className="pt-32 pb-24 px-6 border-b border-[rgba(255,255,255,0.06)] relative">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="font-mono text-[#d97706] text-xs uppercase tracking-[0.2em] block mb-8">
            Broker Partnership
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-8 font-medium leading-[1.1]">
            Partner With <span style={{ color: colors.accent }}>PDYE</span> as a Broker
          </h1>
          <div className="w-16 h-[1px] bg-[#d97706] mx-auto mb-8"></div>
          <p className="font-sans text-[rgba(237,237,237,0.5)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
            Join our exclusive broker network and gain access to off-market listings, motivated sellers, and qualified buyers — with full commission protection at every step.
          </p>
        </div>
      </section>

      {/* 2. BENEFITS */}
      <section className="py-24 px-6 border-b border-[rgba(255,255,255,0.06)] bg-[#131313]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl mb-4 font-medium">Why Brokers Partner with PDYE</h2>
            <p className="font-sans text-[rgba(237,237,237,0.5)]">Private deal flow that doesn't appear on public listing platforms</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)]">
            {[
              { icon: Briefcase, title: "Co-Brokerage Network", desc: "Partner on closed listings with full commission protection. We work under formal co-brokerage agreements — your client relationships remain yours." },
              { icon: Globe, title: "Off-Market Buyer Access", desc: "Tap into our verified pool of motivated buyers who cannot be found through public channels. Discretion guaranteed at every stage." },
              { icon: DollarSign, title: "Qualified Deal Flow", desc: "Access to motivated sellers with urgent timelines — distressed assets, estate sales, forced disposals, and pre-bankruptcy listings." },
              { icon: Shield, title: "Legal & Documentation", desc: "Full support with MOU, purchase agreements, flag state transfer, and escrow coordination through our maritime legal partners." }
            ].map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="bg-[#1a1a1a] p-10 lg:p-12 hover:bg-[#1f1f1f] transition-colors duration-300">
                  <div className="mb-6">
                    <Icon size={24} color={colors.accent} strokeWidth={1} />
                  </div>
                  <h3 className="font-display text-2xl mb-4">{b.title}</h3>
                  <p className="font-sans text-[rgba(237,237,237,0.5)] leading-relaxed font-light text-sm">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. PROCESS */}
      <section className="py-24 px-6 border-b border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-medium">How It Works</h2>
            <div className="w-12 h-[1px] bg-[#d97706] mx-auto mt-6"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-6 relative">
            <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-px bg-[rgba(255,255,255,0.06)] z-0"></div>
            {[
              "Submit your broker application",
              "Profile review within 48 hours",
              "Access broker portal and deal pipeline",
              "Submit and co-broker listings confidentially"
            ].map((step, i) => (
              <div key={i} className="relative z-10 text-center">
                <div className="w-14 h-14 bg-[#1a1a1a] border border-[rgba(255,255,255,0.06)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="font-mono text-[#d97706] text-sm tracking-wider">0{i + 1}</span>
                </div>
                <p className="font-sans text-[rgba(237,237,237,0.7)] text-sm px-4 font-light leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. APPLICATION FORM */}
      <section className="py-24 px-6 bg-[#1a1a1a]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-mono text-[#d97706] text-xs uppercase tracking-[0.2em] block mb-4">
              Apply For Partnership
            </span>
            <h2 className="font-display text-4xl mb-4 font-medium">Broker Application</h2>
            <p className="font-sans text-[rgba(237,237,237,0.5)] font-light">We review every application personally. Response within 48 hours.</p>
          </div>

          {submitted ? (
            <div className="border border-[rgba(255,255,255,0.06)] p-12 text-center bg-[#131313]">
              <CheckCircle size={48} className="text-[#d97706] mx-auto mb-6" strokeWidth={1} />
              <h3 className="font-display text-3xl mb-4">Application Received</h3>
              <p className="font-sans text-[rgba(237,237,237,0.5)] font-light leading-relaxed">
                Thank you for your interest in partnering with PDYE. We will review your application and respond within 48 hours.
              </p>
            </div>
          ) : (
            <div className="bg-[#131313] border border-[rgba(255,255,255,0.06)] p-8 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input required value={form.name} onChange={e => setF("name", e.target.value)} className={inputClass} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address *</label>
                    <input required type="email" value={form.email} onChange={e => setF("email", e.target.value)} className={inputClass} placeholder="john@example.com" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClass}>Phone / WhatsApp</label>
                    <input value={form.phone} onChange={e => setF("phone", e.target.value)} className={inputClass} placeholder="+1 234 567 8900" />
                  </div>
                  <div>
                    <label className={labelClass}>Agency / Company</label>
                    <input value={form.company} onChange={e => setF("company", e.target.value)} className={inputClass} placeholder="Doe Brokerage" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Address</label>
                  <input value={form.address} onChange={e => setF("address", e.target.value)} className={inputClass} placeholder="123 Marina Blvd, Suite 100" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClass}>Broker License / MLS No.</label>
                    <input value={form.license} onChange={e => setF("license", e.target.value)} className={inputClass} placeholder="Lic-123456" />
                  </div>
                  <div>
                    <label className={labelClass}>Years of Experience</label>
                    <select value={form.experience} onChange={e => setF("experience", e.target.value)} className={inputClass + " bg-[#131313]"}>
                      <option value="">Select...</option>
                      {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Partnership Type</label>
                  <select value={form.type} onChange={e => setF("type", e.target.value)} className={inputClass + " bg-[#131313]"}>
                    <option value="">Select...</option>
                    {TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Additional Information</label>
                  <textarea rows={3} value={form.message} onChange={e => setF("message", e.target.value)} className={inputClass + " resize-none"} placeholder="Tell us about your portfolio..." />
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={sending} className="w-full bg-[#d97706] text-[#131313] hover:bg-[#b46004] font-mono uppercase tracking-[0.1em] text-sm py-4 px-8 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {sending ? "Submitting..." : "Submit Partnership Application"}
                  </button>
                  <p className="text-center font-sans font-light text-[rgba(237,237,237,0.3)] text-xs mt-4">
                    All information is kept strictly confidential.
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
