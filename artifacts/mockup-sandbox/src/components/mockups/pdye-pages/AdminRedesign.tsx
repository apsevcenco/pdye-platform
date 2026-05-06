import { Users, Anchor, FileSignature, TrendingUp, Shield, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { PdyeNavbar, PageHeader, GoldButton, StatusPill } from "./_shared";
import "./_group.css";

export function AdminRedesign() {
  return (
    <div className="min-h-screen bg-[#070f1a] text-white font-sans">
      <PdyeNavbar />
      <PageHeader eyebrow="Admin Console" title="Operations Dashboard" breadcrumbs={["Home", "Admin", "Overview"]} />

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-12 space-y-10">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { i: Users,         l: "Members",         v: "1,284", d: "+42 this week" },
            { i: Anchor,        l: "Live Listings",   v: "187",   d: "12 pending review" },
            { i: FileSignature, l: "Open Deals",      v: "24",    d: "9 in NDA stage" },
            { i: TrendingUp,    l: "GMV — YTD",       v: "€ 412M", d: "+18% vs LY" },
          ].map((k, idx) => {
            const Icon = k.i;
            return (
              <div key={idx} className="border border-white/8 bg-white/[0.02] p-6 hover:border-[#c8a46b]/30 transition-colors">
                <div className="flex items-center justify-between mb-5">
                  <Icon size={18} className="text-[#c8a46b]" strokeWidth={1.5} />
                  <span className="text-[10px] tracking-[0.18em] uppercase text-white/30">Last 30d</span>
                </div>
                <div className="text-3xl font-bold font-['Gilroy'] tracking-tight mb-1">{k.v}</div>
                <div className="text-[11px] tracking-[0.16em] uppercase text-white/40">{k.l}</div>
                <div className="text-[12px] text-emerald-400/80 mt-3">{k.d}</div>
              </div>
            );
          })}
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Panel eyebrow="Pending" title="Access Requests" className="lg:col-span-2">
            <table className="w-full text-[13px]">
              <thead className="border-b border-white/8">
                <tr className="text-[10px] tracking-[0.16em] uppercase text-white/40">
                  <th className="text-left font-semibold py-3">Applicant</th>
                  <th className="text-left font-semibold py-3">Role</th>
                  <th className="text-left font-semibold py-3">Submitted</th>
                  <th className="text-left font-semibold py-3">Status</th>
                  <th className="text-right font-semibold py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { n: "Marina Petrova",   r: "Private Buyer", t: "2h ago",  s: "New",        tone: "gold" as const },
                  { n: "Nikos Demetriou",  r: "Broker",        t: "5h ago",  s: "KYC Pending", tone: "muted" as const },
                  { n: "Lord A. Ashcroft", r: "Owner",         t: "1d ago",  s: "Verified",   tone: "green" as const },
                  { n: "Société CMA",      r: "Institutional", t: "2d ago",  s: "Flagged",    tone: "red" as const },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 font-semibold tracking-tight">{row.n}</td>
                    <td className="py-4 text-white/60">{row.r}</td>
                    <td className="py-4 text-white/40 text-[12px]">{row.t}</td>
                    <td className="py-4"><StatusPill tone={row.tone}>{row.s}</StatusPill></td>
                    <td className="py-4 text-right">
                      <GoldButton kind="ghost">Review →</GoldButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel eyebrow="Live" title="Recent Activity">
            <ul className="space-y-5">
              {[
                { i: CheckCircle2, c: "emerald", t: "Deal #DR-228 closed",     s: "€8.4M · Lady Adriatic" },
                { i: Shield,       c: "gold",    t: "NDA signed — Buyer #BC-1142", s: "Northern Spirit" },
                { i: Anchor,       c: "gold",    t: "New listing submitted",  s: "Aegean Dream — 55m" },
                { i: AlertCircle,  c: "red",     t: "KYC flag raised",        s: "Société CMA" },
                { i: Clock,        c: "muted",   t: "Valuation queued",       s: "5 reports pending" },
              ].map((a, i) => {
                const Icon = a.i;
                const colors: any = {
                  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                  gold:    "text-[#c8a46b] bg-[#c8a46b]/10 border-[#c8a46b]/30",
                  red:     "text-red-400 bg-red-500/10 border-red-500/20",
                  muted:   "text-white/40 bg-white/5 border-white/10",
                };
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`w-8 h-8 border flex items-center justify-center flex-shrink-0 ${colors[a.c]}`}>
                      <Icon size={14} strokeWidth={1.8} />
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold tracking-tight">{a.t}</div>
                      <div className="text-[11px] text-white/40 mt-0.5">{a.s}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </main>
    </div>
  );
}

function Panel({ eyebrow, title, children, className = "" }: { eyebrow: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border border-white/8 bg-white/[0.02] p-7 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[#c8a46b] font-bold tracking-[0.22em] text-[11px] uppercase mb-1.5">{eyebrow}</div>
          <h2 className="text-2xl font-bold font-['Gilroy'] tracking-tight">{title}</h2>
        </div>
        <GoldButton kind="ghost">View All →</GoldButton>
      </div>
      {children}
    </section>
  );
}
