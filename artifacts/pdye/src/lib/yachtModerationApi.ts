import { supabase } from "@/lib/supabase";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function call(path: string, body?: Record<string, any>): Promise<{ ok: boolean; listing_status?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  const siteUrl = (typeof window !== "undefined" ? window.location.origin : "");
  const payload = { ...(body || {}), siteUrl };
  const resp = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(json.error || `HTTP ${resp.status}`);
  }
  return json;
}

export const yachtModerationApi = {
  submit:  (yachtId: string) => call(`/yachts/${encodeURIComponent(yachtId)}/submit`),
  approve: (yachtId: string) => call(`/admin/yachts/${encodeURIComponent(yachtId)}/approve`),
  reject:  (yachtId: string, comment: string) => call(`/admin/yachts/${encodeURIComponent(yachtId)}/reject`, { comment }),
};

export type ListingStatus = "draft" | "pending" | "approved" | "rejected";

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  draft:    "Draft",
  pending:  "Awaiting Review",
  approved: "Live in Catalogue",
  rejected: "Changes Requested",
};

export const LISTING_STATUS_STYLE: Record<ListingStatus, string> = {
  draft:    "text-white/40 border-white/15 bg-white/5",
  pending:  "text-yellow-400 border-yellow-500/20 bg-yellow-500/8",
  approved: "text-green-400 border-green-500/20 bg-green-500/8",
  rejected: "text-red-400 border-red-500/20 bg-red-500/8",
};
