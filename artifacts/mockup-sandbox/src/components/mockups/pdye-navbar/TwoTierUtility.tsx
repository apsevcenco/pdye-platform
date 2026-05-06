const useLocation = () => ["/"] as const;
import { Ship, Briefcase, Anchor, Users, TrendingUp, Calculator, LogIn } from "lucide-react";

export function TwoTierUtility() {
  const [location] = useLocation();

  const NAV_ITEMS = [
    { name: "Yachts", href: "/yachts", icon: Ship },
    { name: "Deal Room", href: "/dealroom", icon: Briefcase },
    { name: "Owners", href: "/boat-owners", icon: Anchor },
    { name: "Brokers", href: "/brokers", icon: Users },
    { name: "Buyers", href: "/private-buyers", icon: TrendingUp },
    { name: "Valuation", href: "/valuation", icon: Calculator },
  ];

  return (
    <div className="min-h-screen bg-[#070f1a]">
      <header className="w-full bg-[#070f1a]">
        {/* Top utility row */}
        <div className="max-w-[1280px] mx-auto px-6 h-10 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <Anchor size={16} className="text-[#c8a46b] group-hover:text-white transition-colors" strokeWidth={1.8} />
            <span className="font-['Playfair_Display'] font-normal text-base tracking-[0.22em] text-white group-hover:text-[#c8a46b] transition-colors">
              PDYE
            </span>
          </a>

          <div className="flex items-center gap-5">
            <a href="/login" className="flex items-center gap-1.5 text-white/50 hover:text-white font-bold text-[10px] tracking-widest uppercase transition-colors">
              <LogIn size={11} />
              Login
            </a>
            <a href="/access" className="bg-[#c8a46b] hover:bg-white text-[#070f1a] px-3.5 py-1 text-[9px] font-bold tracking-[0.15em] uppercase rounded-full transition-all duration-300">
              Request Access
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-[#c8a46b]/20" />

        {/* Bottom main nav row */}
        <div className="max-w-[1280px] mx-auto px-6 h-[52px] flex items-center justify-center gap-12">
          {NAV_ITEMS.map((item) => {
            const active = location === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`group relative h-full flex items-center gap-2 font-sans font-semibold text-[11px] tracking-[0.14em] uppercase transition-all duration-200 ${
                  active ? "text-[#c8a46b]" : "text-white/60 hover:text-white"
                }`}
              >
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#c8a46b] shadow-[0_0_8px_rgba(200,164,107,0.8)]" />
                )}
                <item.icon size={13} className={`transition-colors duration-200 ${active ? "text-[#c8a46b]" : "text-white/30 group-hover:text-white/60"}`} strokeWidth={1.5} />
                {item.name}
              </a>
            );
          })}
        </div>
      </header>
    </div>
  );
}
