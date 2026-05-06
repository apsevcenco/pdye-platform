import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Loader2, TrendingUp, Briefcase, Ship } from "lucide-react";
import { getSiteSectionData } from "@/lib/siteContent";

const lbl = "block text-white/55 text-[10px] font-bold mb-1.5 uppercase tracking-widest font-sans";
const inp = "w-full bg-background border border-white/10 focus:border-primary px-4 py-3 text-white text-sm focus:outline-none transition-colors placeholder:text-white/20 font-sans";
const sel = inp + " cursor-pointer";

const CAPACITY_OPTIONS = ["Up to €1M", "€1M – €5M", "€5M – €20M", "€20M – €50M", "€50M+", "Deal by deal"];
const EXPERIENCE_OPTIONS = ["Under 2 years", "2–5 years", "5–10 years", "10+ years"];
const BROKER_TYPE_OPTIONS = ["Co-brokerage only", "Direct buyer introductions", "Both"];

type RoleKey = "investor" | "broker" | "owner";

export default function Access() {
  const [t, setT] = useState({
    investor: getSiteSectionData("access", "investor"),
    broker: getSiteSectionData("access", "broker"),
    owner: getSiteSectionData("access", "owner"),
    common: getSiteSectionData("access", "common"),
  });

  useEffect(() => {
    setT({
      investor: getSiteSectionData("access", "investor"),
      broker: getSiteSectionData("access", "broker"),
      owner: getSiteSectionData("access", "owner"),
      common: getSiteSectionData("access", "common"),
    });
  }, []);

  const ROLES = [
    {
      key: "investor" as RoleKey,
      label: "Private Buyer",
      icon: TrendingUp,
      tag: t.investor.tag,
      heading: t.investor.heading,
      sub: t.investor.sub,
      note: t.investor.note,
      stats: [
        { num: t.investor.stat1_num, label: t.investor.stat1_label },
        { num: t.investor.stat2_num, label: t.investor.stat2_label },
        { num: t.investor.stat3_num, label: t.investor.stat3_label },
      ],
    },
    {
      key: "broker" as RoleKey,
      label: "Broker",
      icon: Briefcase,
      tag: t.broker.tag,
      heading: t.broker.heading,
      sub: t.broker.sub,
      note: t.broker.note,
      stats: [
        { num: t.broker.stat1_num, label: t.broker.stat1_label },
        { num: t.broker.stat2_num, label: t.broker.stat2_label },
        { num: t.broker.stat3_num, label: t.broker.stat3_label },
      ],
    },
    {
      key: "owner" as RoleKey,
      label: "Yacht Owner",
      icon: Ship,
      tag: t.owner.tag,
      heading: t.owner.heading,
      sub: t.owner.sub,
      note: t.owner.note,
      stats: [
        { num: t.owner.stat1_num, label: t.owner.stat1_label },
        { num: t.owner.stat2_num, label: t.owner.stat2_label },
        { num: t.owner.stat3_num, label: t.owner.stat3_label },
      ],
    },
  ];

  const [role, setRole] = useState<RoleKey>("investor");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [company, setCompany] = useState("");
  const [capacity, setCapacity] = useState("");
  const [focus, setFocus] = useState("");

  const [bCompany, setBCompany] = useState("");
  const [license, setLicense] = useState("");
  const [experience, setExperience] = useState("");
  const [brokerType, setBrokerType] = useState("");

  const [vessel, setVessel] = useState("");
  const [length, setLength] = useState("");
  const [year, setYear] = useState("");

  function resetForm() {
    setName(""); setEmail(""); setPhone(""); setMessage("");
    setCompany(""); setCapacity(""); setFocus("");
    setBCompany(""); setLicense(""); setExperience(""); setBrokerType("");
    setVessel(""); setLength(""); setYear("");
    setError("");
  }

  function switchRole(r: RoleKey) {
    setRole(r);
    setSubmitted(false);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError("Full name and email are required."); return; }
    if (role === "investor" && !capacity) { setError("Please select an investment budget."); return; }

    setLoading(true);
    setError("");

    try {
      let budget = "";
      let yacht_type = "";
      let leadMsg = "";

      if (role === "investor") {
        budget = `${capacity}${company ? " · " + company : ""}`;
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

      const { error: dbErr } = await supabase.from("leads").insert([{
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        budget,
        yacht_type,
        message: leadMsg.trim() || null,
      }]);

      if (dbErr) throw new Error(dbErr.message);
      setSubmitted(true);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const current = ROLES.find(r => r.key === role)!;

  return (
    <Layout>
      <div className="min-h-[90vh] flex pt-[72px]">
        <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col">
          <img
            src="https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=1200&q=80"
            alt="Private Yacht"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background" />

          <AnimatePresence mode="wait">
            <motion.div key={role} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="absolute bottom-14 left-10 right-6 z-10">
              <span className="text-primary text-[10px] font-bold tracking-[0.22em] uppercase block mb-3 font-sans">{current.tag}</span>
              <div className="border-l-2 border-primary pl-6 space-y-5">
                {current.stats.map(s => (
                  <div key={s.num}>
                    <p className="font-display text-3xl text-primary">{s.num}</p>
                    <p className="text-white/45 text-xs font-sans uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="w-full lg:w-7/12 bg-background flex flex-col justify-center px-6 md:px-12 xl:px-16 py-28 lg:py-12">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg w-full mx-auto"
          >
            <div className="flex mb-8 bg-white/5 border border-white/15 p-1 gap-1">
              {ROLES.map(r => {
                const Icon = r.icon;
                const active = role === r.key;
                return (
                  <button key={r.key} type="button" onClick={() => switchRole(r.key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 text-[11px] font-bold uppercase tracking-widest transition-all duration-200 font-sans ${
                      active
                        ? "bg-primary text-[#070f1a] shadow-[0_0_12px_rgba(200,164,107,0.25)]"
                        : "text-white/60 hover:text-white hover:bg-white/8"
                    }`}>
                    <Icon size={13} strokeWidth={active ? 2.5 : 1.8} />
                    {r.label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={role + "-header"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <h1 className="font-display text-4xl md:text-[2.6rem] text-white mb-3 leading-tight" dangerouslySetInnerHTML={{ __html: current.heading }} />
                <p className="text-white/50 mb-1 font-sans text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: current.sub }} />
                <p className="text-white/25 mb-8 font-sans text-xs tracking-wide uppercase" dangerouslySetInnerHTML={{ __html: current.note }} />
              </motion.div>
            </AnimatePresence>

            {submitted ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="border border-primary/30 bg-primary/5 p-8 text-center space-y-4">
                <CheckCircle size={38} className="text-primary mx-auto" />
                <h3 className="font-display text-2xl text-white" dangerouslySetInnerHTML={{ __html: t.common.success_title }} />
                <p className="text-white/50 font-sans text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: t.common.success_desc }} />
                <button onClick={() => setSubmitted(false)}
                  className="text-primary text-xs font-sans uppercase tracking-widest hover:underline">
                  {t.common.success_link}
                </button>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.form key={role + "-form"} onSubmit={handleSubmit}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }} className="space-y-4">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={lbl}>Full Name *</label>
                      <input value={name} onChange={e => setName(e.target.value)} required className={inp} placeholder="Jean-Pierre Moreau" />
                    </div>

                    <div>
                      <label className={lbl}>Email *</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inp} placeholder="you@example.com" />
                    </div>
                    <div>
                      <label className={lbl}>Phone</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inp} placeholder="+33 6 00 00 00 00" />
                    </div>
                  </div>

                  {role === "investor" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={lbl}>Company / Fund</label>
                          <input value={company} onChange={e => setCompany(e.target.value)} className={inp} placeholder="Family Office LLC" />
                        </div>
                        <div>
                          <label className={lbl}>Investment Budget *</label>
                          <select value={capacity} onChange={e => setCapacity(e.target.value)} required className={sel}>
                            <option value="">Select range...</option>
                            {CAPACITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>Preferred Yacht Type / Region</label>
                        <input value={focus} onChange={e => setFocus(e.target.value)} className={inp} placeholder="Motor Yacht 30–50m, Mediterranean..." />
                      </div>
                      <div>
                        <label className={lbl}>Message</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} className={inp + " resize-none"} placeholder="Specific requirements, timeline, acquisition criteria..." />
                      </div>
                    </>
                  )}

                  {role === "broker" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={lbl}>Company / Brokerage</label>
                          <input value={bCompany} onChange={e => setBCompany(e.target.value)} className={inp} placeholder="Burgess Yachts" />
                        </div>
                        <div>
                          <label className={lbl}>License / Certification</label>
                          <input value={license} onChange={e => setLicense(e.target.value)} className={inp} placeholder="MYBA, ABYA, IYBA..." />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={lbl}>Years of Experience</label>
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
                        <label className={lbl}>Message</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} className={inp + " resize-none"} placeholder="Current deal flow, specialisation, markets..." />
                      </div>
                    </>
                  )}

                  {role === "owner" && (
                    <>
                      <div>
                        <label className={lbl}>Vessel Description *</label>
                        <input value={vessel} onChange={e => setVessel(e.target.value)} required className={inp} placeholder="e.g. Motor Yacht, Ferretti 881, 2015, GRP..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
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
                        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} className={inp + " resize-none"} placeholder="Condition, refit history, reason for sale, preferred timeline..." />
                      </div>
                    </>
                  )}

                  {error && (
                    <div className="border border-red-500/30 bg-red-500/5 px-4 py-3">
                      <p className="text-red-400 text-xs font-sans">{error}</p>
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full bg-white/5 backdrop-blur-md border border-primary text-primary hover:bg-primary/10 hover:text-white hover:border-white font-bold uppercase tracking-widest py-4 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 size={15} className="animate-spin" /><span>Submitting...</span></> : <span>{t.common.submit_btn}</span>}
                  </button>

                  <p className="text-white/20 text-[10.5px] text-center font-sans leading-relaxed" dangerouslySetInnerHTML={{ __html: t.common.disclaimer }} />
                </motion.form>
              </AnimatePresence>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
