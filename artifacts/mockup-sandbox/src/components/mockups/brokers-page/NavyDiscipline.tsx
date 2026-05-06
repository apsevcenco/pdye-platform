import React, { useState } from 'react';
import { DollarSign, Globe, Briefcase, Shield, ChevronRight, CheckCircle } from 'lucide-react';

export function NavyDiscipline() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", address: "", license: "", experience: "", type: "", message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const setF = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
  };

  return (
    <div style={{ backgroundColor: '#0a1628', color: '#f4ecd8', fontFamily: "'Inter', sans-serif", minHeight: '100vh', paddingBottom: '80px' }}>
      <div dangerouslySetInnerHTML={{ __html: `
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
      `}} />
      <style dangerouslySetInnerHTML={{ __html: `
        .navy-heading { font-family: 'Cormorant Garamond', serif; }
        .navy-bg { background-color: #0a1628; }
        .navy-surface { background-color: #0f1d33; }
        .navy-border { border-color: rgba(255,255,255,0.08); }
        .navy-text { color: #f4ecd8; }
        .navy-muted { color: rgba(244,236,216,0.55); }
        .navy-accent { color: #c8a96a; }
        .navy-accent-border { border-color: #c8a96a; }
        
        .navy-input {
          background-color: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          color: #f4ecd8;
          padding: 0.75rem 1rem;
          width: 100%;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        .navy-input:focus {
          outline: none;
          border-color: #c8a96a;
        }
        .navy-input::placeholder {
          color: rgba(244,236,216,0.3);
        }
        .navy-label {
          display: block;
          color: rgba(244,236,216,0.55);
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
      `}} />

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 border-b navy-border text-center max-w-4xl mx-auto">
        <div className="navy-accent text-[11px] font-semibold tracking-[0.2em] uppercase mb-8">Broker Partnership</div>
        <h1 className="navy-heading text-5xl md:text-6xl mb-6 font-normal tracking-tight">
          Partner With <span className="navy-accent italic">PDYE</span> as a Broker
        </h1>
        <p className="navy-muted text-lg leading-relaxed max-w-2xl mx-auto font-light">
          Join our exclusive broker network and gain access to off-market listings, motivated sellers, and qualified buyers — with full commission protection at every step.
        </p>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="navy-heading text-4xl mb-4">Why Brokers Partner with PDYE</h2>
          <p className="navy-muted text-sm tracking-wide">Private deal flow that doesn't appear on public listing platforms</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { title: "Co-Brokerage Network", icon: DollarSign, desc: "Partner on closed listings with full commission protection. We work under formal co-brokerage agreements — your client relationships remain yours." },
            { title: "Off-Market Buyer Access", icon: Globe, desc: "Tap into our verified pool of motivated buyers who cannot be found through public channels. Discretion guaranteed at every stage." },
            { title: "Qualified Deal Flow", icon: Briefcase, desc: "Access to motivated sellers with urgent timelines — distressed assets, estate sales, forced disposals, and pre-bankruptcy listings." },
            { title: "Legal & Documentation", icon: Shield, desc: "Full support with MOU, purchase agreements, flag state transfer, and escrow coordination through our maritime legal partners." }
          ].map((b, i) => (
            <div key={i} className="navy-surface border navy-border p-10 flex flex-col items-start transition-colors duration-300 hover:border-[#c8a96a]/30">
              <b.icon className="navy-accent mb-6" size={24} strokeWidth={1.5} />
              <h3 className="navy-heading text-xl mb-3">{b.title}</h3>
              <p className="navy-muted text-sm leading-relaxed font-light">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 border-y navy-border">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="navy-heading text-center text-3xl mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-6 text-center">
            {[
              "Submit your broker application",
              "Profile review within 48 hours",
              "Access broker portal and deal pipeline",
              "Submit and co-broker listings confidentially"
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="navy-heading text-4xl navy-accent opacity-60 mb-4 tracking-widest">0{i + 1}</div>
                <p className="navy-text text-sm leading-relaxed max-w-[200px] mx-auto">{step}</p>
                {i < 3 && <ChevronRight className="hidden md:block absolute top-4 -right-3 navy-muted opacity-30" size={20} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-24 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="navy-accent text-[10px] font-semibold tracking-[0.2em] uppercase mb-4">Apply for Partnership</div>
          <h2 className="navy-heading text-4xl mb-4">Broker Application</h2>
          <p className="navy-muted text-sm">We review every application personally. Response within 48 hours.</p>
        </div>

        {submitted ? (
          <div className="navy-surface border navy-border p-16 text-center">
            <CheckCircle className="navy-accent mx-auto mb-6" size={48} strokeWidth={1} />
            <h3 className="navy-heading text-3xl mb-4">Application Received</h3>
            <p className="navy-muted text-sm">Your application has been submitted confidentially. Our partnership team will contact you within 48 hours.</p>
          </div>
        ) : (
          <div className="navy-surface border navy-border p-10 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="navy-label">Full Name *</label>
                  <input required type="text" className="navy-input" value={form.name} onChange={e => setF("name", e.target.value)} />
                </div>
                <div>
                  <label className="navy-label">Email Address *</label>
                  <input required type="email" className="navy-input" value={form.email} onChange={e => setF("email", e.target.value)} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="navy-label">Phone / WhatsApp</label>
                  <input type="text" className="navy-input" value={form.phone} onChange={e => setF("phone", e.target.value)} />
                </div>
                <div>
                  <label className="navy-label">Agency / Company</label>
                  <input type="text" className="navy-input" value={form.company} onChange={e => setF("company", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="navy-label">Address</label>
                <input type="text" className="navy-input" value={form.address} onChange={e => setF("address", e.target.value)} />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="navy-label">Broker License / MLS No.</label>
                  <input type="text" className="navy-input" value={form.license} onChange={e => setF("license", e.target.value)} />
                </div>
                <div>
                  <label className="navy-label">Years of Experience</label>
                  <div className="relative">
                    <select className="navy-input appearance-none" value={form.experience} onChange={e => setF("experience", e.target.value)}>
                      <option value="" disabled style={{ backgroundColor: '#0f1d33' }}>Select experience...</option>
                      <option value="Under 2 years" style={{ backgroundColor: '#0f1d33' }}>Under 2 years</option>
                      <option value="2–5 years" style={{ backgroundColor: '#0f1d33' }}>2–5 years</option>
                      <option value="5–10 years" style={{ backgroundColor: '#0f1d33' }}>5–10 years</option>
                      <option value="10+ years" style={{ backgroundColor: '#0f1d33' }}>10+ years</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none navy-muted">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="navy-label">Partnership Type</label>
                <div className="relative">
                  <select className="navy-input appearance-none" value={form.type} onChange={e => setF("type", e.target.value)}>
                    <option value="" disabled style={{ backgroundColor: '#0f1d33' }}>Select partnership type...</option>
                    <option value="Co-brokerage only" style={{ backgroundColor: '#0f1d33' }}>Co-brokerage only</option>
                    <option value="Direct buyer introductions" style={{ backgroundColor: '#0f1d33' }}>Direct buyer introductions</option>
                    <option value="Both" style={{ backgroundColor: '#0f1d33' }}>Both</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none navy-muted">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="navy-label">Additional Information</label>
                <textarea rows={4} className="navy-input resize-none" value={form.message} onChange={e => setF("message", e.target.value)}></textarea>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-transparent border border-[#c8a96a] text-[#c8a96a] hover:bg-[#c8a96a] hover:text-[#0a1628] transition-colors duration-300 py-4 text-xs font-semibold tracking-[0.15em] uppercase flex items-center justify-center gap-2">
                  Submit Partnership Application
                </button>
              </div>
              <p className="text-center navy-muted text-[11px] mt-4 tracking-wide">
                All information is kept strictly confidential.
              </p>
            </form>
          </div>
        )}
      </section>

    </div>
  );
}
