import { CabinetLayout } from "@/components/layout/CabinetLayout";
import { Layout } from "@/components/layout/Layout";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowUpRight, BarChart3, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

const PageLayout: any = (CabinetLayout as any) || (Layout as any);

const API_BASE: string = (import.meta as any).env?.VITE_API_URL || "/api";

type Bucket = { week: string; c: number };

type Analytics = {
  generated_at: string;
  kpis: {
    users: { total: number; last7: number; last30: number; buyers: number; sellers: number; brokers: number; owners: number; admins: number };
    yachts: { total: number; approved: number; pending: number; rejected: number };
    deals: { total: number; active: number; commission_signed: number };
    leads: { total: number; last30: number; pending_access_requests: number; total_access_requests: number };
    signatures: { platform_nda: number; deal_nda: number };
    engagement: { messages_last30: number };
  };
  weekly: {
    signups: Bucket[];
    yachts: Bucket[];
    deal_rooms: Bucket[];
    commission: Bucket[];
    leads: Bucket[];
  };
  funnel: {
    users: number;
    access_requests: number;
    deal_rooms: number;
    platform_nda: number;
    deal_nda: number;
    commission: number;
  };
  top: {
    yachts_by_requests: { id: string; name: string; c: number }[];
    yachts_by_rooms: { id: string; name: string; c: number }[];
  };
  recent_deals: {
    id: string;
    yacht_name: string | null;
    status: string;
    created_at: string;
    commission_fully_signed_at: string | null;
  }[];
};

function Kpi({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/8 p-5">
      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">{label}</p>
      <p className="font-display text-3xl text-white tabular-nums">{value}</p>
      {sub && <p className="text-white/30 text-xs font-sans mt-1">{sub}</p>}
    </div>
  );
}

function MiniBars({ data, color = "#d4af37" }: { data: Bucket[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.c));
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d) => {
        const h = (d.c / max) * 100;
        return (
          <div key={d.week} className="flex-1 flex flex-col items-center justify-end group" title={`${d.week}: ${d.c}`}>
            <div className="w-full transition-all" style={{ height: `${Math.max(2, h)}%`, backgroundColor: color, opacity: d.c === 0 ? 0.15 : 0.85 }} />
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/8 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function Funnel({ funnel }: { funnel: Analytics["funnel"] }) {
  const steps: { label: string; value: number }[] = [
    { label: "Registered Users", value: funnel.users },
    { label: "Access Requests", value: funnel.access_requests },
    { label: "Platform NDA Signed", value: funnel.platform_nda },
    { label: "Deal Room Created", value: funnel.deal_rooms },
    { label: "Deal NDA Signed", value: funnel.deal_nda },
    { label: "Commission Signed", value: funnel.commission },
  ];
  const top = Math.max(1, ...steps.map((s) => s.value));
  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const w = (s.value / top) * 100;
        const drop = i > 0 && steps[i - 1].value > 0 ? Math.round((s.value / steps[i - 1].value) * 100) : null;
        return (
          <div key={s.label} className="flex items-center gap-3">
            <div className="text-white/50 text-[11px] font-sans w-44 shrink-0">{s.label}</div>
            <div className="flex-1 bg-white/[0.03] border border-white/5 h-7 relative">
              <div className="h-full bg-primary/30 border-r border-primary/60" style={{ width: `${Math.max(2, w)}%` }} />
              <div className="absolute inset-0 flex items-center px-2">
                <span className="text-white text-xs tabular-nums font-bold">{s.value}</span>
                {drop !== null && (
                  <span className="ml-2 text-white/40 text-[10px]">({drop}% of prev)</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalytics() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error("Not signed in");
        const res = await fetch(`${API_BASE}/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as Analytics;
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <PageLayout>
      <section className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-white">Analytics</h1>
            <p className="text-white/40 text-sm font-sans mt-1">Platform health, conversion funnel, and growth signals</p>
          </div>
          <button
            onClick={() => setLocation("/admin")}
            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-white/10 text-white/50 hover:border-white/30 transition-colors"
          >
            ← Back to Admin
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 text-sm">
            Failed to load analytics: {error}
          </div>
        )}

        {data && (
          <div className="space-y-8">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="Total Users" value={data.kpis.users.total} sub={`+${data.kpis.users.last7} last 7d · +${data.kpis.users.last30} last 30d`} />
              <Kpi label="Approved Yachts" value={data.kpis.yachts.approved} sub={`${data.kpis.yachts.pending} pending · ${data.kpis.yachts.rejected} rejected`} />
              <Kpi label="Active Deal Rooms" value={data.kpis.deals.active} sub={`${data.kpis.deals.total} total all-time`} />
              <Kpi label="Commission Signed" value={data.kpis.deals.commission_signed} sub="closed-stage deals" />
              <Kpi label="Buyers / Investors" value={data.kpis.users.buyers} />
              <Kpi label="Brokers" value={data.kpis.users.brokers} />
              <Kpi label="Boat Owners" value={data.kpis.users.owners} />
              <Kpi label="Pending Requests" value={data.kpis.leads.pending_access_requests} sub={`${data.kpis.leads.total_access_requests} total all-time`} />
            </div>

            {/* Conversion Funnel */}
            <Section title="Conversion Funnel">
              <Funnel funnel={data.funnel} />
              <p className="text-white/30 text-[11px] font-sans mt-4">
                Each bar shows volume at that funnel stage. Percentages measure step-to-step conversion (this stage / previous stage).
              </p>
            </Section>

            {/* Web Traffic / Plausible */}
            <Section
              title="Web Traffic (Plausible)"
              right={
                <a
                  href="https://plausible.io/pdyegroup.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                >
                  Open Dashboard <ExternalLink size={11} />
                </a>
              }
            >
              <div className="flex items-start gap-3">
                <BarChart3 className="text-primary/60 shrink-0 mt-1" size={18} />
                <div className="text-white/60 text-sm font-sans space-y-2">
                  <p>
                    Real-time visitor analytics, sources, top pages, conversions, and devices for <span className="text-primary">pdyegroup.com</span> live at the linked Plausible dashboard.
                  </p>
                  <p className="text-white/40 text-[12px]">
                    The lightweight, GDPR-friendly tracker is embedded site-wide — no cookie banners required. If the dashboard returns 404, complete one-time setup at <a className="text-primary underline" href="https://plausible.io/sites" target="_blank" rel="noopener noreferrer">plausible.io/sites</a> by adding <code className="text-white/70">pdyegroup.com</code> as a site.
                  </p>
                </div>
              </div>
            </Section>

            {/* Weekly time-series */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section title="Signups · Last 12 Weeks">
                <MiniBars data={data.weekly.signups} color="#d4af37" />
              </Section>
              <Section title="New Yachts · Last 12 Weeks">
                <MiniBars data={data.weekly.yachts} color="#3b82f6" />
              </Section>
              <Section title="Deal Rooms Created · Last 12 Weeks">
                <MiniBars data={data.weekly.deal_rooms} color="#a855f7" />
              </Section>
              <Section title="Commission Signed · Last 12 Weeks">
                <MiniBars data={data.weekly.commission} color="#22c55e" />
              </Section>
              <Section title="Leads · Last 12 Weeks">
                <MiniBars data={data.weekly.leads} color="#f97316" />
              </Section>
              <Section title="Engagement">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-xs">Messages (last 30 days)</span>
                    <span className="font-display text-2xl text-white tabular-nums">{data.kpis.engagement.messages_last30}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-xs">Platform NDA signatures (all-time)</span>
                    <span className="font-display text-2xl text-white tabular-nums">{data.kpis.signatures.platform_nda}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-xs">Deal NDA signatures (all-time)</span>
                    <span className="font-display text-2xl text-white tabular-nums">{data.kpis.signatures.deal_nda}</span>
                  </div>
                </div>
              </Section>
            </div>

            {/* Top yachts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section title="Top 5 Yachts · By Access Requests">
                {data.top.yachts_by_requests.length === 0 ? (
                  <p className="text-white/30 text-xs font-sans">No data yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.top.yachts_by_requests.map((y) => (
                      <li key={y.id} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                        <a href={`/admin/yachts/${y.id}`} className="text-white/80 text-sm hover:text-primary truncate flex items-center gap-1">
                          {y.name || "Untitled"} <ArrowUpRight size={12} className="text-white/30" />
                        </a>
                        <span className="text-primary font-bold text-sm tabular-nums">{y.c}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
              <Section title="Top 5 Yachts · By Deal Rooms">
                {data.top.yachts_by_rooms.length === 0 ? (
                  <p className="text-white/30 text-xs font-sans">No data yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.top.yachts_by_rooms.map((y) => (
                      <li key={y.id} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                        <a href={`/admin/yachts/${y.id}`} className="text-white/80 text-sm hover:text-primary truncate flex items-center gap-1">
                          {y.name || "Untitled"} <ArrowUpRight size={12} className="text-white/30" />
                        </a>
                        <span className="text-primary font-bold text-sm tabular-nums">{y.c}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>

            {/* Recent deals */}
            <Section title="10 Most Recent Deals">
              {data.recent_deals.length === 0 ? (
                <p className="text-white/30 text-xs font-sans">No deals yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/30 text-[10px] uppercase tracking-widest border-b border-white/10">
                      <th className="text-left py-2 font-bold">Yacht</th>
                      <th className="text-left py-2 font-bold">Status</th>
                      <th className="text-left py-2 font-bold">Created</th>
                      <th className="text-left py-2 font-bold">Commission Signed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_deals.map((d) => (
                      <tr key={d.id} className="border-b border-white/5 last:border-0">
                        <td className="py-2 text-white/80">{d.yacht_name || "—"}</td>
                        <td className="py-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
                            d.status === "active" ? "text-green-400 border-green-500/30" :
                            d.status === "closed" ? "text-blue-400 border-blue-500/30" :
                            d.status === "cancelled" ? "text-red-400 border-red-500/30" :
                            "text-yellow-400 border-yellow-500/30"
                          }`}>{d.status}</span>
                        </td>
                        <td className="py-2 text-white/50 tabular-nums">{new Date(d.created_at).toLocaleDateString("en-GB")}</td>
                        <td className="py-2 text-white/50 tabular-nums">
                          {d.commission_fully_signed_at ? new Date(d.commission_fully_signed_at).toLocaleDateString("en-GB") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            <p className="text-white/20 text-[10px] text-center font-sans">
              Snapshot generated {new Date(data.generated_at).toLocaleString("en-GB")}
            </p>
          </div>
        )}
      </section>
    </PageLayout>
  );
}
