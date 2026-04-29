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

export interface PlatformNdaDocument {
  id: string;
  version: string;
  title: string;
  content: string;
  content_hash: string;
  created_at: string;
  is_active?: boolean;
}

export interface PlatformNdaSignature {
  id: string;
  user_id?: string;
  user_email?: string;
  signature_name: string;
  document_id?: string;
  document_version: string;
  document_hash: string;
  ip?: string;
  user_agent?: string;
  signed_at: string;
  role?: string | null;
}

export const platformNdaApi = {
  getActiveDocument: (): Promise<PlatformNdaDocument> =>
    authFetch("/platform-nda"),

  getMyStatus: (): Promise<{ signed: boolean; signature: PlatformNdaSignature | null }> =>
    authFetch("/platform-nda/me"),

  sign: (data: {
    signature_name: string;
    accepted_read: boolean;
    accepted_understand: boolean;
    accepted_agree: boolean;
    document_id: string;
    content_hash: string;
  }): Promise<{ success: boolean; signature_id: string; signed_at: string; document_version: string }> =>
    authFetch("/platform-nda/sign", { method: "POST", body: JSON.stringify(data) }),

  adminGet: (): Promise<{ active: PlatformNdaDocument | null; history: PlatformNdaDocument[] }> =>
    authFetch("/admin/platform-nda"),

  adminPublish: (data: { version: string; title?: string; content: string }): Promise<PlatformNdaDocument> =>
    authFetch("/admin/platform-nda", { method: "PUT", body: JSON.stringify(data) }),

  adminListSignatures: (): Promise<PlatformNdaSignature[]> =>
    authFetch("/admin/platform-nda/signatures"),

  // Download the signed NDA as a PDF. Returns a Blob; caller is responsible for triggering the download.
  downloadSignedPdf: async (signatureId: string): Promise<Blob> => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const res = await fetch(`${API_BASE}/platform-nda/signature/${signatureId}/pdf`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || "Failed to download PDF");
    }
    return res.blob();
  },
};

/** Trigger a browser download for a Blob with the given filename. */
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
