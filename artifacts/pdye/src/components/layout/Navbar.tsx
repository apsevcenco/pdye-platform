import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Anchor } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const isHome = location === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Yachts", href: "/yachts" },
    { name: "Private Deals", href: "/private" },
    { name: "Brokers", href: "/brokers" },
    { name: "Deal Room", href: "/dealroom" },
  ];

  const navBackground = (isScrolled || !isHome) ? "bg-background/95 backdrop-blur-md border-b border-white/5" : "bg-transparent";

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${navBackground}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-24 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Anchor size={22} className="text-primary group-hover:text-white transition-colors duration-300 flex-shrink-0" strokeWidth={2} />
          <span className="font-display font-normal text-3xl tracking-widest text-white group-hover:text-primary transition-colors duration-300">
            PDYE<span className="text-primary">.</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`font-sans font-medium text-sm tracking-wide uppercase transition-all duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-[1px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full ${
                location === link.href ? "text-primary after:w-full" : "text-white/80 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="h-6 w-[1px] bg-white/20 mx-2"></div>
          <Link
            href="/login"
            className="text-white/80 hover:text-white font-medium text-sm tracking-wide uppercase transition-colors"
          >
            Login
          </Link>
          <Link
            href="/access"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 text-sm font-bold tracking-wide uppercase transition-all duration-300 hover:shadow-[0_0_15px_rgba(200,164,107,0.3)]"
          >
            Request Access
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-24 left-0 w-full bg-background border-b border-white/10 md:hidden flex flex-col p-6 gap-6 shadow-2xl">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-lg font-medium tracking-wide uppercase ${
                location === link.href ? "text-primary" : "text-white/80"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="h-[1px] w-full bg-white/10 my-2"></div>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="text-lg font-medium tracking-wide uppercase text-white/80"
          >
            Login
          </Link>
          <Link
            href="/access"
            onClick={() => setMobileMenuOpen(false)}
            className="bg-primary text-center text-primary-foreground px-6 py-4 font-bold tracking-wide uppercase mt-4"
          >
            Request Access
          </Link>
        </div>
      )}
    </header>
  );
}
