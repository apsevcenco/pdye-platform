import { Layout } from "@/components/layout/Layout";
import { YachtCard } from "@/components/ui/YachtCard";
import { ALL_YACHTS, type Yacht } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getPageContent, type PageContent } from "@/lib/content";

type Filter = "All" | "Motor Yachts" | "Sailing Yachts" | "Distressed Deals";

export default function Yachts() {
  const { user, loading: authLoading } = useAuth();
  const [content, setContent] = useState<PageContent>(getPageContent("yachts"));
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  useEffect(() => {
    setContent(getPageContent("yachts"));
  }, []);

  useEffect(() => {
    // Wait for auth to resolve before fetching
    if (authLoading) return;

    async function fetchYachts() {
      setLoading(true);
      const { data, error } = await supabase.from("yachts").select("*");
      if (!error && data && data.length > 0) {
        // Client-side: hide private yachts from non-logged-in users
        const visible = user
          ? (data as Yacht[])
          : (data as Yacht[]).filter(y => !y.is_private);
        setYachts(visible);
      } else {
        const fallback = user
          ? ALL_YACHTS
          : ALL_YACHTS.filter(y => !y.is_private);
        setYachts(fallback);
      }
      setLoading(false);
    }
    fetchYachts();
  }, [user, authLoading]);

  const filtered = yachts.filter((y) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Distressed Deals") return y.status === "Distressed Sale";
    if (activeFilter === "Motor Yachts") return y.type === "Motor Yacht" || y.type === "Sport Cruiser" || y.type === "Superyacht" || y.type === "Mega Yacht" || y.type === "Explorer";
    if (activeFilter === "Sailing Yachts") return y.type === "Sailing Yacht" || y.type === "Catamaran";
    return true;
  });

  const filters: Filter[] = ["All", "Motor Yachts", "Sailing Yachts", "Distressed Deals"];

  return (
    <Layout>
      <div className="pt-32 pb-12 bg-secondary border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl md:text-5xl text-white mb-4" dangerouslySetInnerHTML={{ __html: content.heading }} />
            <p className="text-white/60 max-w-2xl font-sans text-lg" dangerouslySetInnerHTML={{ __html: content.subheading }} />
            {!user && (
              <p className="mt-4 text-white/30 text-xs font-sans tracking-wide">
                <a href="/#/login" className="text-primary/70 hover:text-primary transition-colors underline underline-offset-2">Sign in</a> to view all private listings and pricing details.
              </p>
            )}
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
                  activeFilter === f
                    ? "text-primary border-b-2 border-primary"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

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
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                >
                  <YachtCard yacht={yacht} />
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
            <p className="text-white/60 mb-6 max-w-xl mx-auto">Not all of our inventory is published online. Contact our brokers to discuss your specific acquisition parameters.</p>
            <a href="/access" className="inline-block border border-primary text-primary px-8 py-3 font-bold uppercase tracking-widest text-sm hover:bg-primary hover:text-background transition-colors">
              Contact Broker
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
