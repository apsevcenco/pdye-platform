import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Lock, ArrowRight, ShieldAlert, Anchor, RefreshCw, Ship, Clock, CheckCircle, FileText, AlertTriangle } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { type DealFlow, DEAL_STATUS_CONFIG } from "@/lib/dealTypes";

type DealWithYacht = DealFlow & {
  yacht_name?: string;
  yacht_builder?: string;
  yacht_image?: string;
};

export default function DealRoom() {
  const { user, userProfile } = useAuth();
  const [deals, setDeals] = useState<DealWithYacht[]>([]);
  const [loading, setLoading] = useState(true);

  const isApproved = userProfile?.approved || userProfile?.role === "admin";
  const isAdmin = userProfile?.role === "admin";

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadDeals();
  }, [user]);

  async function loadDeals() {
    setLoading(true);
    let query = supabaseAdmin
      .from("deals")
      .select("*")
      .not("status", "in", '("cancelled","rejected")')
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("buyer_id", user!.id);
    }

    const { data } = await query;
    const flowDeals = ((data || []) as DealFlow[]).filter(d => d.buyer_id != null);

    if (flowDeals.length > 0) {
      const yachtIds = [...new Set(flowDeals.map(d => d.yacht_id).filter(Boolean))];
      const { data: yachts } = await supabase.from("yachts").select("id, name, builder, main_image, image").in("id", yachtIds);
      const yachtMap = Object.fromEntries((yachts || []).map((y: any) => [y.id, y]));

      setDeals(flowDeals.map(d => ({
        ...d,
        yacht_name: yachtMap[d.yacht_id]?.name || "Unknown Vessel",
        yacht_builder: yachtMap[d.yacht_id]?.builder || "",
        yacht_image: yachtMap[d.yacht_id]?.main_image || yachtMap[d.yacht_id]?.image || "",
      })));
    } else {
      setDeals([]);
    }
    setLoading(false);
  }

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

  const activeDeals = deals.filter(d => d.status === "active" || d.deal_room_enabled);
  const pendingDeals = deals.filter(d => !d.deal_room_enabled && d.status !== "active");

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12">
            <span className="text-primary text-[10px] font-bold tracking-[0.25em] uppercase block mb-3">Secure Deal Room</span>
            <h1 className="font-display text-4xl md:text-5xl text-white mb-4">My Deals</h1>
            <p className="text-white/50 font-sans max-w-xl">
              Track your yacht acquisition requests, complete NDA requirements, and access deal rooms for approved opportunities.
            </p>
          </motion.div>

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
              <p className="text-white/25 text-sm font-sans mb-6">Browse yacht listings and request details to start a deal.</p>
              <Link href="/yachts">
                <div className="bg-primary text-background px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors cursor-pointer">
                  Browse Yachts
                </div>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {activeDeals.length > 0 && (
                <div>
                  <h2 className="font-display text-lg text-white mb-4 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-400" /> Active Deal Rooms
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeDeals.map(deal => <DealCard key={deal.id} deal={deal} />)}
                  </div>
                </div>
              )}

              {pendingDeals.length > 0 && (
                <div>
                  <h2 className="font-display text-lg text-white mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-yellow-400" /> In Progress
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingDeals.map(deal => <DealCard key={deal.id} deal={deal} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function DealCard({ deal }: { deal: DealWithYacht }) {
  const cfg = DEAL_STATUS_CONFIG[deal.status] || DEAL_STATUS_CONFIG.created;
  const needsNda = deal.status === "nda_pending";

  return (
    <Link href={`/dealroom/${deal.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group border border-white/8 bg-white/2 hover:border-primary/40 hover:bg-white/4 transition-all duration-300 cursor-pointer"
      >
        <div className="relative h-36 overflow-hidden bg-[#0a1526]">
          {deal.yacht_image ? (
            <img src={deal.yacht_image} alt={deal.yacht_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Ship size={28} className="text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070f1a] via-[#070f1a]/30 to-transparent" />
          <div className="absolute top-3 left-3">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 border bg-black/50 ${cfg.color} border-current/20`}>
              {cfg.label}
            </span>
          </div>
          {needsNda && (
            <div className="absolute top-3 right-3 bg-orange-500/90 text-white text-[10px] font-bold px-2 py-1 flex items-center gap-1">
              <AlertTriangle size={10} /> NDA Required
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-display text-lg text-white mb-1 group-hover:text-primary transition-colors">{deal.yacht_name}</h3>
          {deal.yacht_builder && (
            <p className="text-white/40 text-xs font-sans mb-3">{deal.yacht_builder}</p>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-3">
              {deal.nda_accepted && (
                <span className="text-[9px] text-green-400 border border-green-500/20 bg-green-500/5 px-2 py-0.5 flex items-center gap-1">
                  <FileText size={8} /> NDA
                </span>
              )}
              {deal.intro_locked && (
                <span className="text-[9px] text-cyan-400 border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 flex items-center gap-1">
                  <Lock size={8} /> Intro
                </span>
              )}
              {deal.deal_room_enabled && (
                <span className="text-[9px] text-green-400 border border-green-500/20 bg-green-500/5 px-2 py-0.5 flex items-center gap-1">
                  <CheckCircle size={8} /> Room
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-widest group-hover:gap-3 transition-all">
              {needsNda ? "Sign NDA" : deal.deal_room_enabled ? "Open Room" : "View"} <ArrowRight size={13} />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function RestrictedScreen({ icon, title, text, action }: {
  icon: React.ReactNode; title: string; text: string;
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
