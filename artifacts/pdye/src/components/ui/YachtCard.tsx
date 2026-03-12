import { Link } from "wouter";
import { MapPin, Ruler, Calendar } from "lucide-react";
import { Yacht } from "@/lib/data";

interface YachtCardProps {
  yacht: Yacht;
  isPrivate?: boolean;
}

export function YachtCard({ yacht, isPrivate = false }: YachtCardProps) {
  const hasDistressed = yacht.distressedPrice && yacht.marketPrice;

  return (
    <div className="group bg-card border border-white/5 hover:border-primary/50 transition-all duration-500 overflow-hidden flex flex-col h-full">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={yacht.image}
          alt={yacht.name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60"></div>

        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-background/80 backdrop-blur-sm border border-white/10 text-white text-xs font-bold tracking-wider uppercase px-3 py-1">
            {yacht.status}
          </span>
          {isPrivate && (
            <span className="bg-primary/90 text-primary-foreground text-xs font-bold tracking-wider uppercase px-3 py-1">
              Confidential
            </span>
          )}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-display text-2xl text-white mb-1 group-hover:text-primary transition-colors">{yacht.name}</h3>
            <p className="text-white/60 text-sm font-sans tracking-wide uppercase">{yacht.builder}</p>
          </div>
          <div className="text-right">
            {hasDistressed ? (
              <>
                <p className="font-display text-lg text-primary">{yacht.distressedPrice}</p>
                <p className="text-white/40 text-xs line-through font-sans mt-0.5">{yacht.marketPrice}</p>
              </>
            ) : (
              <p className="font-display text-lg text-primary">{yacht.price}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-white/70 mb-6 font-sans">
          <div className="flex items-center gap-1.5">
            <Ruler size={16} className="text-primary/70" />
            <span>{yacht.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={16} className="text-primary/70" />
            <span>{yacht.year}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={16} className="text-primary/70" />
            <span>{yacht.location}</span>
          </div>
        </div>

        <p className="text-white/50 text-sm leading-relaxed mb-8 flex-1 line-clamp-2">
          {yacht.description}
        </p>

        <Link
          href={`/dealroom`}
          className="w-full block text-center border border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground py-3 text-sm font-bold tracking-widest uppercase transition-all duration-300 mt-auto"
        >
          View Deal
        </Link>
      </div>
    </div>
  );
}
