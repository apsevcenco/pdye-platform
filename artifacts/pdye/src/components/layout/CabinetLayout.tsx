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
  ChevronDown,
  TrendingUp,
  PenLine,
  Type,
  MessageSquare,
  Scale,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CurrencySelector } from "@/components/ui/CurrencySelector";
import { useUnreadCounts, type SectionKey } from "@/lib/useUnreadCounts";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  /** Optional unread-badge section key. When set, the sidebar renders a
   *  numeric badge driven by `useUnreadCounts` and bumps "last seen" on
   *  click so the badge clears immediately. */
  section?: SectionKey;
}

// Single unified Admin Menu — combines in-page admin views (which navigate
// to /admin?view=<id>; Admin.tsx reads the query param via useSearch) with
// dedicated admin route pages. Items are tagged `viewLink: true` when they
// use the ?view= query-param mechanism so the active-state logic knows
// which matcher to apply.
type AdminMenuItem = NavItem & { viewLink?: boolean };

const ADMIN_MENU_GROUP: { id: string; label: string; icon: React.ElementType; items: AdminMenuItem[] } = {
  id: "admin",
  label: "Admin Menu",
  icon: ShieldCheck,
  items: [
    { href: "/admin?view=dashboard", label: "Dashboard", icon: LayoutDashboard, viewLink: true },
    { href: "/admin?view=yachts", label: "Yachts", icon: Ship, viewLink: true, section: "adminYachts" },
    { href: "/admin?view=dealroom", label: "Deal Room", icon: TrendingUp, viewLink: true, section: "adminDealRoom" },
    { href: "/admin?view=leads", label: "Leads", icon: Inbox, viewLink: true, section: "adminLeads" },
    { href: "/admin?view=investors", label: "Private Buyers", icon: Users, viewLink: true, section: "adminPrivateBuyers" },
    { href: "/admin?view=brokers", label: "Brokers", icon: Briefcase, viewLink: true, section: "adminBrokers" },
    { href: "/admin?view=owners", label: "Boat Owners", icon: Anchor, viewLink: true, section: "adminOwners" },
    { href: "/admin?view=documents", label: "Documents", icon: FileText, viewLink: true, section: "adminDocuments" },
    { href: "/admin?view=messages", label: "Messages", icon: MessageSquare, viewLink: true, section: "adminMessages" },
    { href: "/admin?view=content", label: "Page Content", icon: PenLine, viewLink: true },
    { href: "/admin?view=fonts", label: "Fonts", icon: Type, viewLink: true },
    { href: "/admin-users", label: "Users", icon: Users, section: "adminUsers" },
    { href: "/admin-requests", label: "Access Requests", icon: Inbox, section: "adminAccessRequests" },
    { href: "/admin-platform-nda", label: "Platform CNCA", icon: ShieldCheck, section: "adminPlatformNda" },
    { href: "/admin-deal-nda", label: "Deal NDA", icon: FileText, section: "adminDealNda" },
    { href: "/admin-deal-commission", label: "Commission", icon: Scale, section: "adminCommission" },
    { href: "/admin-legal", label: "Legal Pages", icon: FileText },
  ],
};

function getNavItems(role: string | null): NavItem[] {
  if (role === "owner" || role === "broker") {
    return [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/yachts", label: "Yacht Catalog", icon: Ship },
      { href: "/add-yacht", label: "Add Yacht", icon: Plus },
      { href: "/dealroom", label: "Deal Rooms", icon: Briefcase, section: "dealroom" },
      { href: "/profile", label: "Profile", icon: User },
    ];
  }
  return [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/yachts", label: "Yacht Catalog", icon: Ship },
    { href: "/dealroom", label: "Deal Rooms", icon: Briefcase, section: "dealroom" },
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

// Active-state for items inside the Dashboard accordion: their href looks like
// `/admin?view=xxx` so we match on pathname AND the view query param.
function isActiveAdminView(currentPath: string, href: string): boolean {
  if (!currentPath.startsWith("/admin")) return false;
  if (!currentPath.startsWith("/admin?") && currentPath !== "/admin") return false;
  const [path, query = ""] = href.split("?");
  if (!currentPath.startsWith(path)) return false;
  const targetView = new URLSearchParams(query).get("view");
  if (!targetView) return false;
  const currentView =
    new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    ).get("view") || "dashboard";
  return currentView === targetView;
}

export function CabinetLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { userProfile, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const isAdmin = userProfile?.role === "admin";
  const items = useMemo(() => getNavItems(userProfile?.role ?? null), [userProfile?.role]);
  const { counts, markSeen } = useUnreadCounts(userProfile?.role ?? null, user?.id ?? null);

  // Sum of all admin-section badges — shown on the collapsed Admin Menu
  // accordion header so admins notice activity without expanding the menu.
  const adminMenuBadgeTotal = useMemo(() => {
    if (!isAdmin) return 0;
    let sum = 0;
    for (const item of ADMIN_MENU_GROUP.items) {
      if (item.section) sum += counts[item.section] || 0;
    }
    return sum;
  }, [isAdmin, counts]);
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

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function renderBadge(n: number) {
    if (!n || n <= 0) return null;
    return (
      <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-primary text-background text-[10px] font-bold leading-none">
        {n > 99 ? "99+" : n}
      </span>
    );
  }

  function renderNavLink(item: NavItem, active: boolean) {
    const Icon = item.icon;
    const badge = item.section ? counts[item.section] || 0 : 0;
    // Defensive: only allow same-origin/relative paths in nav hrefs.
    // Blocks `javascript:` / `data:` URIs and protocol-relative `//evil.com`
    // even if config is ever populated from user-controlled data.
    const safeHref =
      item.href.startsWith("/") && !item.href.startsWith("//")
        ? item.href
        : "/";
    return (
      <Link
        key={safeHref}
        href={safeHref}
        onClick={() => {
          setMobileOpen(false);
          if (item.section) markSeen(item.section);
        }}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-sans transition-all border-l-2 ${
          active
            ? "bg-primary/10 text-primary border-primary"
            : "text-white/55 hover:text-white hover:bg-white/5 border-transparent"
        }`}
      >
        <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
        <span className={`tracking-wide ${active ? "font-semibold" : ""}`}>{item.label}</span>
        {renderBadge(badge)}
      </Link>
    );
  }

  function renderAdminMenu() {
    const group = ADMIN_MENU_GROUP;
    const open = !!openGroups[group.id];
    const Icon = group.icon;
    return (
      <div key={group.id} className="space-y-1">
        <button
          type="button"
          onClick={() => toggleGroup(group.id)}
          aria-expanded={open}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-sans text-white/70 hover:text-white hover:bg-white/5 transition-all"
        >
          <Icon size={16} strokeWidth={1.8} />
          <span className="tracking-wide flex-1 text-left">{group.label}</span>
          {!open && renderBadge(adminMenuBadgeTotal)}
          <ChevronDown
            size={14}
            strokeWidth={2}
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="ml-4 pl-2 border-l border-white/8 space-y-0.5">
            {group.items.map((item) => {
              const active = item.viewLink
                ? isActiveAdminView(location, item.href)
                : isActiveRoute(location, item.href);
              return renderNavLink(item, active);
            })}
          </div>
        )}
      </div>
    );
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
        {isAdmin ? (
          <>
            {renderAdminMenu()}
            {renderNavLink(
              { href: "/profile", label: "Profile", icon: User },
              isActiveRoute(location, "/profile")
            )}
          </>
        ) : (
          items.map((item) => renderNavLink(item, isActiveRoute(location, item.href)))
        )}
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
      <aside className="hidden lg:flex flex-col w-64 bg-[#0a1628] border-r border-white/8 fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex flex-col w-64 bg-[#0a1628] border-r border-white/8">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="sticky top-0 z-20 h-14 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/8 flex items-center justify-between px-4 sm:px-6">
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
