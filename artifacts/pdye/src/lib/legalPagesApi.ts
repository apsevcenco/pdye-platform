import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export type LegalKind = "privacy" | "legal";

export interface LegalPage {
  kind: LegalKind;
  title: string;
  content: string;
  updated_at: string | null;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

export const legalPagesApi = {
  async get(kind: LegalKind): Promise<LegalPage> {
    const res = await fetch(`${API_BASE}/legal/${kind}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || "Failed to load");
    }
    return res.json();
  },

  async adminSave(kind: LegalKind, title: string, content: string): Promise<LegalPage> {
    const res = await fetch(`${API_BASE}/admin/legal/${kind}`, {
      method: "PUT",
      headers: await authHeaders(),
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || "Failed to save");
    }
    return res.json();
  },
};
