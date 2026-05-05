import { useEffect, useState } from "react";
import { FileText, Loader2, Save, History, Download } from "lucide-react";
import { CabinetLayout } from "@/components/layout/CabinetLayout";
import { dealNdaApi, type DealNdaDocument, type DealNdaSignature } from "@/lib/dealNdaApi";
import { triggerBlobDownload } from "@/lib/platformNdaApi";

export default function AdminDealNda() {
  const [active, setActive] = useState<DealNdaDocument | null>(null);
  const [history, setHistory] = useState<DealNdaDocument[]>([]);
  const [signatures, setSignatures] = useState<DealNdaSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editVersion, setEditVersion] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownloadSig(sig: DealNdaSignature) {
    setDownloadingId(sig.id);
    try {
      const blob = await dealNdaApi.downloadSignedPdf(sig.id);
      const safeName = sig.signature_name.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40);
      triggerBlobDownload(blob, `PDYE-DealNDA-${sig.document_version}-${sig.side}-${safeName}.pdf`);
    } catch (e: any) {
      alert(`Could not download PDF: ${e?.message || e}`);
    } finally {
      setDownloadingId(null);
    }
  }

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const [docs, sigs] = await Promise.all([
        dealNdaApi.adminGet(),
        dealNdaApi.adminListSignatures(),
      ]);
      setActive(docs.active);
      setHistory(docs.history);
      setSignatures(sigs);
      if (docs.active) {
        setEditTitle(docs.active.title);
        setEditContent(docs.active.content);
      }
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Inject Great Vibes for the signed-name column.
  useEffect(() => {
    const id = "google-font-great-vibes";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap";
    document.head.appendChild(link);
  }, []);

  async function handlePublish() {
    if (!editVersion.trim()) {
      setPublishMessage({ type: "err", text: "Version label is required (e.g. v1.1, v2.0)" });
      return;
    }
    if (editContent.trim().length < 100) {
      setPublishMessage({ type: "err", text: "Content must be at least 100 characters" });
      return;
    }
    if (!confirm(
      `Publish version "${editVersion.trim()}"?\n\n` +
      `This will replace the current active Deal Room NDA. New signers will sign this version. ` +
      `Existing signatures remain valid for the version they signed.`
    )) return;

    setPublishing(true);
    setPublishMessage(null);
    try {
      await dealNdaApi.adminPublish({
        version: editVersion.trim(),
        title: editTitle.trim() || undefined,
        content: editContent,
      });
      setPublishMessage({ type: "ok", text: `Published version ${editVersion.trim()} as the active Deal Room NDA.` });
      setEditVersion("");
      await load();
    } catch (e: any) {
      setPublishMessage({ type: "err", text: e?.message || "Failed to publish" });
    } finally {
      setPublishing(false);
    }
  }

  function fmtDate(s: string) {
    return new Date(s).toLocaleString();
  }

  return (
    <CabinetLayout>
      <div className="min-h-screen bg-background text-white">
        <div className="border-b border-white/5 bg-secondary">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex items-center gap-3">
            <FileText size={18} className="text-primary" />
            <div>
              <p className="text-white/40 text-[10px] font-sans uppercase tracking-widest">Admin</p>
              <h1 className="font-display text-2xl text-white">Deal Room NDA</h1>
            </div>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
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
            {/* CURRENT ACTIVE DOCUMENT */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText size={16} className="text-[#c8a46b]" />
                <h2 className="font-display text-xl">Current Active Document</h2>
              </div>
              {active ? (
                <div className="border border-white/10 bg-[#0a1426] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-white/5">
                    <div>
                      <div className="text-white font-bold">{active.title}</div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
                        Version {active.version} · Published {fmtDate(active.created_at)}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-white/40">SHA-256: {active.content_hash}</div>
                  </div>
                  <div className="max-h-72 overflow-y-auto whitespace-pre-wrap text-sm text-white/70 leading-relaxed">
                    {active.content}
                  </div>
                </div>
              ) : (
                <div className="border border-yellow-500/30 bg-yellow-500/5 p-6 text-yellow-200 text-sm">
                  No active document. Publish the first version below.
                </div>
              )}
            </section>

            {/* PUBLISH NEW VERSION */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Save size={16} className="text-[#c8a46b]" />
                <h2 className="font-display text-xl">Publish New Version</h2>
              </div>
              <div className="border border-[#c8a46b]/25 bg-[#c8a46b]/5 p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">New Version Label</label>
                    <input
                      type="text"
                      value={editVersion}
                      onChange={e => setEditVersion(e.target.value)}
                      placeholder="e.g. v1.1"
                      className="w-full bg-transparent border border-white/15 px-3 py-2 text-white placeholder-white/25 focus:outline-none focus:border-[#c8a46b]/60"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      placeholder="PDYE Deal Room Non-Disclosure Agreement"
                      className="w-full bg-transparent border border-white/15 px-3 py-2 text-white placeholder-white/25 focus:outline-none focus:border-[#c8a46b]/60"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Document Content</label>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={20}
                    className="w-full bg-[#070f1a] border border-white/15 px-4 py-3 text-white text-sm font-mono leading-relaxed focus:outline-none focus:border-[#c8a46b]/60"
                  />
                  <div className="mt-1 text-[10px] text-white/35">{editContent.length} characters</div>
                </div>
                {publishMessage && (
                  <div className={`text-xs px-3 py-2 border ${publishMessage.type === "ok" ? "border-green-500/30 bg-green-500/5 text-green-300" : "border-red-500/30 bg-red-500/5 text-red-300"}`}>
                    {publishMessage.text}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="bg-[#c8a46b] text-[#070f1a] font-bold text-xs uppercase tracking-widest px-8 py-3 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
                  >
                    {publishing ? "Publishing…" : "Publish New Version"}
                  </button>
                </div>
              </div>
            </section>

            {/* VERSION HISTORY */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <History size={16} className="text-[#c8a46b]" />
                <h2 className="font-display text-xl">Version History</h2>
              </div>
              <div className="border border-white/10 bg-[#0a1426]">
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5">
                    <tr>
                      <th className="text-left p-3">Version</th>
                      <th className="text-left p-3">Title</th>
                      <th className="text-left p-3">Hash</th>
                      <th className="text-left p-3">Published</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h.id} className="border-b border-white/5 last:border-b-0">
                        <td className="p-3 font-mono text-[#c8a46b]">{h.version}</td>
                        <td className="p-3 text-white/70">{h.title}</td>
                        <td className="p-3 font-mono text-[10px] text-white/40">{h.content_hash.slice(0, 16)}…</td>
                        <td className="p-3 text-white/60">{fmtDate(h.created_at)}</td>
                        <td className="p-3">
                          {h.is_active ? (
                            <span className="text-[10px] uppercase tracking-widest text-green-400 border border-green-500/30 bg-green-500/5 px-2 py-0.5">Active</span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-widest text-white/40 border border-white/10 px-2 py-0.5">Archived</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr><td colSpan={5} className="p-6 text-center text-white/40 text-xs">No versions yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SIGNATURES LOG */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText size={16} className="text-[#c8a46b]" />
                <h2 className="font-display text-xl">Signature Log ({signatures.length})</h2>
              </div>
              <div className="border border-white/10 bg-[#0a1426] overflow-x-auto">
                <table className="w-full text-sm min-w-[1100px]">
                  <thead className="text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5">
                    <tr>
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Signed Name</th>
                      <th className="text-left p-3">Side</th>
                      <th className="text-left p-3">Deal Room</th>
                      <th className="text-left p-3">Version</th>
                      <th className="text-left p-3">Hash</th>
                      <th className="text-left p-3">IP</th>
                      <th className="text-left p-3">Signed At</th>
                      <th className="text-left p-3">PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signatures.map(s => (
                      <tr key={s.id} className="border-b border-white/5 last:border-b-0">
                        <td className="p-3 text-white/80">{s.user_email}</td>
                        <td
                          className="p-3 text-[#c8a46b]"
                          style={{ fontFamily: "'Great Vibes', 'Snell Roundhand', cursive", fontSize: "22px", lineHeight: 1.1 }}
                        >
                          {s.signature_name}
                        </td>
                        <td className="p-3 text-white/60 capitalize">{s.side}</td>
                        <td className="p-3 font-mono text-[10px] text-white/50" title={s.deal_room_id}>
                          {s.deal_room_id.slice(0, 8)}…
                        </td>
                        <td className="p-3 font-mono text-white/70">{s.document_version}</td>
                        <td className="p-3 font-mono text-[10px] text-white/40" title={s.document_hash}>{s.document_hash.slice(0, 12)}…</td>
                        <td className="p-3 font-mono text-white/60">{s.ip || "—"}</td>
                        <td className="p-3 text-white/60">{fmtDate(s.signed_at)}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleDownloadSig(s)}
                            disabled={downloadingId === s.id}
                            className="inline-flex items-center gap-1.5 border border-[#c8a46b]/40 px-2.5 py-1 text-[10px] uppercase tracking-widest text-[#c8a46b] hover:bg-[#c8a46b]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Download signed NDA PDF"
                          >
                            <Download size={11} /> {downloadingId === s.id ? "…" : "PDF"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {signatures.length === 0 && (
                      <tr><td colSpan={9} className="p-6 text-center text-white/40 text-xs">No signatures yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
        </main>
      </div>
    </CabinetLayout>
  );
}
