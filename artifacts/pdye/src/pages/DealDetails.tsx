import { useEffect, useState, useRef, useCallback, Fragment } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, FileText, Shield, Lock, Anchor, CheckCircle, Clock,
  Send, Download, AlertTriangle, RefreshCw, ShieldAlert, MessageSquare,
  Activity, ChevronDown, ChevronUp, Ship, Eye, Users, User, Loader2,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { dealRoomApi } from "@/lib/dealRoomApi";
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
  const [participantMap, setParticipantMap] = useState<Record<string, { email: string; role: string }>>({});
  const [chatPolling, setChatPolling] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

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
    try {
      const data = await dealRoomApi.get(roomId!);
      if (!data) { setLoading(false); return; }
      setRoom(data as DealRoom);

      const { data: y } = await supabase.from("yachts").select("id, name, builder, length, year, main_image, image").eq("id", data.yacht_id).single();
      if (y) setYacht(y as Yacht);

      const participantIds = [data.buyer_user_id, data.seller_user_id, data.created_by_admin_id].filter(Boolean) as string[];
      if (participantIds.length > 0) {
        const { data: pUsers } = await supabaseAdmin.from("users").select("id, email, role").in("id", participantIds);
        const pMap: Record<string, { email: string; role: string }> = {};
        (pUsers || []).forEach((u: any) => { pMap[u.id] = { email: u.email, role: u.role }; });
        setParticipantMap(pMap);
      }

      if (data.status === "active" || isAdmin) {
        const msgs = await dealRoomApi.getMessages(roomId!);
        setMessages((msgs as DealRoomMessage[]) || []);

        const docs = await dealRoomApi.getDocuments(roomId!);
        setDocuments((docs as DealRoomDocument[]) || []);
      }

      if (isAdmin) {
        const logs = await dealRoomApi.getAuditLogs("deal_room", roomId!);
        setActivity((logs as AuditLog[]) || []);
      }
    } catch (e) {}

    setLoading(false);
  }

  async function signNda() {
    if (!room || !user) return;
    if (mySide !== "buyer" && mySide !== "seller") return;
    setAcceptingNda(true);
    const now = new Date().toISOString();

    const updates: Record<string, any> = {};
    if (isBuyer) {
      updates.buyer_nda_status = "signed";
      updates.buyer_nda_signed_at = now;
    }
    if (isSeller) {
      updates.seller_nda_status = "signed";
      updates.seller_nda_signed_at = now;
    }

    await dealRoomApi.update(room.id, updates);

    await dealRoomApi.createNdaEnvelope({
      deal_room_id: room.id,
      user_id: user.id,
      side: mySide,
      provider: "internal",
      status: "signed",
      signed_at: now,
      completed_at: now,
    });

    await dealRoomApi.createAuditLog({
      entity_type: "deal_room",
      entity_id: room.id,
      user_id: user.id,
      action: "nda_signed",
      meta: { side: mySide },
    });

    await dealRoomApi.sendMessage(room.id, {
      sender_id: user.id,
      message: `NDA signed by ${mySide} party.`,
      is_system: true,
    });

    const refreshed = await dealRoomApi.get(room.id);
    if (refreshed) {
      const buyerSigned = refreshed.buyer_nda_status === "signed";
      const sellerSigned = refreshed.seller_nda_status === "signed";

      if (buyerSigned && sellerSigned && refreshed.status !== "active") {
        await dealRoomApi.update(room.id, { status: "active", fully_activated_at: now });
        await dealRoomApi.updateParticipants(room.id, { can_view: true, can_message: true, can_download: true });

        await dealRoomApi.createAuditLog({
          entity_type: "deal_room",
          entity_id: room.id,
          user_id: user.id,
          action: "deal_room_activated",
          meta: {
            yacht_id: room.yacht_id,
            buyer_id: room.buyer_user_id,
            seller_id: room.seller_user_id,
            activated_at: now,
          },
        });

        await dealRoomApi.sendMessage(room.id, {
          sender_id: user.id,
          message: "Deal room activated after NDA completion by both parties. Full access is now available.",
          is_system: true,
        });
      } else if (buyerSigned !== sellerSigned) {
        await dealRoomApi.update(room.id, { status: "partially_signed" });
      }
    }

    setAcceptingNda(false);
    loadRoom();
  }

  const refreshMessages = useCallback(async () => {
    if (!roomId) return;
    const newMsgs = ((await dealRoomApi.getMessages(roomId)) as DealRoomMessage[]) || [];
    setMessages(prev => {
      if (newMsgs.length !== prev.length) {
        if (isAtBottom) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
        return newMsgs;
      }
      return prev;
    });
  }, [roomId, isAtBottom]);

  useEffect(() => {
    if (!room || (room.status !== "active" && !isAdmin) || !chatPolling) return;
    const interval = setInterval(refreshMessages, 5000);
    return () => clearInterval(interval);
  }, [room, isAdmin, chatPolling, refreshMessages]);

  function handleChatScroll() {
    const el = chatContainerRef.current;
    if (!el) return;
    const atBot = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setIsAtBottom(atBot);
  }

  async function sendMessage() {
    if (!msgText.trim() || !room || !user) return;
    setSending(true);
    const text = msgText.trim();
    setMsgText("");

    const tempMsg: DealRoomMessage = {
      id: "temp-" + Date.now(),
      deal_room_id: room.id,
      sender_id: user.id,
      message: text,
      is_system: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    await dealRoomApi.sendMessage(room.id, { sender_id: user.id, message: text, is_system: false });
    await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user.id, action: "message_sent", meta: {} });
    setSending(false);
    await refreshMessages();
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
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={13} /> Messages
                    {messages.filter(m => !m.is_system).length > 0 && (
                      <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 font-bold">
                        {messages.filter(m => !m.is_system).length}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-3">
                    {Object.entries(participantMap).map(([uid, info]) => (
                      <div key={uid} className="flex items-center gap-1.5" title={info.email}>
                        <div className={`w-2 h-2 rounded-full ${uid === user?.id ? "bg-green-400" : "bg-white/20"}`} />
                        <span className="text-white/30 text-[10px] font-sans">
                          {uid === user?.id ? "You" : info.email.split("@")[0]}
                        </span>
                        <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 font-bold ${
                          info.role === "admin" ? "text-purple-400 bg-purple-400/10" :
                          info.role === "investor" ? "text-cyan-400 bg-cyan-400/10" :
                          info.role === "owner" ? "text-amber-400 bg-amber-400/10" :
                          "text-emerald-400 bg-emerald-400/10"
                        }`}>
                          {info.role === "investor" ? "buyer" : info.role === "admin" ? "admin" : info.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  ref={chatContainerRef}
                  onScroll={handleChatScroll}
                  className="h-[420px] overflow-y-auto p-6 space-y-3 scroll-smooth"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(200,164,107,0.15) transparent" }}
                >
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare size={32} className="text-white/10 mb-3" />
                      <p className="text-white/30 text-sm font-sans">No messages yet.</p>
                      <p className="text-white/15 text-xs font-sans mt-1">Start the conversation below.</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, idx) => {
                        const isOwn = msg.sender_id === user?.id;
                        const senderInfo = participantMap[msg.sender_id];
                        const senderName = senderInfo ? senderInfo.email.split("@")[0] : "Unknown";
                        const senderRole = senderInfo?.role || "";
                        const showSenderHeader = !isOwn && !msg.is_system && (idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id || messages[idx - 1]?.is_system);

                        const prevMsg = messages[idx - 1];
                        const showDateSep = idx === 0 || (prevMsg && new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString());

                        return (
                          <Fragment key={msg.id}>
                            {showDateSep && (
                              <div className="flex items-center gap-4 py-2">
                                <div className="flex-1 h-px bg-white/5" />
                                <span className="text-white/15 text-[10px] uppercase tracking-widest font-sans">
                                  {new Date(msg.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                                </span>
                                <div className="flex-1 h-px bg-white/5" />
                              </div>
                            )}

                            {msg.is_system ? (
                              <div className="flex justify-center">
                                <div className="bg-primary/5 border border-primary/10 px-4 py-2 max-w-[85%]">
                                  <p className="text-primary/50 text-[10px] uppercase tracking-widest mb-0.5 font-bold">System</p>
                                  <p className="text-primary/70 text-xs font-sans">{msg.message}</p>
                                  <p className="text-white/10 text-[10px] mt-1 font-sans text-right">
                                    {new Date(msg.created_at).toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.15 }}
                                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                              >
                                <div className={`max-w-[70%] ${isOwn ? "" : "pl-1"}`}>
                                  {showSenderHeader && (
                                    <div className="flex items-center gap-2 mb-1 ml-1">
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                        senderRole === "investor" ? "bg-cyan-500/20 text-cyan-400" :
                                        senderRole === "owner" ? "bg-amber-500/20 text-amber-400" :
                                        senderRole === "broker" ? "bg-emerald-500/20 text-emerald-400" :
                                        "bg-purple-500/20 text-purple-400"
                                      }`}>
                                        {senderName[0]?.toUpperCase()}
                                      </div>
                                      <span className="text-white/40 text-[11px] font-sans font-medium">{senderName}</span>
                                      <span className={`text-[9px] uppercase tracking-wider font-bold ${
                                        senderRole === "investor" ? "text-cyan-400/60" :
                                        senderRole === "owner" ? "text-amber-400/60" :
                                        senderRole === "broker" ? "text-emerald-400/60" :
                                        "text-purple-400/60"
                                      }`}>
                                        {senderRole === "investor" ? "buyer" : senderRole}
                                      </span>
                                    </div>
                                  )}
                                  <div className={`px-4 py-3 ${
                                    isOwn
                                      ? "bg-primary/15 border border-primary/20"
                                      : "bg-white/[0.04] border border-white/[0.06]"
                                  }`}>
                                    <p className="text-sm font-sans text-white/85 whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                                    <div className={`flex items-center gap-2 mt-1.5 ${isOwn ? "justify-end" : "justify-start"}`}>
                                      <p className="text-[10px] text-white/15 font-sans">
                                        {new Date(msg.created_at).toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                                      </p>
                                      {isOwn && msg.id.startsWith("temp-") && (
                                        <Loader2 size={9} className="text-white/20 animate-spin" />
                                      )}
                                      {isOwn && !msg.id.startsWith("temp-") && (
                                        <CheckCircle size={9} className="text-white/15" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </Fragment>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {!isAtBottom && messages.length > 5 && (
                  <div className="relative">
                    <button
                      onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
                      className="absolute right-6 -top-10 bg-primary/20 border border-primary/30 text-primary text-[10px] uppercase tracking-widest px-3 py-1.5 hover:bg-primary/30 transition-colors font-bold z-10"
                    >
                      ↓ New messages
                    </button>
                  </div>
                )}

                {(room.status === "active" || isAdmin) && (
                  <div className="border-t border-white/5 p-4">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <textarea
                          value={msgText}
                          onChange={e => setMsgText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                          rows={1}
                          className="w-full bg-white/[0.03] border border-white/10 px-4 py-3 text-white text-sm font-sans focus:outline-none focus:border-primary/30 resize-none min-h-[44px] max-h-[120px] placeholder:text-white/15 transition-colors"
                          style={{ scrollbarWidth: "none" }}
                          onInput={e => {
                            const t = e.currentTarget;
                            t.style.height = "auto";
                            t.style.height = Math.min(t.scrollHeight, 120) + "px";
                          }}
                        />
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={sending || !msgText.trim()}
                        className="self-end bg-primary text-background px-5 py-3 font-bold text-xs uppercase tracking-widest hover:bg-primary/90 disabled:opacity-20 transition-all flex items-center gap-2 h-[44px]"
                      >
                        {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        Send
                      </button>
                    </div>
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

    await dealRoomApi.update(room.id, updates);

    if (room.buyer_user_id && room.buyer_nda_status === "not_sent") {
      await dealRoomApi.createNdaEnvelope({ deal_room_id: room.id, user_id: room.buyer_user_id, side: "buyer", provider: "internal", status: "sent", sent_at: now, document_name: "PDYE NDA v1" });
    }
    if (room.seller_user_id && room.seller_nda_status === "not_sent") {
      await dealRoomApi.createNdaEnvelope({ deal_room_id: room.id, user_id: room.seller_user_id, side: "seller", provider: "internal", status: "sent", sent_at: now, document_name: "PDYE NDA v1" });
    }

    await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user?.id || "", action: "nda_sent", meta: { buyer: room.buyer_user_id, seller: room.seller_user_id } });
    await dealRoomApi.sendMessage(room.id, { sender_id: user?.id || "", message: "NDA documents have been sent to both parties for review and signature.", is_system: true });

    setSending(false);
    onReload();
  }

  async function closeRoom() {
    if (!confirm("Close this deal room?")) return;
    await dealRoomApi.update(room.id, { status: "closed" });
    await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user?.id || "", action: "deal_room_closed", meta: {} });
    onReload();
  }

  async function cancelRoom() {
    if (!confirm("Cancel this deal room? This cannot be undone.")) return;
    await dealRoomApi.update(room.id, { status: "cancelled" });
    await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user?.id || "", action: "deal_room_cancelled", meta: {} });
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
