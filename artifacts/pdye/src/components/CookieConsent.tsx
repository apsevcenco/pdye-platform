import { useEffect, useState } from "react";
import { Link } from "wouter";

const STORAGE_KEY = "pdye_cookie_consent_v1";
const TTL_MS = 365 * 24 * 60 * 60 * 1000;

type Categories = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

type StoredConsent = {
  categories: Categories;
  decidedAt: number;
};

function loadStored(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredConsent> | null;
    if (!parsed || typeof parsed !== "object") return null;
    const decidedAt = (parsed as StoredConsent).decidedAt;
    if (typeof decidedAt !== "number" || !Number.isFinite(decidedAt)) return null;
    if (Date.now() - decidedAt > TTL_MS) return null;
    const cats = (parsed as StoredConsent).categories;
    if (!cats || typeof cats !== "object") return null;
    return {
      categories: {
        necessary: true,
        analytics: cats.analytics === true,
        marketing: cats.marketing === true,
      },
      decidedAt,
    };
  } catch {
    return null;
  }
}

function save(categories: Categories) {
  const payload: StoredConsent = { categories, decidedAt: Date.now() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage blocked — fall back to in-memory only
  }
  window.dispatchEvent(new CustomEvent("pdye:consent-changed", { detail: payload }));
}

export const COOKIE_SETTINGS_EVENT = "pdye:open-cookie-settings";

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = loadStored();
    if (!existing) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
    setAnalytics(existing.categories.analytics);
    setMarketing(existing.categories.marketing);
    return undefined;
  }, []);

  useEffect(() => {
    const handler = () => {
      const existing = loadStored();
      if (existing) {
        setAnalytics(existing.categories.analytics);
        setMarketing(existing.categories.marketing);
      }
      setShowCustomize(true);
      setOpen(true);
    };
    window.addEventListener(COOKIE_SETTINGS_EVENT, handler);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, handler);
  }, []);

  if (!open) return null;

  const acceptAll = () => {
    save({ necessary: true, analytics: true, marketing: true });
    setOpen(false);
    setShowCustomize(false);
  };
  const rejectAll = () => {
    save({ necessary: true, analytics: false, marketing: false });
    setOpen(false);
    setShowCustomize(false);
  };
  const saveCustom = () => {
    save({ necessary: true, analytics, marketing });
    setOpen(false);
    setShowCustomize(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
      className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 md:px-6 md:pb-6 pointer-events-none"
    >
      <div className="pointer-events-auto max-w-3xl mx-auto bg-[#06101e]/98 backdrop-blur border border-[#c8a46b]/30 shadow-2xl text-[#f4ecd8]">
        <div className="px-6 py-6 md:px-8 md:py-7">
          <p className="text-[#c8a46b] text-[10px] uppercase tracking-[0.3em] font-sans mb-3">
            Cookies & Privacy
          </p>
          <h2 className="font-display text-xl md:text-2xl mb-3 leading-snug">
            We respect your privacy
          </h2>
          <p className="text-[#f4ecd8]/70 text-sm leading-relaxed font-sans">
            We use strictly necessary cookies to keep the platform secure and to remember your
            session. With your consent, we may also use analytics cookies to understand how the
            platform is used so we can improve it. You can change your choice at any time from
            the footer.{" "}
            <a
              href="#/cookie-policy"
              className="text-[#c8a46b] underline underline-offset-2 hover:text-[#c8a46b]/80"
            >
              Read our Cookie Policy
            </a>
            .
          </p>

          {showCustomize && (
            <div className="mt-5 border-t border-[#f4ecd8]/10 pt-5 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4 py-2">
                <div>
                  <div className="font-sans font-medium text-[#f4ecd8]">Strictly necessary</div>
                  <div className="text-[#f4ecd8]/55 text-xs mt-1 leading-relaxed">
                    Required for authentication, security and core platform functionality.
                    Always on.
                  </div>
                </div>
                <span className="text-[#c8a46b] text-xs uppercase tracking-wider mt-1">
                  Always on
                </span>
              </div>
              <label className="flex items-start justify-between gap-4 py-2 cursor-pointer">
                <div>
                  <div className="font-sans font-medium text-[#f4ecd8]">Analytics</div>
                  <div className="text-[#f4ecd8]/55 text-xs mt-1 leading-relaxed">
                    Anonymous usage statistics so we can improve the platform. No personal
                    profiling.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#c8a46b]"
                />
              </label>
              <label className="flex items-start justify-between gap-4 py-2 cursor-pointer">
                <div>
                  <div className="font-sans font-medium text-[#f4ecd8]">Marketing</div>
                  <div className="text-[#f4ecd8]/55 text-xs mt-1 leading-relaxed">
                    Currently unused. Reserved for future advertising or campaign measurement
                    cookies.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#c8a46b]"
                />
              </label>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
            {showCustomize ? (
              <button
                type="button"
                onClick={saveCustom}
                className="px-5 py-2.5 bg-[#c8a46b] text-[#06101e] text-sm font-sans font-medium tracking-wide hover:bg-[#c8a46b]/90 transition-colors"
              >
                Save preferences
              </button>
            ) : (
              <button
                type="button"
                onClick={acceptAll}
                className="px-5 py-2.5 bg-[#c8a46b] text-[#06101e] text-sm font-sans font-medium tracking-wide hover:bg-[#c8a46b]/90 transition-colors"
              >
                Accept all
              </button>
            )}
            <button
              type="button"
              onClick={rejectAll}
              className="px-5 py-2.5 border border-[#f4ecd8]/25 text-[#f4ecd8]/85 text-sm font-sans hover:bg-[#f4ecd8]/5 transition-colors"
            >
              Necessary only
            </button>
            {!showCustomize && (
              <button
                type="button"
                onClick={() => setShowCustomize(true)}
                className="px-5 py-2.5 text-[#f4ecd8]/65 text-sm font-sans hover:text-[#f4ecd8] transition-colors"
              >
                Customize
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}
