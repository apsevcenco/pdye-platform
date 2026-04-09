import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import {
  ArrowLeft, FileText, Shield, Lock, Anchor, CheckCircle, Clock,
  Send, Download, AlertTriangle, RefreshCw, ShieldAlert, MessageSquare,
  Activity, ChevronDown, ChevronUp, Ship, Eye, Users,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  type DealRoom, type DealRoomMessage, type DealRoomDocument, type AuditLog,
  DEAL_ROOM_STATUS_CONFIG, DEAL_ROOM_TIMELINE,
} from "@/lib/dealTypes";
import { NDA_TEXT, TERMS_TEXT, DISCLAIMER_TEXT } from "@/lib/legalText";

type Yacht = { id: string; name: string; builder: string | null; length: string | null; year: string | null; main_image: string | null; image: string | null };

export default function DealDetails() {
  const params = useParams<{ id: string }>();
  const roomId = params.id;
  const { user, userProfile } = useAuth();
  const [room, setRoom] = useState<DealRoom | null>(null);
  const [yacht, setYacht] = useState<Yacht | null>(null);
  const [messages, setMessages] = useState<DealRoomMessage[]>([]);
  const [documents, setDocuments] = useState<DealRoomDocument[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [ndaCheck, setNdaCheck] = useState(false);
  const [termsCheck, setTermsCheck] = useState(false);
  const [acceptingNda, setAcceptingNda] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = userProfile?.role === "admin";
  const isBuyer = room?.buyer_user_id === user?.id;
  const isSeller = room?.seller_user_id === user?.id;
  const mySide = isAdmin ? "admin" : isBuyer ? "buyer" : isSeller ? "seller" : "unknown";

  useEffect(() => {
    if (!user || !roomId) return;
    loadRoom();
  }, [user, roomId]);

  async function loadRoom() {
    setLoading(true);
    const { data } = await supabaseAdmin.from("deal_rooms").select("*").eq("id", roomId).single();
    if (!data) { setLoading(false); return; }
    setRoom(data as DealRoom);

    const { data: y } = await supabase.from("yachts").select("id, name, builder, length, year, main_image, image").eq("id", data.yacht_id).single();
    if (y) setYacht(y as Yacht);

    if (data.status === "active" || isAdmin) {
      const { data: msgs } = await supabaseAdmin
        .from("deal_room_messages")
        .select("*")
        .eq("deal_room_id", roomId)
        .order("created_at", { ascending: true });
      setMessages((msgs as DealRoomMessage[]) || []);

      const { data: docs } = await supabaseAdmin
        .from("deal_room_documents")
        .select("*")
        .eq("deal_room_id", roomId)
        .order("created_at", { ascending: false });
      setDocuments((docs as DealRoomDocument[]) || []);
    }

    if (isAdmin) {
      const { data: logs } = await supabaseAdmin
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "deal_room")
        .eq("entity_id", roomId)
        .order("created_at", { ascending: false });
      setActivity((logs as AuditLog[]) || []);
    }

    setLoading(false);
  }

  async function signNda() {
    if (!room || !user) return;
    if (mySide !== "buyer" && mySide !== "seller") return;
    setAcceptingNda(true);
    const now = new Date().toISOString();

    const updates: Record<string, any> = { updated_at: now };
    if (isBuyer) {
      updates.buyer_nda_status = "signed";
      updates.buyer_nda_signed_at = now;
    }
    if (isSeller) {
      updates.seller_nda_status = "signed";
      updates.seller_nda_signed_at = now;
    }

    await supabaseAdmin.from("deal_rooms").update(updates).eq("id", room.id);

    await supabaseAdmin.from("nda_envelopes").insert([{
      deal_room_id: room.id,
      user_id: user.id,
      side: mySide,
      provider: "internal",
      status: "signed",
      signed_at: now,
      completed_at: now,
    }]);

    await supabaseAdmin.from("audit_logs").insert([{
      entity_type: "deal_room",
      entity_id: room.id,
      user_id: user.id,
      action: "nda_signed",
      meta: { side: mySide },
    }]);

    await supabaseAdmin.from("deal_room_messages").insert([{
      deal_room_id: room.id,
      sender_id: user.id,
      message: `NDA signed by ${mySide} party.`,
      is_system: true,
    }]);

    const { data: refreshed } = await supabaseAdmin.from("deal_rooms").select("*").eq("id", room.id).single();
    if (refreshed) {
      const buyerSigned = refreshed.buyer_nda_status === "signed";
      const sellerSigned = refreshed.seller_nda_status === "signed";

      if (buyerSigned && sellerSigned && refreshed.status !== "active") {
        await supabaseAdmin.from("deal_rooms").update({
          status: "active",
          fully_activated_at: now,
          updated_at: now,
        }).eq("id", room.id);

        await supabaseAdmin.from("deal_room_participants").update({
          can_view: true,
          can_message: true,
          can_download: true,
        }).eq("deal_room_id", room.id);

        await supabaseAdmin.from("audit_logs").insert([{
          entity_type: "deal_room",
          entity_id: room.id,
          user_id: user.id,
          action: "deal_room_activated",
          meta: {
            yacht_id: room.yacht_id,
            buyer_id: room.buyer_user_id,
            seller_id: room.seller_user_id,
            buyer_nda_signed_at: refreshed.buyer_nda_signed_at,
            seller_nda_signed_at: refreshed.seller_nda_signed_at,
            activated_at: now,
          },
        }]);

        await supabaseAdmin.from("deal_room_messages").insert([{
          deal_room_id: room.id,
          sender_id: user.id,
          message: "Deal room activated after NDA completion by both parties. Full access is now available.",
          is_system: true,
        }]);
      } else if (buyerSigned !== sellerSigned) {
        await supabaseAdmin.from("deal_rooms").update({
          status: "partially_signed",
          updated_at: now,
        }).eq("id", room.id);
      }
    }

    setAcceptingNda(false);
    loadRoom();
  }

  async function sendMessage() {
    if (!msgText.trim() || !room || !user) return;
    setSending(true);
    await supabaseAdmin.from("deal_room_messages").insert([{
      deal_room_id: room.id,
      sender_id: user.id,
      message: msgText.trim(),
      is_system: false,
    }]);
    await supabaseAdmin.from("audit_logs").insert([{
      entity_type: "deal_room",
      entity_id: room.id,
      user_id: user.id,
      action: "message_sent",
      meta: {},
    }]);
    setMsgText("");
    setSending(false);
    const { data: msgs } = await supabaseAdmin
      .from("deal_room_messages")
      .select("*")
      .eq("deal_room_id", room.id)
      .order("created_at", { ascending: true });
    setMessages((msgs as DealRoomMessage[]) || []);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Lock size={32} className="text-primary mx-auto mb-4" />
            <p className="text-white/50 font-sans">Please log in to access this deal room.</p>
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

  if (!room) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <ShieldAlert size={32} className="text-primary mx-auto mb-4" />
            <p className="text-white font-display text-xl mb-2">Deal Room Not Found</p>
            <Link href="/dealroom" className="text-primary text-sm hover:underline">Back to Opportunities</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const cfg = DEAL_ROOM_STATUS_CONFIG[room.status] || DEAL_ROOM_STATUS_CONFIG.draft;
  const currentStep = cfg.step;
  const myNdaStatus = isBuyer ? room.buyer_nda_status : isSeller ? room.seller_nda_status : "n/a";
  const showNdaForm = (room.status === "nda_pending" || room.status === "partially_signed" || room.status === "draft") && myNdaStatus !== "signed" && !isAdmin;
  const showDealRoom = room.status === "active" || isAdmin;

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <Link href="/dealroom">
            <div className="flex items-center gap-2 text-white/40 hover:text-primary transition-colors mb-8 cursor-pointer text-sm font-sans">
              <ArrowLeft size={14} /> Back to Opportunities
            </div>
          </Link>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="font-display text-3xl text-white mb-2">
                  {room.status === "active" || isAdmin ? yacht?.name || "Vessel" : `${yacht?.builder || "Vessel"} · ${yacht?.year || ""}`}
                </h1>
                <p className="text-white/40 text-sm font-sans">
                  {room.status === "active" || isAdmin
                    ? [yacht?.builder, yacht?.length ? `${yacht.length}m` : null, yacht?.year].filter(Boolean).join(" · ")
                    : "Vessel identity disclosed after Deal Room activation"
                  }
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border ${cfg.color} border-current/20 bg-black/30`}>
                  {cfg.label}
                </span>
              </div>
            </div>
            <p className="text-white/20 text-xs font-sans">
              Deal room created {new Date(room.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </motion.div>

          <div className="bg-primary/5 border border-primary/15 px-5 py-3 mb-8">
            <p className="text-primary/80 text-xs font-sans">{DISCLAIMER_TEXT.slice(0, 200)}...</p>
          </div>

          <RoomTimeline currentStep={currentStep} status={room.status} />

          <div className="bg-[#0f1d33] border border-white/8 p-6 mb-8">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Shield size={13} /> NDA Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-sans">
              <div>
                <p className="text-white/30 text-xs mb-1">Buyer NDA</p>
                <p className={room.buyer_nda_status === "signed" ? "text-green-400" : room.buyer_nda_status === "sent" ? "text-orange-400" : "text-white/30"}>
                  {room.buyer_nda_status === "signed" ? "Signed" : room.buyer_nda_status === "sent" ? "Sent" : "Not Sent"}
                </p>
                {room.buyer_nda_signed_at && (
                  <p className="text-white/15 text-[10px] mt-0.5">{new Date(room.buyer_nda_signed_at).toLocaleDateString("en-GB")}</p>
                )}
              </div>
              <div>
                <p className="text-white/30 text-xs mb-1">Seller NDA</p>
                <p className={room.seller_nda_status === "signed" ? "text-green-400" : room.seller_nda_status === "sent" ? "text-orange-400" : "text-white/30"}>
                  {room.seller_nda_status === "signed" ? "Signed" : room.seller_nda_status === "sent" ? "Sent" : "Not Sent"}
                </p>
                {room.seller_nda_signed_at && (
                  <p className="text-white/15 text-[10px] mt-0.5">{new Date(room.seller_nda_signed_at).toLocaleDateString("en-GB")}</p>
                )}
              </div>
              <div>
                <p className="text-white/30 text-xs mb-1">Room Status</p>
                <p className={room.status === "active" ? "text-green-400" : "text-white/40"}>
                  {room.status === "active" ? "Active" : room.status.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <p className="text-white/30 text-xs mb-1">Activated</p>
                <p className={room.fully_activated_at ? "text-green-400" : "text-white/30"}>
                  {room.fully_activated_at ? new Date(room.fully_activated_at).toLocaleDateString("en-GB") : "Pending"}
                </p>
              </div>
            </div>
          </div>

          {showNdaForm && (
            <NdaSection
              ndaCheck={ndaCheck}
              termsCheck={termsCheck}
              onNdaChange={setNdaCheck}
              onTermsChange={setTermsCheck}
              onAccept={signNda}
              accepting={acceptingNda}
            />
          )}

          {myNdaStatus === "signed" && room.status !== "active" && !isAdmin && (
            <div className="bg-cyan-500/5 border border-cyan-500/20 p-8 text-center mb-8">
              <Shield size={28} className="text-cyan-400 mx-auto mb-3" />
              <h3 className="font-display text-xl text-white mb-2">NDA Signed — Awaiting Other Party</h3>
              <p className="text-white/50 text-sm font-sans">Your NDA has been signed. The deal room will activate once the other party also signs.</p>
            </div>
          )}

          {room.status === "draft" && !isAdmin && myNdaStatus === "not_sent" && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 p-8 text-center mb-8">
              <Clock size={28} className="text-yellow-400 mx-auto mb-3" />
              <h3 className="font-display text-xl text-white mb-2">Deal Room Created</h3>
              <p className="text-white/50 text-sm font-sans">The admin has created this deal room. NDA documents will be sent shortly.</p>
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
                    <p className="text-white/30 text-sm font-sans text-center py-4">No messages yet.</p>
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
                {room.status === "active" && (
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
                )}
              </div>
            </div>
          )}

          {isAdmin && activity.length > 0 && (
            <div className="mt-8 bg-[#0f1d33] border border-white/8">
              <button onClick={() => setShowActivity(!showActivity)} className="w-full px-6 py-4 flex items-center justify-between border-b border-white/5 hover:bg-white/2 transition-colors">
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Activity size={13} /> Audit Log ({activity.length})
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

          {isAdmin && (
            <AdminRoomControls room={room} onReload={loadRoom} />
          )}
        </div>
      </div>
    </Layout>
  );
}

function AdminRoomControls({ room, onReload }: { room: DealRoom; onReload: () => void }) {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  async function sendNda() {
    setSending(true);
    const now = new Date().toISOString();

    const updates: Record<string, any> = { updated_at: now };
    if (room.buyer_nda_status === "not_sent") {
      updates.buyer_nda_status = "sent";
      updates.buyer_nda_sent_at = now;
    }
    if (room.seller_nda_status === "not_sent" && room.seller_user_id) {
      updates.seller_nda_status = "sent";
      updates.seller_nda_sent_at = now;
    }
    if (room.status === "draft") {
      updates.status = "nda_pending";
    }

    await supabaseAdmin.from("deal_rooms").update(updates).eq("id", room.id);

    const envelopes = [];
    if (room.buyer_user_id && room.buyer_nda_status === "not_sent") {
      envelopes.push({
        deal_room_id: room.id,
        user_id: room.buyer_user_id,
        side: "buyer",
        provider: "internal",
        status: "sent",
        sent_at: now,
        document_name: "PDYE NDA v1",
      });
    }
    if (room.seller_user_id && room.seller_nda_status === "not_sent") {
      envelopes.push({
        deal_room_id: room.id,
        user_id: room.seller_user_id,
        side: "seller",
        provider: "internal",
        status: "sent",
        sent_at: now,
        document_name: "PDYE NDA v1",
      });
    }
    if (envelopes.length > 0) {
      await supabaseAdmin.from("nda_envelopes").insert(envelopes);
    }

    await supabaseAdmin.from("audit_logs").insert([{
      entity_type: "deal_room",
      entity_id: room.id,
      user_id: user?.id,
      action: "nda_sent",
      meta: { buyer: room.buyer_user_id, seller: room.seller_user_id },
    }]);

    await supabaseAdmin.from("deal_room_messages").insert([{
      deal_room_id: room.id,
      sender_id: user?.id || "",
      message: "NDA documents have been sent to both parties for review and signature.",
      is_system: true,
    }]);

    setSending(false);
    onReload();
  }

  async function closeRoom() {
    if (!confirm("Close this deal room?")) return;
    const now = new Date().toISOString();
    await supabaseAdmin.from("deal_rooms").update({ status: "closed", updated_at: now }).eq("id", room.id);
    await supabaseAdmin.from("audit_logs").insert([{
      entity_type: "deal_room",
      entity_id: room.id,
      user_id: user?.id,
      action: "deal_room_closed",
      meta: {},
    }]);
    onReload();
  }

  async function cancelRoom() {
    if (!confirm("Cancel this deal room? This cannot be undone.")) return;
    const now = new Date().toISOString();
    await supabaseAdmin.from("deal_rooms").update({ status: "cancelled", updated_at: now }).eq("id", room.id);
    await supabaseAdmin.from("audit_logs").insert([{
      entity_type: "deal_room",
      entity_id: room.id,
      user_id: user?.id,
      action: "deal_room_cancelled",
      meta: {},
    }]);
    onReload();
  }

  const canSendNda = room.status === "draft" && (room.buyer_nda_status === "not_sent" || (room.seller_user_id && room.seller_nda_status === "not_sent"));

  return (
    <div className="mt-8 bg-[#0f1d33] border border-white/8 p-6">
      <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
        <Users size={13} /> Admin Controls
      </h3>
      <div className="flex flex-wrap gap-3">
        {canSendNda && (
          <button
            onClick={sendNda}
            disabled={sending}
            className="flex items-center gap-2 bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-40"
          >
            {sending ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
            Send NDA to Both Parties
          </button>
        )}
        {room.status !== "closed" && room.status !== "cancelled" && (
          <>
            <button
              onClick={closeRoom}
              className="flex items-center gap-2 border border-white/10 text-white/40 hover:text-white hover:border-white/30 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Close Room
            </button>
            <button
              onClick={cancelRoom}
              className="flex items-center gap-2 border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Cancel Room
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function RoomTimeline({ currentStep, status }: { currentStep: number; status: string }) {
  const isTerminal = status === "cancelled";

  return (
    <div className="mb-8 bg-[#0f1d33] border border-white/8 p-6">
      <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-6">Deal Room Progress</h3>
      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {DEAL_ROOM_TIMELINE.map((step, i) => {
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
              {i < DEAL_ROOM_TIMELINE.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 mt-[-12px] ${reached && currentStep > stepNum ? "bg-primary" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
      </div>
      {isTerminal && (
        <div className="mt-4 flex items-center gap-2 text-red-400 text-xs font-sans">
          <AlertTriangle size={12} />
          This deal room has been cancelled.
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
          <><CheckCircle size={14} /> Sign NDA & Accept Terms</>
        )}
      </button>
    </div>
  );
}
