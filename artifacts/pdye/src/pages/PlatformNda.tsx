import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Anchor, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { platformNdaApi, type PlatformNdaDocument } from "@/lib/platformNdaApi";

export default function PlatformNda() {
  const { user, userProfile, logout, refreshNdaStatus } = useAuth();
  const [, setLocation] = useLocation();

  const [doc, setDoc] = useState<PlatformNdaDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [signatureName, setSignatureName] = useState("");
  const [acceptedRead, setAcceptedRead] = useState(false);
  const [acceptedUnderstand, setAcceptedUnderstand] = useState(false);
  const [acceptedAgree, setAcceptedAgree] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const d = await platformNdaApi.getActiveDocument();
        if (!cancelled) setDoc(d);
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message || "Failed to load NDA document");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user, setLocation]);

  const allAccepted = acceptedRead && acceptedUnderstand && acceptedAgree;
  const nameValid = signatureName.trim().length >= 3;
  const canSubmit = allAccepted && nameValid && !submitting;

  async function handleSign() {
    if (!canSubmit) return;
    if (!doc) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await platformNdaApi.sign({
        signature_name: signatureName.trim(),
        accepted_read: acceptedRead,
        accepted_understand: acceptedUnderstand,
        accepted_agree: acceptedAgree,
        document_id: doc.id,
        content_hash: doc.content_hash,
      });
      await refreshNdaStatus();
      setSuccess(true);
      setTimeout(() => setLocation("/profile"), 1400);
    } catch (e: any) {
      setSubmitError(e?.message || "Failed to sign agreement");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070f1a] text-white">
      <header className="border-b border-white/10 bg-[#0a1426]/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor size={22} className="text-[#c8a46b]" strokeWidth={2} />
            <span className="font-display text-xl tracking-widest">PDYE</span>
          </div>
          <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-white/50">
            <span className="hidden sm:inline">{userProfile?.email || user?.email}</span>
            <button
              onClick={logout}
              className="hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 border border-[#c8a46b]/40 mb-4">
            <ShieldCheck size={22} className="text-[#c8a46b]" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-3xl mb-2">Platform Non-Disclosure Agreement</h1>
          <p className="text-white/50 text-sm max-w-xl mx-auto leading-relaxed">
            Before accessing the PDYE platform, you must read and electronically sign the Non-Disclosure Agreement.
            This agreement protects all participants and the confidential information shared on the platform.
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center py-20 text-white/40">
            <Loader2 size={28} className="animate-spin mb-3" />
            <span className="text-xs uppercase tracking-widest">Loading agreement…</span>
          </div>
        )}

        {loadError && !loading && (
          <div className="border border-red-500/30 bg-red-500/5 p-6 text-red-300 text-sm">
            {loadError}
          </div>
        )}

        {doc && !loading && (
          <>
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-white/40">
              <span>{doc.title}</span>
              <span>Version {doc.version} · Hash {doc.content_hash.slice(0, 12)}…</span>
            </div>
            <div className="border border-white/10 bg-[#0a1426] p-6 sm:p-8 max-h-[55vh] overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/80">
              {doc.content}
            </div>

            <div className="mt-8 border border-[#c8a46b]/25 bg-[#c8a46b]/5 p-6 sm:p-8">
              <h2 className="font-display text-lg mb-4 text-white">Acknowledgement & Signature</h2>

              <div className="space-y-3 mb-6">
                <label className="flex items-start gap-3 text-sm text-white/75 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedRead}
                    onChange={e => setAcceptedRead(e.target.checked)}
                    className="mt-0.5 accent-[#c8a46b] cursor-pointer"
                    disabled={submitting || success}
                  />
                  <span>I confirm that I have read the full text of this Agreement.</span>
                </label>
                <label className="flex items-start gap-3 text-sm text-white/75 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedUnderstand}
                    onChange={e => setAcceptedUnderstand(e.target.checked)}
                    className="mt-0.5 accent-[#c8a46b] cursor-pointer"
                    disabled={submitting || success}
                  />
                  <span>I understand my obligations and the legal consequences of breaching this Agreement.</span>
                </label>
                <label className="flex items-start gap-3 text-sm text-white/75 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedAgree}
                    onChange={e => setAcceptedAgree(e.target.checked)}
                    className="mt-0.5 accent-[#c8a46b] cursor-pointer"
                    disabled={submitting || success}
                  />
                  <span>I agree to be legally bound by all terms of this Agreement.</span>
                </label>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">
                  Full Legal Name (Electronic Signature)
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={e => setSignatureName(e.target.value)}
                  placeholder="Type your full legal name"
                  disabled={submitting || success}
                  className="w-full bg-transparent border border-white/15 px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-[#c8a46b]/60 transition-colors"
                />
                {nameValid && (
                  <div className="mt-3 px-4 py-3 border border-[#c8a46b]/30 bg-[#070f1a]">
                    <div className="text-[9px] uppercase tracking-widest text-white/35 mb-1">Signature preview</div>
                    <div className="text-2xl text-[#c8a46b] italic" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                      {signatureName.trim()}
                    </div>
                  </div>
                )}
              </div>

              {submitError && (
                <div className="mb-4 border border-red-500/30 bg-red-500/5 p-3 text-red-300 text-xs">
                  {submitError}
                </div>
              )}

              {success && (
                <div className="mb-4 border border-green-500/30 bg-green-500/5 p-3 text-green-300 text-xs">
                  Signed successfully. Redirecting to your account…
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <p className="text-[10px] text-white/35 leading-relaxed max-w-md">
                  By clicking "Sign Agreement", your full name, IP address, browser, and the document hash
                  will be recorded as your legally binding electronic signature.
                </p>
                <button
                  onClick={handleSign}
                  disabled={!canSubmit}
                  className="bg-[#c8a46b] text-[#070f1a] font-bold text-xs uppercase tracking-widest px-8 py-3 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
                >
                  {submitting ? "Signing…" : success ? "Signed ✓" : "Sign Agreement"}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
