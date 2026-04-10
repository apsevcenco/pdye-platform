export const DEAL_STATUSES = [
  "created",
  "pending_admin_review",
  "approved",
  "rejected",
  "nda_pending",
  "nda_signed",
  "intro_sent",
  "active",
  "closed",
  "cancelled",
] as const;

export type DealStatus = (typeof DEAL_STATUSES)[number];

export type DealFlow = {
  id: string;
  yacht_id: string;
  request_id: string | null;
  buyer_id: string;
  broker_id: string | null;
  owner_id: string | null;
  created_by: string;
  status: DealStatus;
  nda_required: boolean;
  nda_accepted: boolean;
  nda_accepted_at: string | null;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  intro_locked: boolean;
  intro_sent_at: string | null;
  deal_room_enabled: boolean;
  closed_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DealMessage = {
  id: string;
  deal_id: string;
  sender_id: string;
  message: string;
  is_system: boolean;
  created_at: string;
  sender_email?: string;
};

export type DealDocument = {
  id: string;
  deal_id: string;
  title: string;
  file_path: string;
  file_type: string | null;
  is_sensitive: boolean;
  visible_to_buyer: boolean;
  visible_to_broker: boolean;
  visible_to_owner: boolean;
  uploaded_by: string;
  created_at: string;
};

export type DealActivityLog = {
  id: string;
  deal_id: string;
  user_id: string | null;
  action: string;
  meta: Record<string, unknown>;
  created_at: string;
};

export type DealParticipant = {
  id: string;
  deal_id: string;
  user_id: string;
  role: string;
  can_view: boolean;
  can_message: boolean;
  can_download: boolean;
  created_at: string;
  user_email?: string;
};

export type NdaAcceptanceLog = {
  id: string;
  deal_id: string;
  user_id: string;
  document_version: string;
  accepted: boolean;
  accepted_at: string;
};

export const DEAL_STATUS_CONFIG: Record<DealStatus, { label: string; color: string; step: number }> = {
  created:              { label: "Created",           color: "text-white/40",   step: 0 },
  pending_admin_review: { label: "Pending Review",    color: "text-yellow-400", step: 1 },
  approved:             { label: "Approved",          color: "text-blue-400",   step: 2 },
  rejected:             { label: "Rejected",          color: "text-red-400",    step: -1 },
  nda_pending:          { label: "NDA Pending",       color: "text-orange-400", step: 3 },
  nda_signed:           { label: "NDA Signed",        color: "text-green-400",  step: 4 },
  intro_sent:           { label: "Intro Sent",        color: "text-cyan-400",   step: 5 },
  active:               { label: "Active",            color: "text-green-400",  step: 6 },
  closed:               { label: "Closed",            color: "text-white/30",   step: 7 },
  cancelled:            { label: "Cancelled",         color: "text-red-300",    step: -1 },
};

export const TIMELINE_STEPS = [
  { key: "created",              label: "Request Submitted" },
  { key: "pending_admin_review", label: "Admin Review" },
  { key: "approved",             label: "Approved" },
  { key: "nda_pending",          label: "NDA Pending" },
  { key: "nda_signed",           label: "NDA Signed" },
  { key: "intro_sent",           label: "Intro Sent" },
  { key: "active",               label: "Deal Active" },
  { key: "closed",               label: "Closed" },
] as const;

/* ═══════════════════════════════════════════════════════════
   NEW ACCESS WORKFLOW TYPES (v2)
   Separates "spec access" from "deal room access"
   ═══════════════════════════════════════════════════════════ */

export const ACCESS_REQUEST_STATUSES = [
  "pending",
  "approved_spec",
  "rejected",
  "escalated",
  "archived",
] as const;

export type AccessRequestStatus = (typeof ACCESS_REQUEST_STATUSES)[number];

export type AccessRequestV2 = {
  id: string;
  yacht_id: string;
  requester_id: string;
  listing_owner_user_id: string | null;
  role: string;
  status: AccessRequestStatus;
  approved_spec_access: boolean;
  approved_spec_access_at: string | null;
  escalated_to_deal_room: boolean;
  deal_room_id: string | null;
  created_at: string;
  updated_at: string;
  yacht_name?: string;
  user_email?: string;
};

export const ACCESS_STATUS_CONFIG: Record<AccessRequestStatus, { label: string; color: string; icon: string }> = {
  pending:       { label: "Under Review",       color: "text-yellow-400", icon: "clock" },
  approved_spec: { label: "Spec Access Granted", color: "text-blue-400",   icon: "eye" },
  rejected:      { label: "Declined",           color: "text-red-400",    icon: "x" },
  escalated:     { label: "In Deal Room",       color: "text-green-400",  icon: "check" },
  archived:      { label: "Archived",           color: "text-white/30",   icon: "archive" },
};

export const DEAL_ROOM_STATUSES = [
  "draft",
  "nda_pending",
  "partially_signed",
  "active",
  "closed",
  "cancelled",
] as const;

export type DealRoomStatus = (typeof DEAL_ROOM_STATUSES)[number];

export type DealRoom = {
  id: string;
  room_number: number | null;
  yacht_id: string;
  access_request_id: string | null;
  created_by_admin_id: string;
  status: DealRoomStatus;
  buyer_user_id: string | null;
  seller_user_id: string | null;
  seller_type: string | null;
  nda_required: boolean;
  buyer_nda_status: string;
  seller_nda_status: string;
  buyer_nda_sent_at: string | null;
  seller_nda_sent_at: string | null;
  buyer_nda_signed_at: string | null;
  seller_nda_signed_at: string | null;
  fully_activated_at: string | null;
  archived: boolean;
  commission_status: string;
  buyer_commission_status: string;
  seller_commission_status: string;
  buyer_commission_signed_at: string | null;
  seller_commission_signed_at: string | null;
  commission_fully_signed_at: string | null;
  identities_revealed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  yacht_name?: string;
  yacht_builder?: string;
  yacht_image?: string;
  buyer_email?: string;
  seller_email?: string;
};

export const BLOCK_KEYS = ["specs", "photos", "documents", "chat", "location", "yacht_name", "identities"] as const;
export type BlockKey = (typeof BLOCK_KEYS)[number];

export type BlockVisibility = Record<BlockKey, {
  is_unlocked: boolean;
  unlocked_by: string | null;
  unlocked_at: string | null;
}>;

export const BLOCK_LABELS: Record<BlockKey, string> = {
  specs: "Specifications",
  photos: "Photos & Gallery",
  documents: "Documents",
  chat: "Chat / Messaging",
  location: "Location",
  yacht_name: "Yacht Name",
  identities: "Participant Identities",
};

export const DEAL_ROOM_STATUS_CONFIG: Record<DealRoomStatus, { label: string; color: string; step: number }> = {
  draft:            { label: "Draft",            color: "text-white/40",   step: 0 },
  nda_pending:      { label: "NDA Pending",      color: "text-orange-400", step: 1 },
  partially_signed: { label: "Partially Signed", color: "text-yellow-400", step: 2 },
  active:           { label: "Active",           color: "text-green-400",  step: 3 },
  closed:           { label: "Closed",           color: "text-white/30",   step: 4 },
  cancelled:        { label: "Cancelled",        color: "text-red-300",    step: -1 },
};

export const DEAL_ROOM_TIMELINE = [
  { key: "draft",            label: "Room Created" },
  { key: "nda_pending",      label: "NDA Sent" },
  { key: "partially_signed", label: "Partial Sign" },
  { key: "active",           label: "Room Active" },
  { key: "closed",           label: "Closed" },
] as const;

export type DealRoomParticipant = {
  id: string;
  deal_room_id: string;
  user_id: string;
  role: string;
  side: string | null;
  can_view: boolean;
  can_message: boolean;
  can_download: boolean;
  created_at: string;
  user_email?: string;
};

export type NdaEnvelope = {
  id: string;
  deal_room_id: string;
  user_id: string;
  side: string;
  provider: string;
  envelope_id: string | null;
  document_name: string | null;
  status: string;
  sent_at: string | null;
  signed_at: string | null;
  completed_at: string | null;
  raw_payload: unknown;
  created_at: string;
  updated_at: string;
};

export type DealRoomDocument = {
  id: string;
  deal_room_id: string;
  title: string;
  file_path: string;
  file_type: string | null;
  uploaded_by: string;
  visible_to_buyer: boolean;
  visible_to_seller: boolean;
  created_at: string;
};

export type DealRoomMessage = {
  id: string;
  deal_room_id: string;
  sender_id: string;
  message: string;
  is_system: boolean;
  created_at: string;
  sender_email?: string;
};

export type AuditLog = {
  id: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  action: string;
  meta: Record<string, unknown>;
  created_at: string;
};

export function auditAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
