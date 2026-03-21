import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, MapPin, TrendingDown, ArrowRight, ShieldAlert, Anchor, RefreshCw } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type Deal = {
  id: string;
  yacht_id: string | null;
  title: string;
  description: string | null;
  market_price: string | null;
  deal_price: string | null;
  location: string | null;
  status: "active" | "under_offer" | "closed";
  image_url: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  under_offer: "Under Offer",
  closed: "Closed",
};

const STATUS_STYLE: Record<string, string> = {
  active: "text-green-400 bg-green-500/10 border-green-500/25",
  under_offer: "text-yellow-400 bg-yellow-500/10 border-yellow-500/25",
  closed: "text-white/30 bg-white/5 border-white/10",
};

function calcDiscount(market: string | null, deal: string | null): string | null {
  if (!market || !deal) return null;
  const parse = (s: string) => parseFloat(s.replace(/[^0-9.]/g, ""));
  const m = parse(market);
  const d = parse(deal);
  if (!m || !d || m <= d) return null;
  return Math.round(((m - d) / m) * 100) + "%";
}

export default function DealRoom() {
  const { user, userProfile } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const isInvestor = userProfile?.role === "investor" || userProfile?.role === "admin";
  const isApproved = userProfile?.approved || userProfile?.role === "admin";
  const hasAccess = isInvestor && isApproved;

  useEffect(() => {
    if (!hasAccess) { setLoading(false); return; }
    supabaseAdmin
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDeals((data as Deal[]) || []);
        setLoading(false);
      });
  }, [hasAccess]);

  if (!user) {
    return (
      <Layout>
        <RestrictedScreen
          icon={<Lock size={32} className="text-primary" />}
          title="Login Required"
          text="Please log in to access the Deal Room."
          action={{ label: "Sign In", href: "/login" }}
        />
      </Layout>
    );
  }

  if (!isApproved) {
    return (
      <Layout>
        <RestrictedScreen
          icon={<RefreshCw size={32} className="text-primary animate-spin" style={{ animationDuration: "3s" }} />}
          title="Application Under Review"
          text="Your account is being reviewed. Access will be granted once approved — typically within 24–48 hours."
        />
      </Layout>
    );
  }

  if (!isInvestor) {
    return (
      <Layout>
        <RestrictedScreen
          icon={<ShieldAlert size={32} className="text-primary" />}
          title="Restricted Access"
          text="The Deal Room is exclusively available to verified investors and administrators. Request access to upgrade your profile."
          action={{ label: "Request Investor Access", href: "/access" }}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6 md:px-10">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12">
            <span className="text-primary text-[10px] font-bold tracking-[0.25em] uppercase block mb-3">Secure Deal Room</span>
            <h1 className="font-display text-4xl md:text-5xl text-white mb-4">Active Opportunities</h1>
            <p className="text-white/50 font-sans max-w-xl">
              Exclusive distressed and off-market acquisitions available to verified investors only. All information is strictly confidential.
            </p>
          </motion.div>

          {/* Confidentiality bar */}
          <div className="flex items-center gap-3 bg-primary/8 border border-primary/20 px-5 py-3.5 mb-10">
            <Lock size={14} className="text-primary flex-shrink-0" />
            <p className="text-primary text-xs font-sans tracking-wide">
              You are accessing a secure environment. All activity is logged. Information is subject to NDA.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Anchor size={40} className="text-white/15 mb-4" />
              <p className="font-display text-xl text-white/30 mb-2">No Active Deals</p>
              <p className="text-white/25 text-sm font-sans">New opportunities will appear here as they become available.</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {deals.map((deal, i) => {
                  const discount = calcDiscount(deal.market_price, deal.deal_price);
                  return (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.07 }}
                    >
                      <Link href={`/dealroom/${deal.id}`}>
                        <div className={`group border border-white/8 bg-white/2 hover:border-primary/40 hover:bg-white/4 transition-all duration-300 cursor-pointer ${deal.status === "closed" ? "opacity-50" : ""}`}>
                          {/* Image */}
                          <div className="relative h-44 overflow-hidden bg-[#0a1526]">
                            {deal.image_url ? (
                              <img src={deal.image_url} alt={deal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Anchor size={28} className="text-white/10" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#070f1a] via-[#070f1a]/20 to-transparent" />
                            {/* Status badge */}
                            <div className="absolute top-4 left-4">
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 border ${STATUS_STYLE[deal.status] || STATUS_STYLE.active}`}>
                                {STATUS_LABEL[deal.status] || deal.status}
                              </span>
                            </div>
                            {/* Discount badge */}
                            {discount && (
                              <div className="absolute top-4 right-4 bg-primary text-background text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 flex items-center gap-1">
                                <TrendingDown size={10} />
                                -{discount}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-6">
                            <h3 className="font-display text-xl text-white mb-2 group-hover:text-primary transition-colors">{deal.title}</h3>
                            {deal.location && (
                              <div className="flex items-center gap-1.5 text-white/40 text-xs mb-4">
                                <MapPin size={11} />
                                <span className="font-sans">{deal.location}</span>
                              </div>
                            )}
                            {deal.description && (
                              <p className="text-white/50 text-sm font-sans leading-relaxed mb-5 line-clamp-2">{deal.description}</p>
                            )}
                            <div className="flex items-end justify-between border-t border-white/6 pt-4">
                              <div>
                                {deal.market_price && (
                                  <p className="text-white/30 text-xs line-through font-sans mb-0.5">{deal.market_price}</p>
                                )}
                                {deal.deal_price && (
                                  <p className="font-display text-2xl text-primary">{deal.deal_price}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-widest group-hover:gap-3 transition-all duration-200">
                                View Deal <ArrowRight size={13} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </Layout>
  );
}

function RestrictedScreen({
  icon, title, text, action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-10">
          <Anchor size={26} className="text-primary" strokeWidth={2} />
          <span className="font-display text-2xl tracking-widest text-white">PDYE</span>
        </div>
        <div className="bg-[#0f1d33] border border-white/8 p-10">
          <div className="w-16 h-16 border border-primary/25 flex items-center justify-center mx-auto mb-6">
            {icon}
          </div>
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
