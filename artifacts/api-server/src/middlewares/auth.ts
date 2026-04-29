import type { Request, Response, NextFunction } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  _admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  status: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

function extractToken(req: Request): string | null {
  const h = req.headers.authorization || req.headers.Authorization;
  if (!h || typeof h !== "string") return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

async function resolveUser(token: string): Promise<AuthUser | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  const authU = data.user;
  // Look up profile to get role + status
  const { data: profile } = await sb
    .from("users")
    .select("role,status,email")
    .eq("id", authU.id)
    .maybeSingle();
  return {
    id: authU.id,
    email: (profile?.email as string | undefined) || authU.email || "",
    role: (profile?.role as string | undefined) || "investor",
    status: (profile?.status as string | undefined) || "active",
  };
}

export async function requireUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: "Authentication required" }); return; }
  const u = await resolveUser(token);
  if (!u) { res.status(401).json({ error: "Invalid or expired token" }); return; }
  if (u.status === "suspended" || u.status === "rejected") { res.status(403).json({ error: "Account not active" }); return; }
  req.authUser = u;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) { res.status(401).json({ error: "Authentication required" }); return; }
  const u = await resolveUser(token);
  if (!u) { res.status(401).json({ error: "Invalid or expired token" }); return; }
  if (u.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }
  req.authUser = u;
  next();
}

export async function optionalUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) { next(); return; }
  const u = await resolveUser(token).catch(() => null);
  if (u) req.authUser = u;
  next();
}
