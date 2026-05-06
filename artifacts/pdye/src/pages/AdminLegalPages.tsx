import { useEffect, useState } from "react";
import { FileText, Loader2, Save, Eye } from "lucide-react";
import { CabinetLayout } from "@/components/layout/CabinetLayout";
import { legalPagesApi, type LegalKind, type LegalPage } from "@/lib/legalPagesApi";

const TABS: { kind: LegalKind; label: string; publicPath: string }[] = [
  { kind: "privacy", label: "Privacy Policy", publicPath: "/#/privacy-policy" },
  { kind: "legal", label: "Legal Notice", publicPath: "/#/legal-notice" },
];

export default function AdminLegalPages() {
  const [activeKind, setActiveKind] = useState<LegalKind>("privacy");
  const [pages, setPages] = useState<Record<LegalKind, LegalPage | null>>({ privacy: null, legal: null });
  const [titleDraft, setTitleDraft] = useState("");
  const [contentDraft, setContentDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function loadAll() {
    setLoading(true);
    setLoadError(null);
    try {
      const [privacy, legal] = await Promise.all([
        legalPagesApi.get("privacy"),
        legalPagesApi.get("legal"),
      ]);
      setPages({ privacy, legal });
      const current = activeKind === "privacy" ? privacy : legal;
      setTitleDraft(current.title);
      setContentDraft(current.content);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  function switchTab(kind: LegalKind) {
    setActiveKind(kind);
    setSaveMessage(null);
    const p = pages[kind];
    if (p) {
      setTitleDraft(p.title);
      setContentDraft(p.content);
    }
  }

  async function handleSave() {
    if (!titleDraft.trim()) {
      setSaveMessage({ type: "err", text: "Title is required" });
      return;
    }
    if (!contentDraft.trim()) {
      setSaveMessage({ type: "err", text: "Content is required" });
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      const updated = await legalPagesApi.adminSave(activeKind, titleDraft.trim(), contentDraft);
      setPages((prev) => ({ ...prev, [activeKind]: updated }));
      setSaveMessage({ type: "ok", text: "Saved." });
    } catch (e: any) {
      setSaveMessage({ type: "err", text: e?.message || "Failed to save" });
    } finally {
      setSaving(false);
    }
  }

  const currentTab = TABS.find((t) => t.kind === activeKind)!;

  return (
    <CabinetLayout>
      <div className="min-h-screen bg-background text-white">
        <div className="border-b border-white/5 bg-secondary">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex items-center gap-3">
            <FileText size={18} className="text-primary" />
            <div>
              <p className="text-white/40 text-[10px] font-sans uppercase tracking-widest">Admin</p>
              <h1 className="font-display text-2xl text-white">Legal Pages</h1>
            </div>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
          {loading && (
            <div className="flex flex-col items-center py-20 text-white/40">
              <Loader2 size={28} className="animate-spin mb-3" />
              <span className="text-xs uppercase tracking-widest">Loading…</span>
            </div>
          )}

          {loadError && !loading && (
            <div className="border border-red-500/30 bg-red-500/5 p-6 text-red-300 text-sm">{loadError}</div>
          )}

          {!loading && !loadError && (
            <>
              <div className="flex flex-wrap gap-2 border-b border-white/8">
                {TABS.map((t) => (
                  <button
                    key={t.kind}
                    onClick={() => switchTab(t.kind)}
                    className={`px-5 py-3 text-xs uppercase tracking-widest font-sans transition-colors ${
                      activeKind === t.kind
                        ? "text-[#c8a46b] border-b-2 border-[#c8a46b] -mb-px"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <section className="bg-white/[0.02] border border-white/8 p-6 md:p-8 space-y-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="font-display text-xl text-white">{currentTab.label}</h2>
                    {pages[activeKind]?.updated_at && (
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
                        Last updated {new Date(pages[activeKind]!.updated_at!).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <a
                    href={currentTab.publicPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[#c8a46b]/40 text-[#c8a46b] text-[10px] uppercase tracking-widest hover:bg-[#c8a46b]/10 transition-colors"
                  >
                    <Eye size={12} />
                    Preview public page
                  </a>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Title</label>
                  <input
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    className="w-full bg-transparent border border-white/15 px-3 py-2 text-white placeholder-white/25 focus:outline-none focus:border-[#c8a46b]/60"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">
                    Content (HTML allowed)
                  </label>
                  <textarea
                    value={contentDraft}
                    onChange={(e) => setContentDraft(e.target.value)}
                    rows={24}
                    className="w-full bg-[#070f1a] border border-white/15 px-4 py-3 text-white text-sm font-mono leading-relaxed focus:outline-none focus:border-[#c8a46b]/60"
                  />
                  <div className="mt-1 text-[10px] text-white/35">
                    {contentDraft.length} characters · use &lt;p&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt; tags for formatting
                  </div>
                </div>

                {saveMessage && (
                  <div
                    className={`text-xs px-3 py-2 border ${
                      saveMessage.type === "ok"
                        ? "border-green-500/30 bg-green-500/5 text-green-300"
                        : "border-red-500/30 bg-red-500/5 text-red-300"
                    }`}
                  >
                    {saveMessage.text}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-primary text-primary hover:bg-primary/10 hover:text-white hover:border-white font-bold text-xs uppercase tracking-widest px-8 py-3 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Save size={14} />
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </CabinetLayout>
  );
}
