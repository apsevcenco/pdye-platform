import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import {
  ChevronLeft, ChevronRight, MapPin, Calendar, Anchor, Ruler,
  Bed, Bath, Zap, Flag, Layers, Gauge, Droplets, Wind,
  ArrowLeft, Users, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Yacht, FEATURED_YACHTS } from "@/lib/data";
import { useCurrency } from "@/lib/currency";

type UnitSystem = "metric" | "imperial";

function parseNum(raw: string): number | null {
  if (!raw) return null;
  const n = parseFloat(String(raw).replace(/,/g, "").match(/[\d.]+/)?.[0] ?? "");
  return isNaN(n) ? null : n;
}

function cvtLength(raw: string | number | null | undefined, sys: UnitSystem): string {
  if (raw === null || raw === undefined || raw === "") return "";
  const s = String(raw).trim();
  const n = parseNum(s);
  if (n === null) return s;
  const lower = s.toLowerCase();
  const storedImp = lower.includes("ft") || lower.includes("feet") || lower.includes("'");
  const meters = storedImp ? n / 3.28084 : n;
  if (sys === "metric") return `${meters % 1 === 0 ? meters : meters.toFixed(1)} m`;
  return `${(meters * 3.28084).toFixed(1)} ft`;
}

function cvtCapacity(raw: string | number | null | undefined, sys: UnitSystem): string {
  if (raw === null || raw === undefined || raw === "") return "";
  const s = String(raw).trim();
  const n = parseNum(s);
  if (n === null) return s;
  const lower = s.toLowerCase();
  const storedImp = lower.includes("gal");
  const liters = storedImp ? n / 0.264172 : n;
  if (sys === "metric") return `${Math.round(liters).toLocaleString()} L`;
  return `${Math.round(liters * 0.264172).toLocaleString()} gal`;
}

function cvtDisp(raw: string | number | null | undefined, sys: UnitSystem): string {
  if (raw === null || raw === undefined || raw === "") return "";
  const s = String(raw).trim();
  const n = parseNum(s);
  if (n === null) return s;
  const lower = s.toLowerCase();
  const storedImp = lower.includes("lt") || lower.includes("long ton");
  const tonnes = storedImp ? n / 0.984207 : n;
  if (sys === "metric") return `${tonnes.toFixed(1)} t`;
  return `${(tonnes * 0.984207).toFixed(1)} LT`;
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800&q=80";

function SpecRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
      <span className="text-white/40 text-sm font-sans tracking-wide">{label}</span>
      <span className="text-white/85 text-sm font-sans text-right">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/3 border border-white/8 p-6">
      <h3 className="font-display text-lg text-primary mb-4 tracking-wide uppercase">{title}</h3>
      {children}
    </div>
  );
}

export default function YachtDetail() {
  const { id } = useParams<{ id: string }>();
  const [yacht, setYacht] = useState<Yacht | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [units, setUnits] = useState<UnitSystem>("metric");
  const { formatPrice } = useCurrency();
  const M = units === "metric";

  useEffect(() => {
    window.scrollTo(0, 0);
    async function load() {
      setLoading(true);
      // try DB first
      const { data, error } = await supabase
        .from("yachts")
        .select("*")
        .eq("id", id)
        .single();
      if (data && !error) {
        setYacht(data as Yacht);
      } else {
        // fall back to static data
        const found = FEATURED_YACHTS.find(y => y.id === id);
        setYacht(found || null);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (lightbox === null) return;
      if (e.key === "ArrowRight") setLightbox(i => (i! + 1) % allPhotos.length);
      if (e.key === "ArrowLeft") setLightbox(i => ((i! - 1) + allPhotos.length) % allPhotos.length);
      if (e.key === "Escape") setLightbox(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!yacht) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="font-display text-2xl text-white/40">Vessel not found</p>
        <Link href="/yachts" className="text-primary text-sm font-sans tracking-widest uppercase hover:underline">
          ← Back to Fleet
        </Link>
      </div>
    );
  }

  const allPhotos: string[] = (() => {
    const pool: string[] = [];
    if (yacht.photos && yacht.photos.length > 0) pool.push(...yacht.photos);
    if (yacht.image && !pool.includes(yacht.image)) pool.unshift(yacht.image);
    return pool.length > 0 ? pool : [DEFAULT_IMAGE];
  })();

  const hasDistressed = yacht.distressed_price && yacht.market_price;

  const prev = () => setIdx(i => (i - 1 + allPhotos.length) % allPhotos.length);
  const next = () => setIdx(i => (i + 1) % allPhotos.length);

  return (
    <div className="min-h-screen bg-background">

      {/* Back nav */}
      <div className="fixed top-6 left-6 z-40">
        <Link
          href="/yachts"
          className="flex items-center gap-2 bg-background/80 backdrop-blur-md border border-white/10 text-white/70 hover:text-primary hover:border-primary/40 px-4 py-2 text-sm font-sans tracking-wider uppercase transition-all duration-300"
        >
          <ArrowLeft size={14} />
          Fleet
        </Link>
      </div>

      {/* ── Hero Gallery ── */}
      <div className="relative h-[70vh] min-h-[480px] overflow-hidden">
        <img
          key={allPhotos[idx]}
          src={allPhotos[idx]}
          alt={`${yacht.name} — ${idx + 1}`}
          className="w-full h-full object-cover transition-all duration-500"
          onClick={() => setLightbox(idx)}
          style={{ cursor: "zoom-in" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none" />

        {/* Arrows */}
        {allPhotos.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 bg-background/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-all z-10">
              <ChevronLeft size={20} />
            </button>
            <button onClick={next} className="absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 bg-background/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-all z-10">
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Dot strip */}
        {allPhotos.length > 1 && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1.5 z-10">
            {allPhotos.slice(0, 12).map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-8 bg-primary" : "w-1.5 bg-white/30 hover:bg-white/60"}`}
              />
            ))}
            {allPhotos.length > 12 && (
              <span className="text-white/30 text-xs self-center ml-1">+{allPhotos.length - 12}</span>
            )}
          </div>
        )}

        {/* Badges top-right */}
        <div className="absolute top-20 right-6 flex flex-col gap-2 items-end z-10">
          <span className="bg-background/80 backdrop-blur-sm border border-white/10 text-white text-xs font-bold tracking-widest uppercase px-3 py-1.5">
            {yacht.status}
          </span>
          {yacht.type && (
            <span className="bg-primary/20 backdrop-blur-sm border border-primary/40 text-primary text-xs font-bold tracking-widest uppercase px-3 py-1.5">
              {yacht.type}
            </span>
          )}
        </div>

        {/* Thumbnail strip */}
        {allPhotos.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 flex gap-1 px-6 pb-0 overflow-x-auto scrollbar-hide z-10">
            {allPhotos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`flex-shrink-0 w-16 h-11 overflow-hidden border-b-2 transition-all duration-200 ${i === idx ? "border-primary" : "border-transparent opacity-50 hover:opacity-80"}`}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left — name + specs */}
          <div className="lg:col-span-2 space-y-8">

            {/* Title block */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                {yacht.flag && (
                  <span className="flex items-center gap-1.5 text-white/40 text-xs font-sans tracking-widest uppercase">
                    <Flag size={11} />
                    {yacht.flag}
                  </span>
                )}
                {yacht.location && (
                  <span className="flex items-center gap-1.5 text-white/40 text-xs font-sans tracking-widest uppercase">
                    <MapPin size={11} />
                    {yacht.location}
                  </span>
                )}
              </div>
              <h1 className="font-display text-5xl md:text-6xl text-white mb-2">{yacht.name}</h1>
              <p className="text-white/50 font-sans tracking-wide text-lg">
                {[yacht.builder, yacht.year, yacht.refit ? `Refit ${yacht.refit}` : null]
                  .filter(Boolean).join(" · ")}
              </p>
            </div>

            {/* Description */}
            {yacht.description && (
              <div className="border-l-2 border-primary/40 pl-5">
                <p className="text-white/65 font-sans leading-relaxed text-base">{yacht.description}</p>
              </div>
            )}

            {/* Quick stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
              {[
                { icon: <Ruler size={16} />, label: "Length", value: cvtLength(yacht.length, units) },
                { icon: <Anchor size={16} />, label: "Draft", value: cvtLength(yacht.draft, units) },
                { icon: <Bed size={16} />, label: "Cabins", value: yacht.cabins != null ? `${yacht.cabins}` : null },
                { icon: <Users size={16} />, label: "Crew", value: yacht.crew != null ? `${yacht.crew}` : null },
              ].map(({ icon, label, value }) => value ? (
                <div key={label} className="bg-background flex flex-col items-center justify-center gap-1 py-5 text-center">
                  <span className="text-primary/70">{icon}</span>
                  <span className="text-white/85 font-sans text-lg font-semibold">{value}</span>
                  <span className="text-white/35 font-sans text-xs tracking-widest uppercase">{label}</span>
                </div>
              ) : null)}
            </div>

            {/* Spec sections */}
            <div>
              {/* Unit toggle */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/30 text-[10px] uppercase tracking-widest font-sans">Specifications</p>
                <button
                  onClick={() => setUnits(u => u === "metric" ? "imperial" : "metric")}
                  className="flex items-center gap-0 border border-white/10 overflow-hidden hover:border-primary/30 transition-colors"
                >
                  <span className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors ${M ? "bg-primary text-background" : "text-white/30 hover:text-white/60"}`}>
                    Metric
                  </span>
                  <span className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors ${!M ? "bg-primary text-background" : "text-white/30 hover:text-white/60"}`}>
                    Imperial
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <Section title="Dimensions">
                  <SpecRow label={M ? "Length Overall" : "Length Overall"} value={cvtLength(yacht.length, units)} />
                  <SpecRow label="Beam" value={cvtLength(yacht.beam, units)} />
                  <SpecRow label="Draft" value={cvtLength(yacht.draft, units)} />
                  <SpecRow label="Displacement" value={cvtDisp(yacht.displacement, units)} />
                  <SpecRow label="Gross Tonnage" value={yacht.gross_tonnage ? `${parseNum(String(yacht.gross_tonnage)) ?? yacht.gross_tonnage} GT` : null} />
                </Section>

                <Section title="Hull & Construction">
                  <SpecRow label="Hull Material" value={yacht.hull_material} />
                  <SpecRow label="Hull Type" value={yacht.hull_type} />
                  <SpecRow label="Condition" value={yacht.condition} />
                  <SpecRow label="Flag" value={yacht.flag} />
                  <SpecRow label="Year Built" value={yacht.year} />
                  <SpecRow label="Last Refit" value={yacht.refit} />
                </Section>

                <Section title="Performance">
                  <SpecRow label="Max Speed" value={yacht.max_speed ? `${parseNum(String(yacht.max_speed)) ?? yacht.max_speed} kn` : null} />
                  <SpecRow label="Cruise Speed" value={yacht.cruise_speed ? `${parseNum(String(yacht.cruise_speed)) ?? yacht.cruise_speed} kn` : null} />
                  <SpecRow label="Range" value={yacht.range ? `${parseNum(String(yacht.range))?.toLocaleString() ?? yacht.range} nm` : null} />
                  <SpecRow label="Fuel Type" value={yacht.fuel_type} />
                  <SpecRow label="Fuel Capacity" value={cvtCapacity(yacht.fuel_capacity, units)} />
                  <SpecRow label="Water Capacity" value={cvtCapacity(yacht.water_capacity, units)} />
                </Section>

                <Section title="Propulsion">
                  <SpecRow label="Engines" value={yacht.engines} />
                  <SpecRow label="Engine Count" value={yacht.engine_count} />
                  <SpecRow label="Horse Power" value={yacht.horse_power ? `${yacht.horse_power} hp` : null} />
                </Section>

                <Section title="Accommodation">
                  <SpecRow label="Guest Cabins" value={yacht.cabins} />
                  <SpecRow label="Heads / Bathrooms" value={yacht.heads} />
                  <SpecRow label="Berths" value={yacht.berths} />
                  <SpecRow label="Crew" value={yacht.crew} />
                </Section>

              </div>
            </div>
          </div>

          {/* Right — pricing + CTA */}
          <div className="space-y-6">

            {/* Price card */}
            <div className="bg-white/3 border border-white/8 p-8 sticky top-24">
              {hasDistressed ? (
                <>
                  <p className="text-white/40 text-xs font-sans tracking-widest uppercase mb-1">Market Value</p>
                  <p className="font-sans text-white/40 text-lg line-through mb-4">{formatPrice(yacht.market_price!)}</p>
                  <p className="text-white/40 text-xs font-sans tracking-widest uppercase mb-1">Distressed Asking Price</p>
                  <p className="font-display text-4xl text-primary mb-2">{formatPrice(yacht.distressed_price!)}</p>
                  <div className="bg-primary/10 border border-primary/20 px-4 py-2 mt-4">
                    <p className="text-primary text-xs font-sans tracking-widest uppercase text-center font-bold">
                      Distressed Sale Opportunity
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-white/40 text-xs font-sans tracking-widest uppercase mb-2">Asking Price</p>
                  <p className="font-display text-4xl text-primary">{formatPrice(yacht.price)}</p>
                </>
              )}

              <div className="mt-8 space-y-3">
                <Link
                  href={`/dealroom/${yacht.id}`}
                  className="block w-full text-center bg-primary text-primary-foreground py-4 font-bold tracking-widest uppercase text-sm hover:bg-primary/90 transition-all duration-300"
                >
                  Enquire Now
                </Link>
                <Link
                  href="/access"
                  className="block w-full text-center border border-white/15 text-white/60 hover:border-primary/40 hover:text-primary py-3 font-sans tracking-widest uppercase text-xs transition-all duration-300"
                >
                  Request Private Access
                </Link>
              </div>

              {/* Key details summary */}
              <div className="mt-8 space-y-0 border-t border-white/5 pt-6">
                <SpecRow label="Type" value={yacht.type} />
                <SpecRow label="Builder" value={yacht.builder} />
                <SpecRow label="Year" value={yacht.year} />
                <SpecRow label="Location" value={yacht.location} />
                <SpecRow label="Length" value={cvtLength(yacht.length, units)} />
                <SpecRow label="Cabins" value={yacht.cabins} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Photo grid at bottom */}
      {allPhotos.length > 1 && (
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <h2 className="font-display text-2xl text-white mb-6 tracking-wide">Gallery</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {allPhotos.map((photo, i) => (
              <button
                key={i}
                onClick={() => { setIdx(i); setLightbox(i); }}
                className="aspect-[4/3] overflow-hidden group relative"
              >
                <img
                  src={photo}
                  alt={`${yacht.name} — ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white border border-white/10 hover:border-white/30 transition-all"
            onClick={() => setLightbox(null)}
          >
            <X size={20} />
          </button>

          {allPhotos.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setLightbox(i => ((i! - 1) + allPhotos.length) % allPhotos.length); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/60 hover:text-white border border-white/10 hover:border-white/30 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setLightbox(i => (i! + 1) % allPhotos.length); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/60 hover:text-white border border-white/10 hover:border-white/30 transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <img
            src={allPhotos[lightbox]}
            alt=""
            className="max-w-[90vw] max-h-[88vh] object-contain"
            onClick={e => e.stopPropagation()}
          />
          <p className="absolute bottom-6 left-0 right-0 text-center text-white/30 text-sm font-sans">
            {lightbox + 1} / {allPhotos.length}
          </p>
        </div>
      )}
    </div>
  );
}
