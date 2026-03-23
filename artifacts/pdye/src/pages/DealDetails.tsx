import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Download, FileText, Shield, TrendingDown,
  Lock, Anchor, Mail, Phone, ChevronRight, AlertCircle, RefreshCw, ShieldAlert,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { useAuth } from "@/context/AuthContext";

type Deal = {
  id: string;
  yacht_id: string | null;
  title: string;
  description: string | null;
  market_price: string | null;
  deal_price: string | null;
  location: string | null;
  status: string;
  image_url: string | null;
  created_at: string;
};

type DealDocument = {
  id: string;
  deal_id: string;
  name: string;
  file_url: string | null;
  created_at: string;
};

const STATUS_STYLE: Record<string, string> = {
  active: "text-green-400 bg-green-500/10 border-green-500/25",
  under_offer: "text-yellow-400 bg-yellow-500/10 border-yellow-500/25",
  closed: "text-white/30 bg-white/5 border-white/10",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  under_offer: "Under Offer",
  closed: "Closed",
};

function calcDiscount(market: string | null, deal: string | null): string | null {
  if (!market || !deal) return null;
  const parse = (s: string) => parseFloat(s.replace(/[^0-9.]/g, ""));
  const m = parse(market);
  const d = parse(deal);
  if (!m || !d || m <= d) return null;
  return Math.round(((m - d) / m) * 100) + "%";
}

function RestrictedScreen({ icon, title, text, action }: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-10">
          <Anchor size={26} className="text-primary" strokeWidth={2} />
          <span className="font-display text-2xl tracking-widest text-white">PDYE</span>
        </div>
        <div className="bg-[#0f1d33] border border-white/8 p-10">
          <div className="w-16 h-16 border border-primary/25 flex items-center justify-center mx-auto mb-6">{icon}</div>
          <h2 className="font-display text-2xl text-white mb-3">{title}</h2>
          <p className="text-white/50 font-sans text-sm leading-relaxed mb-6">{text}</p>
          {action && (
            <Link href={action.href}>
              <div className="bg-primary text-background font-bold uppercase tracking-widest py-3.5 px-8 text-xs hover:bg-primary/85 transition-colors cursor-pointer inline-block">
                {action.label}
              </div>
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ContactModal({ dealTitle, onClose }: { dealTitle: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const { userProfile } = useAuth();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await supabaseAdmin.from("leads").insert([{
      name: name || userProfile?.email || "Investor",
      email: email || userProfile?.email || "",
      yacht_type: "Deal Room Inquiry",
      message: `Deal: ${dealTitle}\n\n${msg}`,
    }]);
    setSent(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-[#0f1d33] border border-white/10 p-8 w-full max-w-md z-10"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
          ✕
        </button>
        {sent ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <Shield size={22} className="text-primary" />
            </div>
            <h3 className="font-display text-xl text-white mb-2">Request Received</h3>
            <p className="text-white/50 text-sm font-sans">Your advisor will contact you within 24 hours regarding this opportunity.</p>
          </div>
        ) : (
          <>
            <h3 className="font-display text-xl text-white mb-1">Request Deal Access</h3>
            <p className="text-white/40 text-xs font-sans mb-6 tracking-wide">{dealTitle}</p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">Your Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required
                  className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-3 font-sans focus:outline-none focus:border-primary/40 placeholder:text-white/20" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com" required
                  className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-3 font-sans focus:outline-none focus:border-primary/40 placeholder:text-white/20" />
              </div>
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">Message</label>
                <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3} placeholder="Your interest in this opportunity..."
                  className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-3 font-sans focus:outline-none focus:border-primary/40 placeholder:text-white/20 resize-none" />
              </div>
              <button type="submit" className="w-full bg-primary text-background font-bold uppercase tracking-widest py-3.5 text-xs hover:bg-primary/85 transition-colors">
                Send Request
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function DealDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, userProfile } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [docs, setDocs] = useState<DealDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);

  const isInvestor = userProfile?.role === "investor" || userProfile?.role === "admin";
  const isApproved = userProfile?.approved || userProfile?.role === "admin";
  const hasAccess = isInvestor && isApproved;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!hasAccess || !id) { setLoading(false); return; }
    Promise.all([
      supabaseAdmin.from("deals").select("*").eq("id", id).single(),
      supabaseAdmin.from("deal_documents").select("*").eq("deal_id", id).order("created_at"),
    ]).then(([dealRes, docsRes]) => {
      setDeal(dealRes.data as Deal | null);
      setDocs((docsRes.data as DealDocument[]) || []);
      setLoading(false);
    });
  }, [id, hasAccess]);

  if (!user) return <Layout><RestrictedScreen icon={<Lock size={32} className="text-primary" />} title="Login Required" text="Please sign in to access the Deal Room." action={{ label: "Sign In", href: "/login" }} /></Layout>;
  if (!isApproved) return <Layout><RestrictedScreen icon={<RefreshCw size={32} className="text-primary" />} title="Under Review" text="Your account is under review. Access will be granted once approved." /></Layout>;
  if (!isInvestor) return <Layout><RestrictedScreen icon={<ShieldAlert size={32} className="text-primary" />} title="Private Buyer Access Only" text="The Deal Room is exclusively available to verified private buyers." action={{ label: "Request Access", href: "/access" }} /></Layout>;

  if (loading) return <Layout><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div></Layout>;

  if (!deal) return (
    <Layout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 pt-24">
        <AlertCircle size={36} className="text-white/20" />
        <p className="font-display text-2xl text-white/30">Deal not found</p>
        <Link href="/dealroom" className="text-primary text-sm font-sans tracking-widest uppercase hover:underline">← Back to Deal Room</Link>
      </div>
    </Layout>
  );

  const discount = calcDiscount(deal.market_price, deal.deal_price);

  return (
    <Layout>
      {contactOpen && <ContactModal dealTitle={deal.title} onClose={() => setContactOpen(false)} />}

      {/* Hero image */}
      <div className="relative h-[50vh] min-h-[320px] overflow-hidden bg-[#0a1526]">
        {deal.image_url ? (
          <img src={deal.image_url} alt={deal.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Anchor size={48} className="text-white/8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />

        {/* Back */}
        <div className="absolute top-24 left-6 z-10">
          <Link href="/dealroom" className="flex items-center gap-2 bg-background/70 backdrop-blur-md border border-white/10 text-white/70 hover:text-primary hover:border-primary/30 px-4 py-2 text-xs font-sans tracking-widest uppercase transition-all">
            <ArrowLeft size={12} /> Deal Room
          </Link>
        </div>

        {/* Badges */}
        <div className="absolute top-24 right-6 flex flex-col gap-2 items-end z-10">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border ${STATUS_STYLE[deal.status] || STATUS_STYLE.active}`}>
            {STATUS_LABEL[deal.status] || deal.status}
          </span>
          {discount && (
            <span className="bg-primary text-background text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 flex items-center gap-1">
              <TrendingDown size={10} /> -{discount} off market
            </span>
          )}
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-8">
          <div className="max-w-5xl mx-auto">
            <span className="text-primary text-[10px] font-bold tracking-[0.25em] uppercase block mb-2">Confidential Deal — Secure Data Room</span>
            <h1 className="font-display text-4xl md:text-5xl text-white leading-none">{deal.title}</h1>
            {deal.location && (
              <div className="flex items-center gap-1.5 text-white/50 text-sm mt-2">
                <MapPin size={13} /> {deal.location}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="py-12 bg-background">
        <div className="max-w-5xl mx-auto px-6 md:px-12">

          {/* Confidentiality notice */}
          <div className="flex items-center gap-3 bg-primary/6 border border-primary/15 px-5 py-3 mb-10">
            <Lock size={13} className="text-primary flex-shrink-0" />
            <p className="text-primary/80 text-xs font-sans">
              This information is strictly confidential and subject to NDA. Unauthorized sharing is prohibited.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Left: description + documents */}
            <div className="lg:col-span-2 space-y-10">

              {/* Description */}
              {deal.description && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  <h2 className="font-display text-xl text-white mb-4 uppercase tracking-wide">Opportunity Overview</h2>
                  <p className="text-white/60 font-sans leading-relaxed">{deal.description}</p>
                </motion.div>
              )}

              {/* Documents */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                <h2 className="font-display text-xl text-white mb-4 uppercase tracking-wide">Due Diligence Documents</h2>
                {docs.length === 0 ? (
                  <div className="bg-white/2 border border-white/8 p-8 text-center">
                    <FileText size={28} className="text-white/15 mx-auto mb-3" />
                    <p className="text-white/30 text-sm font-sans">Documents will be made available upon confirmation of interest.</p>
                  </div>
                ) : (
                  <div className="border border-white/8 divide-y divide-white/5">
                    {docs.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 bg-background border border-white/10 flex items-center justify-center flex-shrink-0">
                            <FileText size={15} className="text-primary" />
                          </div>
                          <p className="text-white text-sm font-sans group-hover:text-primary transition-colors">{doc.name}</p>
                        </div>
                        {doc.file_url ? (
                          <a href={doc.file_url} download target="_blank" rel="noopener noreferrer"
                            className="w-9 h-9 border border-white/10 flex items-center justify-center text-white/40 hover:bg-primary hover:text-background hover:border-primary transition-all flex-shrink-0"
                            title="Download">
                            <Download size={15} />
                          </a>
                        ) : (
                          <div className="w-9 h-9 border border-white/5 flex items-center justify-center text-white/15 flex-shrink-0">
                            <Download size={15} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 bg-white/2 border border-white/6 px-5 py-4">
                  <div className="flex items-start gap-2">
                    <Shield size={13} className="text-white/30 mt-0.5 flex-shrink-0" />
                    <p className="text-white/35 text-xs font-sans leading-relaxed">
                      All documents are strictly confidential. Downloading or sharing without authorization violates your NDA agreement.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right: price card + CTA */}
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/3 border border-white/8 p-7 sticky top-28"
              >
                <h3 className="font-display text-sm text-white/40 tracking-widest uppercase mb-5">Deal Summary</h3>

                {deal.market_price && (
                  <div className="mb-3">
                    <p className="text-white/35 text-[10px] font-sans tracking-widest uppercase mb-0.5">Market Value</p>
                    <p className="text-white/40 text-base font-sans line-through">{deal.market_price}</p>
                  </div>
                )}

                {deal.deal_price && (
                  <div className="mb-2">
                    <p className="text-white/35 text-[10px] font-sans tracking-widest uppercase mb-0.5">Deal Price</p>
                    <p className="font-display text-3xl text-primary">{deal.deal_price}</p>
                  </div>
                )}

                {discount && (
                  <div className="bg-primary/10 border border-primary/20 px-4 py-2 mb-5 flex items-center gap-2">
                    <TrendingDown size={13} className="text-primary" />
                    <p className="text-primary text-[10px] font-bold uppercase tracking-widest">
                      {discount} below market value
                    </p>
                  </div>
                )}

                {deal.location && (
                  <div className="border-t border-white/8 pt-4 mb-5">
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <MapPin size={13} className="text-primary" />
                      {deal.location}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setContactOpen(true)}
                  className="w-full bg-primary text-background font-bold uppercase tracking-widest py-4 text-xs hover:bg-primary/85 transition-colors flex items-center justify-center gap-2"
                >
                  <Mail size={14} /> Request Deal Access
                </button>
                <Link href="/dealroom">
                  <div className="w-full text-center text-white/35 hover:text-white text-xs font-sans tracking-wider uppercase mt-3 transition-colors cursor-pointer">
                    ← All Deals
                  </div>
                </Link>
              </motion.div>

              {/* Contact info */}
              <div className="bg-white/2 border border-white/6 p-5">
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Direct Contact</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <Mail size={13} className="text-primary/60" />
                    <span className="font-sans">deals@pdye.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <Phone size={13} className="text-primary/60" />
                    <span className="font-sans">+1 (555) 000-0000</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
}
