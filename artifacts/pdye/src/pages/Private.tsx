import { Layout } from "@/components/layout/Layout";
import { YachtCard } from "@/components/ui/YachtCard";
import { FEATURED_YACHTS } from "@/lib/data";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { getPageContent, type PageContent } from "@/lib/content";

export default function Private() {
  const [content, setContent] = useState<PageContent>(getPageContent("private"));
  useEffect(() => { setContent(getPageContent("private")); }, []);

  return (
    <Layout>
      <div className="pt-32 pb-12 bg-card border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1920')] opacity-5 bg-cover bg-center mix-blend-luminosity"></div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4 mb-4"
          >
            <Lock className="text-primary w-8 h-8" />
            <h1 className="font-display text-4xl md:text-5xl text-white">{content.heading}</h1>
          </motion.div>
          <p className="text-white/60 max-w-2xl font-sans text-lg">{content.subheading}</p>
        </div>
      </div>

      <section className="py-16 md:py-24 bg-background min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <div className="bg-primary/10 border border-primary/20 p-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-primary font-display text-xl mb-1">Approved Access Granted</h3>
              <p className="text-white/70 text-sm">You are viewing Level 1 confidential inventory. Please adhere to the signed NDA regarding these assets.</p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Session ID: {Math.random().toString(36).substring(2, 10)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Reusing featured yachts but presenting them as private */}
            {FEATURED_YACHTS.map((yacht, idx) => (
              <motion.div
                key={yacht.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                <YachtCard yacht={yacht} isPrivate={true} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
