import React, { useState } from "react";
import { DollarSign, Globe, Briefcase, Shield, ChevronRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const EXPERIENCE_OPTIONS = ["Under 2 years", "2–5 years", "5–10 years", "10+ years"];
const TYPE_OPTIONS = ["Co-brokerage only", "Direct buyer introductions", "Both"];

export function MediterraneanEditorial() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", address: "", license: "", experience: "", type: "", message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 1000);
  };

  const inputClass = "w-full bg-[#f4ede0] border-b border-[#0f3443]/20 px-0 py-3 text-[#0f3443] focus:outline-none focus:border-[#b07d3c] transition-colors placeholder:text-[#0f3443]/30 font-['Inter'] text-sm rounded-none";
  const labelClass = "block text-[#0f3443]/60 text-[11px] uppercase tracking-[0.15em] mb-1 font-['Inter'] font-medium";

  return (
    <div className="min-h-screen bg-[#f4ede0] text-[#0f3443] font-['Inter']">
      <div dangerouslySetInnerHTML={{ __html: `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">` }} />
      
      {/* HERO */}
      <section className="pt-32 pb-24 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center">
          <span className="text-[#b07d3c] text-[10px] uppercase tracking-[0.25em] font-semibold mb-8 inline-block relative">
            Broker Partnership
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-[#b07d3c]/30"></span>
          </span>
          <h1 className="font-['Cormorant_Garamond'] text-5xl md:text-7xl font-light mb-8 max-w-4xl leading-tight">
            Partner With <span className="text-[#b07d3c] italic">PDYE</span> as a Broker
          </h1>
          <p className="text-[#0f3443]/70 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
            Join our exclusive broker network and gain access to off-market listings, motivated sellers, and qualified buyers — with full commission protection at every step.
          </p>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-24 px-6 md:px-12 bg-[#ebe1cf] border-y border-[#0f3443]/10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 md:mb-20">
            <h2 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-light mb-4">
              Why Brokers Partner <span className="italic text-[#b07d3c]">with PDYE</span>
            </h2>
            <p className="text-[#0f3443]/60 text-lg font-light">
              Private deal flow that doesn't appear on public listing platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            <div className="md:col-span-7 bg-[#f4ede0] p-10 md:p-14 border border-[#0f3443]/10">
              <Briefcase size={28} className="text-[#b07d3c] mb-8" strokeWidth={1.5} />
              <h3 className="font-['Cormorant_Garamond'] text-3xl font-medium mb-4">Co-Brokerage Network</h3>
              <p className="text-[#0f3443]/70 font-light leading-relaxed text-lg">
                Partner on closed listings with full commission protection. We work under formal co-brokerage agreements — your client relationships remain yours.
              </p>
            </div>

            <div className="md:col-span-5 bg-[#f4ede0] p-8 md:p-10 border border-[#0f3443]/10">
              <Globe size={24} className="text-[#b07d3c] mb-6" strokeWidth={1.5} />
              <h3 className="font-['Cormorant_Garamond'] text-2xl font-medium mb-3">Off-Market Buyer Access</h3>
              <p className="text-[#0f3443]/70 font-light leading-relaxed">
                Tap into our verified pool of motivated buyers who cannot be found through public channels. Discretion guaranteed at every stage.
              </p>
            </div>

            <div className="md:col-span-6 bg-[#f4ede0] p-8 md:p-10 border border-[#0f3443]/10">
              <DollarSign size={24} className="text-[#b07d3c] mb-6" strokeWidth={1.5} />
              <h3 className="font-['Cormorant_Garamond'] text-2xl font-medium mb-3">Qualified Deal Flow</h3>
              <p className="text-[#0f3443]/70 font-light leading-relaxed">
                Access to motivated sellers with urgent timelines — distressed assets, estate sales, forced disposals, and pre-bankruptcy listings.
              </p>
            </div>

            <div className="md:col-span-6 bg-[#f4ede0] p-8 md:p-10 border border-[#0f3443]/10">
              <Shield size={24} className="text-[#b07d3c] mb-6" strokeWidth={1.5} />
              <h3 className="font-['Cormorant_Garamond'] text-2xl font-medium mb-3">Legal & Documentation</h3>
              <p className="text-[#0f3443]/70 font-light leading-relaxed">
                Full support with MOU, purchase agreements, flag state transfer, and escrow coordination through our maritime legal partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="py-24 px-6 md:px-12 max-w-6xl mx-auto">
        <h2 className="font-['Cormorant_Garamond'] text-4xl text-center font-light mb-16">
          How It <span className="italic text-[#b07d3c]">Works</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
          {[
            "Submit your broker application",
            "Profile review within 48 hours",
            "Access broker portal and deal pipeline",
            "Submit and co-broker listings confidentially"
          ].map((step, i) => (
            <div key={i} className="relative flex flex-col md:items-center text-left md:text-center group">
              <div className="text-4xl md:text-5xl font-['Cormorant_Garamond'] font-light text-[#b07d3c] mb-4">
                0{i + 1}
              </div>
              <div className="w-12 md:w-[1px] h-[1px] md:h-8 bg-[#0f3443]/20 mb-4 md:my-4"></div>
              <p className="text-[#0f3443]/80 font-medium px-4">
                {step}
              </p>
              {i < 3 && (
                <div className="hidden md:block absolute top-6 right-0 translate-x-1/2 text-[#0f3443]/10">
                  <ChevronRight size={32} strokeWidth={1} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FORM */}
      <section className="py-24 px-6 md:px-12 bg-[#ebe1cf] border-t border-[#0f3443]/10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#b07d3c] text-[10px] uppercase tracking-[0.25em] font-semibold mb-4 inline-block">
              Apply For Partnership
            </span>
            <h2 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl font-light mb-4">
              Broker <span className="italic text-[#b07d3c]">Application</span>
            </h2>
            <p className="text-[#0f3443]/60">
              We review every application personally. Response within 48 hours.
            </p>
          </div>

          <div className="bg-[#f4ede0] p-8 md:p-14 border border-[#0f3443]/15 rounded-sm shadow-[0_10px_40px_-15px_rgba(15,52,67,0.1)]">
            {submitted ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
                <CheckCircle size={48} className="text-[#b07d3c] mx-auto mb-6" strokeWidth={1} />
                <h3 className="font-['Cormorant_Garamond'] text-3xl font-medium mb-3">Application Received</h3>
                <p className="text-[#0f3443]/70 font-light max-w-sm mx-auto">
                  Thank you for your interest in partnering with PDYE. Our team will review your profile and respond within 48 hours.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input type="text" required className={inputClass} placeholder="e.g. Jean-Luc Picard" />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address *</label>
                    <input type="email" required className={inputClass} placeholder="jean-luc@example.com" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClass}>Phone / WhatsApp</label>
                    <input type="tel" className={inputClass} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div>
                    <label className={labelClass}>Agency / Company</label>
                    <input type="text" className={inputClass} placeholder="e.g. Horizon Yachting" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Address</label>
                  <input type="text" className={inputClass} placeholder="Full business address" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className={labelClass}>Broker License / MLS No.</label>
                    <input type="text" className={inputClass} placeholder="If applicable" />
                  </div>
                  <div>
                    <label className={labelClass}>Years of Experience</label>
                    <select className={inputClass + " appearance-none cursor-pointer"}>
                      <option value="" disabled selected>Select duration</option>
                      {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Partnership Type</label>
                  <select className={inputClass + " appearance-none cursor-pointer"}>
                    <option value="" disabled selected>Select partnership type</option>
                    {TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Additional Information</label>
                  <textarea rows={3} className={inputClass + " resize-none"} placeholder="Tell us about your client base and focus areas..."></textarea>
                </div>

                <div className="pt-4 text-center">
                  <button type="submit" disabled={sending} className="group relative inline-flex items-center justify-center gap-3 bg-transparent border border-[#b07d3c] text-[#0f3443] hover:text-[#f4ede0] px-8 py-4 transition-all duration-500 overflow-hidden disabled:opacity-50">
                    <div className="absolute inset-0 bg-[#b07d3c] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]"></div>
                    <span className="relative z-10 text-xs tracking-[0.2em] font-semibold uppercase">
                      {sending ? "Submitting..." : "Submit Partnership Application"}
                    </span>
                  </button>
                  <p className="mt-6 text-[11px] text-[#0f3443]/40 tracking-wide uppercase">
                    All information is kept strictly confidential.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
