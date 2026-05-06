import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export type SiteContentMap = Record<string, Record<string, Record<string, string>>>;

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

export async function fetchSiteContent(): Promise<SiteContentMap> {
  const res = await fetch(`${API_BASE}/site-content`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Failed to load site content");
  }
  const json = await res.json();
  return (json.content || {}) as SiteContentMap;
}

export async function saveSiteSectionRemote(
  pageId: string,
  sectionId: string,
  data: Record<string, string>,
): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/site-content`, {
    method: "PUT",
    headers: await authHeaders(),
    body: JSON.stringify({ page_id: pageId, section_id: sectionId, data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Failed to save site content");
  }
}

export async function deleteSiteSectionRemote(
  pageId: string,
  sectionId: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/admin/site-content/${encodeURIComponent(pageId)}/${encodeURIComponent(sectionId)}`,
    { method: "DELETE", headers: await authHeaders() },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Failed to reset site content");
  }
}
