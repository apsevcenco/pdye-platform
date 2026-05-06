import { Anchor, Ship, Briefcase, Users, TrendingUp, Calculator, LogIn } from "lucide-react";

export function CenteredSplit() {
  const leftLinks = [
    { name: "Yachts", href: "/yachts", icon: Ship },
    { name: "Deals", href: "/dealroom", icon: Briefcase },
    { name: "Owners", href: "/boat-owners", icon: Anchor },
  ];

  const rightLinks = [
    { name: "Brokers", href: "/brokers", icon: Users },
    { name: "Buyers", href: "/private-buyers", icon: TrendingUp },
    { name: "Valuation", href: "/valuation", icon: Calculator },
  ];

  const NavLink = ({ href, name, icon: Icon }: { href: string; name: string; icon: React.ElementType }) => (
    <a
      href={href}
      className="group flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.15em] text-white/60 hover:text-[#c8a46b] transition-colors duration-300 relative px-4"
    >
      <Icon size={12} className="text-white/30 group-hover:text-[#c8a46b] transition-colors duration-300" strokeWidth={1.5} />
      <span>{name}</span>
      <span className="absolute -bottom-2 left-1/2 w-0 h-[1px] bg-[#c8a46b] transition-all duration-300 group-hover:w-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100" />
    </a>
  );

  return (
    <div className="min-h-screen bg-[#070f1a] w-full font-sans">
      <header className="w-full border-b border-white/5 bg-[#070f1a] relative z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-[88px] flex items-center justify-between">
          
          {/* Mobile menu fallback for completeness, though mockup is desktop 1280px focus */}
          <div className="flex lg:hidden items-center text-white/70 text-[10px] uppercase tracking-widest">
            Menu
          </div>

          {/* Left Nav Group */}
          <nav className="hidden lg:flex items-center flex-1 justify-end pr-10 border-r border-white/5 h-10">
            {leftLinks.map((link, i) => (
              <div key={link.name} className="flex items-center">
                <NavLink {...link} />
                {i < leftLinks.length - 1 && <div className="h-4 w-[1px] bg-white/10 mx-2" />}
              </div>
            ))}
          </nav>

          {/* Center Logo */}
          <a href="/" className="flex flex-col items-center justify-center px-10 group shrink-0">
            <Anchor size={22} className="text-[#c8a46b] group-hover:text-white transition-colors duration-500 mb-1" strokeWidth={1.5} />
            <span className="font-['Playfair_Display'] text-xl tracking-[0.22em] text-white leading-none">
              PDYE
            </span>
          </a>

          {/* Right Nav Group */}
          <nav className="hidden lg:flex items-center flex-1 justify-start pl-10 border-l border-white/5 h-10">
            {rightLinks.map((link, i) => (
              <div key={link.name} className="flex items-center">
                <NavLink {...link} />
                {i < rightLinks.length - 1 && <div className="h-4 w-[1px] bg-white/10 mx-2" />}
              </div>
            ))}
            
            {/* CTA Group right-aligned inside the flex container */}
            <div className="ml-auto flex items-center gap-6">
              <a
                href="/login"
                className="flex items-center gap-1.5 text-white/50 hover:text-white text-[10px] tracking-[0.15em] uppercase transition-colors"
              >
                <LogIn size={12} strokeWidth={1.5} />
                <span>Login</span>
              </a>
              <a
                href="/access"
                className="border border-[#c8a46b] text-[#c8a46b] hover:bg-[#c8a46b] hover:text-[#070f1a] px-6 py-2.5 text-[10px] tracking-[0.2em] uppercase transition-all duration-500"
              >
                Request Access
              </a>
            </div>
          </nav>

        </div>
      </header>
    </div>
  );
}
