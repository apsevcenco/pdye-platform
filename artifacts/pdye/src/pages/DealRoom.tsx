import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CabinetLayout } from "@/components/layout/CabinetLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, ArrowRight, ShieldAlert, Anchor, RefreshCw, Ship, Clock,
  CheckCircle, FileText, AlertTriangle, Eye, Shield, ChevronRight,
  ArrowLeft, X, Hash, Users, Calendar, ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { dealRoomApi } from "@/lib/dealRoomApi";
import { type DealRoom, DEAL_ROOM_STATUS_CONFIG } from "@/lib/dealTypes";

type RoomWithYacht = DealRoom & {
  yacht_name?: string;
  yacht_builder?: string;
  yacht_image?: string;
  my_side?: string;
};

type ApprovedSpec = {
  id: string;
  yacht_id: string;
  yacht_name?: string;
  yacht_builder?: string;
  approved_spec_access_at: string | null;
};

export default function DealRoomPage() {
  const { user, userProfile } = useAuth();
  const [rooms, setRooms] = useState<RoomWithYacht[]>([]);
  const [approvedSpecs, setApprovedSpecs] = useState<ApprovedSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  const isApproved = userProfile?.approved || userProfile?.role === "admin";
  const isAdmin = userProfile?.role === "admin";

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);

    let dealRooms: DealRoom[] = [];
    try {
      if (isAdmin) {
        dealRooms = (await dealRoomApi.list({})) as DealRoom[];
      } else {
        dealRooms = (await dealRoomApi.byUser(user!.id)) as DealRoom[];
      }
      dealRooms = dealRooms.filter(r => r.status !== "cancelled");
    } catch (e) {}

    const { data: specData } = await supabase
      .from("access_requests")
      .select("id, yacht_id, approved_spec_access_at")
      .eq("requester_id", user!.id)
      .or("status.eq.approved_spec,status.eq.approved")
      .eq("escalated_to_deal_room", false)
      .order("created_at", { ascending: false });

    const allYachtIds = [
      ...new Set([
        ...dealRooms.map(r => r.yacht_id),
        ...(specData || []).map((s: any) => s.yacht_id),
      ].filter(Boolean)),
    ];

    let yachtMap: Record<string, any> = {};
    if (allYachtIds.length > 0) {
      const { data: yachts } = await supabase
        .from("yachts")
        .select("id, name, builder, main_image, image")
        .in("id", allYachtIds);
      yachtMap = Object.fromEntries((yachts || []).map((y: any) => [y.id, y]));
    }

    setRooms(dealRooms.map(r => ({
      ...r,
      yacht_name: yachtMap[r.yacht_id]?.name || "Vessel",
      yacht_builder: yachtMap[r.yacht_id]?.builder || "",
      yacht_image: yachtMap[r.yacht_id]?.main_image || yachtMap[r.yacht_id]?.image || "",
      my_side: r.buyer_user_id === user!.id ? "Buyer" : r.seller_user_id === user!.id ? "Seller" : isAdmin ? "Admin" : "—",
    })));

    setApprovedSpecs((specData || []).map((s: any) => ({
      ...s,
      yacht_name: yachtMap[s.yacht_id]?.name || "Vessel",
      yacht_builder: yachtMap[s.yacht_id]?.builder || "",
    })));

    setLoading(false);
  }

  if (!user) {
    return (
      <CabinetLayout>
        <RestrictedScreen
          icon={<Lock size={32} className="text-primary" />}
          title="Login Required"
          text="Please log in to access the Deal Room."
          action={{ label: "Sign In", href: "/login" }}
        />
      </CabinetLayout>
    );
  }

  if (!isApproved) {
    return (
      <CabinetLayout>
        <RestrictedScreen
          icon={<RefreshCw size={32} className="text-primary animate-spin" style={{ animationDuration: "3s" }} />}
          title="Application Under Review"
          text="Your account is being reviewed. Access will be granted once approved — typically within 24–48 hours."
        />
      </CabinetLayout>
    );
  }

  const activeRooms = rooms.filter(r => r.status === "active");
  const ndaPendingRooms = rooms.filter(r => r.status === "nda_pending" || r.status === "partially_signed" || r.status === "draft");
  const closedRooms = rooms.filter(r => r.status === "closed");

  const needsAction = rooms.filter(r => r.status !== "closed" && r.status !== "cancelled" && (
    (r.buyer_user_id === user?.id && (r.buyer_nda_status === "sent" || r.buyer_commission_status === "sent")) ||
    (r.seller_user_id === user?.id && (r.seller_nda_status === "sent" || r.seller_commission_status === "sent"))
  ));

  const roomLabel = (r: DealRoom) => r.room_number ? `DR-${String(r.room_number).padStart(6, "0")}` : "";

  function goToFullView(roomId: string) {
    setLocation(`/dealroom/${roomId}`);
  }

  return (
    <CabinetLayout>
      <div className="min-h-screen bg-background pt-8 pb-20">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 md:px-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12">
            <span className="text-primary text-[10px] font-bold tracking-[0.25em] uppercase block mb-3">Secure Platform</span>
            <h1 className="font-display text-3xl md:text-4xl text-white mb-4">My Deal Rooms</h1>
            <p className="text-white/50 font-sans max-w-xl">
              Track your yacht access requests, approved specifications, and active deal rooms.
            </p>
          </motion.div>

          <div className="flex items-center gap-3 bg-primary/8 border border-primary/20 px-5 py-3.5 mb-10">
            <Lock size={14} className="text-primary flex-shrink-0" />
            <p className="text-primary text-xs font-sans tracking-wide">
              You are accessing a secure environment. All activity is logged. Information is subject to NDA.
            </p>
          </div>

          {needsAction.length > 0 && (
            <div className="bg-orange-500/5 border border-orange-500/20 p-5 mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-orange-500/15 flex items-center justify-center"><AlertTriangle size={16} className="text-orange-400" /></div>
                <div>
                  <p className="text-orange-400 text-sm font-bold">Action Required</p>
                  <p className="text-white/40 text-xs font-sans">You have documents waiting for your signature</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {needsAction.map(room => {
                  const isNda = (room.buyer_user_id === user?.id && room.buyer_nda_status === "sent") || (room.seller_user_id === user?.id && room.seller_nda_status === "sent");
                  const label = roomLabel(room);
                  return (
                    <div key={room.id} onClick={() => goToFullView(room.id)} className="flex items-center justify-between px-3 py-2 bg-orange-500/5 hover:bg-orange-500/10 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{room.yacht_name}</span>
                        {label && <span className="text-primary/40 text-[10px] font-mono">{label}</span>}
                      </div>
                      <span className="text-orange-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:underline">
                        {isNda ? "Sign NDA" : "Sign Commission"} <ChevronRight size={11} />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : rooms.length === 0 && approvedSpecs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Anchor size={40} className="text-white/15 mb-4" />
              <p className="font-display text-xl text-white/30 mb-2">No Active Deal Rooms</p>
              <p className="text-white/25 text-sm font-sans mb-6">Browse yacht listings and request details to start.</p>
              <Link href="/yachts">
                <div className="bg-primary text-background px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors cursor-pointer">
                  Browse Yachts
                </div>
              </Link>
            </div>
          ) : (
            <div className="space-y-10">
              {approvedSpecs.length > 0 && (
                <div>
                  <h2 className="font-display text-lg text-white mb-4 flex items-center gap-2">
                    <Eye size={16} className="text-blue-400" /> Approved Specifications
                  </h2>
                  <p className="text-white/30 text-xs font-sans mb-4">
                    These vessels have granted you extended specification access. Deal rooms have not been opened yet.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {approvedSpecs.map(spec => (
                      <Link key={spec.id} href={`/yacht/${spec.yacht_id}`}>
                        <div className="group border border-blue-500/15 bg-blue-500/3 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300 cursor-pointer p-5">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Eye size={13} className="text-blue-400" />
                                <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Spec Access</span>
                              </div>
                              <p className="text-white/50 text-xs font-sans mb-1">{spec.yacht_builder}</p>
                              {spec.approved_spec_access_at && (
                                <p className="text-white/20 text-[10px] font-sans">Approved {new Date(spec.approved_spec_access_at).toLocaleDateString("en-GB")}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold uppercase tracking-widest group-hover:gap-3 transition-all">
                              View Specs <ArrowRight size={13} />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {activeRooms.length > 0 && (
                <div>
                  <h2 className="font-display text-lg text-white mb-4 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-400" /> Active Deal Rooms
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeRooms.map(room => <RoomCard key={room.id} room={room} userId={user?.id} onSelect={() => goToFullView(room.id)} />)}
                  </div>
                </div>
              )}

              {ndaPendingRooms.length > 0 && (
                <div>
                  <h2 className="font-display text-lg text-white mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-orange-400" /> NDA Pending
                  </h2>
                  <p className="text-white/30 text-xs font-sans mb-4">
                    Deal rooms awaiting NDA signature from one or both parties.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ndaPendingRooms.map(room => <RoomCard key={room.id} room={room} userId={user?.id} onSelect={() => goToFullView(room.id)} />)}
                  </div>
                </div>
              )}

              {closedRooms.length > 0 && (
                <div>
                  <h2 className="font-display text-lg text-white mb-4 flex items-center gap-2 opacity-60">
                    <Shield size={16} className="text-white/30" /> Closed
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                    {closedRooms.map(room => <RoomCard key={room.id} room={room} userId={user?.id} onSelect={() => goToFullView(room.id)} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </CabinetLayout>
  );
}

function RoomCard({ room, userId, onSelect }: { room: RoomWithYacht; userId?: string; onSelect: () => void }) {
  const cfg = DEAL_ROOM_STATUS_CONFIG[room.status] || DEAL_ROOM_STATUS_CONFIG.draft;
  const isNdaPending = room.status === "nda_pending" || room.status === "partially_signed";
  const label = room.room_number ? `DR-${String(room.room_number).padStart(6, "0")}` : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
      className="group border border-white/8 bg-white/2 hover:border-primary/40 hover:bg-white/4 transition-all duration-300 cursor-pointer"
    >
      <div className="relative h-36 overflow-hidden bg-[#0a1526]">
        {room.yacht_image ? (
          <img src={room.yacht_image} alt={room.yacht_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Ship size={28} className="text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070f1a] via-[#070f1a]/30 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 border bg-black/50 ${cfg.color} border-current/20`}>
            {cfg.label}
          </span>
          {room.my_side && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-black/50 text-white/50 border border-white/10">
              {room.my_side}
            </span>
          )}
        </div>
        {isNdaPending && (
          <div className="absolute top-3 right-3 bg-orange-500/90 text-white text-[10px] font-bold px-2 py-1 flex items-center gap-1">
            <AlertTriangle size={10} /> NDA Required
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-display text-lg text-white group-hover:text-primary transition-colors">{room.yacht_name}</h3>
          {label && <span className="text-primary/40 text-[10px] font-mono">{label}</span>}
        </div>
        {room.yacht_builder && (
          <p className="text-white/40 text-xs font-sans mb-3">{room.yacht_builder}</p>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-3">
            {room.buyer_nda_status === "signed" && (
              <span className="text-[9px] text-green-400 border border-green-500/20 bg-green-500/5 px-2 py-0.5 flex items-center gap-1">
                <FileText size={8} /> Buyer NDA
              </span>
            )}
            {room.seller_nda_status === "signed" && (
              <span className="text-[9px] text-green-400 border border-green-500/20 bg-green-500/5 px-2 py-0.5 flex items-center gap-1">
                <FileText size={8} /> Seller NDA
              </span>
            )}
            {room.identities_revealed && (
              <span className="text-[9px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 flex items-center gap-1">
                <CheckCircle size={8} /> Unlocked
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-widest group-hover:gap-3 transition-all">
            View <ArrowRight size={13} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RestrictedScreen({ icon, title, text, action }: {
  icon: React.ReactNode; title: string; text: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-10">
          <Anchor size={26} className="text-primary" strokeWidth={2} />
          <span className="font-display text-2xl tracking-widest text-white">PDYE</span>
        </div>
        <div className="bg-[#0f1d33] border border-white/8 p-10">
          <div className="w-16 h-16 border border-primary/25 flex items-center justify-center mx-auto mb-6">{icon}</div>
          <h2 className="font-display text-2xl text-white mb-3">{title}</h2>
          <p className="text-white/50 font-sans text-sm leading-relaxed mb-6">{text}</p>
          {action && (
            <Link href={action.href}>
              <div className="bg-primary text-background font-bold uppercase tracking-widest py-3.5 px-8 text-xs hover:bg-primary/85 transition-colors cursor-pointer inline-block">
                {action.label}
              </div>
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}
