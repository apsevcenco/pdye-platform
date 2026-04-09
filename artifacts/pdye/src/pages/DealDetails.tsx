import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import {
  ArrowLeft, FileText, Shield, Lock, Anchor, CheckCircle, Clock,
  Send, Download, AlertTriangle, RefreshCw, ShieldAlert, MessageSquare,
  Activity, ChevronDown, ChevronUp, Ship,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  type DealFlow, type DealMessage, type DealDocument, type DealActivityLog,
  DEAL_STATUS_CONFIG, TIMELINE_STEPS,
} from "@/lib/dealTypes";
import { NDA_TEXT, TERMS_TEXT, DISCLAIMER_TEXT } from "@/lib/legalText";

type Yacht = { id: string; name: string; builder: string | null; length: string | null; year: string | null; main_image: string | null; image: string | null };

export default function DealDetails() {
  const params = useParams<{ id: string }>();
  const dealId = params.id;
  const { user, userProfile } = useAuth();
  const [deal, setDeal] = useState<DealFlow | null>(null);
  const [yacht, setYacht] = useState<Yacht | null>(null);
  const [messages, setMessages] = useState<DealMessage[]>([]);
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [activity, setActivity] = useState<DealActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [ndaCheck, setNdaCheck] = useState(false);
  const [termsCheck, setTermsCheck] = useState(false);
  const [acceptingNda, setAcceptingNda] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = userProfile?.role === "admin";

  useEffect(() => {
    if (!user || !dealId) return;
    loadDeal();
  }, [user, dealId]);

  async function loadDeal() {
    setLoading(true);
    const { data } = await supabaseAdmin.from("deals").select("*").eq("id", dealId).single();
    if (!data || !data.buyer_id) { setLoading(false); return; }
    setDeal(data as DealFlow);

    const { data: y } = await supabase.from("yachts").select("id, name, builder, length, year, main_image, image").eq("id", data.yacht_id).single();
    if (y) setYacht(y as Yacht);

    if (data.deal_room_enabled || isAdmin) {
      const { data: msgs } = await supabaseAdmin
        .from("deal_messages")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: true });
      setMessages((msgs as DealMessage[]) || []);

      const { data: docs } = await supabaseAdmin
        .from("deal_documents")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });
      setDocuments((docs as DealDocument[]) || []);
    }

    if (isAdmin) {
      const { data: logs } = await supabaseAdmin
        .from("deal_activity_logs")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });
      setActivity((logs as DealActivityLog[]) || []);
    }

    setLoading(false);
  }

  async function acceptNda() {
    if (!deal || !user) return;
    setAcceptingNda(true);

    const now = new Date().toISOString();

    await supabaseAdmin.from("deals").update({
      nda_accepted: true,
      nda_accepted_at: now,
      terms_accepted: true,
      terms_accepted_at: now,
      status: "nda_signed",
      updated_at: now,
    }).eq("id", deal.id);

    await supabaseAdmin.from("nda_acceptance_logs").insert([{
      deal_id: deal.id,
      user_id: user.id,
      document_version: "v1",
      accepted: true,
      accepted_at: now,
    }]);

    await supabaseAdmin.from("deal_activity_logs").insert([
      { deal_id: deal.id, user_id: user.id, action: "nda_accepted", meta: {} },
      { deal_id: deal.id, user_id: user.id, action: "terms_accepted", meta: {} },
    ]);

    setAcceptingNda(false);
    loadDeal();
  }

  async function sendMessage() {
    if (!msgText.trim() || !deal || !user) return;
    setSending(true);
    await supabaseAdmin.from("deal_messages").insert([{
      deal_id: deal.id,
      sender_id: user.id,
      message: msgText.trim(),
      is_system: false,
    }]);
    await supabaseAdmin.from("deal_activity_logs").insert([{
      deal_id: deal.id,
      user_id: user.id,
      action: "message_sent",
      meta: {},
    }]);
    setMsgText("");
    setSending(false);
    const { data: msgs } = await supabaseAdmin
      .from("deal_messages")
      .select("*")
      .eq("deal_id", deal.id)
      .order("created_at", { ascending: true });
    setMessages((msgs as DealMessage[]) || []);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Lock size={32} className="text-primary mx-auto mb-4" />
            <p className="text-white/50 font-sans">Please log in to access this deal.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!deal) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <ShieldAlert size={32} className="text-primary mx-auto mb-4" />
            <p className="text-white font-display text-xl mb-2">Deal Not Found</p>
            <Link href="/dealroom" className="text-primary text-sm hover:underline">Back to Deal Room</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const cfg = DEAL_STATUS_CONFIG[deal.status] || DEAL_STATUS_CONFIG.created;
  const currentStep = cfg.step;
  const showNdaForm = deal.status === "nda_pending" && !isAdmin;
  const showDealRoom = deal.deal_room_enabled || isAdmin;

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <Link href="/dealroom">
            <div className="flex items-center gap-2 text-white/40 hover:text-primary transition-colors mb-8 cursor-pointer text-sm font-sans">
              <ArrowLeft size={14} /> Back to Deal Room
            </div>
          </Link>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="font-display text-3xl text-white mb-2">
                  {yacht?.name || "Vessel"}
                </h1>
                <p className="text-white/40 text-sm font-sans">
                  {[yacht?.builder, yacht?.length ? `${yacht.length}m` : null, yacht?.year].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border ${cfg.color} border-current/20 bg-black/30`}>
                  {cfg.label}
                </span>
                {deal.nda_accepted && (
                  <span className="text-[10px] text-green-400 border border-green-500/20 bg-green-500/5 px-2 py-1 flex items-center gap-1">
                    <FileText size={9} /> NDA Signed
                  </span>
                )}
                {deal.intro_locked && (
                  <span className="text-[10px] text-cyan-400 border border-cyan-500/20 bg-cyan-500/5 px-2 py-1 flex items-center gap-1">
                    <Lock size={9} /> Intro Locked
                  </span>
                )}
              </div>
            </div>
            <p className="text-white/20 text-xs font-sans">
              Deal created {new Date(deal.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </motion.div>

          <div className="bg-primary/5 border border-primary/15 px-5 py-3 mb-8">
            <p className="text-primary/80 text-xs font-sans">{DISCLAIMER_TEXT.slice(0, 200)}...</p>
          </div>

          <StatusTimeline currentStep={currentStep} dealStatus={deal.status} />

          {showNdaForm && (
            <NdaSection
              ndaCheck={ndaCheck}
              termsCheck={termsCheck}
              onNdaChange={setNdaCheck}
              onTermsChange={setTermsCheck}
              onAccept={acceptNda}
              accepting={acceptingNda}
            />
          )}

          {deal.status === "pending_admin_review" && !isAdmin && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 p-8 text-center mb-8">
              <Clock size={28} className="text-yellow-400 mx-auto mb-3" />
              <h3 className="font-display text-xl text-white mb-2">Awaiting Admin Review</h3>
              <p className="text-white/50 text-sm font-sans">Your request is being reviewed. You will be notified once it's processed.</p>
            </div>
          )}

          {deal.status === "nda_signed" && !deal.intro_locked && !isAdmin && (
            <div className="bg-cyan-500/5 border border-cyan-500/20 p-8 text-center mb-8">
              <Shield size={28} className="text-cyan-400 mx-auto mb-3" />
              <h3 className="font-display text-xl text-white mb-2">NDA Accepted — Awaiting Introduction</h3>
              <p className="text-white/50 text-sm font-sans">Your NDA has been signed. The admin will now process the formal introduction with the broker.</p>
            </div>
          )}

          {showDealRoom && (
            <div className="space-y-8">
              <div className="bg-[#0f1d33] border border-white/8">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <FileText size={13} /> Documents
                  </p>
                </div>
                <div className="p-6">
                  {documents.length === 0 ? (
                    <p className="text-white/30 text-sm font-sans text-center py-4">No documents uploaded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between bg-white/3 border border-white/5 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <FileText size={16} className="text-primary/60" />
                            <div>
                              <p className="text-white text-sm">{doc.title || "Untitled"}</p>
                              <p className="text-white/30 text-xs font-sans">{doc.file_type || "Document"} · {new Date(doc.created_at).toLocaleDateString("en-GB")}</p>
                            </div>
                          </div>
                          {doc.file_path && (
                            <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="text-primary text-xs font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
                              <Download size={12} /> View
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#0f1d33] border border-white/8">
                <div className="px-6 py-4 border-b border-white/5">
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={13} /> Messages
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-white/30 text-sm font-sans text-center py-4">No messages yet. Start the conversation.</p>
                  ) : (
                    messages.map(msg => {
                      const isOwn = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] px-4 py-3 ${msg.is_system ? "bg-primary/10 border border-primary/20 text-primary/80" : isOwn ? "bg-primary/15 border border-primary/25" : "bg-white/5 border border-white/8"}`}>
                            {msg.is_system && <p className="text-[10px] uppercase tracking-widest mb-1 opacity-60">System</p>}
                            <p className="text-sm font-sans text-white/80">{msg.message}</p>
                            <p className="text-[10px] text-white/20 mt-1 font-sans">
                              {new Date(msg.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="border-t border-white/5 p-4 flex gap-3">
                  <input
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/5 border border-white/10 px-4 py-2.5 text-white text-sm font-sans focus:outline-none focus:border-primary/40"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !msgText.trim()}
                    className="bg-primary text-background px-5 py-2.5 font-bold text-xs uppercase tracking-widest hover:bg-primary/90 disabled:opacity-30 transition-colors flex items-center gap-2"
                  >
                    <Send size={12} /> Send
                  </button>
                </div>
              </div>

              <div className="bg-[#0f1d33] border border-white/8 p-6">
                <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Shield size={13} /> Deal Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-sans">
                  <div>
                    <p className="text-white/30 text-xs mb-1">NDA Status</p>
                    <p className={deal.nda_accepted ? "text-green-400" : "text-yellow-400"}>
                      {deal.nda_accepted ? "Accepted" : "Pending"}
                    </p>
                    {deal.nda_accepted_at && (
                      <p className="text-white/20 text-[10px] mt-0.5">{new Date(deal.nda_accepted_at).toLocaleDateString("en-GB")}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-white/30 text-xs mb-1">Terms Status</p>
                    <p className={deal.terms_accepted ? "text-green-400" : "text-yellow-400"}>
                      {deal.terms_accepted ? "Accepted" : "Pending"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs mb-1">Intro Locked</p>
                    <p className={deal.intro_locked ? "text-cyan-400" : "text-white/40"}>
                      {deal.intro_locked ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs mb-1">Deal Room</p>
                    <p className={deal.deal_room_enabled ? "text-green-400" : "text-white/40"}>
                      {deal.deal_room_enabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isAdmin && activity.length > 0 && (
            <div className="mt-8 bg-[#0f1d33] border border-white/8">
              <button onClick={() => setShowActivity(!showActivity)} className="w-full px-6 py-4 flex items-center justify-between border-b border-white/5 hover:bg-white/2 transition-colors">
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Activity size={13} /> Activity Log ({activity.length})
                </p>
                {showActivity ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
              </button>
              {showActivity && (
                <div className="max-h-60 overflow-y-auto p-4 space-y-2">
                  {activity.map(log => (
                    <div key={log.id} className="flex items-start gap-3 text-xs font-sans">
                      <span className="text-white/20 flex-shrink-0 w-28">
                        {new Date(log.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-primary/60">{log.action.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function StatusTimeline({ currentStep, dealStatus }: { currentStep: number; dealStatus: string }) {
  const isTerminal = dealStatus === "rejected" || dealStatus === "cancelled";

  return (
    <div className="mb-8 bg-[#0f1d33] border border-white/8 p-6">
      <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-6">Deal Progress</h3>
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {TIMELINE_STEPS.map((step, i) => {
          const isActive = currentStep >= step.key === "closed" ? 7 : i;
          const isCurrent = currentStep === (step.key === "closed" ? 7 : i);
          const stepNum = i;
          const reached = currentStep >= stepNum;

          return (
            <div key={step.key} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors ${
                  reached
                    ? "bg-primary border-primary text-background"
                    : "border-white/15 text-white/20"
                }`}>
                  {reached ? <CheckCircle size={12} /> : i + 1}
                </div>
                <p className={`text-[9px] mt-1.5 text-center max-w-[70px] leading-tight ${reached ? "text-primary" : "text-white/20"}`}>
                  {step.label}
                </p>
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 mt-[-12px] ${reached && currentStep > stepNum ? "bg-primary" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
      </div>
      {isTerminal && (
        <div className="mt-4 flex items-center gap-2 text-red-400 text-xs font-sans">
          <AlertTriangle size={12} />
          This deal has been {dealStatus}.
        </div>
      )}
    </div>
  );
}

function NdaSection({ ndaCheck, termsCheck, onNdaChange, onTermsChange, onAccept, accepting }: {
  ndaCheck: boolean; termsCheck: boolean;
  onNdaChange: (v: boolean) => void; onTermsChange: (v: boolean) => void;
  onAccept: () => void; accepting: boolean;
}) {
  return (
    <div className="mb-8 space-y-6">
      <div className="bg-[#0f1d33] border border-orange-500/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-orange-400" />
          <h3 className="font-display text-lg text-white">Non-Disclosure Agreement Required</h3>
        </div>
        <div className="bg-black/30 border border-white/5 p-4 max-h-48 overflow-y-auto mb-4">
          <pre className="text-white/60 text-xs font-sans whitespace-pre-wrap leading-relaxed">{NDA_TEXT}</pre>
        </div>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" checked={ndaCheck} onChange={e => onNdaChange(e.target.checked)} className="mt-1 accent-primary" />
          <span className="text-white/70 text-sm font-sans group-hover:text-white transition-colors">
            I have read and agree to the Non-Disclosure Agreement
          </span>
        </label>
      </div>

      <div className="bg-[#0f1d33] border border-orange-500/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-orange-400" />
          <h3 className="font-display text-lg text-white">Terms of Access & Non-Circumvention</h3>
        </div>
        <div className="bg-black/30 border border-white/5 p-4 max-h-48 overflow-y-auto mb-4">
          <pre className="text-white/60 text-xs font-sans whitespace-pre-wrap leading-relaxed">{TERMS_TEXT}</pre>
        </div>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" checked={termsCheck} onChange={e => onTermsChange(e.target.checked)} className="mt-1 accent-primary" />
          <span className="text-white/70 text-sm font-sans group-hover:text-white transition-colors">
            I have read and agree to the Terms of Access and Non-Circumvention Agreement
          </span>
        </label>
      </div>

      <button
        onClick={onAccept}
        disabled={!ndaCheck || !termsCheck || accepting}
        className="w-full bg-primary text-background py-4 font-bold text-sm uppercase tracking-widest hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {accepting ? (
          <><RefreshCw size={14} className="animate-spin" /> Processing...</>
        ) : (
          <><CheckCircle size={14} /> Accept & Continue</>
        )}
      </button>
    </div>
  );
}
