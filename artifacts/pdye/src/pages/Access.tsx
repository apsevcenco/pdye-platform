import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Loader2 } from "lucide-react";

const labelCls = "block text-white/60 text-[11px] font-bold mb-2 uppercase tracking-widest font-sans";
const inputCls = "w-full bg-background border border-white/10 focus:border-primary px-4 py-3 text-white text-sm focus:outline-none transition-colors placeholder:text-white/20 font-sans";

const BUDGET_OPTIONS = [
  { value: "", label: "Select budget range" },
  { value: "€500k–€1M", label: "€500k – €1M" },
  { value: "€1M–€5M", label: "€1M – €5M" },
  { value: "€5M–€10M", label: "€5M – €10M" },
  { value: "€10M+", label: "€10M+" },
];

interface FormState {
  name: string;
  email: string;
  phone: string;
  budget: string;
  yacht_type: string;
  message: string;
}

const EMPTY: FormState = { name: "", email: "", phone: "", budget: "", yacht_type: "", message: "" };

export default function Access() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function setF(key: keyof FormState, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Full name and email are required.");
      return;
    }
    if (!form.budget) {
      setError("Please select an investment budget.");
      return;
    }

    setLoading(true);
    setError("");

    const { error: dbErr } = await supabase.from("leads").insert([{
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      budget: form.budget,
      yacht_type: form.yacht_type.trim() || null,
      message: form.message.trim() || null,
    }]);

    setLoading(false);

    if (dbErr) {
      setError("Submission failed: " + dbErr.message);
      return;
    }

    setSubmitted(true);
    setForm(EMPTY);
  }

  return (
    <Layout>
      <div className="min-h-[90vh] flex">
        {/* Left side — hero image */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=1200&q=80"
            alt="Private Yacht"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background" />

          {/* Overlay copy */}
          <div className="absolute bottom-16 left-10 right-10 z-10">
            <div className="border-l-2 border-primary pl-6 space-y-4">
              {[
                { num: "60%", label: "Below market value" },
                { num: "€500M+", label: "In managed inventory" },
                { num: "72h", label: "Average response time" },
              ].map(item => (
                <div key={item.num}>
                  <p className="font-display text-3xl text-primary">{item.num}</p>
                  <p className="text-white/50 text-xs font-sans uppercase tracking-widest">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side — form */}
        <div className="w-full lg:w-1/2 bg-background flex flex-col justify-center px-6 md:px-16 py-32 lg:py-0">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md w-full mx-auto"
          >
            <span className="text-primary font-bold tracking-[0.2em] text-xs uppercase mb-4 block font-sans">
              Investor Relations
            </span>
            <h1 className="font-display text-4xl md:text-5xl text-white mb-4 leading-tight">
              Private Investor<br />Access
            </h1>
            <p className="text-white/55 mb-2 font-sans leading-relaxed text-sm">
              Gain access to distressed and off-market yacht deals up to 60% below market value.
            </p>
            <p className="text-white/30 mb-10 font-sans text-xs tracking-wide uppercase">
              Membership is limited and subject to approval.
            </p>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-primary/30 bg-primary/5 p-8 text-center space-y-4"
              >
                <CheckCircle size={40} className="text-primary mx-auto" />
                <h3 className="font-display text-2xl text-white">Request Submitted</h3>
                <p className="text-white/55 font-sans text-sm leading-relaxed">
                  Your request has been submitted. Our team will contact you within 72 hours to discuss your investment criteria.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-primary text-xs font-sans uppercase tracking-widest hover:underline mt-4"
                >
                  Submit another request
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Full Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setF("name", e.target.value)}
                      placeholder="Jean-Pierre Moreau"
                      className={inputCls}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setF("email", e.target.value)}
                      placeholder="jp@familyoffice.com"
                      className={inputCls}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setF("phone", e.target.value)}
                      placeholder="+33 6 00 00 00 00"
                      className={inputCls}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelCls}>Investment Budget *</label>
                    <select
                      value={form.budget}
                      onChange={e => setF("budget", e.target.value)}
                      className={inputCls + " appearance-none cursor-pointer"}
                      required
                    >
                      {BUDGET_OPTIONS.map(o => (
                        <option key={o.value} value={o.value} disabled={!o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelCls}>Preferred Yacht Type</label>
                    <input
                      type="text"
                      value={form.yacht_type}
                      onChange={e => setF("yacht_type", e.target.value)}
                      placeholder="e.g. Motor Yacht 30–50m, Sailing Yacht..."
                      className={inputCls}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelCls}>Message</label>
                    <textarea
                      value={form.message}
                      onChange={e => setF("message", e.target.value)}
                      rows={4}
                      placeholder="Specific requirements, timeline, acquisition criteria..."
                      className={inputCls + " resize-none"}
                    />
                  </div>
                </div>

                {error && (
                  <div className="border border-red-500/30 bg-red-500/5 px-4 py-3">
                    <p className="text-red-400 text-xs font-sans">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-white text-background font-bold uppercase tracking-widest py-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : "Request Access"}
                </button>

                <p className="text-white/25 text-[11px] text-center font-sans leading-relaxed">
                  All information is kept strictly confidential in accordance with our privacy policy.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
