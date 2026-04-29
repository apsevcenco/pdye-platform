import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Введите email");
      return;
    }
    setLoading(true);
    const redirectTo = `${window.location.origin}/#/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-32 pb-20 flex items-start justify-center">
        <div className="w-full max-w-md px-6">
          <Link href="/login" className="inline-flex items-center gap-2 text-white/40 hover:text-primary text-xs uppercase tracking-widest mb-8 transition-colors">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>

          <div className="bg-[#0f1d33] border border-white/8 p-8">
            <p className="text-primary text-xs font-bold tracking-[0.25em] uppercase mb-2">Account Recovery</p>
            <h1 className="font-display text-3xl text-white font-normal mb-3">Forgot Password</h1>
            <p className="text-white/50 text-sm font-sans mb-8">
              Enter the email address associated with your account and we will send you a secure link to reset your password.
            </p>

            {sent ? (
              <div className="space-y-4">
                <div className="px-4 py-4 bg-green-500/10 border border-green-500/30 text-green-300 text-sm font-sans flex items-start gap-3">
                  <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">Reset link sent</p>
                    <p className="text-green-300/80 text-xs">Check your inbox at <span className="text-white">{email}</span>. The link is valid for 1 hour.</p>
                  </div>
                </div>
                <p className="text-white/40 text-xs font-sans">
                  Didn't receive it? Check Spam folder, or <button onClick={() => { setSent(false); }} className="text-primary hover:underline">try again</button>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-white/50 text-[9.5px] uppercase tracking-widest mb-1.5 font-bold">Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                      placeholder="you@example.com"
                      className="w-full bg-background border border-white/10 focus:border-primary pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none transition-colors placeholder:text-white/20 font-sans"
                    />
                  </div>
                </div>

                {error && (
                  <div className="border border-red-500/30 bg-red-500/5 px-4 py-3">
                    <p className="text-red-400 text-xs font-sans leading-relaxed">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-[#070f1a] py-3 font-bold tracking-widest uppercase text-xs hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>

                <p className="text-white/40 text-xs text-center font-sans pt-2">
                  Remember your password? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
