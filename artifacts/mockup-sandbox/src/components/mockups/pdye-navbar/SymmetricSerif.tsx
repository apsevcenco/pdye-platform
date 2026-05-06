const useLocation = () => ["/"] as const;
import { Anchor, Ship, Briefcase, Users, TrendingUp, Calculator, LogIn } from "lucide-react";

export function SymmetricSerif() {
  const [location] = useLocation();

  const LEFT_LINKS = [
    { name: "Yachts", href: "/yachts", icon: Ship },
    { name: "Deals", href: "/dealroom", icon: Briefcase },
    { name: "Owners", href: "/boat-owners", icon: Anchor },
  ];

  const RIGHT_LINKS = [
    { name: "Brokers", href: "/brokers", icon: Users },
    { name: "Buyers", href: "/private-buyers", icon: TrendingUp },
    { name: "Valuation", href: "/valuation", icon: Calculator },
  ];

  function NavLink({ href, name, icon: Icon }: { href: string; name: string; icon: React.ElementType }) {
    const active = location === href;
    return (
      <a
        href={href}
        className={`group flex items-center gap-2 font-sans font-semibold text-[11px] tracking-[0.15em] uppercase transition-all duration-300 relative py-2 ${
          active ? "text-[#c8a46b]" : "text-white/60 hover:text-white"
        }`}
      >
        <Icon size={14} className={`transition-colors duration-300 ${active ? "text-[#c8a46b]" : "text-white/30 group-hover:text-[#c8a46b]"}`} strokeWidth={1.5} />
        {name}
        <span className={`absolute bottom-0 left-0 h-[1px] bg-[#c8a46b] transition-all duration-300 ${active ? "w-full" : "w-0 group-hover:w-full"}`} />
      </a>
    );
  }

  return (
    <div className="min-h-screen bg-[#070f1a] w-full font-sans text-white">
      <header className="w-full bg-[#070f1a] border-b border-white/5 relative flex items-center h-[90px]">
        
        {/* Central Nav Area */}
        <div className="w-full flex items-center justify-center">
          
          {/* Left Links */}
          <nav className="flex items-center gap-8 pr-12">
            {LEFT_LINKS.map(l => <NavLink key={l.href} {...l} />)}
          </nav>

          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group mx-4">
            <Anchor size={28} className="text-[#c8a46b] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
            <span className="font-['Playfair_Display'] font-normal text-[30px] tracking-[0.22em] text-white group-hover:text-[#c8a46b] transition-colors duration-300 pt-1">
              PDYE
            </span>
          </a>

          {/* Right Links */}
          <nav className="flex items-center gap-8 pl-12">
            {RIGHT_LINKS.map(l => <NavLink key={l.href} {...l} />)}
          </nav>

        </div>

        {/* Far Right Action Buttons */}
        <div className="absolute right-8 flex items-center gap-5">
          <a
            href="/login"
            className="flex items-center gap-1.5 text-white/50 hover:text-white font-bold text-[11px] tracking-[0.15em] uppercase transition-colors"
          >
            <LogIn size={14} />
            Login
          </a>
          <a
            href="/access"
            className="bg-[#c8a46b] hover:bg-white text-[#070f1a] px-6 py-2.5 text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-300 hover:shadow-none shadow-[0_0_20px_rgba(200,164,107,0.15)]"
          >
            Request Access
          </a>
        </div>
      </header>
    </div>
  );
}
