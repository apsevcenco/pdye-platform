import { User, Mail, Phone, Building, MapPin, Calendar, FileText, Anchor, TrendingUp } from "lucide-react";
import { PdyeNavbar, PageHeader, GoldButton, StatusPill } from "./_shared";
import "./_group.css";

export function ProfileRedesign() {
  return (
    <div className="min-h-screen bg-[#070f1a] text-white font-sans">
      <PdyeNavbar />
      <PageHeader eyebrow="Member Account" title="Personal Cabinet" breadcrumbs={["Home", "Profile"]} />

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Identity card */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="border border-white/8 bg-white/[0.02] p-7">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 border border-[#c8a46b]/40 bg-[#c8a46b]/10 flex items-center justify-center text-[#c8a46b] text-xl font-bold font-['Gilroy']">
                AS
              </div>
              <div>
                <div className="text-[10px] tracking-[0.18em] uppercase text-white/40 mb-1">Verified Broker</div>
                <h2 className="text-lg font-bold font-['Gilroy'] tracking-tight">Alexander Sevcenco</h2>
              </div>
            </div>
            <div className="space-y-3 text-[13px]">
              <Row icon={Mail} label="alex@pdye.com" />
              <Row icon={Phone} label="+377 6 12 34 56 78" />
              <Row icon={Building} label="Apex Yacht Brokerage" />
              <Row icon={MapPin} label="Monaco · Mediterranean" />
              <Row icon={Calendar} label="Member since Jan 2024" />
            </div>
            <div className="mt-6 pt-5 border-t border-white/5 flex items-center gap-3">
              <StatusPill tone="green">KYC Verified</StatusPill>
              <StatusPill>Pro</StatusPill>
            </div>
            <div className="mt-6">
              <GoldButton>Edit Profile</GoldButton>
            </div>
          </div>

          <div className="border border-white/8 bg-white/[0.02] p-6">
            <div className="text-[#c8a46b] font-bold tracking-[0.22em] text-[11px] uppercase mb-4">Activity</div>
            <div className="space-y-4">
              <Stat label="Active Listings" value="07" />
              <Stat label="Open Deals" value="03" />
              <Stat label="Closed YTD" value="€ 14.2 M" />
            </div>
          </div>
        </aside>

        {/* Right: panels */}
        <div className="lg:col-span-2 space-y-8">
          <Panel eyebrow="My Listings" title="Yachts under management">
            <div className="divide-y divide-white/5">
              {[
                { n: "Lady Adriatic", l: "62m · Benetti · 2019", s: "Active", t: "gold" as const, p: "€ 22.5 M" },
                { n: "Northern Spirit", l: "48m · Heesen · 2021", s: "In Deal Room", t: "green" as const, p: "€ 18.0 M" },
                { n: "Aegean Dream", l: "55m · Sanlorenzo · 2017", s: "Pending Review", t: "muted" as const, p: "€ 14.8 M" },
              ].map((y, i) => (
                <div key={i} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <Anchor size={18} className="text-[#c8a46b]" strokeWidth={1.5} />
                    <div>
                      <div className="font-semibold tracking-tight">{y.n}</div>
                      <div className="text-[12px] text-white/45">{y.l}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-[#c8a46b] font-bold text-[13px]">{y.p}</div>
                    <StatusPill tone={y.t}>{y.s}</StatusPill>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Documents" title="Compliance & Agreements">
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: "Platform NDA", d: "Signed · 12 Jan 2024", t: "green" as const },
                { n: "Brokerage Agreement", d: "Active · 03 Mar 2024", t: "green" as const },
                { n: "Commission Schedule", d: "Updated 18 Apr 2026", t: "gold" as const },
                { n: "KYC Package", d: "Renewed · 02 Feb 2026", t: "green" as const },
              ].map((d, i) => (
                <div key={i} className="border border-white/8 p-5 hover:border-[#c8a46b]/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <FileText size={18} className="text-[#c8a46b]" strokeWidth={1.5} />
                    <StatusPill tone={d.t}>{d.t === "green" ? "OK" : "Update"}</StatusPill>
                  </div>
                  <div className="font-semibold text-[14px] tracking-tight">{d.n}</div>
                  <div className="text-[11px] text-white/40 mt-1">{d.d}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}

function Row({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-3 text-white/60">
      <Icon size={14} className="text-[#c8a46b]/70" strokeWidth={1.5} />
      <span>{label}</span>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-end justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-[11px] tracking-[0.16em] uppercase text-white/40">{label}</span>
      <span className="text-xl font-bold font-['Gilroy'] tracking-tight text-white">{value}</span>
    </div>
  );
}
function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border border-white/8 bg-white/[0.02] p-7">
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
