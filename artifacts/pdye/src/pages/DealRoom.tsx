import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Download, FileText, Activity, ShieldCheck, AlertCircle, ArrowLeft, Anchor } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Yacht, YachtDocument, FEATURED_YACHTS } from "@/lib/data";

const ICON_MAP: Record<string, React.ElementType> = {
  PDF: FileText,
  DOC: FileText,
  DOCX: FileText,
  XLS: Activity,
  XLSX: Activity,
  ZIP: ShieldCheck,
  RAR: ShieldCheck,
  default: AlertCircle,
};

export default function DealRoom() {
  const { id } = useParams<{ id?: string }>();
  const [yacht, setYacht] = useState<Yacht | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    async function load() {
      setLoading(true);
      if (id) {
        const { data, error } = await supabase.from("yachts").select("*").eq("id", id).single();
        if (data && !error) {
          setYacht(data as Yacht);
        } else {
          const found = FEATURED_YACHTS.find(y => y.id === id);
          setYacht(found || FEATURED_YACHTS[0]);
        }
      } else {
        // No ID — try to show first DB yacht
        const { data } = await supabase.from("yachts").select("*").limit(1).single();
        setYacht(data as Yacht || FEATURED_YACHTS[0]);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!yacht) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <p className="font-display text-2xl text-white/40">Deal room not found</p>
          <Link href="/yachts" className="text-primary text-sm font-sans tracking-widest uppercase hover:underline">
            ← Back to Fleet
          </Link>
        </div>
      </Layout>
    );
  }

  const documents: YachtDocument[] = yacht.documents || [];
  const coverImage = yacht.photos?.[0] || yacht.image;

  return (
    <Layout>
      <div className="pt-32 pb-12 bg-secondary border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Link
                href={id ? `/yacht/${id}` : "/yachts"}
                className="flex items-center gap-1.5 text-white/40 hover:text-primary text-xs font-sans tracking-widest uppercase transition-colors"
              >
                <ArrowLeft size={12} />
                {id ? "Back to listing" : "Fleet"}
              </Link>
            </div>
            <span className="text-primary font-bold tracking-[0.2em] text-xs uppercase mb-2 block">
              Virtual Data Room
            </span>
            <h1 className="font-display text-4xl text-white">Project: {yacht.name}</h1>
            {yacht.builder && (
              <p className="text-white/40 font-sans text-sm mt-1">
                {yacht.builder}{yacht.year ? ` · ${yacht.year}` : ""}
                {yacht.length ? ` · ${yacht.length}` : ""}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card px-6 py-3 border border-white/10"
          >
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Status</p>
            <p className="text-white font-bold">{yacht.status}</p>
          </motion.div>
        </div>
      </div>

      <section className="py-12 bg-background min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col lg:flex-row gap-12">

          {/* Main — Documents */}
          <div className="w-full lg:w-2/3">
            <h2 className="font-display text-2xl text-white mb-6">Due Diligence Documents</h2>

            {documents.length > 0 ? (
              <div className="bg-card border border-white/5 flex flex-col">
                {documents.map((doc, idx) => {
                  const Icon = ICON_MAP[doc.type || ""] || ICON_MAP.default;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="flex items-center justify-between p-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-background flex items-center justify-center border border-white/10 text-primary flex-shrink-0">
                          <Icon size={20} />
                        </div>
                        <div>
                          <h4 className="text-white font-medium font-sans group-hover:text-primary transition-colors">{doc.name}</h4>
                          <p className="text-white/40 text-xs uppercase tracking-wider mt-1">
                            {doc.type || "FILE"}{doc.size ? ` · ${doc.size}` : ""}
                          </p>
                        </div>
                      </div>

                      <a
                        href={doc.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:bg-primary hover:text-background hover:border-primary transition-all duration-300 flex-shrink-0"
                        title="Download"
                      >
                        <Download size={18} />
                      </a>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-card border border-white/5 p-12 text-center">
                <FileText size={32} className="text-white/15 mx-auto mb-4" />
                <p className="text-white/40 font-sans text-sm">
                  Documents for this vessel have not been uploaded yet.
                </p>
                <p className="text-white/25 font-sans text-xs mt-2">
                  Contact our brokers to request due diligence materials.
                </p>
              </div>
            )}

            <div className="mt-8 bg-primary/10 border border-primary/20 p-6">
              <h4 className="text-primary font-bold uppercase tracking-wider text-sm mb-2">Confidentiality Notice</h4>
              <p className="text-white/60 text-sm leading-relaxed">
                All documents contained within this virtual data room are strictly confidential and subject to the
                Non-Disclosure Agreement executed prior to access. Unauthorized distribution is prohibited.
              </p>
            </div>
          </div>

          {/* Sidebar — Asset Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-card border border-white/5 sticky top-32">
              {coverImage && (
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img src={coverImage} alt={yacht.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-background/20" />
                  {yacht.status && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-background/80 backdrop-blur-sm border border-white/10 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1">
                        {yacht.status}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="p-8">
                <h3 className="font-display text-2xl text-white mb-6">Asset Summary</h3>

                <div className="space-y-0 font-sans text-sm">
                  {yacht.builder && (
                    <div className="flex justify-between border-b border-white/5 py-2.5">
                      <span className="text-white/50">Builder</span>
                      <span className="text-white font-medium">{yacht.builder}</span>
                    </div>
                  )}
                  {yacht.year && (
                    <div className="flex justify-between border-b border-white/5 py-2.5">
                      <span className="text-white/50">Year</span>
                      <span className="text-white font-medium">{yacht.year}</span>
                    </div>
                  )}
                  {yacht.length && (
                    <div className="flex justify-between border-b border-white/5 py-2.5">
                      <span className="text-white/50">Length</span>
                      <span className="text-white font-medium">{yacht.length}</span>
                    </div>
                  )}
                  {yacht.cabins != null && (
                    <div className="flex justify-between border-b border-white/5 py-2.5">
                      <span className="text-white/50">Cabins</span>
                      <span className="text-white font-medium">{yacht.cabins}</span>
                    </div>
                  )}
                  {yacht.location && (
                    <div className="flex justify-between border-b border-white/5 py-2.5">
                      <span className="text-white/50">Location</span>
                      <span className="text-white font-medium">{yacht.location}</span>
                    </div>
                  )}
                  {yacht.flag && (
                    <div className="flex justify-between border-b border-white/5 py-2.5">
                      <span className="text-white/50">Flag</span>
                      <span className="text-white font-medium">{yacht.flag}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3">
                    <span className="text-white/50">Asking Price</span>
                    <span className="text-primary font-bold font-display text-lg">
                      {yacht.distressed_price || yacht.price}
                    </span>
                  </div>
                  {yacht.distressed_price && yacht.market_price && (
                    <div className="flex justify-between">
                      <span className="text-white/30 text-xs">Market Value</span>
                      <span className="text-white/30 text-xs line-through">{yacht.market_price}</span>
                    </div>
                  )}
                </div>

                <Link
                  href="/access"
                  className="w-full block text-center bg-transparent border border-primary text-primary hover:bg-primary hover:text-background font-bold uppercase tracking-widest py-4 mt-8 transition-all duration-300 text-xs"
                >
                  Contact Broker
                </Link>

                {id && (
                  <Link
                    href={`/yacht/${id}`}
                    className="w-full block text-center text-white/40 hover:text-white text-xs font-sans tracking-wider uppercase mt-3 transition-colors"
                  >
                    ← Back to full listing
                  </Link>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>
    </Layout>
  );
}
