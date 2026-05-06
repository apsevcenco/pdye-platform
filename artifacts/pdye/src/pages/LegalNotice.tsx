import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { Layout } from "@/components/layout/Layout";
import { legalPagesApi, type LegalPage } from "@/lib/legalPagesApi";

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "h2", "h3", "h4", "ul", "ol", "li", "a", "blockquote", "hr"],
  ALLOWED_ATTR: ["href", "target", "rel"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

export default function LegalNotice() {
  const [page, setPage] = useState<LegalPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    legalPagesApi.get("legal")
      .then(setPage)
      .catch((e) => setError(e?.message || "Failed to load"));
  }, []);

  const safeHtml = useMemo(
    () => (page ? DOMPurify.sanitize(page.content, SANITIZE_CONFIG) : ""),
    [page],
  );

  return (
    <Layout>
      <div className="min-h-screen bg-[#070f1a] text-white">
        <section className="max-w-4xl mx-auto px-6 md:px-12 py-24 md:py-32">
          <p className="text-[#c8a46b] text-[10px] uppercase tracking-[0.3em] mb-4 font-sans">Legal</p>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-10 leading-tight">
            {page?.title || "Legal Notice"}
          </h1>
          <div className="bg-white/[0.02] border border-white/8 p-8 md:p-12">
            {error && (
              <div className="text-red-300 text-sm">{error}</div>
            )}
            {!error && !page && (
              <div className="text-white/40 text-sm">Loading…</div>
            )}
            {page && (
              <div
                className="prose prose-invert max-w-none font-sans text-white/80 leading-relaxed [&_h2]:font-display [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:font-display [&_h3]:text-white [&_a]:text-[#c8a46b] [&_p]:mb-4"
                dangerouslySetInnerHTML={{ __html: safeHtml }}
              />
            )}
            {page?.updated_at && (
              <p className="mt-10 pt-6 border-t border-white/8 text-white/40 text-xs font-sans">
                Last updated: {new Date(page.updated_at).toLocaleDateString("en-GB")}
              </p>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
