import { Layout } from "@/components/layout/Layout";
import { YachtCard, type RequestStatus } from "@/components/ui/YachtCard";
import { ALL_YACHTS, type Yacht } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { getPageContent, type PageContent } from "@/lib/content";

type Filter = "All" | "Motor Yachts" | "Sailing Yachts" | "Distressed Deals";

type AccessRequest = {
  id: string;
  yacht_id: string;
  status: "pending" | "approved" | "rejected";
};

export default function Yachts() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [content, setContent] = useState<PageContent>(getPageContent("yachts"));
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [requests, setRequests] = useState<Record<string, RequestStatus>>({});
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => { setContent(getPageContent("yachts")); }, []);

  const loadRequests = useCallback(async () => {
    if (!user) { setRequests({}); return; }
    const { data } = await supabase
      .from("access_requests")
      .select("id, yacht_id, status")
      .eq("requester_id", user.id);
    if (data) {
      const map: Record<string, RequestStatus> = {};
      (data as AccessRequest[]).forEach(r => { map[r.yacht_id] = r.status; });
      setRequests(map);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    async function fetchYachts() {
      setLoading(true);
      const { data, error } = await supabase.from("yachts").select("*");
      if (!error && data && data.length > 0) {
        const visible = user ? (data as Yacht[]) : (data as Yacht[]).filter(y => !y.is_private);
        setYachts(visible);
      } else {
        const fallback = user ? ALL_YACHTS : ALL_YACHTS.filter(y => !y.is_private);
        setYachts(fallback);
      }
      setLoading(false);
    }
    fetchYachts();
    loadRequests();
  }, [user, authLoading, loadRequests]);

  async function handleRequest(yachtId: string) {
    if (!user) { window.location.hash = "/login"; return; }
    setRequesting(yachtId);
    setRequestError(null);

    const { data: existingDeal } = await supabaseAdmin
      .from("deals")
      .select("id")
      .eq("yacht_id", yachtId)
      .eq("buyer_id", user.id)
      .not("status", "in", '("cancelled","rejected","closed")')
      .maybeSingle();

    if (existingDeal) {
      setRequests(prev => ({ ...prev, [yachtId]: "pending" }));
      setRequesting(null);
      return;
    }

    const { data: accessReq, error: arError } = await supabaseAdmin.from("access_requests").insert([{
      yacht_id: yachtId,
      requester_id: user.id,
      role: userProfile?.role || "buyer",
      status: "pending",
    }]).select("id").single();

    if (arError) {
      console.error("access_requests insert error:", arError.message, arError.details, arError.hint);
      setRequestError(`Error submitting request: ${arError.message}`);
      setRequesting(null);
      return;
    }

    const { error: dealError } = await supabaseAdmin.from("deals").insert([{
      yacht_id: yachtId,
      request_id: accessReq?.id || null,
      buyer_id: user.id,
      created_by: user.id,
      status: "pending_admin_review",
    }]);

    if (dealError) {
      console.error("deal create error:", dealError.message);
    } else {
      const { data: newDeal } = await supabaseAdmin
        .from("deals")
        .select("id")
        .eq("yacht_id", yachtId)
        .eq("buyer_id", user.id)
        .eq("status", "pending_admin_review")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (newDeal) {
        await supabaseAdmin.from("deal_participants").insert([{
          deal_id: newDeal.id,
          user_id: user.id,
          role: "buyer",
          can_view: true,
          can_message: true,
          can_download: false,
        }]);
        await supabaseAdmin.from("deal_activity_logs").insert([
          { deal_id: newDeal.id, user_id: user.id, action: "request_created", meta: { yacht_id: yachtId } },
          { deal_id: newDeal.id, user_id: user.id, action: "deal_created", meta: { status: "pending_admin_review" } },
        ]);
      }
    }

    setRequests(prev => ({ ...prev, [yachtId]: "pending" }));
    setRequesting(null);
  }

  const filtered = yachts.filter((y) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Distressed Deals") return y.status === "Distressed Sale";
    if (activeFilter === "Motor Yachts") return ["Motor Yacht", "Sport Cruiser", "Superyacht", "Mega Yacht", "Explorer"].includes(y.type || "");
    if (activeFilter === "Sailing Yachts") return ["Sailing Yacht", "Catamaran"].includes(y.type || "");
    return true;
  });

  const filters: Filter[] = ["All", "Motor Yachts", "Sailing Yachts", "Distressed Deals"];

  return (
    <Layout>
      <div className="pt-32 pb-12 bg-secondary border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-4xl md:text-5xl text-white mb-4" dangerouslySetInnerHTML={{ __html: content.heading }} />
            <p className="text-white/60 max-w-2xl font-sans text-lg" dangerouslySetInnerHTML={{ __html: content.subheading }} />
            <p className="mt-4 text-white/30 text-xs font-sans tracking-wide">
              All listings are confidential. Request full details to unlock pricing, location and specifications.
              {!user && (
                <>
                  {" "}<a href="/#/login" className="text-primary/70 hover:text-primary transition-colors underline underline-offset-2">Sign in</a> to submit a request.
                </>
              )}
            </p>
          </motion.div>
        </div>
      </div>

      <section className="py-16 md:py-24 bg-background min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-wrap gap-4 mb-12 border-b border-white/10 pb-6">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`pb-2 font-bold tracking-wider uppercase text-sm transition-colors ${
                  activeFilter === f ? "text-primary border-b-2 border-primary" : "text-white/50 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {requestError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-sans flex items-center justify-between gap-4">
              <span>{requestError}</span>
              <button onClick={() => setRequestError(null)} className="text-red-400/60 hover:text-red-400 text-lg leading-none">✕</button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-white/40 text-sm font-sans tracking-widest uppercase">Loading listings...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((yacht, idx) => (
                <motion.div
                  key={yacht.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                >
                  <YachtCard
                    yacht={yacht}
                    requestStatus={requests[yacht.id] || "none"}
                    onRequest={() => handleRequest(yacht.id)}
                    requesting={requesting === yacht.id}
                  />
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-3 text-center py-24">
                  <p className="text-white/30 text-lg font-sans">No listings match this filter.</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-16 text-center bg-card p-10 border border-white/5">
            <h3 className="font-display text-2xl text-white mb-3">Seeking something specific?</h3>
            <p className="text-white/60 mb-6 max-w-xl mx-auto">Not all inventory is published online. Our team can source assets matching your exact acquisition parameters.</p>
            <a href="/#/access" className="inline-block border border-primary text-primary px-8 py-3 font-bold uppercase tracking-widest text-sm hover:bg-primary hover:text-background transition-colors">
              Contact Broker
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
