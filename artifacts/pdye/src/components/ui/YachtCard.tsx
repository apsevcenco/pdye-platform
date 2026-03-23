import { Link } from "wouter";
import { Ruler, Calendar, Building2, Lock, Clock, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { Yacht } from "@/lib/data";
import { useCurrency } from "@/lib/currency";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800&q=80";

export type RequestStatus = "none" | "pending" | "approved" | "rejected";

interface YachtCardProps {
  yacht: Yacht;
  requestStatus?: RequestStatus;
  onRequest?: () => void;
  requesting?: boolean;
}

const STATUS_CONFIG: Record<RequestStatus, { label: string; icon: React.ReactNode; style: string; btnStyle: string }> = {
  none: {
    label: "Request Full Details",
    icon: <Lock size={12} />,
    style: "",
    btnStyle: "bg-primary/10 border border-primary/40 text-primary hover:bg-primary hover:text-background",
  },
  pending: {
    label: "Under Review",
    icon: <Clock size={12} />,
    style: "",
    btnStyle: "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 cursor-default",
  },
  approved: {
    label: "Access Granted",
    icon: <CheckCircle size={12} />,
    style: "",
    btnStyle: "bg-green-500/10 border border-green-500/30 text-green-400 cursor-default",
  },
  rejected: {
    label: "Request Declined",
    icon: <XCircle size={12} />,
    style: "",
    btnStyle: "bg-red-500/10 border border-red-500/30 text-red-400 cursor-default",
  },
};

export function YachtCard({ yacht, requestStatus = "none", onRequest, requesting = false }: YachtCardProps) {
  const image = (yacht as any).main_image || yacht.image || DEFAULT_IMAGE;
  const cfg = STATUS_CONFIG[requestStatus];
  const { formatPrice } = useCurrency();

  return (
    <div className="group bg-card border border-white/5 hover:border-primary/30 transition-all duration-500 overflow-hidden flex flex-col">

      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={yacht.name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        {/* Locked overlay — only when not approved */}
        {requestStatus !== "approved" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[1px]">
            <div className="bg-background/80 border border-white/10 px-4 py-2 flex items-center gap-2">
              <Lock size={13} className="text-primary/70" />
              <span className="text-white/60 text-xs font-sans tracking-widest uppercase">Confidential</span>
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-background/80 backdrop-blur-sm border border-white/10 text-white text-xs font-bold tracking-wider uppercase px-3 py-1">
            {yacht.status}
          </span>
          {yacht.type && (
            <span className="bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary text-xs font-bold tracking-wider uppercase px-3 py-1">
              {yacht.type}
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-6 flex flex-col flex-1 gap-4">

        {/* Price (always shown) + status */}
        <div className="flex items-start justify-between gap-2">
          <div>
            {yacht.price ? (
              <p className="font-display text-2xl text-primary">{formatPrice(yacht.price)}</p>
            ) : (
              <p className="font-display text-2xl text-white/20">Price on Request</p>
            )}
            <p className="text-white/30 text-[10px] font-sans tracking-widest uppercase mt-0.5">Confidential Listing</p>
          </div>
          {yacht.distressed_price && yacht.distressed_price !== yacht.price && (
            <div className="text-right flex-shrink-0">
              <p className="text-white/25 text-xs line-through font-sans">{yacht.market_price ? formatPrice(yacht.market_price) : ""}</p>
              <p className="text-green-400 text-[10px] font-bold uppercase tracking-wider">Distressed</p>
            </div>
          )}
        </div>

        {/* Public specs — only builder, length, year */}
        <div className="flex flex-wrap gap-4 text-sm text-white/60 font-sans border-t border-white/5 pt-4">
          {yacht.builder && (
            <div className="flex items-center gap-1.5">
              <Building2 size={13} className="text-primary/60" />
              <span>{yacht.builder}</span>
            </div>
          )}
          {yacht.length && (
            <div className="flex items-center gap-1.5">
              <Ruler size={13} className="text-primary/60" />
              <span>{yacht.length}</span>
            </div>
          )}
          {yacht.year && (
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-primary/60" />
              <span>{yacht.year}</span>
            </div>
          )}
        </div>

        {/* Hidden specs teaser */}
        <div className="flex flex-wrap gap-2">
          {["Name", "Location", "Specs", "Docs"].map(item => (
            <span key={item} className="text-[10px] text-white/20 font-sans tracking-widest uppercase border border-white/5 px-2 py-1 flex items-center gap-1">
              <Lock size={8} className="opacity-50" /> {item}
            </span>
          ))}
        </div>

        {/* CTA */}
        {requestStatus === "approved" ? (
          <Link
            href={`/yacht/${yacht.id}`}
            className="flex items-center justify-center gap-2 w-full border border-primary text-primary hover:bg-primary hover:text-background py-3 text-xs font-bold tracking-widest uppercase transition-all duration-300 mt-auto"
          >
            View Full Details <ChevronRight size={13} />
          </Link>
        ) : (
          <button
            onClick={requestStatus === "none" ? onRequest : undefined}
            disabled={requesting || requestStatus !== "none"}
            className={`flex items-center justify-center gap-2 w-full py-3 text-xs font-bold tracking-widest uppercase transition-all duration-300 mt-auto ${cfg.btnStyle} disabled:opacity-60`}
          >
            {requesting ? (
              <>
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                {cfg.icon} {cfg.label}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
