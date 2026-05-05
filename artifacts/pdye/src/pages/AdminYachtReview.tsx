import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useLocation } from "wouter";
import { CabinetLayout } from "@/components/layout/CabinetLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  yachtModerationApi,
  LISTING_STATUS_LABEL,
  LISTING_STATUS_STYLE,
  type ListingStatus,
} from "@/lib/yachtModerationApi";
import {
  ArrowLeft, CheckCircle, XCircle, Loader2, ShieldCheck, Lock,
  User as UserIcon, Mail, Phone, Briefcase, MapPin, Calendar,
  Image as ImageIcon, FileText, AlertTriangle, ChevronLeft, ChevronRight, X,
} from "lucide-react";

type YachtFull = Record<string, any>;
type OwnerProfile = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  company?: string | null;
  phone?: string | null;
  location?: string | null;
} | null;

function Field({ label, value }: { label: string; value: any }) {
  if (value === null || value === undefined || value === "") return null;
  const display = typeof value === "object" ? JSON.stringify(value) : String(value);
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-white/40 text-xs font-sans tracking-wide flex-shrink-0">{label}</span>
      <span className="text-white/85 text-sm font-sans text-right break-words min-w-0">{display}</span>
    </div>
  );
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="bg-[#0f1d33] border border-white/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-primary text-xs font-bold uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function AdminYachtReview() {
  const { id } = useParams<{ id: string }>();
  const { userProfile, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const [yacht, setYacht] = useState<YachtFull | null>(null);
  const [owner, setOwner] = useState<OwnerProfile>(null);
  const [reviewer, setReviewer] = useState<{ email?: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState("");

  const [lightbox, setLightbox] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase.from("yachts").select("*").eq("id", id).maybeSingle();
    if (error || !data) {
      setErr(error?.message || "Yacht not found");
      setLoading(false);
      return;
    }
    setYacht(data as YachtFull);

    if (data.owner_id) {
      const { data: profile } = await supabase
        .from("users")
        .select("id, email, name, role, company, phone, location")
        .eq("id", data.owner_id)
        .maybeSingle();
      setOwner((profile as OwnerProfile) || { id: data.owner_id });
    } else {
      setOwner(null);
    }

    if (data.listing_reviewed_by) {
      const { data: rv } = await supabase
        .from("users")
        .select("email, name")
        .eq("id", data.listing_reviewed_by)
        .maybeSingle();
      setReviewer((rv as any) || null);
    } else {
      setReviewer(null);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (authLoading || loading) {
    return (
      <CabinetLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 size={28} className="text-primary animate-spin" />
        </div>
      </CabinetLayout>
    );
  }

  if (!userProfile || (userProfile as any).role !== "admin") {
    navigate("/dashboard");
    return null;
  }

  if (err && !yacht) {
    return (
      <CabinetLayout>
        <div className="min-h-screen bg-background pt-8 pb-16">
          <div className="max-w-3xl mx-auto px-6">
            <Link href="/admin" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm font-sans transition-colors mb-6">
              <ArrowLeft size={14} /> Admin
            </Link>
            <div className="bg-red-500/8 border border-red-500/20 p-6 text-red-400 text-sm font-sans">
              {err}
            </div>
          </div>
        </div>
      </CabinetLayout>
    );
  }

  if (!yacht) return null;

  const listingStatus = ((yacht.listing_status || "approved") as ListingStatus);
  const lstLabel = LISTING_STATUS_LABEL[listingStatus] ?? listingStatus;
  const lstStyle = LISTING_STATUS_STYLE[listingStatus] ?? LISTING_STATUS_STYLE.draft;

  const photos: string[] = Array.isArray(yacht.photos) ? yacht.photos : [];
  const documents: Array<{ name?: string; url?: string }> = Array.isArray(yacht.documents) ? yacht.documents : [];

  async function approve() {
    if (!yacht || busy) return;
    setBusy("approve");
    setErr(null);
    setInfo(null);
    try {
      await yachtModerationApi.approve(yacht.id);
      setInfo("Listing approved. The owner has been notified.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Approval failed");
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    if (!yacht || busy) return;
    const comment = rejectComment.trim();
    if (!comment) { setErr("Please provide a comment for the owner explaining the requested changes."); return; }
    setBusy("reject");
    setErr(null);
    setInfo(null);
    try {
      await yachtModerationApi.reject(yacht.id, comment);
      setInfo("Listing rejected. The owner has been notified with your comment.");
      setShowRejectModal(false);
      setRejectComment("");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Rejection failed");
    } finally {
      setBusy(null);
    }
  }

  const canDecide = listingStatus === "pending" || listingStatus === "draft";
  const isApproved = listingStatus === "approved";
  const isRejected = listingStatus === "rejected";

  return (
    <CabinetLayout>
      <div className="min-h-screen bg-background pt-8 pb-16">
        <div className="max-w-5xl mx-auto px-6 space-y-6">

          {/* Back + header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Link href="/admin" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm font-sans transition-colors">
              <ArrowLeft size={14} /> Admin
            </Link>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border ${lstStyle}`}>
                {lstLabel}
              </span>
              <Link
                href={`/yacht/${yacht.id}`}
                className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-primary border border-white/10 hover:border-primary/40 px-3 py-1.5 transition-colors"
              >
                Open Public Page
              </Link>
            </div>
          </div>

          {/* Title */}
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-sans mb-1">Listing Review</p>
            <h1 className="font-display text-3xl text-white">{yacht.name || "Untitled Listing"}</h1>
            <p className="text-white/40 text-sm font-sans mt-2">
              {[yacht.builder, yacht.length, yacht.year, yacht.type].filter(Boolean).join(" · ")}
            </p>
          </div>

          {/* Read-only banner */}
          <div className="flex items-center gap-2 bg-white/3 border border-white/8 px-4 py-2.5 text-white/60 text-xs font-sans">
            <Lock size={12} className="text-primary/70" />
            <span>Read-only review. The listing is owned by the user — the admin may approve or request changes, but cannot edit the data.</span>
          </div>

          {err && (
            <div className="bg-red-500/8 border border-red-500/20 px-4 py-3 text-red-400 text-sm font-sans flex items-center justify-between gap-4">
              <span>{err}</span>
              <button onClick={() => setErr(null)} className="text-red-400/60 hover:text-red-400 text-base leading-none">×</button>
            </div>
          )}
          {info && (
            <div className="bg-green-500/8 border border-green-500/20 px-4 py-3 text-green-400 text-sm font-sans flex items-center justify-between gap-4">
              <span>{info}</span>
              <button onClick={() => setInfo(null)} className="text-green-400/60 hover:text-green-400 text-base leading-none">×</button>
            </div>
          )}

          {/* Review history */}
          {(isApproved || isRejected) && (
            <Section title={isApproved ? "Approval Record" : "Rejection Record"} icon={isApproved ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}>
              <div className="space-y-1.5">
                <Field label="Reviewed by" value={reviewer?.name || reviewer?.email || (yacht.listing_reviewed_by ? String(yacht.listing_reviewed_by).slice(0, 8) + "…" : "—")} />
                <Field label="Reviewed at" value={yacht.listing_reviewed_at ? new Date(yacht.listing_reviewed_at).toLocaleString("en-GB") : "—"} />
                {isRejected && yacht.listing_review_comment && (
                  <div className="pt-2">
                    <p className="text-white/40 text-xs font-sans tracking-wide mb-2">Comment to owner</p>
                    <div className="border-l-2 border-red-400/40 bg-red-400/5 px-3 py-2 text-white/85 text-sm font-sans whitespace-pre-wrap">
                      {yacht.listing_review_comment}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Owner */}
          <Section title="Owner" icon={<UserIcon size={14} className="text-primary" />}>
            <div className="space-y-1.5">
              <Field label="Name" value={owner?.name || "—"} />
              <Field label="Email" value={owner?.email || "—"} />
              <Field label="Role" value={owner?.role || "—"} />
              <Field label="Company" value={owner?.company || "—"} />
              <Field label="Phone" value={owner?.phone || "—"} />
              <Field label="Location" value={owner?.location || "—"} />
              <Field label="User ID" value={yacht.owner_id || "—"} />
            </div>
            {owner?.id && (
              <Link
                href={`/admin/users/${owner.id}`}
                className="inline-flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-widest mt-4 hover:underline"
              >
                Open user profile <ChevronRight size={11} />
              </Link>
            )}
          </Section>

          {/* Photos */}
          <Section title={`Photos (${photos.length})`} icon={<ImageIcon size={14} className="text-primary" />}>
            {photos.length === 0 ? (
              <p className="text-white/30 text-sm font-sans">No photos uploaded.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {photos.map((url, i) => (
                  <button
                    key={url + i}
                    type="button"
                    onClick={() => setLightbox(i)}
                    className="relative aspect-[4/3] bg-white/5 border border-white/10 overflow-hidden group"
                  >
                    <img src={url} alt={`photo ${i + 1}`} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 text-center bg-primary text-background text-[8px] font-bold uppercase tracking-widest py-0.5">Main</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </Section>

          {/* Specs grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section title="Identity">
              <Field label="Name" value={yacht.name} />
              <Field label="Builder" value={yacht.builder} />
              <Field label="Type" value={yacht.type} />
              <Field label="Year Built" value={yacht.year} />
              <Field label="Last Refit" value={yacht.refit} />
              <Field label="Flag" value={yacht.flag} />
              <Field label="Condition" value={yacht.condition} />
              <Field label="Status" value={yacht.status} />
              <Field label="Private Listing" value={yacht.is_private ? "Yes" : "No"} />
            </Section>

            <Section title="Pricing & Location">
              <Field label="Asking Price" value={yacht.price} />
              <Field label="Market Value" value={yacht.market_price} />
              <Field label="Distressed Price" value={yacht.distressed_price} />
              <Field label="Location" value={yacht.location} />
            </Section>

            <Section title="Dimensions">
              <Field label="Length Overall" value={yacht.length} />
              <Field label="Beam" value={yacht.beam} />
              <Field label="Draft" value={yacht.draft} />
              <Field label="Displacement" value={yacht.displacement} />
              <Field label="Gross Tonnage" value={yacht.gross_tonnage} />
              <Field label="Hull Material" value={yacht.hull_material} />
              <Field label="Hull Type" value={yacht.hull_type} />
            </Section>

            <Section title="Performance">
              <Field label="Max Speed" value={yacht.max_speed} />
              <Field label="Cruise Speed" value={yacht.cruise_speed} />
              <Field label="Range" value={yacht.range} />
              <Field label="Fuel Type" value={yacht.fuel_type} />
              <Field label="Fuel Capacity" value={yacht.fuel_capacity} />
              <Field label="Water Capacity" value={yacht.water_capacity} />
            </Section>

            <Section title="Propulsion">
              <Field label="Engines" value={yacht.engines} />
              <Field label="Engine Count" value={yacht.engine_count} />
              <Field label="Horse Power" value={yacht.horse_power} />
            </Section>

            <Section title="Accommodation">
              <Field label="Guest Cabins" value={yacht.cabins} />
              <Field label="Heads / Bathrooms" value={yacht.heads} />
              <Field label="Berths" value={yacht.berths} />
              <Field label="Crew" value={yacht.crew} />
            </Section>
          </div>

          {/* Description (rendered as plain text — owner-controlled content must never run as HTML) */}
          {yacht.description && (
            <Section title="Description" icon={<FileText size={14} className="text-primary" />}>
              <p className="text-white/85 text-sm font-sans leading-relaxed whitespace-pre-wrap">{String(yacht.description)}</p>
            </Section>
          )}

          {/* Documents */}
          <Section title={`Documents (${documents.length})`} icon={<FileText size={14} className="text-primary" />}>
            {documents.length === 0 ? (
              <p className="text-white/30 text-sm font-sans">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((d, i) => (
                  <li key={(d.url || "") + i} className="flex items-center justify-between border border-white/8 px-3 py-2">
                    <span className="text-white/70 text-sm font-sans truncate">{d.name || `Document ${i + 1}`}</span>
                    {d.url && (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline">
                        Open
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Decision bar */}
          <div className="sticky bottom-4 bg-[#0a1426]/95 backdrop-blur-md border border-primary/20 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-primary" />
              <div>
                <p className="text-white text-sm font-medium">Moderation Decision</p>
                <p className="text-white/40 text-xs font-sans">
                  {canDecide ? "Approve to publish, or request changes with a comment." : isApproved ? "Already approved. Owner edits are live immediately." : "Already rejected. Owner has been notified."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={!!busy || isRejected}
                className="flex items-center gap-2 border border-red-400/40 text-red-400 hover:bg-red-400/10 disabled:opacity-30 disabled:cursor-not-allowed px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                <XCircle size={12} /> {isRejected ? "Already Rejected" : "Reject with Comment"}
              </button>
              <button
                onClick={approve}
                disabled={!!busy || isApproved}
                className="flex items-center gap-2 bg-primary text-background hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                {busy === "approve" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                {isApproved ? "Already Approved" : "Approve Listing"}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#0f1d33] border border-white/10 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-400" />
                <h2 className="font-display text-xl text-white">Request Changes</h2>
              </div>
              <button onClick={() => { setShowRejectModal(false); setRejectComment(""); }} className="text-white/40 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-white/50 text-sm font-sans">
              Write a clear note for the owner explaining what needs to change. The owner will receive this comment by email and on their dashboard.
            </p>
            <textarea
              value={rejectComment}
              onChange={e => setRejectComment(e.target.value)}
              rows={6}
              placeholder="e.g. Please re-upload the main photo in higher resolution and add the engine hours."
              className="w-full bg-[#070f1a] border border-white/10 focus:border-red-400/60 px-4 py-3 text-white text-sm focus:outline-none placeholder:text-white/20 font-sans resize-none"
              maxLength={4000}
            />
            <div className="flex items-center justify-between text-[10px] text-white/30 font-sans">
              <span>{rejectComment.length} / 4000</span>
              <span>The listing will return to the owner for editing.</span>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowRejectModal(false); setRejectComment(""); }}
                disabled={busy === "reject"}
                className="border border-white/10 text-white/50 hover:text-white/70 hover:border-white/30 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={reject}
                disabled={busy === "reject" || !rejectComment.trim()}
                className="flex items-center gap-2 bg-red-500 text-white hover:bg-red-500/90 disabled:opacity-30 disabled:cursor-not-allowed px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                {busy === "reject" ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                Send to Owner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button onClick={(e) => { e.stopPropagation(); setLightbox(null); }} className="absolute top-6 right-6 text-white/70 hover:text-white">
            <X size={22} />
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox(((lightbox - 1) + photos.length) % photos.length); }}
                className="absolute left-6 text-white/70 hover:text-white"
              ><ChevronLeft size={32} /></button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % photos.length); }}
                className="absolute right-6 text-white/70 hover:text-white"
              ><ChevronRight size={32} /></button>
            </>
          )}
          <img src={photos[lightbox]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </CabinetLayout>
  );
}
