import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import {
  Download, FileText, Activity, ShieldCheck, AlertCircle, ArrowLeft,
  MapPin, Anchor, Ruler, Bed, Zap, Flag, Gauge, Droplets, Wind,
  ChevronLeft, ChevronRight, Calendar, Users, Layers
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Yacht, YachtDocument, FEATURED_YACHTS } from "@/lib/data";
import { useCurrency } from "@/lib/currency";

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

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=1200&q=80";

function SpecCell({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-1 bg-white/3 border border-white/8 px-4 py-3">
      <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-sans tracking-widest uppercase">
        <Icon size={10} />
        {label}
      </div>
      <span className="text-white text-sm font-medium font-sans">{value}</span>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-center border-b border-white/5 py-2.5 text-sm font-sans">
      <span className="text-white/50">{label}</span>
      <span className="text-white font-medium text-right">{value}</span>
    </div>
  );
}

export default function DealRoom() {
  const { id } = useParams<{ id?: string }>();
  const [yacht, setYacht] = useState<Yacht | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const { formatPrice } = useCurrency();

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

  const allPhotos: string[] = (() => {
    const pool: string[] = [];
    if (yacht.photos && yacht.photos.length > 0) pool.push(...yacht.photos);
    if (yacht.image && !pool.includes(yacht.image)) pool.unshift(yacht.image);
    return pool.length > 0 ? pool : [DEFAULT_IMAGE];
  })();

  const hasDistressed = !!(yacht.distressed_price && yacht.market_price);
  const uploadedDocs: YachtDocument[] = yacht.documents || [];

  const DEFAULT_DOCS = [
    { name: "General Arrangement & Specs", type: "PDF", size: "2.4 MB", Icon: FileText, url: null },
    { name: "Recent Condition Survey", type: "PDF", size: "14.1 MB", Icon: Activity, url: null },
    { name: "Registration & Title Docs", type: "ZIP", size: "5.2 MB", Icon: ShieldCheck, url: null },
    { name: "Terms of Sale / NDA", type: "PDF", size: "1.1 MB", Icon: AlertCircle, url: null },
  ];

  const displayDocs = uploadedDocs.length > 0
    ? uploadedDocs.map(d => ({
        name: d.name,
        type: d.type || "FILE",
        size: d.size || "",
        Icon: ICON_MAP[d.type || ""] || ICON_MAP.default,
        url: d.url,
      }))
    : DEFAULT_DOCS;

  const prev = () => setImgIdx(i => (i - 1 + allPhotos.length) % allPhotos.length);
  const next = () => setImgIdx(i => (i + 1) % allPhotos.length);

  return (
    <Layout>

      {/* ── Hero Gallery ── */}
      <div className="relative h-[55vh] min-h-[380px] overflow-hidden">
        <img
          key={allPhotos[imgIdx]}
          src={allPhotos[imgIdx]}
          alt={`${yacht.name} — ${imgIdx + 1}`}
          className="w-full h-full object-cover transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/10 pointer-events-none" />

        {/* Back button */}
        <div className="absolute top-28 left-6 z-10">
          <Link
            href={id ? `/yacht/${id}` : "/yachts"}
            className="flex items-center gap-2 bg-background/70 backdrop-blur-md border border-white/10 text-white/70 hover:text-primary hover:border-primary/40 px-4 py-2 text-xs font-sans tracking-widest uppercase transition-all duration-300"
          >
            <ArrowLeft size={12} />
            {id ? "Back to listing" : "Fleet"}
          </Link>
        </div>

        {/* Arrows */}
        {allPhotos.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-all z-10">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next} className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-all z-10">
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Badges */}
        <div className="absolute top-28 right-6 flex flex-col gap-2 items-end z-10">
          <span className="bg-background/80 backdrop-blur-sm border border-white/10 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5">
            {yacht.status}
          </span>
          {hasDistressed && (
            <span className="bg-primary/20 border border-primary/40 text-primary text-[10px] font-bold tracking-widest uppercase px-3 py-1.5">
              Distressed Sale
            </span>
          )}
        </div>

        {/* Thumbnail strip */}
        {allPhotos.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 flex gap-1 px-6 overflow-x-auto z-10">
            {allPhotos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`flex-shrink-0 w-14 h-10 overflow-hidden border-b-2 transition-all duration-200 ${i === imgIdx ? "border-primary" : "border-transparent opacity-40 hover:opacity-70"}`}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-8 pt-16 bg-gradient-to-t from-background to-transparent">
          <div className="max-w-7xl mx-auto">
            <span className="text-primary font-bold tracking-[0.25em] text-[10px] uppercase block mb-1">
              Virtual Data Room
            </span>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl md:text-5xl text-white leading-none">Project: {yacht.name}</h1>
                <p className="text-white/50 font-sans text-sm mt-2 tracking-wide">
                  {[yacht.builder, yacht.year, yacht.length, yacht.type].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                {hasDistressed ? (
                  <>
                    <p className="text-white/35 text-sm line-through font-sans">{formatPrice(yacht.market_price!)}</p>
                    <p className="font-display text-3xl text-primary">{formatPrice(yacht.distressed_price!)}</p>
                  </>
                ) : (
                  <p className="font-display text-3xl text-primary">{formatPrice(yacht.price)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Left col — specs + documents */}
            <div className="lg:col-span-2 space-y-10">

              {/* Description */}
              {yacht.description && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  <p className="text-white/60 font-sans text-base leading-relaxed">{yacht.description}</p>
                </motion.div>
              )}

              {/* Quick spec grid */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
                <h2 className="font-display text-xl text-white mb-4 tracking-wide uppercase">Key Specifications</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <SpecCell icon={Ruler} label="Length" value={yacht.length} />
                  <SpecCell icon={Layers} label="Beam" value={yacht.beam} />
                  <SpecCell icon={Anchor} label="Draft" value={yacht.draft} />
                  <SpecCell icon={Calendar} label="Year Built" value={yacht.year} />
                  {yacht.refit && <SpecCell icon={Calendar} label="Last Refit" value={yacht.refit} />}
                  <SpecCell icon={Flag} label="Flag" value={yacht.flag} />
                  <SpecCell icon={Bed} label="Cabins" value={yacht.cabins} />
                  <SpecCell icon={Users} label="Crew" value={yacht.crew} />
                  <SpecCell icon={MapPin} label="Location" value={yacht.location} />
                  <SpecCell icon={Gauge} label="Max Speed" value={yacht.max_speed} />
                  <SpecCell icon={Gauge} label="Cruise Speed" value={yacht.cruise_speed} />
                  <SpecCell icon={Wind} label="Range" value={yacht.range} />
                  <SpecCell icon={Zap} label="Power" value={yacht.horse_power} />
                  <SpecCell icon={Droplets} label="Fuel Cap." value={yacht.fuel_capacity} />
                  <SpecCell icon={Droplets} label="Water Cap." value={yacht.water_capacity} />
                </div>
              </motion.div>

              {/* Detailed spec tables */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {/* Hull & Build */}
                {(yacht.hull_material || yacht.hull_type || yacht.displacement || yacht.gross_tonnage || yacht.condition) && (
                  <div className="bg-white/3 border border-white/8 p-5">
                    <h3 className="font-display text-sm text-primary mb-3 tracking-widest uppercase">Hull & Build</h3>
                    <SpecRow label="Condition" value={yacht.condition} />
                    <SpecRow label="Hull Material" value={yacht.hull_material} />
                    <SpecRow label="Hull Type" value={yacht.hull_type} />
                    <SpecRow label="Displacement" value={yacht.displacement} />
                    <SpecRow label="Gross Tonnage" value={yacht.gross_tonnage} />
                  </div>
                )}

                {/* Engines */}
                {(yacht.engines || yacht.engine_count || yacht.horse_power || yacht.fuel_type || yacht.fuel_capacity) && (
                  <div className="bg-white/3 border border-white/8 p-5">
                    <h3 className="font-display text-sm text-primary mb-3 tracking-widest uppercase">Propulsion</h3>
                    <SpecRow label="Engines" value={yacht.engines} />
                    <SpecRow label="Engine Count" value={yacht.engine_count} />
                    <SpecRow label="Power" value={yacht.horse_power} />
                    <SpecRow label="Fuel Type" value={yacht.fuel_type} />
                    <SpecRow label="Fuel Capacity" value={yacht.fuel_capacity} />
                    <SpecRow label="Water Capacity" value={yacht.water_capacity} />
                  </div>
                )}

                {/* Accommodation */}
                {(yacht.cabins || yacht.heads || yacht.berths || yacht.crew) && (
                  <div className="bg-white/3 border border-white/8 p-5">
                    <h3 className="font-display text-sm text-primary mb-3 tracking-widest uppercase">Accommodation</h3>
                    <SpecRow label="Guest Cabins" value={yacht.cabins} />
                    <SpecRow label="Heads / Bathrooms" value={yacht.heads} />
                    <SpecRow label="Berths" value={yacht.berths} />
                    <SpecRow label="Crew Cabins" value={yacht.crew} />
                  </div>
                )}

                {/* Performance */}
                {(yacht.max_speed || yacht.cruise_speed || yacht.range) && (
                  <div className="bg-white/3 border border-white/8 p-5">
                    <h3 className="font-display text-sm text-primary mb-3 tracking-widest uppercase">Performance</h3>
                    <SpecRow label="Max Speed" value={yacht.max_speed} />
                    <SpecRow label="Cruise Speed" value={yacht.cruise_speed} />
                    <SpecRow label="Range" value={yacht.range} />
                  </div>
                )}
              </motion.div>

              {/* Documents */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
                <h2 className="font-display text-xl text-white mb-4 tracking-wide uppercase">Due Diligence Documents</h2>
                <div className="bg-card border border-white/5 flex flex-col">
                  {displayDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-background flex items-center justify-center border border-white/10 text-primary flex-shrink-0">
                          <doc.Icon size={18} />
                        </div>
                        <div>
                          <h4 className="text-white text-sm font-medium font-sans group-hover:text-primary transition-colors">{doc.name}</h4>
                          <p className="text-white/35 text-xs uppercase tracking-wider mt-0.5">
                            {doc.type}{doc.size ? ` · ${doc.size}` : ""}
                          </p>
                        </div>
                      </div>
                      {doc.url ? (
                        <a
                          href={doc.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 border border-white/10 flex items-center justify-center text-white/50 hover:bg-primary hover:text-background hover:border-primary transition-all duration-300 flex-shrink-0"
                          title="Download"
                        >
                          <Download size={16} />
                        </a>
                      ) : (
                        <div className="w-9 h-9 border border-white/5 flex items-center justify-center text-white/15 flex-shrink-0">
                          <Download size={16} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-5 bg-primary/10 border border-primary/20 p-5">
                  <h4 className="text-primary font-bold uppercase tracking-wider text-xs mb-1.5">Confidentiality Notice</h4>
                  <p className="text-white/55 text-xs leading-relaxed">
                    All documents in this virtual data room are strictly confidential and subject to the NDA executed prior to access. Unauthorized distribution is prohibited.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right col — price card + summary */}
            <div className="space-y-6">

              {/* Price card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/3 border border-white/8 p-7 sticky top-28"
              >
                <h3 className="font-display text-base text-white/50 tracking-widest uppercase mb-5">Asset Summary</h3>

                {hasDistressed ? (
                  <>
                    <p className="text-white/40 text-[10px] font-sans tracking-widest uppercase mb-0.5">Market Value</p>
                    <p className="font-sans text-white/40 text-base line-through mb-3">{formatPrice(yacht.market_price!)}</p>
                    <p className="text-white/40 text-[10px] font-sans tracking-widest uppercase mb-0.5">Distressed Asking Price</p>
                    <p className="font-display text-3xl text-primary mb-2">{formatPrice(yacht.distressed_price!)}</p>
                    <div className="bg-primary/10 border border-primary/20 px-4 py-2 mb-5">
                      <p className="text-primary text-[10px] font-sans tracking-widest uppercase text-center font-bold">Distressed Sale Opportunity</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-white/40 text-[10px] font-sans tracking-widest uppercase mb-1">Asking Price</p>
                    <p className="font-display text-3xl text-primary mb-5">{formatPrice(yacht.price)}</p>
                  </>
                )}

                <div className="space-y-0 font-sans text-sm border-t border-white/8 pt-4">
                  <SpecRow label="Builder" value={yacht.builder} />
                  <SpecRow label="Year" value={yacht.year} />
                  {yacht.refit && <SpecRow label="Refit" value={yacht.refit} />}
                  <SpecRow label="Type" value={yacht.type} />
                  <SpecRow label="Length" value={yacht.length} />
                  <SpecRow label="Beam" value={yacht.beam} />
                  <SpecRow label="Flag" value={yacht.flag} />
                  <SpecRow label="Cabins" value={yacht.cabins} />
                  <SpecRow label="Location" value={yacht.location} />
                  <SpecRow label="Status" value={yacht.status} />
                </div>

                <Link
                  href="/access"
                  className="w-full block text-center bg-primary text-background font-bold uppercase tracking-widest py-4 mt-6 transition-all duration-300 hover:bg-primary/85 text-xs"
                >
                  Contact Broker
                </Link>
                <Link
                  href={id ? `/yacht/${id}` : "/yachts"}
                  className="w-full block text-center text-white/35 hover:text-white text-xs font-sans tracking-wider uppercase mt-3 transition-colors"
                >
                  ← Full listing
                </Link>
              </motion.div>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
}
