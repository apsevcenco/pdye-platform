import { Layout } from "@/components/layout/Layout";
import { openCookieSettings } from "@/components/CookieConsent";

export default function CookiePolicy() {
  const updated = "May 2026";

  return (
    <Layout>
      <div className="min-h-screen bg-[#0a1628] text-white">
        <section className="max-w-4xl mx-auto px-6 md:px-12 py-24 md:py-32">
          <p className="text-[#c8a96a] text-[10px] uppercase tracking-[0.3em] mb-4 font-sans">
            Legal
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-3 leading-tight">
            Cookie Policy
          </h1>
          <p className="text-white/45 text-sm font-sans mb-10">Last updated: {updated}</p>

          <div className="bg-white/[0.02] border border-white/10 p-8 md:p-12 space-y-8 font-sans text-[15px] leading-relaxed text-white/80">
            <section className="space-y-3">
              <p>
                Private Distressed Yacht Exchange ("PDYE", "we", "us") uses cookies and similar
                technologies on this website. This page explains what cookies are, which cookies
                we use, and how you can manage your choices.
              </p>
              <p>
                By continuing to use the platform you agree that we may store the cookies
                described below on your device, in line with the consent you give in our cookie
                banner.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-2xl text-white">1. What are cookies?</h2>
              <p>
                Cookies are small text files placed on your device by the websites you visit.
                They are widely used to make websites work, to make them work more efficiently,
                and to provide information to the site owners. We also use comparable
                technologies such as <em>localStorage</em> to remember your preferences and your
                authenticated session.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-2xl text-white">2. Cookies we use</h2>

              <div className="border border-white/10 p-5">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <h3 className="font-display text-lg text-white">Strictly necessary</h3>
                  <span className="text-[#c8a96a] text-[10px] uppercase tracking-[0.25em]">
                    Always on
                  </span>
                </div>
                <p className="text-white/70 text-sm">
                  Required for the platform to function. They keep you signed in, secure your
                  session, remember your cookie choice, and protect against cross-site request
                  forgery. Without these cookies the site cannot work properly. They are not
                  used for tracking and they cannot be switched off.
                </p>
                <ul className="text-white/55 text-xs mt-3 space-y-1">
                  <li>
                    <code className="text-[#c8a96a]">sb-*</code> — Supabase authentication
                    session (issued by our identity provider).
                  </li>
                  <li>
                    <code className="text-[#c8a96a]">pdye_cookie_consent_v1</code> — your cookie
                    preferences (stored in localStorage, valid 12 months).
                  </li>
                </ul>
              </div>

              <div className="border border-white/10 p-5">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <h3 className="font-display text-lg text-white">Analytics</h3>
                  <span className="text-white/40 text-[10px] uppercase tracking-[0.25em]">
                    Optional
                  </span>
                </div>
                <p className="text-white/70 text-sm">
                  If you accept analytics cookies we may collect anonymous, aggregated usage
                  statistics (pages visited, broad device type, referring source) to understand
                  how the platform is used and where we can improve it. We do not build
                  individual profiles and we do not sell this data. At present no analytics
                  provider is enabled; this category is reserved for future use and only loads
                  after your explicit consent.
                </p>
              </div>

              <div className="border border-white/10 p-5">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <h3 className="font-display text-lg text-white">Marketing</h3>
                  <span className="text-white/40 text-[10px] uppercase tracking-[0.25em]">
                    Optional
                  </span>
                </div>
                <p className="text-white/70 text-sm">
                  Reserved for future advertising or campaign measurement cookies. We currently
                  do not run any advertising network and no marketing cookies are set.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-2xl text-white">3. Third-party services</h2>
              <p>
                Some core functionality is delivered by trusted third parties acting as our
                processors:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-white/75">
                <li>
                  <strong className="text-white">Supabase</strong> — authentication, database
                  and file storage.
                </li>
                <li>
                  <strong className="text-white">Render</strong> — application hosting.
                </li>
                <li>
                  <strong className="text-white">Resend</strong> — transactional email
                  delivery.
                </li>
                <li>
                  <strong className="text-white">OpenAI</strong> — yacht valuation assistant
                  (only when you submit the valuation form).
                </li>
              </ul>
              <p>
                These providers may set strictly-necessary cookies of their own that are
                required for the service to operate (for example, the Supabase session cookie).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-2xl text-white">4. Managing your choices</h2>
              <p>
                You can change or withdraw your consent at any time using the button below or
                the "Cookie settings" link in the website footer. You can also delete cookies
                directly in your browser settings; note that deleting strictly necessary
                cookies will sign you out and may break parts of the platform.
              </p>
              <button
                type="button"
                onClick={openCookieSettings}
                className="inline-block mt-2 px-5 py-2.5 bg-[#c8a96a] text-[#0a1628] text-sm font-medium tracking-wide hover:bg-[#c8a96a]/90 transition-colors"
              >
                Open cookie settings
              </button>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-2xl text-white">5. Changes to this policy</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect changes to the
                cookies we use or for operational, legal or regulatory reasons. The "Last
                updated" date at the top of the page indicates when it was last revised.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-2xl text-white">6. Contact</h2>
              <p>
                For any question about this Cookie Policy or our use of cookies, please contact
                us at{" "}
                <a
                  href="mailto:asevcenco@aayachts.fr"
                  className="text-[#c8a96a] underline underline-offset-2 hover:text-[#c8a96a]/80"
                >
                  asevcenco@aayachts.fr
                </a>
                .
              </p>
            </section>
          </div>
        </section>
      </div>
    </Layout>
  );
}
