import { ReactNode, useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  Anchor,
  LayoutDashboard,
  Ship,
  Briefcase,
  User,
  LogOut,
  Plus,
  Menu,
  Globe,
  Users,
  Inbox,
  ShieldCheck,
  FileText,
  Percent,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CurrencySelector } from "@/components/ui/CurrencySelector";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

function getNavItems(role: string | null): NavItem[] {
  if (role === "admin") {
    return [
      { href: "/admin", label: "Admin Panel", icon: LayoutDashboard },
      { href: "/admin-users", label: "Users", icon: Users },
      { href: "/admin-requests", label: "Access Requests", icon: Inbox },
      { href: "/yachts", label: "Yachts", icon: Ship },
      { href: "/dealroom", label: "Deal Rooms", icon: Briefcase },
      { href: "/admin-platform-nda", label: "Platform NDA", icon: ShieldCheck },
      { href: "/admin-deal-nda", label: "Deal NDA", icon: FileText },
      { href: "/admin-deal-commission", label: "Commission", icon: Percent },
      { href: "/profile", label: "Profile", icon: User },
    ];
  }
  if (role === "owner" || role === "broker") {
    return [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/yachts", label: "Yacht Catalog", icon: Ship },
      { href: "/add-yacht", label: "Add Yacht", icon: Plus },
      { href: "/dealroom", label: "Deal Rooms", icon: Briefcase },
      { href: "/profile", label: "Profile", icon: User },
    ];
  }
  return [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/yachts", label: "Yacht Catalog", icon: Ship },
    { href: "/dealroom", label: "Deal Rooms", icon: Briefcase },
    { href: "/profile", label: "Profile", icon: User },
  ];
}

// Maps deep-link route prefixes that should highlight a sidebar item whose
// href doesn't share the same URL prefix (e.g. nested admin detail pages).
const ROUTE_ALIASES: Record<string, string[]> = {
  "/admin-users": ["/admin/users/"],
  "/admin": ["/admin/yachts/"],
};

function isActiveRoute(current: string, href: string): boolean {
  if (current === href) return true;
  const aliases = ROUTE_ALIASES[href];
  if (aliases && aliases.some((p) => current.startsWith(p))) return true;
  if (href === "/dashboard" || href === "/admin" || href === "/profile" || href === "/add-yacht") {
    return false;
  }
  return current.startsWith(href + "/");
}

export function CabinetLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { userProfile, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = userProfile?.role === "admin";
  const items = useMemo(() => getNavItems(userProfile?.role ?? null), [userProfile?.role]);
  const displayName = userProfile?.email || user?.email || "Account";
  // Display label for the role badge in the header. Single source of truth so
  // we never accidentally surface raw role keys (e.g. "investor", which we
  // retired in favour of "Private Buyer") to end users. Falls back to a
  // capitalised version of the role if it isn't in the map.
  const ROLE_LABELS: Record<string, string> = {
    investor: "Private Buyer",
    buyer:    "Private Buyer",
    broker:   "Broker",
    owner:    "Owner",
    admin:    "Admin",
  };
  const roleLabel = userProfile?.role
    ? (ROLE_LABELS[userProfile.role] ?? (userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)))
    : "";

  async function handleLogout() {
    setMobileOpen(false);
    await logout();
  }

  const sidebarContent = (
    <>
      <Link
        href={isAdmin ? "/admin" : "/dashboard"}
        onClick={() => setMobileOpen(false)}
        className="px-6 py-5 flex items-center gap-2.5 border-b border-white/8 hover:bg-white/[0.02] transition"
      >
        <Anchor size={22} className="text-primary" strokeWidth={1.8} />
        <span className="font-display text-xl tracking-[0.22em] text-white">PDYE</span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActiveRoute(location, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-sans transition-all border-l-2 ${
                active
                  ? "bg-primary/10 text-primary border-primary"
                  : "text-white/55 hover:text-white hover:bg-white/5 border-transparent"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              <span className={`tracking-wide ${active ? "font-semibold" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-white/8 space-y-1">
        {isAdmin && (
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-[12px] font-sans text-white/45 hover:text-white hover:bg-white/5 transition"
          >
            <Globe size={14} strokeWidth={1.8} />
            <span className="tracking-wide">View public site</span>
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[12px] font-sans text-white/45 hover:text-red-400 hover:bg-white/5 transition"
        >
          <LogOut size={14} strokeWidth={1.8} />
          <span className="tracking-wide">Log out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background text-white selection:bg-primary/30 selection:text-white overflow-x-hidden">
      <aside className="hidden lg:flex flex-col w-64 bg-[#070f1a] border-r border-white/8 fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex flex-col w-64 bg-[#070f1a] border-r border-white/8">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="sticky top-0 z-20 h-14 bg-[#070f1a]/95 backdrop-blur-md border-b border-white/8 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-white/60 hover:text-white p-2 -ml-2"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <Anchor size={18} className="text-primary" strokeWidth={1.8} />
              <span className="font-display text-base tracking-[0.2em] text-white">PDYE</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <CurrencySelector />
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-[12px] font-sans text-white/70 tracking-wide truncate max-w-[220px]">
                {displayName}
              </span>
              {roleLabel && (
                <span className="text-[10px] font-sans uppercase tracking-[0.18em] text-primary/70">
                  {roleLabel}
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col w-full">{children}</main>
      </div>
    </div>
  );
}
