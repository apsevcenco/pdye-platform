import { Lock, FileText, MessageSquare, Download, Check, Anchor, Shield, Users, Clock } from "lucide-react";
import { PdyeNavbar, PageHeader, GoldButton, StatusPill } from "./_shared";
import "./_group.css";

export function DealRoomRedesign() {
  return (
    <div className="min-h-screen bg-[#070f1a] text-white font-sans">
      <PdyeNavbar />
      <PageHeader eyebrow="Confidential · NDA Required" title="Deal Room — DR-228" breadcrumbs={["Home", "Deals", "DR-228"]} />

      {/* Sub header with parties */}
      <section className="border-b border-white/6 bg-[#0a1426]/60">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-6 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border border-[#c8a46b]/40 bg-[#c8a46b]/5 flex items-center justify-center">
              <Anchor size={20} className="text-[#c8a46b]" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.18em] uppercase text-white/40 mb-1">Asset</div>
              <div className="font-bold font-['Gilroy'] tracking-tight text-lg">Lady Adriatic — 62m Benetti</div>
            </div>
          </div>
          <div className="flex items-center gap-8 text-[12px]">
            <Meta label="Asking" value="€ 22.5 M" gold />
            <Meta label="Offer" value="€ 19.8 M" />
            <Meta label="Stage" value="Due Diligence" />
            <Meta label="Counsel" value="Withers LLP" />
          </div>
          <div className="flex items-center gap-3">
            <StatusPill tone="green"><Lock size={10} className="mr-1.5" />NDA Signed</StatusPill>
            <GoldButton>Submit Offer</GoldButton>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Documents */}
        <div className="lg:col-span-2 space-y-8">
          <Panel eyebrow="Diligence Files" title="Documents Vault">
            <div className="divide-y divide-white/5">
              {[
                { n: "Survey Report — Lloyd's 2025", s: "PDF · 14.2 MB", t: "Verified", tone: "green" as const },
                { n: "Vessel Title & Registration",   s: "PDF · 2.1 MB",  t: "Verified", tone: "green" as const },
                { n: "Maintenance Logbook (5y)",      s: "ZIP · 88 MB",   t: "Verified", tone: "green" as const },
                { n: "Class Certificate — RINA",      s: "PDF · 0.9 MB",  t: "Pending",  tone: "gold"  as const },
                { n: "Insurance Schedule 2026",       s: "PDF · 3.4 MB",  t: "New",      tone: "gold"  as const },
              ].map((d, i) => (
                <div key={i} className="flex items-center justify-between py-4 group">
                  <div className="flex items-center gap-4">
                    <FileText size={18} className="text-[#c8a46b]" strokeWidth={1.5} />
                    <div>
                      <div className="font-semibold tracking-tight">{d.n}</div>
                      <div className="text-[11px] text-white/40 mt-0.5">{d.s}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusPill tone={d.tone}>{d.t}</StatusPill>
                    <button className="text-white/40 hover:text-[#c8a46b] transition-colors">
                      <Download size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Negotiation" title="Secure Channel">
            <div className="space-y-5">
              <Message who="Buyer Counsel" when="14:08 · today" body="We accept the latest survey caveats. Proposing escrow at €19.8M against satisfactory sea trial." gold />
              <Message who="Seller Broker" when="11:22 · today" body="Sea trial scheduled 12 May out of Antibes. Captain confirmed availability." />
              <Message who="PDYE Concierge" when="Yesterday" body="Reminder: NDA addendum #2 due for countersignature by Friday." gold={false} />
            </div>
            <div className="mt-6 border border-white/10 p-4 bg-white/[0.02] flex items-center justify-between">
              <span className="text-white/40 text-[13px]">Compose secure message…</span>
              <GoldButton>Send</GoldButton>
            </div>
          </Panel>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Panel eyebrow="Timeline" title="Milestones" compact>
            <ol className="relative ml-2 border-l border-white/10 space-y-5">
              {[
                { l: "NDA Signed",         d: "12 Apr · Done",   ok: true },
                { l: "DD Opened",          d: "18 Apr · Done",   ok: true },
                { l: "Counter-Offer",      d: "02 May · Active", ok: true },
                { l: "Sea Trial",          d: "12 May",          ok: false },
                { l: "Closing & Escrow",   d: "TBD",             ok: false },
              ].map((m, i) => (
                <li key={i} className="pl-5 relative">
                  <span className={`absolute -left-[7px] top-1 w-3 h-3 border ${m.ok ? "bg-[#c8a46b] border-[#c8a46b]" : "bg-[#070f1a] border-white/20"}`}>
                    {m.ok && <Check size={10} className="text-[#070f1a]" strokeWidth={3} />}
                  </span>
                  <div className="font-semibold text-[13px] tracking-tight">{m.l}</div>
                  <div className="text-[11px] text-white/40">{m.d}</div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel eyebrow="Parties" title="Participants" compact>
            <ul className="space-y-3">
              {[
                { i: Users,  n: "Buyer (Anonymous)",  r: "Private Buyer" },
                { i: Anchor, n: "Apex Yacht Brokerage", r: "Seller Broker" },
                { i: Shield, n: "Withers LLP",          r: "Maritime Counsel" },
                { i: Clock,  n: "PDYE Concierge",       r: "Platform" },
              ].map((p, i) => {
                const Icon = p.i;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-8 h-8 border border-white/10 flex items-center justify-center text-[#c8a46b]">
                      <Icon size={14} strokeWidth={1.5} />
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold tracking-tight">{p.n}</div>
                      <div className="text-[11px] text-white/40">{p.r}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </aside>
      </main>
    </div>
  );
}

function Meta({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] uppercase text-white/40 mb-1">{label}</div>
      <div className={`font-bold tracking-tight ${gold ? "text-[#c8a46b]" : "text-white"}`}>{value}</div>
    </div>
  );
}
function Message({ who, when, body, gold }: { who: string; when: string; body: string; gold?: boolean }) {
  return (
    <div className={`border ${gold ? "border-[#c8a46b]/30 bg-[#c8a46b]/[0.04]" : "border-white/8 bg-white/[0.02]"} p-5`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare size={12} className="text-[#c8a46b]" strokeWidth={1.5} />
          <span className="text-[12px] font-bold tracking-wide uppercase">{who}</span>
        </div>
        <span className="text-[11px] text-white/40">{when}</span>
      </div>
      <p className="text-[13px] text-white/70 leading-relaxed">{body}</p>
    </div>
  );
}
function Panel({ eyebrow, title, children, compact = false }: { eyebrow: string; title: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <section className={`border border-white/8 bg-white/[0.02] ${compact ? "p-6" : "p-7"}`}>
      <div className="mb-5">
        <div className="text-[#c8a46b] font-bold tracking-[0.22em] text-[11px] uppercase mb-1.5">{eyebrow}</div>
        <h2 className={`${compact ? "text-lg" : "text-2xl"} font-bold font-['Gilroy'] tracking-tight`}>{title}</h2>
      </div>
      {children}
    </section>
  );
}
