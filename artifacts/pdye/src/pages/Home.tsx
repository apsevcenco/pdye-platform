import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Shield, TrendingUp, Anchor, FileCheck } from "lucide-react";
import { YachtCard } from "@/components/ui/YachtCard";
import { FEATURED_YACHTS } from "@/lib/data";
import { useState, useEffect } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const DEFAULT_TITLE = "Private Access To Off-Market Yachts";
const DEFAULT_SUBTITLE = "Confidential brokerage connecting qualified investors with distressed and off-market Mediterranean yacht opportunities.";

export default function Home() {
  const [heroTitle, setHeroTitle] = useState(DEFAULT_TITLE);
  const [heroSubtitle, setHeroSubtitle] = useState(DEFAULT_SUBTITLE);

  useEffect(() => {
    const savedTitle = localStorage.getItem("heroTitle");
    const savedSubtitle = localStorage.getItem("heroSubtitle");
    if (savedTitle) setHeroTitle(savedTitle);
    if (savedSubtitle) setHeroSubtitle(savedSubtitle);
  }, []);

  return (
    <Layout>
      {/* HERO SECTION */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* landing page hero scenic Mediterranean yacht offshore */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1920&q=80" 
            alt="Luxury Yacht" 
            className="w-full h-full object-cover scale-105 motion-safe:animate-[pulse_20s_ease-in-out_infinite_alternate]"
          />
          <div className="absolute inset-0 bg-background/70 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center mt-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-col items-center"
          >
            <span className="text-primary font-bold tracking-[0.2em] text-sm md:text-base uppercase mb-6 inline-block border border-primary/30 px-4 py-1.5 bg-background/30 backdrop-blur-md">
              Exclusive Network
            </span>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white font-bold leading-[1.1] mb-6">
              {heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-sans font-light leading-relaxed mb-10">
              {heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              <Link 
                href="/access"
                className="bg-primary hover:bg-white text-background hover:text-background px-8 py-4 font-bold tracking-widest uppercase transition-all duration-300 text-sm shadow-[0_0_20px_rgba(200,164,107,0.4)]"
              >
                Request Access
              </Link>
              <Link 
                href="/brokers"
                className="bg-transparent border border-white/20 hover:border-white text-white px-8 py-4 font-bold tracking-widest uppercase transition-all duration-300 text-sm"
              >
                Submit Listing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="py-24 md:py-32 bg-secondary border-t border-white/5 relative z-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl text-white mb-4">Our Expertise</h2>
            <div className="w-24 h-1 bg-primary mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Anchor, title: "Confidential Brokerage", desc: "Discreet matching of sellers and buyers outside public listing platforms." },
              { icon: Shield, title: "Investor Network", desc: "Vetted database of UHNW individuals and syndicates ready to deploy capital." },
              { icon: FileCheck, title: "Deal Structuring", desc: "Complex transaction management including leasing, tax, and registration." },
              { icon: TrendingUp, title: "Asset Recovery", desc: "Working with institutions on rapid disposition of marine assets." }
            ].map((service, idx) => (
              <motion.div 
                key={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { delay: idx * 0.1, duration: 0.6 } }
                }}
                className="bg-card p-8 border border-white/5 hover:border-primary/30 transition-all duration-300 group"
              >
                <service.icon className="w-12 h-12 text-primary mb-6 group-hover:scale-110 transition-transform duration-300" strokeWidth={1} />
                <h3 className="font-display text-xl text-white mb-3">{service.title}</h3>
                <p className="text-white/60 font-sans leading-relaxed text-sm">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED DEALS */}
      <section className="py-24 md:py-32 bg-background relative">
        {/* Subtle decorative background element */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <h2 className="font-display text-3xl md:text-5xl text-white mb-4">Featured Opportunities</h2>
              <div className="w-24 h-1 bg-primary"></div>
            </motion.div>
            <Link 
              href="/yachts"
              className="text-primary hover:text-white uppercase tracking-widest font-bold text-sm transition-colors border-b border-primary hover:border-white pb-1"
            >
              View All Inventory
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURED_YACHTS.map((yacht, idx) => (
              <motion.div
                key={yacht.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { delay: idx * 0.15, duration: 0.7 } }
                }}
              >
                <YachtCard yacht={yacht} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
