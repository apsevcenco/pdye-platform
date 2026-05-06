import { supabase } from "./supabase";

const API_BASE = "https://pdye-platform.onrender.com/api";

async function request(path: string, options?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  const authHeader: Record<string, string> = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...options?.headers,
    },
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(err.error || "API error");
  }
  return resp.json();
}

export const dealRoomApi = {
  list: (opts?: { includeArchived?: boolean }) => request(`/deal-rooms${opts?.includeArchived ? "?include_archived=true" : ""}`),
  get: (id: string) => request(`/deal-rooms/${id}`),
  create: (data: Record<string, any>) => request("/deal-rooms", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, any>) => request(`/deal-rooms/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request(`/deal-rooms/${id}`, { method: "DELETE" }),

  byUser: (userId: string) => request(`/deal-rooms/by-user/${userId}`),

  getParticipants: (roomId: string) => request(`/deal-rooms/${roomId}/participants`),
  getParticipantsInfo: (roomId: string): Promise<Record<string, { email: string; role: string }>> =>
    request(`/deal-rooms/${roomId}/participants-info`),
  addParticipant: (roomId: string, data: Record<string, any>) => request(`/deal-rooms/${roomId}/participants`, { method: "POST", body: JSON.stringify(data) }),
  updateParticipants: (roomId: string, data: Record<string, any>) => request(`/deal-rooms/${roomId}/participants`, { method: "PATCH", body: JSON.stringify(data) }),

  getMessages: (roomId: string) => request(`/deal-rooms/${roomId}/messages`),
  sendMessage: (roomId: string, data: { sender_id: string; message: string; is_system?: boolean }) =>
    request(`/deal-rooms/${roomId}/messages`, { method: "POST", body: JSON.stringify(data) }),

  getDocuments: (roomId: string) => request(`/deal-rooms/${roomId}/documents`),

  listAllDocuments: () => request("/deal-room-documents"),
  deleteDocument: (id: string) => request(`/deal-room-documents/${id}`, { method: "DELETE" }),

  listAllMessages: () => request("/deal-room-messages-all"),
  deleteMessage: (id: string) => request(`/deal-room-messages/${id}`, { method: "DELETE" }),

  createNdaEnvelope: (data: Record<string, any>) => request("/nda-envelopes", { method: "POST", body: JSON.stringify(data) }),

  createAuditLog: (data: { entity_type: string; entity_id: string; user_id: string; action: string; meta?: any }) =>
    request("/audit-logs", { method: "POST", body: JSON.stringify(data) }),
  getAuditLogs: (entityType: string, entityId: string) => request(`/audit-logs/${entityType}/${entityId}`),

  getBlocks: (roomId: string) => request(`/deal-rooms/${roomId}/blocks`),
  setBlock: (roomId: string, blockKey: string, data: { is_unlocked: boolean; admin_id: string }) =>
    request(`/deal-rooms/${roomId}/blocks/${blockKey}`, { method: "PUT", body: JSON.stringify(data) }),

  archive: (roomId: string, archived: boolean) =>
    request(`/deal-rooms/${roomId}/archive`, { method: "PATCH", body: JSON.stringify({ archived }) }),

  sendCommission: (roomId: string, adminId: string) =>
    request(`/deal-rooms/${roomId}/commission/send`, { method: "POST", body: JSON.stringify({ admin_id: adminId }) }),
};

export interface DealNdaDocument {
  id: string;
  version: string;
  title: string;
  content: string;
  content_hash: string;
  created_at?: string;
}

export interface DealNdaSignResponse {
  success: boolean;
  signature_id: string;
  signed_at: string;
  document_version: string;
  activated: boolean;
}

export const dealLegalApi = {
  getNdaDocument: (): Promise<DealNdaDocument> => request("/deal-nda/document"),

  signNda: (
    roomId: string,
    payload: {
      signature_name: string;
      accepted_read: boolean;
      accepted_understand: boolean;
      accepted_agree: boolean;
      document_id: string;
      content_hash: string;
    }
  ): Promise<DealNdaSignResponse> =>
    request(`/deal-rooms/${roomId}/nda/sign`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  downloadSignedNda: async (roomId: string, side: "buyer" | "seller"): Promise<Blob> => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const res = await fetch(
      `${API_BASE}/deal-rooms/${roomId}/nda/signed-pdf?side=${side}`,
      { headers }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || "Failed to download signed CNCA");
    }
    return res.blob();
  },
};

/* ─────────────────── Commission Agreement API ─────────────────── */

export type DealCommissionAudience = "broker" | "owner";

export interface DealCommissionDocument {
  id: string;
  version: string;
  title: string;
  content: string;
  content_hash: string;
  audience?: DealCommissionAudience;
  created_at?: string;
}

export interface DealCommissionSignResponse {
  success: boolean;
  signature_id: string;
  signed_at: string;
  document_version: string;
  both_signed: boolean;
}

export interface DealCommissionAudienceBundle {
  active: (DealCommissionDocument & { created_by?: string | null }) | null;
  history: Array<{
    id: string;
    version: string;
    title: string;
    content_hash: string;
    is_active: boolean;
    audience: DealCommissionAudience;
    created_at: string;
    created_by: string | null;
  }>;
}

export interface DealCommissionAdminBundle {
  broker: DealCommissionAudienceBundle;
  owner: DealCommissionAudienceBundle;
}

export interface DealCommissionSignatureRow {
  id: string;
  deal_room_id: string;
  user_id: string;
  side: "buyer" | "seller";
  user_email: string;
  signature_name: string;
  document_id: string;
  document_version: string;
  document_hash: string;
  ip: string | null;
  user_agent: string | null;
  signed_at: string;
}

export const dealCommissionApi = {
  getDocument: (opts?: { roomId?: string; audience?: DealCommissionAudience }): Promise<DealCommissionDocument> => {
    const params = new URLSearchParams();
    if (opts?.roomId) params.set("roomId", opts.roomId);
    else if (opts?.audience) params.set("audience", opts.audience);
    const qs = params.toString();
    return request(`/deal-commission/document${qs ? `?${qs}` : ""}`);
  },

  sign: (
    roomId: string,
    payload: {
      signature_name: string;
      accepted_read: boolean;
      accepted_understand: boolean;
      accepted_agree: boolean;
      document_id: string;
      content_hash: string;
    }
  ): Promise<DealCommissionSignResponse> =>
    request(`/deal-rooms/${roomId}/commission/sign`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  downloadSigned: async (roomId: string, side: "buyer" | "seller"): Promise<Blob> => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const res = await fetch(
      `${API_BASE}/deal-rooms/${roomId}/commission/signed-pdf?side=${side}`,
      { headers }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || "Failed to download signed Commission Agreement");
    }
    return res.blob();
  },

  // Admin
  adminGet: (): Promise<DealCommissionAdminBundle> => request("/admin/deal-commission"),
  adminPublish: (data: { version: string; title: string; content: string; audience: DealCommissionAudience }) =>
    request("/admin/deal-commission", { method: "PUT", body: JSON.stringify(data) }),
  adminListSignatures: (): Promise<DealCommissionSignatureRow[]> => request("/admin/deal-commission/signatures"),
};

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
