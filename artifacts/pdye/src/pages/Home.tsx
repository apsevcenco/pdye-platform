import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";
import { motion, type Variants } from "framer-motion";
import { Shield, TrendingUp, Anchor, FileCheck } from "lucide-react";
import { YachtCard } from "@/components/ui/YachtCard";
import { type Yacht } from "@/lib/data";
import { useState, useEffect } from "react";
import { getHeroContent, type HeroContent } from "@/lib/content";
import { supabase } from "@/lib/supabase";
import { getSiteSectionData } from "@/lib/siteContent";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
};

const ICONS = [Anchor, Shield, FileCheck, TrendingUp];

export default function Home() {
  const [hero, setHero] = useState<HeroContent>(getHeroContent());
  const [featuredYachts, setFeaturedYachts] = useState<Yacht[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [t, setT] = useState({
    heroSection: getSiteSectionData("home", "hero"),
    expertise: getSiteSectionData("home", "expertise"),
    valuationCta: getSiteSectionData("home", "valuation_cta"),
    featured: getSiteSectionData("home", "featured"),
  });

  useEffect(() => {
    setHero(getHeroContent());
    setT({
      heroSection: getSiteSectionData("home", "hero"),
      expertise: getSiteSectionData("home", "expertise"),
      valuationCta: getSiteSectionData("home", "valuation_cta"),
      featured: getSiteSectionData("home", "featured"),
    });
  }, []);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const { data, error } = await supabase
          .from("yachts")
          .select("*")
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .limit(6);
        if (!error && data && data.length > 0) {
          setFeaturedYachts(data as Yacht[]);
        }
      } catch {
      }
      setFeaturedLoading(false);
    }
    loadFeatured();
  }, []);

  const expertiseItems = [
    { icon: ICONS[0], title: t.expertise.item1_title, desc: t.expertise.item1_desc },
    { icon: ICONS[1], title: t.expertise.item2_title, desc: t.expertise.item2_desc },
    { icon: ICONS[2], title: t.expertise.item3_title, desc: t.expertise.item3_desc },
    { icon: ICONS[3], title: t.expertise.item4_title, desc: t.expertise.item4_desc },
  ];

  return (
    <Layout>
      <section className="relative h-[90vh] min-h-[600px] flex items-start sm:items-center justify-center overflow-hidden pt-28 sm:pt-0">
        <div className="absolute inset-0 z-0">
          <video
            src={`${import.meta.env.BASE_URL}videos/hero.mp4`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-background/70 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center mt-4 sm:mt-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-col items-center"
          >
            <span className="text-primary font-bold tracking-[0.2em] text-sm md:text-base uppercase mb-6 inline-block" dangerouslySetInnerHTML={{ __html: t.heroSection.badge }} />
            <h1
              className={`${hero.titleSize} text-white font-bold leading-[1.1] mb-6`}
              style={{ fontFamily: hero.titleFont }}
              dangerouslySetInnerHTML={{ __html: hero.title }}
            />
            <p
              className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-sans font-light leading-relaxed mb-10"
              dangerouslySetInnerHTML={{ __html: hero.subtitle }}
            />
            <div className="flex justify-center">
              <Link
                href="/access"
                className="bg-white/5 backdrop-blur-md border border-primary text-primary hover:bg-primary/10 hover:text-white hover:border-white px-9 py-4 font-bold tracking-widest uppercase transition-all duration-300 text-sm"
              >
                {t.heroSection.cta1}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-background relative z-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl text-white mb-4" dangerouslySetInnerHTML={{ __html: t.expertise.title }} />
            <div className="w-24 h-1 bg-primary mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {expertiseItems.map((service, idx) => (
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
                <h3 className="font-display text-xl text-white mb-3" dangerouslySetInnerHTML={{ __html: service.title }} />
                <p className="text-white/60 font-sans leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: service.desc }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex flex-col md:flex-row items-center justify-between gap-10 border border-white/8 p-10 md:p-14 bg-card"
          >
            <div className="flex-1">
              <span className="text-primary text-[10px] font-bold tracking-[0.25em] uppercase block mb-3" dangerouslySetInnerHTML={{ __html: t.valuationCta.tag }} />
              <h2 className="font-display text-3xl md:text-4xl text-white mb-4" dangerouslySetInnerHTML={{ __html: t.valuationCta.title }} />
              <p className="text-white/50 font-sans text-sm leading-relaxed max-w-lg" dangerouslySetInnerHTML={{ __html: t.valuationCta.desc }} />
              <div className="flex flex-wrap gap-3 mt-5">
                {[t.valuationCta.feature1, t.valuationCta.feature2, t.valuationCta.feature3].map(txt => (
                  <span key={txt} className="border border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">{txt}</span>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link
                href="/valuation"
                className="flex items-center gap-3 bg-primary hover:bg-white text-[#070f1a] px-10 py-5 font-bold tracking-widest uppercase transition-all duration-300 text-sm shadow-[0_0_30px_rgba(200,164,107,0.25)] hover:shadow-none"
              >
                {t.valuationCta.button}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-background relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <h2 className="font-display text-3xl md:text-5xl text-white mb-4" dangerouslySetInnerHTML={{ __html: t.featured.title }} />
              <div className="w-24 h-1 bg-primary"></div>
            </motion.div>
            <Link 
              href="/yachts"
              className="text-primary hover:text-white uppercase tracking-widest font-bold text-sm transition-colors border-b border-primary hover:border-white pb-1"
            >
              {t.featured.link}
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-[#0f1d33] border border-white/5 animate-pulse" style={{ height: 340 }}>
                  <div className="w-full h-52 bg-white/5" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-white/5 rounded w-1/3" />
                    <div className="h-5 bg-white/8 rounded w-2/3" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredYachts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredYachts.map((yacht, idx) => (
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
          ) : (
            <div className="bg-[#0f1d33] border border-white/5 px-8 py-20 text-center">
              <Anchor size={32} className="text-primary/40 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-white/40 text-sm font-sans tracking-wide">Featured listings will appear here once published.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
