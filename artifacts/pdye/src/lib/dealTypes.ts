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
