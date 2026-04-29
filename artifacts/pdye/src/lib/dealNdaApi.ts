import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function authFetch(path: string, options?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export interface DealNdaDocument {
  id: string;
  version: string;
  title: string;
  content: string;
  content_hash: string;
  created_at: string;
  is_active?: boolean;
}

export interface DealNdaSignature {
  id: string;
  deal_room_id: string;
  user_id: string;
  side: "buyer" | "seller";
  user_email: string;
  signature_name: string;
  document_id: string;
  document_version: string;
  document_hash: string;
  ip?: string | null;
  user_agent?: string | null;
  signed_at: string;
}

export const dealNdaApi = {
  adminGet: (): Promise<{ active: DealNdaDocument | null; history: DealNdaDocument[] }> =>
    authFetch("/admin/deal-nda"),

  adminPublish: (data: { version: string; title?: string; content: string }): Promise<DealNdaDocument> =>
    authFetch("/admin/deal-nda", { method: "PUT", body: JSON.stringify(data) }),

  adminListSignatures: (): Promise<DealNdaSignature[]> =>
    authFetch("/admin/deal-nda/signatures"),

  // Resolves the exact signature row by ID (audit-trail safe — unlike the
  // participant room+side endpoint, which returns only the most recent sig).
  downloadSignedPdf: async (signatureId: string): Promise<Blob> => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const res = await fetch(
      `${API_BASE}/admin/deal-nda/signatures/${signatureId}/pdf`,
      { headers }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || "Failed to download PDF");
    }
    return res.blob();
  },
};
