import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Anchor, LogIn, LogOut, Ship, Briefcase, Users, TrendingUp, Calculator, LayoutDashboard, User } from "lucide-react";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { useAuth } from "@/context/AuthContext";

const MEMBER_LINKS = [
  { name: "Yachts", href: "/yachts", icon: Ship },
  { name: "Deal Room", href: "/dealroom", icon: Briefcase },
];

const SERVICE_LINKS = [
  { name: "Boat Owners", href: "/boat-owners", icon: Anchor },
  { name: "Brokers", href: "/brokers", icon: Users },
  { name: "Private Buyers", href: "/private-buyers", icon: TrendingUp },
];

const TOOL_LINK = { name: "Value Yacht", href: "/valuation", icon: Calculator };

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isHome = location === "/";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navBackground = (isScrolled || !isHome)
    ? "bg-[#070f1a]/97 backdrop-blur-md border-b border-white/6 shadow-[0_1px_0_rgba(255,255,255,0.04)]"
    : "bg-transparent";

  async function handleLogout() {
    await logout();
    setMobileMenuOpen(false);
  }

  function NavLink({ href, name, icon: Icon }: { href: string; name: string; icon: React.ElementType }) {
    const active = location === href;
    return (
      <Link
        href={href}
        className={`group flex items-center gap-1.5 font-sans font-semibold text-[10.5px] tracking-[0.14em] uppercase transition-all duration-250 relative ${
          active ? "text-primary" : "text-white/55 hover:text-white"
        }`}
      >
        <Icon size={12} className={`transition-colors duration-250 ${active ? "text-primary" : "text-white/30 group-hover:text-white/60"}`} strokeWidth={2} />
        {name}
        <span className={`absolute -bottom-1.5 left-0 h-[1px] bg-primary transition-all duration-300 ${active ? "w-full" : "w-0 group-hover:w-full"}`} />
      </Link>
    );
  }

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-400 ${navBackground}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 h-[72px] flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="relative">
            <Anchor size={24} className="text-primary group-hover:text-white transition-colors duration-300" strokeWidth={1.8} />
          </div>
          <span className="font-display font-normal text-[26px] tracking-[0.22em] text-white group-hover:text-primary transition-colors duration-300">
            PDYE
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-5 flex-1 justify-center">

          {/* Section label + member links */}
          <div className="flex items-center gap-1">
            <span className="text-white/15 text-[9px] font-bold tracking-[0.2em] uppercase mr-2 font-sans">Members</span>
            <div className="flex items-center gap-5">
              {MEMBER_LINKS.map(l => <NavLink key={l.href} {...l} />)}
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          {/* Section label + service links */}
          <div className="flex items-center gap-1">
            <span className="text-white/15 text-[9px] font-bold tracking-[0.2em] uppercase mr-2 font-sans">Services</span>
            <div className="flex items-center gap-5">
              {SERVICE_LINKS.map(l => <NavLink key={l.href} {...l} />)}
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          {/* AI Tool — special pill */}
          <Link
            href={TOOL_LINK.href}
            className={`flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.14em] uppercase transition-all duration-250 px-3.5 py-1.5 border font-sans ${
              location === TOOL_LINK.href
                ? "border-primary bg-primary/15 text-primary"
                : "border-primary/35 text-primary/70 hover:border-primary hover:text-primary hover:bg-primary/8"
            }`}
          >
            <Calculator size={11} strokeWidth={2} />
            {TOOL_LINK.name}
          </Link>
        </nav>

        {/* Right side */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <CurrencySelector compact />
          <div className="h-5 w-[1px] bg-white/12" />
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors px-3 py-1.5 border ${location === "/dashboard" ? "border-primary/50 text-primary bg-primary/8" : "border-white/8 bg-white/3 text-white/50 hover:text-primary hover:border-primary/30"}`}
              >
                <LayoutDashboard size={11} />
                Dashboard
              </Link>
              <Link
                href="/profile"
                title="My Profile — change email or password"
                data-testid="link-profile-desktop"
                className={`flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors px-3 py-1.5 border ${location === "/profile" ? "border-primary/50 text-primary bg-primary/8" : "border-white/8 bg-white/3 text-white/50 hover:text-primary hover:border-primary/30"}`}
              >
                <User size={11} />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                title="Logout"
                className="flex items-center gap-1.5 text-white/40 hover:text-white text-[10px] font-bold tracking-widest uppercase transition-colors"
              >
                <LogOut size={13} />
                Exit
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-white/50 hover:text-white font-bold text-[10.5px] tracking-widest uppercase transition-colors"
              >
                <LogIn size={13} />
                Login
              </Link>
              <Link
                href="/access"
                className="bg-primary hover:bg-white text-[#070f1a] px-5 py-2.5 text-[10.5px] font-bold tracking-[0.14em] uppercase transition-all duration-300 hover:shadow-none shadow-[0_0_18px_rgba(200,164,107,0.2)]"
              >
                Request Access
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-white/80 hover:text-white p-1.5 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-[72px] left-0 w-full bg-[#070f1a] border-b border-white/10 lg:hidden shadow-2xl">
          <div className="flex flex-col p-6 gap-0">
            <div className="mb-4">
              <span className="text-white/20 text-[9px] font-bold tracking-[0.25em] uppercase block mb-3 font-sans">Members Area</span>
              <div className="space-y-0 divide-y divide-white/5">
                {MEMBER_LINKS.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 py-3.5 text-sm font-semibold tracking-wide uppercase ${location === l.href ? "text-primary" : "text-white/70"}`}>
                    <l.icon size={14} className={location === l.href ? "text-primary" : "text-white/30"} strokeWidth={1.8} />
                    {l.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/8 mb-4" />

            <div className="mb-4">
              <span className="text-white/20 text-[9px] font-bold tracking-[0.25em] uppercase block mb-3 font-sans">Services</span>
              <div className="space-y-0 divide-y divide-white/5">
                {SERVICE_LINKS.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 py-3.5 text-sm font-semibold tracking-wide uppercase ${location === l.href ? "text-primary" : "text-white/70"}`}>
                    <l.icon size={14} className={location === l.href ? "text-primary" : "text-white/30"} strokeWidth={1.8} />
                    {l.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/8 mb-4" />

            <Link href={TOOL_LINK.href} onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 py-3 border border-primary/30 px-4 text-primary font-bold text-sm tracking-wide uppercase mb-5">
              <Calculator size={14} />
              {TOOL_LINK.name}
            </Link>

            <div className="flex items-center justify-between mb-5">
              <span className="text-white/30 text-xs font-sans tracking-widest uppercase">Currency</span>
              <CurrencySelector />
            </div>

            <div className="h-[1px] w-full bg-white/8 mb-4" />

            {user ? (
              <div className="space-y-3">
                <p className="text-white/30 text-xs font-sans truncate">{user.email}</p>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-bold tracking-wide uppercase text-primary hover:text-white transition-colors">
                  <LayoutDashboard size={14} />
                  My Dashboard
                </Link>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-bold tracking-wide uppercase text-white/70 hover:text-white transition-colors"
                  data-testid="link-profile">
                  <User size={14} />
                  My Profile
                </Link>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 text-sm font-bold tracking-wide uppercase text-white/60 hover:text-white">
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-bold tracking-wide uppercase text-white/70">
                  <LogIn size={14} />
                  Login
                </Link>
                <Link href="/access" onClick={() => setMobileMenuOpen(false)}
                  className="block bg-primary text-center text-[#070f1a] px-6 py-4 font-bold tracking-widest uppercase">
                  Request Access
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
