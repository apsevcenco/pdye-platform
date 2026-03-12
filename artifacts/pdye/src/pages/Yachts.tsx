import { Layout } from "@/components/layout/Layout";
import { YachtCard } from "@/components/ui/YachtCard";
import { ALL_YACHTS } from "@/lib/data";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getPageContent, type PageContent } from "@/lib/content";

export default function Yachts() {
  const [content, setContent] = useState<PageContent>(getPageContent("yachts"));
  useEffect(() => { setContent(getPageContent("yachts")); }, []);

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
          </motion.div>
        </div>
      </div>

      <section className="py-16 md:py-24 bg-background min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Simple Filters Placeholder */}
          <div className="flex flex-wrap gap-4 mb-12 border-b border-white/10 pb-6">
            <button className="text-primary border-b-2 border-primary pb-2 font-bold tracking-wider uppercase text-sm">All Yachts</button>
            <button className="text-white/50 hover:text-white pb-2 font-bold tracking-wider uppercase text-sm transition-colors">Motor Yachts</button>
            <button className="text-white/50 hover:text-white pb-2 font-bold tracking-wider uppercase text-sm transition-colors">Sailing Yachts</button>
            <button className="text-white/50 hover:text-white pb-2 font-bold tracking-wider uppercase text-sm transition-colors">Distressed Deals</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ALL_YACHTS.map((yacht, idx) => (
              <motion.div
                key={yacht.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                <YachtCard yacht={yacht} />
              </motion.div>
            ))}
          </div>
          
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
