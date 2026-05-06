import { Anchor, Ship, Users, TrendingUp, Calculator, LogIn, Shield, FileCheck } from "lucide-react";

const LEFT_LINKS = [
  { name: "Yachts", href: "/yachts" },
  { name: "Boat Owners", href: "/boat-owners" },
  { name: "Brokers", href: "/brokers" },
];

const RIGHT_LINKS = [
  { name: "Buyers", href: "/private-buyers" },
  { name: "Valuation", href: "/valuation" },
];

function NavLink({ href, name }: { href: string; name: string }) {
  return (
    <a
      href={href}
      className="group relative font-sans font-semibold text-[11px] tracking-[0.18em] uppercase text-white/60 hover:text-white transition-colors duration-300"
    >
      {name}
      <span className="absolute -bottom-2 left-0 h-[1px] w-0 bg-[#c8a46b] transition-all duration-300 group-hover:w-full" />
    </a>
  );
}

export function HomeWithSplitNav() {
  return (
    <div className="min-h-screen bg-[#070f1a] text-white font-sans">
      {/* Navbar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#070f1a]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-10 h-[78px] flex items-center justify-center relative">

          {/* Left Links */}
          <nav className="flex items-center gap-10 pr-12">
            {LEFT_LINKS.map(l => <NavLink key={l.href} {...l} />)}
          </nav>

          {/* Centered Logo */}
          <a href="/" className="flex items-center gap-3 group mx-6 flex-shrink-0">
            <Anchor size={26} className="text-[#c8a46b] group-hover:text-white transition-colors duration-300" strokeWidth={1.6} />
            <span className="font-['Playfair_Display'] font-normal text-[28px] tracking-[0.22em] text-white group-hover:text-[#c8a46b] transition-colors duration-300">
              PDYE
            </span>
          </a>

          {/* Right Links */}
          <nav className="flex items-center gap-10 pl-12">
            {RIGHT_LINKS.map(l => <NavLink key={l.href} {...l} />)}
          </nav>

          {/* Far right: Login only */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <a
              href="/login"
              className="flex items-center gap-2 text-white/55 hover:text-[#c8a46b] font-semibold text-[11px] tracking-[0.18em] uppercase transition-colors"
            >
              <LogIn size={13} strokeWidth={1.8} />
              Login
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[90vh] min-h-[640px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1920&q=80"
            alt="Luxury Yacht"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-[#070f1a]/70 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070f1a]/40 via-[#070f1a]/20 to-[#070f1a]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <span className="text-[#c8a46b] font-bold tracking-[0.22em] text-[12px] md:text-[13px] uppercase mb-7 inline-block border border-[#c8a46b]/30 px-4 py-1.5 bg-[#070f1a]/30 backdrop-blur-md">
            By Invitation · Off-Market
          </span>
          <h1 className="text-5xl md:text-7xl text-white font-bold leading-[1.1] mb-7 font-['Playfair_Display']">
            Private Distressed<br />Yacht Exchange
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-light leading-relaxed mb-10">
            A discreet marketplace where vetted owners, brokers, and acquirers
            transact superyachts in confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
            <a
              href="/yachts"
              className="bg-[#c8a46b] hover:bg-white text-[#070f1a] px-9 py-4 font-bold tracking-[0.18em] uppercase transition-all duration-300 text-[12px] shadow-[0_0_20px_rgba(200,164,107,0.4)]"
            >
              Browse Inventory
            </a>
            <a
              href="/brokers"
              className="bg-transparent border border-white/20 hover:border-white text-white px-9 py-4 font-bold tracking-[0.18em] uppercase transition-all duration-300 text-[12px]"
            >
              For Brokers
            </a>
          </div>
        </div>
      </section>

      {/* Expertise teaser */}
      <section className="py-24 bg-[#0a1426] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-10">
          <div className="text-center mb-14">
            <span className="text-[#c8a46b] font-bold tracking-[0.22em] text-[11px] uppercase">Our Expertise</span>
            <h2 className="text-3xl md:text-4xl font-['Playfair_Display'] mt-3 text-white">
              Discretion at every stage
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Anchor, title: "Curated Inventory", desc: "Only verified, distressed assets reach our members." },
              { icon: Shield, title: "NDA-Gated Rooms", desc: "Documents flow through encrypted deal rooms." },
              { icon: FileCheck, title: "Legal Concierge", desc: "Maritime counsel on every transaction." },
              { icon: TrendingUp, title: "Market Intelligence", desc: "Live valuation and comparables." },
            ].map((x, i) => {
              const Icon = x.icon;
              return (
                <div key={i} className="border border-white/8 p-7 hover:border-[#c8a46b]/40 transition-colors group">
                  <Icon size={26} className="text-[#c8a46b] mb-4 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  <h3 className="text-base font-bold tracking-wide uppercase text-white mb-2">{x.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed font-light">{x.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
