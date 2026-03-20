import { Link } from "wouter";
import { MapPin, Ruler, Anchor, Bed, Bath, Zap, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { Yacht } from "@/lib/data";
import { useState } from "react";
import { useCurrency } from "@/lib/currency";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800&q=80";

interface YachtCardProps {
  yacht: Yacht;
  isPrivate?: boolean;
}

export function YachtCard({ yacht, isPrivate = false }: YachtCardProps) {
  const { formatPrice } = useCurrency();
  const hasDistressed = yacht.distressed_price && yacht.market_price;

  const allPhotos: string[] = (() => {
    const pool: string[] = [];
    if (yacht.photos && yacht.photos.length > 0) pool.push(...yacht.photos);
    if (yacht.image && !pool.includes(yacht.image)) pool.unshift(yacht.image);
    return pool.length > 0 ? pool : [DEFAULT_IMAGE];
  })();

  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    setIdx(i => (i - 1 + allPhotos.length) % allPhotos.length);
  };
  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    setIdx(i => (i + 1) % allPhotos.length);
  };

  return (
    <div className="group bg-card border border-white/5 hover:border-primary/50 transition-all duration-500 overflow-hidden flex flex-col h-full">

      {/* Photo area */}
      <Link href={`/yacht/${yacht.id}`} className="block">
      <div
        className="relative aspect-[4/3] overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          key={allPhotos[idx]}
          src={allPhotos[idx]}
          alt={`${yacht.name} — photo ${idx + 1}`}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />

        {/* Status & type badges */}
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          <span className="bg-background/80 backdrop-blur-sm border border-white/10 text-white text-xs font-bold tracking-wider uppercase px-3 py-1">
            {yacht.status}
          </span>
          {yacht.type && (
            <span className="bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary text-xs font-bold tracking-wider uppercase px-3 py-1">
              {yacht.type}
            </span>
          )}
          {isPrivate && (
            <span className="bg-primary/90 text-primary-foreground text-xs font-bold tracking-wider uppercase px-3 py-1">
              Confidential
            </span>
          )}
        </div>

        {/* Nav arrows — only shown when multiple photos and hovered */}
        {allPhotos.length > 1 && hovered && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/70 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/70 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Photo counter + dot strip */}
        {allPhotos.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center gap-1.5">
            {/* Dot indicators (max 10 shown) */}
            <div className="flex gap-1">
              {allPhotos.slice(0, 10).map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.preventDefault(); setIdx(i); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-primary w-3" : "bg-white/40 hover:bg-white/70"}`}
                />
              ))}
              {allPhotos.length > 10 && (
                <span className="text-white/40 text-[10px] leading-none self-center ml-1">+{allPhotos.length - 10}</span>
              )}
            </div>
            {/* Counter */}
            <span className="flex items-center gap-1 bg-background/60 backdrop-blur-sm px-2 py-0.5 text-[10px] text-white/60 font-sans">
              <Images size={10} />
              {idx + 1} / {allPhotos.length}
            </span>
          </div>
        )}

        {/* Flag */}
        {yacht.flag && (
          <div className="absolute top-4 right-4">
            <span className="bg-background/70 backdrop-blur-sm text-white/60 text-[10px] font-sans uppercase tracking-widest px-2 py-1">
              {yacht.flag}
            </span>
          </div>
        )}
      </div>
      </Link>

      {/* Card body */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-display text-2xl text-white mb-1 group-hover:text-primary transition-colors">{yacht.name}</h3>
            <p className="text-white/60 text-sm font-sans tracking-wide uppercase">{yacht.builder}{yacht.year ? ` · ${yacht.year}` : ""}</p>
          </div>
          <div className="text-right">
            {hasDistressed ? (
              <>
                <p className="font-display text-lg text-primary">{formatPrice(yacht.distressed_price!)}</p>
                <p className="text-white/40 text-xs line-through font-sans mt-0.5">{formatPrice(yacht.market_price!)}</p>
              </>
            ) : (
              <p className="font-display text-lg text-primary">{formatPrice(yacht.price)}</p>
            )}
          </div>
        </div>

        {/* Primary specs */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/70 mb-4 font-sans">
          {yacht.length && (
            <div className="flex items-center gap-1.5">
              <Ruler size={14} className="text-primary/70" />
              <span>{yacht.length}</span>
            </div>
          )}
          {yacht.beam && (
            <div className="flex items-center gap-1.5">
              <span className="text-primary/70 text-xs font-bold">⟺</span>
              <span>{yacht.beam}</span>
            </div>
          )}
          {yacht.draft && (
            <div className="flex items-center gap-1.5">
              <Anchor size={14} className="text-primary/70" />
              <span>{yacht.draft}</span>
            </div>
          )}
          {yacht.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-primary/70" />
              <span>{yacht.location}</span>
            </div>
          )}
        </div>

        {/* Secondary specs */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/50 mb-4 font-sans border-t border-white/5 pt-4">
          {yacht.cabins != null && (
            <div className="flex items-center gap-1">
              <Bed size={12} className="text-primary/50" />
              <span>{yacht.cabins} cab.</span>
            </div>
          )}
          {yacht.heads != null && (
            <div className="flex items-center gap-1">
              <Bath size={12} className="text-primary/50" />
              <span>{yacht.heads} heads</span>
            </div>
          )}
          {yacht.cruise_speed && (
            <div className="flex items-center gap-1">
              <Zap size={12} className="text-primary/50" />
              <span>{yacht.cruise_speed} cruise</span>
            </div>
          )}
          {yacht.max_speed && <span className="text-white/30">{yacht.max_speed} max</span>}
          {yacht.range && <span className="text-white/30">{yacht.range}</span>}
          {yacht.hull_material && <span className="text-white/30">{yacht.hull_material}</span>}
          {yacht.fuel_type && <span className="text-white/30">{yacht.fuel_type}</span>}
        </div>

        {/* Technical specification grid */}
        {(yacht.engines || yacht.horse_power || yacht.displacement || yacht.gross_tonnage || yacht.fuel_capacity || yacht.berths != null || yacht.crew != null) && (
          <div className="border border-white/5 bg-white/2 mb-4">
            <div className="grid grid-cols-2 divide-x divide-y divide-white/5">
              {yacht.engines && (
                <div className="px-3 py-2">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-sans mb-0.5">Engines</p>
                  <p className="text-white/65 text-[11px] font-sans leading-tight">{yacht.engines}</p>
                </div>
              )}
              {yacht.horse_power && (
                <div className="px-3 py-2">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-sans mb-0.5">Power</p>
                  <p className="text-white/65 text-[11px] font-sans leading-tight">{yacht.horse_power}</p>
                </div>
              )}
              {yacht.displacement && (
                <div className="px-3 py-2">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-sans mb-0.5">Displacement</p>
                  <p className="text-white/65 text-[11px] font-sans leading-tight">{yacht.displacement}</p>
                </div>
              )}
              {yacht.gross_tonnage && (
                <div className="px-3 py-2">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-sans mb-0.5">Gross Tonnage</p>
                  <p className="text-white/65 text-[11px] font-sans leading-tight">{yacht.gross_tonnage}</p>
                </div>
              )}
              {yacht.fuel_capacity && (
                <div className="px-3 py-2">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-sans mb-0.5">Fuel Capacity</p>
                  <p className="text-white/65 text-[11px] font-sans leading-tight">{yacht.fuel_capacity}</p>
                </div>
              )}
              {yacht.berths != null && (
                <div className="px-3 py-2">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-sans mb-0.5">Berths</p>
                  <p className="text-white/65 text-[11px] font-sans leading-tight">{yacht.berths}</p>
                </div>
              )}
              {yacht.crew != null && (
                <div className="px-3 py-2">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-sans mb-0.5">Crew</p>
                  <p className="text-white/65 text-[11px] font-sans leading-tight">{yacht.crew}</p>
                </div>
              )}
              {yacht.water_capacity && (
                <div className="px-3 py-2">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-sans mb-0.5">Water</p>
                  <p className="text-white/65 text-[11px] font-sans leading-tight">{yacht.water_capacity}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-white/50 text-sm leading-relaxed mb-8 flex-1 line-clamp-2">
          {yacht.description}
        </p>

        <Link
          href="/dealroom"
          className="w-full block text-center border border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground py-3 text-sm font-bold tracking-widest uppercase transition-all duration-300 mt-auto"
        >
          View Deal
        </Link>
      </div>
    </div>
  );
}
