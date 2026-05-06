import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Anchor, LogIn, LogOut, LayoutDashboard, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { name: "Yachts", href: "/yachts" },
  { name: "Boat Owners", href: "/boat-owners" },
  { name: "Brokers", href: "/brokers" },
  { name: "Private Buyers", href: "/private-buyers" },
  { name: "Yacht Valuation", href: "/valuation" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, userProfile, logout } = useAuth();
  const isAdmin = userProfile?.role === "admin";

  const isHome = location === "/";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navBackground = (isScrolled || !isHome)
    ? "bg-[#0a1628]/97 backdrop-blur-md border-b border-white/6 shadow-[0_1px_0_rgba(255,255,255,0.04)]"
    : "bg-transparent";

  async function handleLogout() {
    await logout();
    setMobileMenuOpen(false);
  }

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-400 ${navBackground}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 h-[72px] flex items-center justify-between gap-4 relative">

        {/* Logo — unchanged */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="relative">
            <Anchor size={24} className="text-primary group-hover:text-white transition-colors duration-300" strokeWidth={1.8} />
          </div>
          <span className="font-display font-normal text-[26px] tracking-[0.22em] text-white group-hover:text-primary transition-colors duration-300">
            PDYE
          </span>
        </Link>

        {/* Desktop Nav — centered, single row */}
        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
          {NAV_LINKS.map((l) => {
            const active = location === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`group relative font-sans font-semibold text-[11px] tracking-[0.16em] uppercase transition-colors duration-300 py-1 whitespace-nowrap ${
                  active ? "text-primary" : "text-white/60 hover:text-white"
                }`}
              >
                {l.name}
                <span className={`absolute -bottom-1.5 left-0 h-[1px] bg-primary transition-all duration-300 ${active ? "w-full" : "w-0 group-hover:w-full"}`} />
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="hidden lg:flex items-center gap-5 flex-shrink-0">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase transition-colors px-3 py-1.5 border ${location === "/dashboard" ? "border-primary/50 text-primary bg-primary/8" : "border-white/8 bg-white/3 text-white/50 hover:text-primary hover:border-primary/30"}`}
                >
                  <LayoutDashboard size={11} />
                  Dashboard
                </Link>
              )}
              <Link
                href="/profile"
                title="My Profile"
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
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-white/60 hover:text-primary font-semibold text-[11px] tracking-[0.16em] uppercase transition-colors"
            >
              <LogIn size={13} strokeWidth={1.8} />
              Login
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-white/80 hover:text-white p-1.5 transition-colors ml-auto"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-[72px] left-0 w-full bg-[#0a1628] border-b border-white/10 lg:hidden shadow-2xl">
          <div className="flex flex-col p-6 gap-0">
            <div className="space-y-0 divide-y divide-white/5 mb-4">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3.5 text-sm font-semibold tracking-wide uppercase ${location === l.href ? "text-primary" : "text-white/70"}`}
                >
                  {l.name}
                </Link>
              ))}
            </div>

            <div className="h-[1px] w-full bg-white/8 mb-4" />

            {user ? (
              <div className="space-y-3">
                <p className="text-white/30 text-xs font-sans truncate">{user.email}</p>
                {isAdmin && (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-bold tracking-wide uppercase text-primary hover:text-white transition-colors">
                    <LayoutDashboard size={14} />
                    My Dashboard
                  </Link>
                )}
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
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm font-bold tracking-wide uppercase text-white/70 hover:text-white">
                <LogIn size={14} />
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
