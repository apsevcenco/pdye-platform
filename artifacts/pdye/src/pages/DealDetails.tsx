import { useEffect, useState, useRef, useCallback, Fragment } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, FileText, Shield, Lock, Anchor, CheckCircle, Clock,
  Send, Download, AlertTriangle, RefreshCw, ShieldAlert, MessageSquare,
  Activity, ChevronDown, ChevronUp, Ship, Eye, Users, User, Loader2,
  Image, Briefcase, Scale, Settings, MapPin, Calendar, Hash,
  Circle, Minus, X, Upload, MoreVertical, Gavel, Package,
  Compass, Wrench, Home, Monitor, Navigation, Fuel, Wind,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { dealRoomApi } from "@/lib/dealRoomApi";
import {
  type DealRoom, type DealRoomMessage, type DealRoomDocument, type AuditLog,
  type BlockVisibility, type BlockKey,
  DEAL_ROOM_STATUS_CONFIG, DEAL_ROOM_TIMELINE, BLOCK_KEYS, BLOCK_LABELS, auditAction,
} from "@/lib/dealTypes";
import { NDA_TEXT, TERMS_TEXT, DISCLAIMER_TEXT } from "@/lib/legalText";

type YachtFull = {
  id: string; name: string; builder: string | null; length: string | null;
  year: string | null; main_image: string | null; image: string | null;
  model: string | null; price: number | null; currency: string | null;
  location: string | null; flag: string | null; hull_material: string | null;
  beam: string | null; draft: string | null; gross_tonnage: string | null;
  fuel_capacity: string | null; water_capacity: string | null;
  cabins: string | null; berths: string | null; crew_cabins: string | null;
  engines: string | null; engine_hours: string | null; cruising_speed: string | null;
  max_speed: string | null; range: string | null;
  description: string | null; status: string | null;
  gallery?: string | null; images?: string[] | null;
};

type TabKey = "overview" | "specs" | "documents" | "media" | "messages" | "legal" | "offers" | "activity";

const TABS: { key: TabKey; label: string; icon: any; adminOnly?: boolean; activeOnly?: boolean }[] = [
  { key: "overview", label: "Overview", icon: Ship },
  { key: "specs", label: "Specifications", icon: Compass },
  { key: "documents", label: "Documents", icon: FileText, activeOnly: true },
  { key: "media", label: "Media", icon: Image, activeOnly: true },
  { key: "messages", label: "Messages", icon: MessageSquare, activeOnly: true },
  { key: "legal", label: "Legal / NDA", icon: Shield },
  { key: "offers", label: "Offers", icon: Gavel, activeOnly: true },
  { key: "activity", label: "Activity", icon: Activity },
];

export default function DealDetails() {
  const params = useParams<{ id: string }>();
  const roomId = params.id;
  const { user, userProfile } = useAuth();
  const [room, setRoom] = useState<DealRoom | null>(null);
  const [yacht, setYacht] = useState<YachtFull | null>(null);
  const [messages, setMessages] = useState<DealRoomMessage[]>([]);
  const [documents, setDocuments] = useState<DealRoomDocument[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [ndaCheck, setNdaCheck] = useState(false);
  const [termsCheck, setTermsCheck] = useState(false);
  const [acceptingNda, setAcceptingNda] = useState(false);
  const [participantMap, setParticipantMap] = useState<Record<string, { email: string; role: string }>>({});
  const [chatPolling, setChatPolling] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [blocks, setBlocks] = useState<BlockVisibility | null>(null);
  const [commissionCheck, setCommissionCheck] = useState(false);
  const [signingCommission, setSigningCommission] = useState(false);

  const isAdmin = userProfile?.role === "admin";
  const isBuyer = room?.buyer_user_id === user?.id;
  const isSeller = room?.seller_user_id === user?.id;
  const mySide = isAdmin ? "admin" : isBuyer ? "buyer" : isSeller ? "seller" : "unknown";
  const isActivated = room?.status === "active";
  const isTerminal = room?.status === "closed" || room?.status === "cancelled";
  const showDealRoom = isActivated || isAdmin;
  const identitiesRevealed = room?.identities_revealed || false;
  const canSeeIdentities = isAdmin || identitiesRevealed;
  const isBlockUnlocked = (key: BlockKey) => isAdmin || blocks?.[key]?.is_unlocked || false;
  const roomLabel = room?.room_number ? `DR-${String(room.room_number).padStart(6, "0")}` : room?.id?.slice(0, 8).toUpperCase() || "";

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

      const { data: y } = await supabase.from("yachts").select("*").eq("id", data.yacht_id).single();
      if (y) setYacht(y as YachtFull);

      const participantIds = [data.buyer_user_id, data.seller_user_id, data.created_by_admin_id].filter(Boolean) as string[];
      if (participantIds.length > 0) {
        const { data: pUsers } = await supabaseAdmin.from("users").select("id, email, role").in("id", participantIds);
        const pMap: Record<string, { email: string; role: string }> = {};
        (pUsers || []).forEach((u: any) => { pMap[u.id] = { email: u.email, role: u.role }; });
        setParticipantMap(pMap);
      }

      const isRoomActive = data.status === "active" || data.status === "closed";
      const isUserAdmin = participantIds.includes(data.created_by_admin_id);
      if (isRoomActive || isUserAdmin) {
        const msgs = await dealRoomApi.getMessages(roomId!);
        setMessages((msgs as DealRoomMessage[]) || []);
        const docs = await dealRoomApi.getDocuments(roomId!);
        setDocuments((docs as DealRoomDocument[]) || []);
      }

      const logs = await dealRoomApi.getAuditLogs("deal_room", roomId!);
      setActivity((logs as AuditLog[]) || []);

      try {
        const blk = await dealRoomApi.getBlocks(roomId!);
        setBlocks(blk as BlockVisibility);
      } catch {}
    } catch (e) {}
    setLoading(false);
  }

  async function signCommission() {
    if (!room || !user || (mySide !== "buyer" && mySide !== "seller")) return;
    setSigningCommission(true);
    await dealRoomApi.signCommission(room.id, mySide, user.id);
    await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user.id, action: "commission_signed", meta: { side: mySide } });
    await dealRoomApi.sendMessage(room.id, { sender_id: user.id, message: `Commission Agreement signed by ${mySide} party.`, is_system: true });
    setSigningCommission(false);
    setCommissionCheck(false);
    loadRoom();
  }

  async function signNda() {
    if (!room || !user) return;
    if (mySide !== "buyer" && mySide !== "seller") return;
    setAcceptingNda(true);
    const now = new Date().toISOString();
    const updates: Record<string, any> = {};
    if (isBuyer) { updates.buyer_nda_status = "signed"; updates.buyer_nda_signed_at = now; }
    if (isSeller) { updates.seller_nda_status = "signed"; updates.seller_nda_signed_at = now; }
    await dealRoomApi.update(room.id, updates);
    await dealRoomApi.createNdaEnvelope({ deal_room_id: room.id, user_id: user.id, side: mySide, provider: "internal", status: "signed", signed_at: now, completed_at: now });
    await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user.id, action: "nda_signed", meta: { side: mySide } });
    await dealRoomApi.sendMessage(room.id, { sender_id: user.id, message: `NDA signed by ${mySide} party.`, is_system: true });
    const refreshed = await dealRoomApi.get(room.id);
    if (refreshed) {
      const buyerSigned = refreshed.buyer_nda_status === "signed";
      const sellerSigned = refreshed.seller_nda_status === "signed";
      if (buyerSigned && sellerSigned && refreshed.status !== "active") {
        await dealRoomApi.update(room.id, { status: "active", fully_activated_at: now });
        await dealRoomApi.updateParticipants(room.id, { can_view: true, can_message: true, can_download: true });
        await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user.id, action: "deal_room_activated", meta: { yacht_id: room.yacht_id, activated_at: now } });
        await dealRoomApi.sendMessage(room.id, { sender_id: user.id, message: "Deal room activated after NDA completion by both parties. Full access is now available.", is_system: true });
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
        if (isAtBottom) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
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
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  }

  async function sendMessage() {
    if (!msgText.trim() || !room || !user) return;
    setSending(true);
    const text = msgText.trim();
    setMsgText("");
    const tempMsg: DealRoomMessage = { id: "temp-" + Date.now(), deal_room_id: room.id, sender_id: user.id, message: text, is_system: false, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    await dealRoomApi.sendMessage(room.id, { sender_id: user.id, message: text, is_system: false });
    await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user.id, action: "message_sent", meta: {} });
    setSending(false);
    await refreshMessages();
  }

  if (!user) return <Layout><div className="min-h-screen flex items-center justify-center"><div className="text-center"><Lock size={32} className="text-primary mx-auto mb-4" /><p className="text-white/50 font-sans">Please log in to access this deal room.</p></div></div></Layout>;
  if (loading) return <Layout><div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div></Layout>;
  if (!room) return <Layout><div className="min-h-screen flex items-center justify-center"><div className="text-center"><ShieldAlert size={32} className="text-primary mx-auto mb-4" /><p className="text-white font-display text-xl mb-2">Deal Room Not Found</p><Link href="/dealroom" className="text-primary text-sm hover:underline">Back to Opportunities</Link></div></div></Layout>;

  const cfg = DEAL_ROOM_STATUS_CONFIG[room.status] || DEAL_ROOM_STATUS_CONFIG.draft;
  const myNdaStatus = isBuyer ? room.buyer_nda_status : isSeller ? room.seller_nda_status : "n/a";
  const showNdaForm = (room.status === "nda_pending" || room.status === "partially_signed" || room.status === "draft") && myNdaStatus !== "signed" && !isAdmin && myNdaStatus === "sent";
  const nextAction = getNextAction(room, mySide, isAdmin, myNdaStatus, {
    goToLegal: () => setActiveTab("legal"),
  });
  const userMsgCount = messages.filter(m => !m.is_system).length;

  const visibleTabs = TABS.filter(t => {
    if (t.adminOnly && !isAdmin) return false;
    if (t.activeOnly && !showDealRoom) return false;
    return true;
  });

  return (
    <Layout>
      <div className="min-h-screen bg-background pt-28 pb-20">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <Link href="/dealroom">
            <div className="flex items-center gap-2 text-white/40 hover:text-primary transition-colors mb-6 cursor-pointer text-sm font-sans">
              <ArrowLeft size={14} /> Back to Opportunities
            </div>
          </Link>

          {/* ══════ 1. TOP HEADER / SUMMARY BAR ══════ */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0f1d33] border border-white/8 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Hash size={14} className="text-primary/40" />
                  <span className="text-primary/80 text-xs font-mono font-bold">{roomLabel}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 border ${cfg.color} border-current/20 bg-black/30`}>
                    {cfg.label}
                  </span>
                  {isTerminal && <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20">Read Only</span>}
                  {room.archived && <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-white/5 text-white/30 border border-white/10">Archived</span>}
                </div>
                <h1 className="font-display text-2xl md:text-3xl text-white mb-1">
                  {isBlockUnlocked("yacht_name") ? yacht?.name || "Vessel" : `${yacht?.builder || "Vessel"} · ${yacht?.year || ""}`}
                </h1>
                <p className="text-white/40 text-sm font-sans">
                  {isBlockUnlocked("yacht_name")
                    ? [yacht?.builder, yacht?.model, yacht?.length ? `${yacht.length}m` : null, yacht?.year].filter(Boolean).join(" · ")
                    : "Full vessel identity disclosed after Commission Agreement"
                  }
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-sans">
                  <span className="text-white/25">Buyer</span>
                  <span className="text-white/60 text-right">{canSeeIdentities ? (participantMap[room.buyer_user_id || ""]?.email?.split("@")[0] || "—") : "Confidential"}</span>
                  <span className="text-white/25">Seller</span>
                  <span className="text-white/60 text-right">{canSeeIdentities ? (participantMap[room.seller_user_id || ""]?.email?.split("@")[0] || "—") : "Confidential"}</span>
                  <span className="text-white/25">Created</span>
                  <span className="text-white/60 text-right">{fmtDate(room.created_at)}</span>
                  <span className="text-white/25">Last Update</span>
                  <span className="text-white/60 text-right">{fmtDate(room.updated_at)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ══════ 2. STATUS TIMELINE / PROGRESS TRACKER ══════ */}
          <TransactionTimeline room={room} />

          {/* ══════ 3. NEXT ACTION / ACTION CENTER ══════ */}
          {nextAction && !isTerminal && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className={`border p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 ${nextAction.urgent ? "bg-orange-500/5 border-orange-500/20" : "bg-primary/5 border-primary/15"}`}
            >
              <div className="flex-1">
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${nextAction.urgent ? "text-orange-400" : "text-primary/70"}`}>
                  {nextAction.urgent ? "Action Required" : "Next Step"}
                </p>
                <p className="text-white text-sm font-sans">{nextAction.text}</p>
                {nextAction.who && <p className="text-white/30 text-xs font-sans mt-1">Responsible: {nextAction.who}</p>}
              </div>
              {nextAction.cta && (
                <button onClick={nextAction.ctaAction} className={`flex-shrink-0 px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${
                  nextAction.urgent
                    ? "bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25"
                    : "bg-primary text-background hover:bg-primary/90"
                }`}>
                  {nextAction.ctaIcon && <nextAction.ctaIcon size={12} />}
                  {nextAction.cta}
                </button>
              )}
            </motion.div>
          )}

          {/* ══════ TAB NAVIGATION ══════ */}
          <div className="flex gap-0 border-b border-white/8 mb-6 overflow-x-auto">
            {visibleTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const msgBadge = tab.key === "messages" && userMsgCount > 0;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 flex-shrink-0 ${
                    isActive ? "border-primary text-primary" : "border-transparent text-white/30 hover:text-white/60"
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                  {msgBadge && <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 font-bold">{userMsgCount}</span>}
                </button>
              );
            })}
          </div>

          {/* ══════ MAIN CONTENT + SIDEBAR ══════ */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              {activeTab === "overview" && <OverviewTab yacht={yacht} room={room} isBlockUnlocked={isBlockUnlocked} isAdmin={isAdmin} canSeeIdentities={canSeeIdentities} />}
              {activeTab === "specs" && <SpecificationsTab yacht={yacht} isBlockUnlocked={isBlockUnlocked} isAdmin={isAdmin} />}
              {activeTab === "documents" && showDealRoom && (isBlockUnlocked("documents") ? <DocumentsTab documents={documents} isAdmin={isAdmin} isTerminal={isTerminal} /> : <LockedBlockNotice block="documents" />)}
              {activeTab === "media" && showDealRoom && (isBlockUnlocked("photos") ? <MediaTab yacht={yacht} isBlockUnlocked={isBlockUnlocked} isAdmin={isAdmin} /> : <LockedBlockNotice block="photos" />)}
              {activeTab === "messages" && showDealRoom && (isBlockUnlocked("chat") ? (
                <MessagesTab
                  messages={messages} participantMap={participantMap} user={user}
                  msgText={msgText} setMsgText={setMsgText} sendMessage={sendMessage}
                  sending={sending} isTerminal={isTerminal} room={room} isAdmin={isAdmin}
                  chatContainerRef={chatContainerRef} messagesEndRef={messagesEndRef}
                  handleChatScroll={handleChatScroll} isAtBottom={isAtBottom}
                  canSeeIdentities={canSeeIdentities}
                />
              ) : <LockedBlockNotice block="chat" />)}
              {activeTab === "legal" && (
                <LegalTab room={room} mySide={mySide} myNdaStatus={myNdaStatus}
                  showNdaForm={showNdaForm} ndaCheck={ndaCheck} termsCheck={termsCheck}
                  setNdaCheck={setNdaCheck} setTermsCheck={setTermsCheck}
                  signNda={signNda} acceptingNda={acceptingNda}
                  participantMap={participantMap} canSeeIdentities={canSeeIdentities}
                  commissionCheck={commissionCheck} setCommissionCheck={setCommissionCheck}
                  signCommission={signCommission} signingCommission={signingCommission}
                />
              )}
              {activeTab === "offers" && showDealRoom && <OffersTab isTerminal={isTerminal} />}
              {activeTab === "activity" && <ActivityTab activity={activity} participantMap={participantMap} isAdmin={isAdmin} />}
            </div>

            {/* ══════ RIGHT SIDEBAR ══════ */}
            <div className="w-full lg:w-[300px] flex-shrink-0 space-y-4">
              <SidebarStatus room={room} cfg={cfg} roomLabel={roomLabel} />
              <SidebarParticipants room={room} participantMap={participantMap} canSeeIdentities={canSeeIdentities} />
              <SidebarNda room={room} />
              {room.commission_status && room.commission_status !== "not_started" && <SidebarCommission room={room} />}
              {isAdmin && blocks && <SidebarBlocks blocks={blocks} roomId={room.id} onReload={loadRoom} />}
              {activity.length > 0 && <SidebarRecentActivity activity={activity.slice(0, 6)} participantMap={participantMap} />}
              {isAdmin && !isTerminal && <AdminControls room={room} onReload={loadRoom} />}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ═══════════════════════════════════════════════════
   HELPER: next action logic
   ═══════════════════════════════════════════════════ */
function getNextAction(room: DealRoom, mySide: string, isAdmin: boolean, myNdaStatus: string, actions: { goToLegal: () => void }) {
  if (room.status === "closed" || room.status === "cancelled") return null;
  if (room.status === "draft") {
    if (isAdmin) return { text: "NDA documents need to be sent to both parties.", who: "Admin", cta: "Send NDA", ctaIcon: Send, urgent: true, ctaAction: actions.goToLegal };
    return { text: "Deal room created. Waiting for admin to send NDA documents.", who: "Platform Admin", urgent: false, cta: null, ctaAction: undefined, ctaIcon: null };
  }
  if (room.status === "nda_pending") {
    if (myNdaStatus === "sent" && mySide !== "admin") return { text: "Please review and sign the NDA to proceed.", who: "You", cta: "Sign NDA", ctaIcon: Shield, urgent: true, ctaAction: actions.goToLegal };
    if (myNdaStatus === "signed") return { text: "Your NDA is signed. Waiting for the other party to sign.", who: "Counterparty", urgent: false, cta: null, ctaAction: undefined, ctaIcon: null };
    if (isAdmin) return { text: "Waiting for both parties to sign NDA.", who: "Buyer & Seller", urgent: false, cta: null, ctaAction: undefined, ctaIcon: null };
    return { text: "NDA documents have been sent. Please review and sign.", who: "Both Parties", urgent: true, cta: "Review NDA", ctaIcon: Shield, ctaAction: actions.goToLegal };
  }
  if (room.status === "partially_signed") {
    const buyerSigned = room.buyer_nda_status === "signed";
    const sellerSigned = room.seller_nda_status === "signed";
    if (!buyerSigned && mySide === "buyer") return { text: "Please sign the NDA to activate the deal room.", who: "You (Buyer)", cta: "Sign NDA", ctaIcon: Shield, urgent: true, ctaAction: actions.goToLegal };
    if (!sellerSigned && mySide === "seller") return { text: "Please sign the NDA to activate the deal room.", who: "You (Seller)", cta: "Sign NDA", ctaIcon: Shield, urgent: true, ctaAction: actions.goToLegal };
    return { text: `Waiting for ${!buyerSigned ? "buyer" : "seller"} to sign NDA.`, who: !buyerSigned ? "Buyer" : "Seller", urgent: false, cta: null, ctaAction: undefined, ctaIcon: null };
  }
  if (room.status === "active") {
    return { text: "Deal room is fully active. Documents, messages, and negotiations are available.", who: null, urgent: false, cta: null, ctaAction: undefined, ctaIcon: null };
  }
  return null;
}

/* ═══════════════════════════════════════════════════
   2. TRANSACTION TIMELINE
   ═══════════════════════════════════════════════════ */
const FULL_TIMELINE = [
  { key: "created", label: "Room Created", icon: Briefcase },
  { key: "nda_sent", label: "NDA Sent", icon: Send },
  { key: "buyer_signed", label: "Buyer NDA", icon: CheckCircle },
  { key: "seller_signed", label: "Seller NDA", icon: CheckCircle },
  { key: "activated", label: "Room Active", icon: Lock },
  { key: "negotiation", label: "Discussion", icon: MessageSquare },
  { key: "commission", label: "Commission", icon: Scale },
  { key: "revealed", label: "ID Revealed", icon: Eye },
  { key: "closed", label: "Completed", icon: CheckCircle },
];

function TransactionTimeline({ room }: { room: DealRoom }) {
  const stageMap: Record<string, boolean> = {
    created: true,
    nda_sent: room.buyer_nda_status !== "not_sent" || room.seller_nda_status !== "not_sent",
    buyer_signed: room.buyer_nda_status === "signed",
    seller_signed: room.seller_nda_status === "signed",
    activated: room.status === "active" || room.status === "closed",
    negotiation: room.status === "active" || room.status === "closed",
    commission: room.commission_status === "completed" || room.commission_status === "pending",
    revealed: room.identities_revealed === true,
    closed: room.status === "closed",
  };
  const isCancelled = room.status === "cancelled";

  return (
    <div className="bg-[#0f1d33] border border-white/8 p-5 mb-6">
      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-5">Transaction Progress</p>
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {FULL_TIMELINE.map((step, i) => {
          const completed = stageMap[step.key];
          const Icon = step.icon;
          const isCurrent = completed && (i === FULL_TIMELINE.length - 1 || !stageMap[FULL_TIMELINE[i + 1]?.key]);
          return (
            <div key={step.key} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center w-[80px]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCancelled ? "border-red-500/30 bg-red-500/10" :
                  completed ? (isCurrent ? "border-primary bg-primary text-background" : "border-primary/50 bg-primary/20 text-primary") :
                  "border-white/10 bg-transparent text-white/15"
                }`}>
                  {isCancelled ? <X size={12} className="text-red-400" /> : completed ? <Icon size={12} /> : <Circle size={8} />}
                </div>
                <p className={`text-[9px] mt-2 text-center leading-tight font-sans ${
                  isCancelled ? "text-red-400/50" : completed ? (isCurrent ? "text-primary font-bold" : "text-primary/60") : "text-white/15"
                }`}>
                  {step.label}
                </p>
              </div>
              {i < FULL_TIMELINE.length - 1 && (
                <div className={`w-6 h-0.5 mt-[-20px] ${completed && stageMap[FULL_TIMELINE[i + 1]?.key] ? "bg-primary/40" : "bg-white/5"}`} />
              )}
            </div>
          );
        })}
      </div>
      {isCancelled && <div className="mt-3 flex items-center gap-2 text-red-400 text-xs font-sans"><AlertTriangle size={12} /> This deal room has been cancelled.</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   4. OVERVIEW TAB
   ═══════════════════════════════════════════════════ */
function OverviewTab({ yacht, room, isBlockUnlocked, isAdmin, canSeeIdentities }: { yacht: YachtFull | null; room: DealRoom; isBlockUnlocked: (k: BlockKey) => boolean; isAdmin: boolean; canSeeIdentities: boolean }) {
  if (!yacht) return <EmptyState icon={Ship} text="Yacht information not available" />;
  const showName = isBlockUnlocked("yacht_name");
  const showLocation = isBlockUnlocked("location");
  const showFull = showName;
  return (
    <div className="space-y-6">
      {yacht.main_image && (
        <div className="relative overflow-hidden border border-white/8 bg-[#0f1d33]">
          <img src={yacht.main_image} alt={yacht.name || "Yacht"} className="w-full h-[300px] object-cover" />
          {!showFull && <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent flex items-end p-6"><p className="text-white/40 text-sm font-sans italic">Full gallery available after room activation</p></div>}
        </div>
      )}
      <div className="bg-[#0f1d33] border border-white/8 p-6">
        <h2 className="font-display text-xl text-white mb-4">{showFull ? yacht.name : `${yacht.builder || "Vessel"} · ${yacht.year || ""}`}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Builder", value: yacht.builder, icon: Wrench },
            { label: "Year", value: yacht.year, icon: Calendar },
            { label: "Length", value: yacht.length ? `${yacht.length}m` : null, icon: Compass },
            { label: "Flag", value: showLocation ? yacht.flag : "—", icon: Navigation },
          ].map(item => (
            <div key={item.label} className="bg-white/[0.02] border border-white/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <item.icon size={11} className="text-primary/40" />
                <span className="text-white/30 text-[10px] uppercase tracking-widest">{item.label}</span>
              </div>
              <p className="text-white text-sm font-sans">{item.value || "—"}</p>
            </div>
          ))}
        </div>
        {showFull && yacht.price && (
          <div className="bg-primary/5 border border-primary/15 p-4 mb-4">
            <p className="text-primary/50 text-[10px] uppercase tracking-widest mb-1">Asking Price / Guidance</p>
            <p className="text-primary text-xl font-display">{yacht.currency === "USD" ? "$" : yacht.currency === "GBP" ? "£" : "€"}{Number(yacht.price).toLocaleString()}</p>
          </div>
        )}
        {showLocation && yacht.location && (
          <div className="flex items-center gap-2 text-white/40 text-sm font-sans mb-4">
            <MapPin size={13} className="text-primary/40" />
            {yacht.location}
          </div>
        )}
        {!showLocation && (
          <div className="flex items-center gap-2 text-white/20 text-sm font-sans mb-4 italic">
            <Lock size={13} className="text-white/10" />
            Location disclosed after Commission Agreement
          </div>
        )}
        {yacht.description && (
          <div className="border-t border-white/5 pt-4">
            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-2">Summary</p>
            <p className="text-white/60 text-sm font-sans leading-relaxed whitespace-pre-wrap">{yacht.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   5. SPECIFICATIONS TAB
   ═══════════════════════════════════════════════════ */
function SpecificationsTab({ yacht, isBlockUnlocked, isAdmin }: { yacht: YachtFull | null; isBlockUnlocked: (k: BlockKey) => boolean; isAdmin: boolean }) {
  if (!yacht) return <EmptyState icon={Compass} text="Specifications not available" />;
  if (!isBlockUnlocked("specs") && !isAdmin) return <LockedBlockNotice block="specs" />;
  const showFull = isBlockUnlocked("location");
  const sections = [
    { title: "General", icon: Ship, rows: [
      ["Builder", yacht.builder], ["Model", yacht.model], ["Year", yacht.year],
      ["Flag", showFull ? yacht.flag : "—"], ["Hull Material", yacht.hull_material], ["Status", yacht.status],
    ]},
    { title: "Dimensions", icon: Compass, rows: [
      ["LOA", yacht.length ? `${yacht.length}m` : null], ["Beam", yacht.beam ? `${yacht.beam}m` : null],
      ["Draft", yacht.draft ? `${yacht.draft}m` : null], ["Gross Tonnage", yacht.gross_tonnage ? `${yacht.gross_tonnage} GT` : null],
    ]},
    { title: "Engines & Performance", icon: Settings, rows: [
      ["Engines", yacht.engines], ["Engine Hours", yacht.engine_hours],
      ["Cruising Speed", yacht.cruising_speed ? `${yacht.cruising_speed} kn` : null],
      ["Max Speed", yacht.max_speed ? `${yacht.max_speed} kn` : null],
      ["Range", yacht.range ? `${yacht.range} nm` : null],
    ]},
    { title: "Tankage", icon: Fuel, rows: [
      ["Fuel Capacity", yacht.fuel_capacity ? `${yacht.fuel_capacity}L` : null],
      ["Water Capacity", yacht.water_capacity ? `${yacht.water_capacity}L` : null],
    ]},
    { title: "Accommodation", icon: Home, rows: [
      ["Cabins", yacht.cabins], ["Berths", yacht.berths], ["Crew Cabins", yacht.crew_cabins],
    ]},
  ];

  return (
    <div className="space-y-4">
      {sections.map(section => {
        const hasData = section.rows.some(r => r[1]);
        if (!hasData) return null;
        const Icon = section.icon;
        return (
          <div key={section.title} className="bg-[#0f1d33] border border-white/8">
            <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
              <Icon size={13} className="text-primary/40" />
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{section.title}</p>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {section.rows.filter(r => r[1]).map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-white/35 text-sm font-sans">{label}</span>
                  <span className="text-white/80 text-sm font-sans">{value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   6. DOCUMENTS TAB
   ═══════════════════════════════════════════════════ */
const DOC_CATEGORIES = ["Brochure", "Specification", "Inventory", "Legal", "Registration", "Service", "Survey", "Photos", "Offers", "NDA / Signed"];

function DocumentsTab({ documents, isAdmin, isTerminal }: { documents: DealRoomDocument[]; isAdmin: boolean; isTerminal: boolean }) {
  if (documents.length === 0) return <EmptyState icon={FileText} text="No documents uploaded yet" sub="Documents will appear here once uploaded by the admin or participants." />;
  return (
    <div className="space-y-3">
      {documents.map(doc => (
        <div key={doc.id} className="bg-[#0f1d33] border border-white/8 flex items-center gap-4 px-5 py-4">
          <div className="w-9 h-9 bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-primary/60" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm truncate">{doc.title || "Untitled"}</p>
            <p className="text-white/30 text-xs font-sans">{doc.file_type || "Document"} · {fmtDate(doc.created_at)}</p>
          </div>
          {doc.file_path && (
            <a href={doc.file_path} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-widest hover:text-white transition-colors flex-shrink-0">
              <Download size={12} /> View
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   7. MEDIA TAB
   ═══════════════════════════════════════════════════ */
function MediaTab({ yacht, isBlockUnlocked, isAdmin }: { yacht: YachtFull | null; isBlockUnlocked: (k: BlockKey) => boolean; isAdmin: boolean }) {
  const showFull = isBlockUnlocked("photos");
  const images: string[] = [];
  if (yacht?.main_image) images.push(yacht.main_image);
  if (yacht?.image) images.push(yacht.image);
  try {
    if (yacht?.gallery) {
      const parsed = JSON.parse(yacht.gallery);
      if (Array.isArray(parsed)) images.push(...parsed);
    }
  } catch {}
  if (yacht?.images && Array.isArray(yacht.images)) images.push(...yacht.images);
  const unique = [...new Set(images)];

  if (!showFull) {
    return (
      <div className="bg-[#0f1d33] border border-white/8 p-12 text-center">
        <Lock size={32} className="text-white/10 mx-auto mb-4" />
        <p className="text-white/40 text-sm font-sans">Full media gallery unlocks after deal room activation.</p>
        {yacht?.main_image && (
          <div className="mt-6 mx-auto max-w-md relative overflow-hidden">
            <img src={yacht.main_image} alt="Preview" className="w-full h-48 object-cover opacity-40 blur-sm" />
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Lock size={20} className="text-white/20" />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (unique.length === 0) return <EmptyState icon={Image} text="No media available yet" sub="Photos and videos will appear here once uploaded." />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {unique.map((src, i) => (
        <a key={i} href={src} target="_blank" rel="noopener noreferrer"
          className="bg-[#0f1d33] border border-white/8 overflow-hidden group cursor-pointer">
          <img src={src} alt={`Photo ${i + 1}`} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
        </a>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   8. MESSAGES TAB
   ═══════════════════════════════════════════════════ */
type MessagesTabProps = {
  messages: DealRoomMessage[]; participantMap: Record<string, { email: string; role: string }>;
  user: { id: string } | null; msgText: string; setMsgText: (v: string) => void;
  sendMessage: () => void; sending: boolean; isTerminal: boolean; room: DealRoom;
  isAdmin: boolean; chatContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleChatScroll: () => void; isAtBottom: boolean; canSeeIdentities: boolean;
};
function MessagesTab({ messages, participantMap, user, msgText, setMsgText, sendMessage, sending, isTerminal, room, isAdmin, chatContainerRef, messagesEndRef, handleChatScroll, isAtBottom, canSeeIdentities }: MessagesTabProps) {
  return (
    <div className="bg-[#0f1d33] border border-white/8">
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <p className="text-white/60 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <MessageSquare size={13} /> Communication Hub
        </p>
        <div className="flex items-center gap-3">
          {Object.entries(participantMap).map(([uid, info]) => (
            <div key={uid} className="flex items-center gap-1.5" title={canSeeIdentities ? info.email : "Anonymous"}>
              <div className={`w-2 h-2 rounded-full ${uid === user?.id ? "bg-green-400" : "bg-white/15"}`} />
              <span className="text-white/30 text-[10px] font-sans">{uid === user?.id ? "You" : canSeeIdentities ? info.email?.split("@")[0] : "Anonymous"}</span>
              {canSeeIdentities && <RoleBadge role={info.role} />}
            </div>
          ))}
        </div>
      </div>

      <div ref={chatContainerRef} onScroll={handleChatScroll}
        className="h-[450px] overflow-y-auto p-5 space-y-3 scroll-smooth"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(200,164,107,0.15) transparent" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare size={32} className="text-white/10 mb-3" />
            <p className="text-white/30 text-sm font-sans">No messages yet</p>
            <p className="text-white/15 text-xs font-sans mt-1">Start the conversation below</p>
          </div>
        ) : (
          <>
            {messages.map((msg: DealRoomMessage, idx: number) => {
              const isOwn = msg.sender_id === user?.id;
              const senderInfo = participantMap[msg.sender_id];
              const senderName = isOwn ? (senderInfo ? senderInfo.email.split("@")[0] : "You") : canSeeIdentities ? (senderInfo ? senderInfo.email.split("@")[0] : "Unknown") : "Anonymous";
              const senderRole = canSeeIdentities ? (senderInfo?.role || "") : "";
              const showSenderHeader = !isOwn && !msg.is_system && (idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id || messages[idx - 1]?.is_system);
              const prevMsg = messages[idx - 1];
              const showDateSep = idx === 0 || (prevMsg && new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString());
              return (
                <Fragment key={msg.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-4 py-2">
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-white/15 text-[10px] uppercase tracking-widest font-sans">{fmtDateFull(msg.created_at)}</span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                  )}
                  {msg.is_system ? (
                    <div className="flex justify-center">
                      <div className="bg-primary/5 border border-primary/10 px-4 py-2 max-w-[85%]">
                        <p className="text-primary/50 text-[10px] uppercase tracking-widest mb-0.5 font-bold">System</p>
                        <p className="text-primary/70 text-xs font-sans">{msg.message}</p>
                        <p className="text-white/10 text-[10px] mt-1 font-sans text-right">{fmtTime(msg.created_at)}</p>
                      </div>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] ${isOwn ? "" : "pl-1"}`}>
                        {showSenderHeader && (
                          <div className="flex items-center gap-2 mb-1 ml-1">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${roleAvatarColor(senderRole)}`}>
                              {senderName[0]?.toUpperCase()}
                            </div>
                            <span className="text-white/40 text-[11px] font-sans font-medium">{senderName}</span>
                            <RoleBadge role={senderRole} />
                          </div>
                        )}
                        <div className={`px-4 py-3 ${isOwn ? "bg-primary/15 border border-primary/20" : "bg-white/[0.04] border border-white/[0.06]"}`}>
                          <p className="text-sm font-sans text-white/85 whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                          <div className={`flex items-center gap-2 mt-1.5 ${isOwn ? "justify-end" : "justify-start"}`}>
                            <p className="text-[10px] text-white/15 font-sans">{fmtTime(msg.created_at)}</p>
                            {isOwn && msg.id.startsWith("temp-") && <Loader2 size={9} className="text-white/20 animate-spin" />}
                            {isOwn && !msg.id.startsWith("temp-") && <CheckCircle size={9} className="text-white/15" />}
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
          <button onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute right-6 -top-10 bg-primary/20 border border-primary/30 text-primary text-[10px] uppercase tracking-widest px-3 py-1.5 hover:bg-primary/30 transition-colors font-bold z-10">
            ↓ New messages
          </button>
        </div>
      )}

      {!isTerminal && (room.status === "active" || isAdmin) && (
        <div className="border-t border-white/5 p-4">
          <div className="flex gap-3">
            <textarea value={msgText} onChange={(e: any) => setMsgText(e.target.value)}
              onKeyDown={(e: any) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type a message... (Enter to send)"
              rows={1}
              className="flex-1 bg-white/[0.03] border border-white/10 px-4 py-3 text-white text-sm font-sans focus:outline-none focus:border-primary/30 resize-none min-h-[44px] max-h-[120px] placeholder:text-white/15 transition-colors"
              style={{ scrollbarWidth: "none" }}
              onInput={(e: any) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }}
            />
            <button onClick={sendMessage} disabled={sending || !msgText.trim()}
              className="self-end bg-primary text-background px-5 py-3 font-bold text-xs uppercase tracking-widest hover:bg-primary/90 disabled:opacity-20 transition-all flex items-center gap-2 h-[44px]">
              {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   9. LEGAL / NDA TAB
   ═══════════════════════════════════════════════════ */
type LegalTabProps = {
  room: DealRoom; mySide: string; myNdaStatus: string; showNdaForm: boolean;
  ndaCheck: boolean; termsCheck: boolean; setNdaCheck: (v: boolean) => void;
  setTermsCheck: (v: boolean) => void; signNda: () => void; acceptingNda: boolean;
  participantMap: Record<string, { email: string; role: string }>;
  canSeeIdentities: boolean;
  commissionCheck: boolean; setCommissionCheck: (v: boolean) => void;
  signCommission: () => void; signingCommission: boolean;
};
function LegalTab({ room, mySide, myNdaStatus, showNdaForm, ndaCheck, termsCheck, setNdaCheck, setTermsCheck, signNda, acceptingNda, participantMap, canSeeIdentities, commissionCheck, setCommissionCheck, signCommission, signingCommission }: LegalTabProps) {
  const myCommissionStatus = mySide === "buyer" ? room.buyer_commission_status : mySide === "seller" ? room.seller_commission_status : "n/a";
  const showCommissionForm = room.commission_status === "pending" && myCommissionStatus === "sent" && mySide !== "admin";
  return (
    <div className="space-y-6">
      <div className="bg-[#0f1d33] border border-white/8 p-6">
        <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-5 flex items-center gap-2"><Shield size={13} /> 1. NDA Compliance (Entry Gate)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NdaPartyCard side="Buyer" status={room.buyer_nda_status} sentAt={room.buyer_nda_sent_at} signedAt={room.buyer_nda_signed_at} email={canSeeIdentities ? participantMap[room.buyer_user_id || ""]?.email : undefined} />
          <NdaPartyCard side="Seller" status={room.seller_nda_status} sentAt={room.seller_nda_sent_at} signedAt={room.seller_nda_signed_at} email={canSeeIdentities ? participantMap[room.seller_user_id || ""]?.email : undefined} />
        </div>
      </div>

      {room.fully_activated_at && (
        <div className="bg-green-500/5 border border-green-500/20 p-5 flex items-center gap-4">
          <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-400 text-sm font-bold">Deal Room Fully Activated</p>
            <p className="text-white/40 text-xs font-sans mt-0.5">Both parties signed NDA on {fmtDate(room.fully_activated_at)}</p>
          </div>
        </div>
      )}

      {showNdaForm && (
        <NdaSigningForm ndaCheck={ndaCheck} termsCheck={termsCheck} onNdaChange={setNdaCheck} onTermsChange={setTermsCheck} onAccept={signNda} accepting={acceptingNda} />
      )}

      {myNdaStatus === "signed" && room.status !== "active" && mySide !== "admin" && (
        <div className="bg-cyan-500/5 border border-cyan-500/20 p-6 text-center">
          <Shield size={24} className="text-cyan-400 mx-auto mb-3" />
          <h3 className="font-display text-lg text-white mb-1">NDA Signed — Awaiting Counterparty</h3>
          <p className="text-white/50 text-sm font-sans">Your NDA has been signed. The deal room will activate once the other party also signs.</p>
        </div>
      )}

      {room.status === "active" && (
        <div className="bg-[#0f1d33] border border-white/8 p-6">
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-5 flex items-center gap-2"><Scale size={13} /> 2. Commission Agreement (Identity Reveal Gate)</p>
          <p className="text-white/40 text-sm font-sans mb-4">
            Before participant identities, yacht name, and location are disclosed, both parties must sign the Commission Agreement.
            {room.commission_status === "not_started" && " The admin will initiate this process when the discussion phase concludes."}
          </p>
          {room.commission_status === "not_started" && (
            <div className="bg-white/[0.02] border border-white/5 p-4 text-center">
              <Clock size={20} className="text-white/15 mx-auto mb-2" />
              <p className="text-white/30 text-xs font-sans">Awaiting admin to initiate Commission Agreement</p>
            </div>
          )}
          {(room.commission_status === "pending" || room.commission_status === "completed") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <NdaPartyCard side="Buyer" status={room.buyer_commission_status} sentAt={null} signedAt={room.buyer_commission_signed_at} email={canSeeIdentities ? participantMap[room.buyer_user_id || ""]?.email : undefined} />
              <NdaPartyCard side="Seller" status={room.seller_commission_status} sentAt={null} signedAt={room.seller_commission_signed_at} email={canSeeIdentities ? participantMap[room.seller_user_id || ""]?.email : undefined} />
            </div>
          )}
          {showCommissionForm && (
            <div className="bg-[#0f1d33] border border-orange-500/20 p-6 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Scale size={16} className="text-orange-400" />
                <h3 className="font-display text-lg text-white">Commission Agreement</h3>
              </div>
              <div className="bg-black/30 border border-white/5 p-4 max-h-48 overflow-y-auto mb-4" style={{ scrollbarWidth: "thin" }}>
                <pre className="text-white/60 text-xs font-sans whitespace-pre-wrap leading-relaxed">
{`COMMISSION AGREEMENT

This Commission Agreement ("Agreement") governs the brokerage commission structure for the transaction facilitated through the Private Distressed Yacht Exchange (PDYE).

By signing below, both parties acknowledge and agree:

1. PDYE acts as an intermediary facilitating this transaction.
2. Commission rates as discussed and agreed upon apply.
3. Upon signing, the identities of all parties will be revealed.
4. The yacht name, location, and full vessel details will be disclosed.
5. All parties agree to the non-circumvention terms previously accepted.

This agreement is binding upon electronic signature.`}
                </pre>
              </div>
              <label className="flex items-start gap-3 cursor-pointer group mb-4">
                <input type="checkbox" checked={commissionCheck} onChange={e => setCommissionCheck(e.target.checked)} className="mt-1 accent-primary" />
                <span className="text-white/70 text-sm font-sans group-hover:text-white transition-colors">I have read and agree to the Commission Agreement terms</span>
              </label>
              <button onClick={signCommission} disabled={!commissionCheck || signingCommission}
                className="w-full bg-primary text-background py-4 font-bold text-sm uppercase tracking-widest hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {signingCommission ? <><RefreshCw size={14} className="animate-spin" /> Processing...</> : <><Scale size={14} /> Sign Commission Agreement</>}
              </button>
            </div>
          )}
          {myCommissionStatus === "signed" && room.commission_status !== "completed" && mySide !== "admin" && (
            <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 mt-4 text-center">
              <Scale size={20} className="text-cyan-400 mx-auto mb-2" />
              <p className="text-white text-sm font-bold">Commission Agreement Signed</p>
              <p className="text-white/40 text-xs font-sans mt-1">Waiting for counterparty to sign. Identities will be revealed once both sign.</p>
            </div>
          )}
          {room.commission_status === "completed" && (
            <div className="bg-green-500/5 border border-green-500/20 p-4 mt-4 flex items-center gap-4">
              <Eye size={20} className="text-green-400 flex-shrink-0" />
              <div>
                <p className="text-green-400 text-sm font-bold">Identities Revealed</p>
                <p className="text-white/40 text-xs font-sans mt-0.5">Both parties signed. Full identities, yacht name, and location are now visible.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-primary/5 border border-primary/15 p-5">
        <p className="text-primary/60 text-xs font-sans leading-relaxed">{DISCLAIMER_TEXT}</p>
      </div>
    </div>
  );
}

function NdaPartyCard({ side, status, sentAt, signedAt, email }: { side: string; status: string; sentAt: string | null; signedAt: string | null; email?: string }) {
  const isSigned = status === "signed";
  const isSent = status === "sent";
  return (
    <div className={`p-4 border ${isSigned ? "border-green-500/20 bg-green-500/5" : isSent ? "border-orange-500/20 bg-orange-500/5" : "border-white/5 bg-white/[0.02]"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{side} NDA</span>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border ${
          isSigned ? "text-green-400 border-green-500/20" : isSent ? "text-orange-400 border-orange-500/20" : "text-white/25 border-white/10"
        }`}>
          {isSigned ? "Signed" : isSent ? "Sent" : "Not Sent"}
        </span>
      </div>
      {email && <p className="text-white/40 text-xs font-sans mb-2">{email}</p>}
      <div className="space-y-1 text-xs font-sans">
        {sentAt && <p className="text-white/25"><span className="text-white/15">Sent:</span> {fmtDate(sentAt)}</p>}
        {signedAt && <p className="text-white/25"><span className="text-white/15">Signed:</span> {fmtDate(signedAt)}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   10. NDA SIGNING FORM
   ═══════════════════════════════════════════════════ */
function NdaSigningForm({ ndaCheck, termsCheck, onNdaChange, onTermsChange, onAccept, accepting }: {
  ndaCheck: boolean; termsCheck: boolean;
  onNdaChange: (v: boolean) => void; onTermsChange: (v: boolean) => void;
  onAccept: () => void; accepting: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-[#0f1d33] border border-orange-500/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-orange-400" />
          <h3 className="font-display text-lg text-white">Non-Disclosure Agreement</h3>
        </div>
        <div className="bg-black/30 border border-white/5 p-4 max-h-48 overflow-y-auto mb-4" style={{ scrollbarWidth: "thin" }}>
          <pre className="text-white/60 text-xs font-sans whitespace-pre-wrap leading-relaxed">{NDA_TEXT}</pre>
        </div>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" checked={ndaCheck} onChange={e => onNdaChange(e.target.checked)} className="mt-1 accent-primary" />
          <span className="text-white/70 text-sm font-sans group-hover:text-white transition-colors">I have read and agree to the Non-Disclosure Agreement</span>
        </label>
      </div>
      <div className="bg-[#0f1d33] border border-orange-500/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-orange-400" />
          <h3 className="font-display text-lg text-white">Terms of Access & Non-Circumvention</h3>
        </div>
        <div className="bg-black/30 border border-white/5 p-4 max-h-48 overflow-y-auto mb-4" style={{ scrollbarWidth: "thin" }}>
          <pre className="text-white/60 text-xs font-sans whitespace-pre-wrap leading-relaxed">{TERMS_TEXT}</pre>
        </div>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" checked={termsCheck} onChange={e => onTermsChange(e.target.checked)} className="mt-1 accent-primary" />
          <span className="text-white/70 text-sm font-sans group-hover:text-white transition-colors">I have read and agree to the Terms of Access and Non-Circumvention Agreement</span>
        </label>
      </div>
      <div className="bg-yellow-500/5 border border-yellow-500/20 p-3 flex items-center gap-3">
        <AlertTriangle size={14} className="text-yellow-400/60 flex-shrink-0" />
        <p className="text-yellow-400/60 text-[10px] font-sans">
          <span className="font-bold uppercase tracking-widest">Simulation Mode</span> — This is an internal NDA signing. In production, this will be handled via DocuSign.
        </p>
      </div>
      <button onClick={onAccept} disabled={!ndaCheck || !termsCheck || accepting}
        className="w-full bg-primary text-background py-4 font-bold text-sm uppercase tracking-widest hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
        {accepting ? <><RefreshCw size={14} className="animate-spin" /> Processing...</> : <><CheckCircle size={14} /> Sign NDA & Accept Terms</>}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   11. OFFERS TAB
   ═══════════════════════════════════════════════════ */
function OffersTab({ isTerminal }: { isTerminal: boolean }) {
  return (
    <div className="bg-[#0f1d33] border border-white/8 p-8 text-center">
      <Gavel size={32} className="text-white/10 mx-auto mb-4" />
      <h3 className="font-display text-lg text-white mb-2">Offers & Negotiation</h3>
      <p className="text-white/40 text-sm font-sans mb-4">No offers submitted yet.</p>
      <p className="text-white/20 text-xs font-sans">When ready, offers and LOI documents can be submitted and tracked in this section.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   12. ACTIVITY TAB
   ═══════════════════════════════════════════════════ */
function ActivityTab({ activity, participantMap, isAdmin }: { activity: AuditLog[]; participantMap: Record<string, { email: string; role: string }>; isAdmin: boolean }) {
  if (activity.length === 0) return <EmptyState icon={Activity} text="No activity recorded yet" />;
  return (
    <div className="bg-[#0f1d33] border border-white/8">
      <div className="px-5 py-3 border-b border-white/5">
        <p className="text-white/50 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Activity size={13} /> Audit Trail ({activity.length} entries)
        </p>
      </div>
      <div className="divide-y divide-white/[0.03] max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        {activity.map(log => {
          const who = log.user_id && participantMap[log.user_id] ? participantMap[log.user_id].email.split("@")[0] : "System";
          return (
            <div key={log.id} className="px-5 py-3 flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary/30 mt-1" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-sm font-sans">{auditAction(log.action)}</p>
                <p className="text-white/20 text-xs font-sans mt-0.5">by {who}</p>
              </div>
              <span className="text-white/15 text-xs font-sans flex-shrink-0">{fmtDateShort(log.created_at)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SIDEBAR COMPONENTS
   ═══════════════════════════════════════════════════ */
function LockedBlockNotice({ block }: { block: string }) {
  const label = BLOCK_LABELS[block as BlockKey] || block;
  return (
    <div className="bg-[#0f1d33] border border-white/8 p-12 text-center">
      <Lock size={32} className="text-white/10 mx-auto mb-4" />
      <h3 className="font-display text-lg text-white mb-2">{label} — Locked</h3>
      <p className="text-white/30 text-sm font-sans">This section is currently locked by admin. It will become available when the admin unlocks it.</p>
    </div>
  );
}

function SidebarStatus({ room, cfg, roomLabel }: { room: DealRoom; cfg: { label: string; color: string }; roomLabel: string }) {
  return (
    <div className="bg-[#0f1d33] border border-white/8 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Current Status</p>
        <span className="text-primary/80 text-xs font-mono font-bold">{roomLabel}</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${
          room.status === "active" ? "bg-green-400" :
          room.status === "closed" ? "bg-white/20" :
          room.status === "cancelled" ? "bg-red-400" :
          "bg-orange-400 animate-pulse"
        }`} />
        <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
        {room.archived && <span className="text-[9px] text-white/25 bg-white/5 px-1.5 py-0.5">ARCHIVED</span>}
      </div>
      <div className="space-y-1.5 text-xs font-sans">
        <div className="flex justify-between"><span className="text-white/25">Created</span><span className="text-white/50">{fmtDate(room.created_at)}</span></div>
        <div className="flex justify-between"><span className="text-white/25">Updated</span><span className="text-white/50">{fmtDate(room.updated_at)}</span></div>
        {room.fully_activated_at && <div className="flex justify-between"><span className="text-white/25">Activated</span><span className="text-green-400/80">{fmtDate(room.fully_activated_at)}</span></div>}
        {room.commission_fully_signed_at && <div className="flex justify-between"><span className="text-white/25">ID Revealed</span><span className="text-green-400/80">{fmtDate(room.commission_fully_signed_at)}</span></div>}
      </div>
    </div>
  );
}

function SidebarParticipants({ room, participantMap, canSeeIdentities }: { room: DealRoom; participantMap: Record<string, { email: string; role: string }>; canSeeIdentities: boolean }) {
  const parts = [
    { id: room.buyer_user_id, side: "Buyer", ndaStatus: room.buyer_nda_status },
    { id: room.seller_user_id, side: "Seller", ndaStatus: room.seller_nda_status },
    { id: room.created_by_admin_id, side: "Admin", ndaStatus: "n/a" },
  ].filter(p => p.id);

  return (
    <div className="bg-[#0f1d33] border border-white/8 p-5">
      <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={11} /> Participants</p>
      <div className="space-y-3">
        {parts.map(p => {
          const info = participantMap[p.id!];
          return (
            <div key={p.id} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${roleAvatarColor(canSeeIdentities ? (info?.role || "") : "")}`}>
                {canSeeIdentities || p.side === "Admin" ? (info?.email?.[0]?.toUpperCase() || "?") : "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/60 text-xs font-sans truncate">{canSeeIdentities || p.side === "Admin" ? (info?.email || "Unknown") : "Anonymous"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {(canSeeIdentities || p.side === "Admin") && <RoleBadge role={info?.role || ""} />}
                  <span className="text-[9px] text-white/20">{p.side}</span>
                  {p.ndaStatus === "signed" && <CheckCircle size={9} className="text-green-400" />}
                  {p.ndaStatus === "sent" && <Clock size={9} className="text-orange-400" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SidebarNda({ room }: { room: DealRoom }) {
  return (
    <div className="bg-[#0f1d33] border border-white/8 p-5">
      <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Shield size={11} /> NDA Status</p>
      <div className="space-y-2">
        {[
          { label: "Buyer", status: room.buyer_nda_status },
          { label: "Seller", status: room.seller_nda_status },
        ].map(n => (
          <div key={n.label} className="flex items-center justify-between">
            <span className="text-white/40 text-xs font-sans">{n.label}</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              n.status === "signed" ? "text-green-400" : n.status === "sent" ? "text-orange-400" : "text-white/20"
            }`}>
              {n.status === "signed" ? "✓ Signed" : n.status === "sent" ? "⏳ Sent" : "Not Sent"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SidebarCommission({ room }: { room: DealRoom }) {
  return (
    <div className="bg-[#0f1d33] border border-white/8 p-5">
      <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Scale size={11} /> Commission</p>
      <div className="space-y-2">
        {[
          { label: "Buyer", status: room.buyer_commission_status },
          { label: "Seller", status: room.seller_commission_status },
        ].map(n => (
          <div key={n.label} className="flex items-center justify-between">
            <span className="text-white/40 text-xs font-sans">{n.label}</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              n.status === "signed" ? "text-green-400" : n.status === "sent" ? "text-orange-400" : "text-white/20"
            }`}>
              {n.status === "signed" ? "Signed" : n.status === "sent" ? "Pending" : "Not Sent"}
            </span>
          </div>
        ))}
      </div>
      {room.identities_revealed && (
        <div className="mt-3 flex items-center gap-2 text-green-400/70 text-xs font-sans">
          <Eye size={10} /> Identities revealed
        </div>
      )}
    </div>
  );
}

function SidebarBlocks({ blocks, roomId, onReload }: { blocks: BlockVisibility; roomId: string; onReload: () => void }) {
  const { user } = useAuth();
  const [toggling, setToggling] = useState<string | null>(null);

  async function toggleBlock(key: BlockKey) {
    if (!user) return;
    setToggling(key);
    await dealRoomApi.setBlock(roomId, key, { is_unlocked: !blocks[key].is_unlocked, admin_id: user.id });
    await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: roomId, user_id: user.id, action: blocks[key].is_unlocked ? "block_locked" : "block_unlocked", meta: { block: key } });
    setToggling(null);
    onReload();
  }

  return (
    <div className="bg-[#0f1d33] border border-white/8 p-5">
      <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Settings size={11} /> Block Visibility</p>
      <div className="space-y-1.5">
        {BLOCK_KEYS.map(key => {
          const isOn = blocks[key]?.is_unlocked || false;
          const isLoading = toggling === key;
          return (
            <button key={key} onClick={() => toggleBlock(key)} disabled={isLoading}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-sans hover:bg-white/[0.03] transition-colors disabled:opacity-40">
              <span className="text-white/50">{BLOCK_LABELS[key]}</span>
              <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${isOn ? "text-green-400" : "text-red-400/50"}`}>
                {isLoading ? <RefreshCw size={9} className="animate-spin" /> : isOn ? <Eye size={9} /> : <Lock size={9} />}
                {isOn ? "Open" : "Locked"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SidebarRecentActivity({ activity, participantMap }: { activity: AuditLog[]; participantMap: Record<string, { email: string; role: string }> }) {
  return (
    <div className="bg-[#0f1d33] border border-white/8 p-5">
      <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={11} /> Recent Activity</p>
      <div className="space-y-2">
        {activity.map(log => (
          <div key={log.id} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/25 mt-1.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-white/50 text-[11px] font-sans truncate">{auditAction(log.action)}</p>
              <p className="text-white/15 text-[10px] font-sans">{fmtDateShort(log.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   13. ADMIN CONTROL PANEL
   ═══════════════════════════════════════════════════ */
function AdminControls({ room, onReload }: { room: DealRoom; onReload: () => void }) {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  const [ndaSent, setNdaSent] = useState(false);

  async function sendNda() {
    setSending(true);
    const now = new Date().toISOString();
    const updates: Record<string, any> = {};
    if (room.buyer_nda_status === "not_sent") { updates.buyer_nda_status = "sent"; updates.buyer_nda_sent_at = now; }
    if (room.seller_nda_status === "not_sent" && room.seller_user_id) { updates.seller_nda_status = "sent"; updates.seller_nda_sent_at = now; }
    if (room.status === "draft") updates.status = "nda_pending";
    await dealRoomApi.update(room.id, updates);
    if (room.buyer_user_id && room.buyer_nda_status === "not_sent") await dealRoomApi.createNdaEnvelope({ deal_room_id: room.id, user_id: room.buyer_user_id, side: "buyer", provider: "internal", status: "sent", sent_at: now });
    if (room.seller_user_id && room.seller_nda_status === "not_sent") await dealRoomApi.createNdaEnvelope({ deal_room_id: room.id, user_id: room.seller_user_id, side: "seller", provider: "internal", status: "sent", sent_at: now });
    await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user?.id || "", action: "nda_sent", meta: { mode: "simulation" } });
    await dealRoomApi.sendMessage(room.id, { sender_id: user?.id || "", message: "[SIMULATION] NDA documents sent to both parties for review and signature. Participants can sign from their Deal Room → Legal tab.", is_system: true });
    setSending(false);
    setNdaSent(true);
    setTimeout(() => setNdaSent(false), 8000);
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
  const canSendCommission = room.status === "active" && room.commission_status === "not_started";

  async function sendCommission() {
    setSending(true);
    await dealRoomApi.sendCommission(room.id, user?.id || "");
    await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user?.id || "", action: "commission_sent", meta: {} });
    await dealRoomApi.sendMessage(room.id, { sender_id: user?.id || "", message: "Commission Agreement sent to both parties for review and signature.", is_system: true });
    setSending(false);
    onReload();
  }

  async function toggleArchive() {
    const newArchived = !room.archived;
    await dealRoomApi.archive(room.id, newArchived);
    await dealRoomApi.createAuditLog({ entity_type: "deal_room", entity_id: room.id, user_id: user?.id || "", action: newArchived ? "deal_room_archived" : "deal_room_unarchived", meta: {} });
    onReload();
  }

  return (
    <div className="bg-[#0f1d33] border border-white/8 p-5">
      <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2"><Settings size={11} /> Admin Controls</p>
      <div className="space-y-2">
        {canSendNda && (
          <>
            <div className="bg-yellow-500/5 border border-yellow-500/20 p-2.5 text-center">
              <p className="text-yellow-400/70 text-[9px] font-bold uppercase tracking-widest">Simulation Mode — No DocuSign</p>
              <p className="text-white/30 text-[10px] font-sans mt-0.5">NDA will be available for signing inside each participant's Deal Room</p>
            </div>
            <button onClick={sendNda} disabled={sending}
              className="w-full flex items-center justify-center gap-2 bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25 px-3 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-40">
              {sending ? <RefreshCw size={11} className="animate-spin" /> : <Send size={11} />} Send NDA
            </button>
          </>
        )}
        {ndaSent && (
          <div className="bg-green-500/10 border border-green-500/30 p-3 text-center animate-pulse">
            <p className="text-green-400 text-xs font-bold">NDA Sent Successfully</p>
            <p className="text-white/40 text-[10px] font-sans mt-0.5">Participants will see the NDA in their Legal tab</p>
          </div>
        )}
        {canSendCommission && (
          <button onClick={sendCommission} disabled={sending}
            className="w-full flex items-center justify-center gap-2 bg-purple-500/15 border border-purple-500/30 text-purple-400 hover:bg-purple-500/25 px-3 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-40">
            {sending ? <RefreshCw size={11} className="animate-spin" /> : <Scale size={11} />} Send Commission
          </button>
        )}
        {room.status !== "closed" && room.status !== "cancelled" && (
          <>
            <button onClick={closeRoom}
              className="w-full flex items-center justify-center gap-2 border border-white/10 text-white/40 hover:text-white hover:border-white/30 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors">
              Close Room
            </button>
            <button onClick={cancelRoom}
              className="w-full flex items-center justify-center gap-2 border border-red-500/20 text-red-400/50 hover:text-red-400 hover:border-red-500/40 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors">
              Cancel Room
            </button>
          </>
        )}
        <button onClick={toggleArchive}
          className="w-full flex items-center justify-center gap-2 border border-white/5 text-white/25 hover:text-white/50 hover:border-white/15 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors">
          {room.archived ? "Unarchive" : "Archive"} Room
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SHARED UTILITIES
   ═══════════════════════════════════════════════════ */
function EmptyState({ icon: Icon, text, sub }: { icon: any; text: string; sub?: string }) {
  return (
    <div className="bg-[#0f1d33] border border-white/8 p-12 text-center">
      <Icon size={32} className="text-white/10 mx-auto mb-4" />
      <p className="text-white/30 text-sm font-sans">{text}</p>
      {sub && <p className="text-white/15 text-xs font-sans mt-2">{sub}</p>}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const display = role === "investor" ? "Buyer" : role === "admin" ? "Admin" : role === "owner" ? "Owner" : role === "broker" ? "Broker" : role;
  const color = role === "investor" ? "text-cyan-400/60 bg-cyan-400/10" :
    role === "admin" ? "text-purple-400/60 bg-purple-400/10" :
    role === "owner" ? "text-amber-400/60 bg-amber-400/10" :
    "text-emerald-400/60 bg-emerald-400/10";
  return <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 font-bold ${color}`}>{display}</span>;
}

function roleAvatarColor(role: string) {
  if (role === "investor") return "bg-cyan-500/20 text-cyan-400";
  if (role === "owner") return "bg-amber-500/20 text-amber-400";
  if (role === "broker") return "bg-emerald-500/20 text-emerald-400";
  if (role === "admin") return "bg-purple-500/20 text-purple-400";
  return "bg-white/10 text-white/40";
}

function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"; }
function fmtDateFull(d: string) { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
function fmtDateShort(d: string) { return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
function fmtTime(d: string) { return new Date(d).toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit" }); }
