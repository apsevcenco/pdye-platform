import { Search, Filter, MapPin, Anchor, Calendar, Ruler } from "lucide-react";
import { PdyeNavbar, PageHeader, GoldButton, StatusPill } from "./_shared";
import "./_group.css";

const YACHTS = [
  { n: "Lady Adriatic",  b: "Benetti",     y: 2019, l: "62 m", loc: "Monaco",   p: "€ 22.5 M", t: "Off-Market", tone: "gold" as const,  img: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=80" },
  { n: "Northern Spirit",b: "Heesen",      y: 2021, l: "48 m", loc: "Antibes",  p: "€ 18.0 M", t: "In Deal Room", tone: "green" as const, img: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=900&q=80" },
  { n: "Aegean Dream",   b: "Sanlorenzo",  y: 2017, l: "55 m", loc: "Athens",   p: "€ 14.8 M", t: "New",         tone: "gold" as const,  img: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=900&q=80" },
  { n: "Côte d'Azur",    b: "Feadship",    y: 2015, l: "71 m", loc: "Cannes",   p: "€ 39.0 M", t: "Distressed",  tone: "red" as const,   img: "https://images.unsplash.com/photo-1599582909646-e8e22b9a4d3e?w=900&q=80" },
  { n: "Stella Maris",   b: "Lürssen",     y: 2020, l: "85 m", loc: "Genoa",    p: "€ 64.0 M", t: "Off-Market",  tone: "gold" as const,  img: "https://images.unsplash.com/photo-1569263835889-ec4d3d1f9a44?w=900&q=80" },
  { n: "Blue Horizon",   b: "Amels",       y: 2018, l: "57 m", loc: "Palma",    p: "€ 19.4 M", t: "Reserved",    tone: "muted" as const, img: "https://images.unsplash.com/photo-1505839673365-e3971f8d9184?w=900&q=80" },
];

export function YachtsRedesign() {
  return (
    <div className="min-h-screen bg-[#070f1a] text-white font-sans">
      <PdyeNavbar active="Yachts" />
      <PageHeader eyebrow="Curated Inventory" title="Yacht Database" breadcrumbs={["Home", "Yachts"]} />

      {/* Filters */}
      <section className="border-b border-white/6 bg-[#0a1426]/40">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[260px] flex items-center gap-3 border border-white/10 bg-white/[0.02] px-4 py-2.5">
            <Search size={15} className="text-white/40" strokeWidth={1.8} />
            <input
              placeholder="Search by name, builder, or hull number…"
              className="bg-transparent outline-none w-full text-[13px] placeholder:text-white/30"
            />
          </div>
          {[
            { l: "Length", v: "Any" },
            { l: "Builder", v: "All" },
            { l: "Year", v: "2010–2026" },
            { l: "Location", v: "Mediterranean" },
            { l: "Status", v: "Off-Market" },
          ].map((f, i) => (
            <button key={i} className="border border-white/10 bg-white/[0.02] hover:border-[#c8a46b]/40 px-4 py-2.5 text-[12px] flex items-center gap-3 transition-colors">
              <span className="text-[10px] tracking-[0.18em] uppercase text-white/40">{f.l}</span>
              <span className="text-white/80">{f.v}</span>
            </button>
          ))}
          <button className="border border-[#c8a46b]/40 text-[#c8a46b] hover:text-white hover:border-white px-4 py-2.5 flex items-center gap-2 transition-colors">
            <Filter size={13} strokeWidth={1.8} />
            <span className="text-[11px] tracking-[0.16em] uppercase font-bold">Filters</span>
          </button>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[#c8a46b] font-bold tracking-[0.22em] text-[11px] uppercase">187 Vessels</div>
            <div className="text-white/40 text-[13px] mt-1">12 newly listed · Updated 8 min ago</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-[0.18em] uppercase text-white/40">Sort</span>
            <button className="border border-white/10 px-3 py-2 text-[12px] text-white/70">Recently Added</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {YACHTS.map((y, i) => (
            <article key={i} className="border border-white/8 bg-white/[0.02] hover:border-[#c8a46b]/30 transition-all duration-300 group overflow-hidden">
              <div className="relative h-44 overflow-hidden">
                <img src={y.img} alt={y.n} className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070f1a]/90 via-[#070f1a]/30 to-transparent" />
                <div className="absolute top-3 right-3"><StatusPill tone={y.tone}>{y.t}</StatusPill></div>
                <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white/70 text-[11px]">
                  <MapPin size={11} className="text-[#c8a46b]" strokeWidth={1.8} />
                  {y.loc}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-[10px] tracking-[0.18em] uppercase text-white/40 mb-1">{y.b}</div>
                    <h3 className="text-lg font-bold font-['Gilroy'] tracking-tight">{y.n}</h3>
                  </div>
                  <Anchor size={16} className="text-[#c8a46b] mt-1" strokeWidth={1.5} />
                </div>
                <div className="flex items-center gap-4 text-[11px] text-white/50 my-4">
                  <span className="flex items-center gap-1.5"><Ruler size={11} strokeWidth={1.8} /> {y.l}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={11} strokeWidth={1.8} /> {y.y}</span>
                </div>
                <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                  <span className="text-[#c8a46b] font-bold tracking-tight text-[15px]">{y.p}</span>
                  <span className="text-[10px] tracking-[0.18em] uppercase text-white/50 hover:text-[#c8a46b] transition-colors cursor-pointer">View →</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="flex justify-center pt-6">
          <GoldButton>Load More Yachts</GoldButton>
        </div>
      </main>
    </div>
  );
}
