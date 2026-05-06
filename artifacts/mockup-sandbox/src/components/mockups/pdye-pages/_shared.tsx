import { Anchor, ChevronRight } from "lucide-react";

const NAV_LINKS = [
  { name: "Yachts", href: "#" },
  { name: "Boat Owners", href: "#" },
  { name: "Brokers", href: "#" },
  { name: "Private Buyers", href: "#" },
  { name: "Yacht Valuation", href: "#" },
];

export function PdyeNavbar({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 w-full z-50 bg-[#070f1a]/97 backdrop-blur-md border-b border-white/6">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-[72px] flex items-center justify-between gap-4 relative">
        <a href="#" className="flex items-center gap-2.5 group flex-shrink-0">
          <Anchor size={24} className="text-[#c8a46b]" strokeWidth={1.8} />
          <span className="font-['Gilroy'] font-normal text-[26px] tracking-[0.22em] text-white">PDYE</span>
        </a>
        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
          {NAV_LINKS.map((l) => (
            <a key={l.name} href={l.href}
              className={`group relative font-sans font-semibold text-[11px] tracking-[0.16em] uppercase transition-colors duration-300 py-1 ${
                active === l.name ? "text-[#c8a46b]" : "text-white/60 hover:text-white"
              }`}>
              {l.name}
              <span className={`absolute -bottom-1.5 left-0 h-[1px] bg-[#c8a46b] transition-all duration-300 ${active === l.name ? "w-full" : "w-0 group-hover:w-full"}`} />
            </a>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-5 flex-shrink-0">
          <span className="text-white/60 font-semibold text-[11px] tracking-[0.16em] uppercase">Login</span>
        </div>
      </div>
    </header>
  );
}

export function PageHeader({ eyebrow, title, breadcrumbs }: { eyebrow: string; title: string; breadcrumbs?: string[] }) {
  return (
    <section className="border-b border-white/6 bg-[#070f1a]">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        {breadcrumbs && (
          <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase text-white/40 mb-5">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                {b}
                {i < breadcrumbs.length - 1 && <ChevronRight size={12} className="text-white/30" />}
              </span>
            ))}
          </div>
        )}
        <span className="text-[#c8a46b] font-bold tracking-[0.22em] text-[12px] uppercase mb-3 inline-block">{eyebrow}</span>
        <h1 className="text-4xl md:text-5xl text-white font-bold font-['Gilroy'] tracking-tight">{title}</h1>
      </div>
    </section>
  );
}

export function GoldButton({ children, kind = "outline" }: { children: React.ReactNode; kind?: "outline" | "ghost" }) {
  if (kind === "ghost") {
    return (
      <button className="text-white/60 hover:text-[#c8a46b] font-bold tracking-[0.18em] uppercase text-[11px] transition-colors">
        {children}
      </button>
    );
  }
  return (
    <button className="bg-white/5 backdrop-blur-md border border-[#c8a46b] text-[#c8a46b] hover:bg-[#c8a46b]/10 hover:text-white hover:border-white px-7 py-3 font-bold tracking-[0.18em] uppercase transition-all duration-300 text-[11px]">
      {children}
    </button>
  );
}

export function StatusPill({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "green" | "muted" | "red" }) {
  const tones: Record<string, string> = {
    gold: "border-[#c8a46b]/40 text-[#c8a46b] bg-[#c8a46b]/5",
    green: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
    muted: "border-white/15 text-white/50 bg-white/5",
    red: "border-red-500/30 text-red-400 bg-red-500/5",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 border text-[10px] tracking-[0.16em] uppercase font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
