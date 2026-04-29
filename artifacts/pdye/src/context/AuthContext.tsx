import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { type Session, type User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  email: string;
  role: string | null;
  approved: boolean;
  platform_nda_signed?: boolean;
}

export interface NdaStatus {
  signed: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: UserProfile | null;
  ndaStatus: NdaStatus | null;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (email: string, password: string, role: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshNdaStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PROFILE_TIMEOUT = 5000;

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    const queryPromise = supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (error) return null;
        return (data as UserProfile) ?? null;
      });
    const timeoutPromise = new Promise<null>(resolve =>
      setTimeout(() => resolve(null), PROFILE_TIMEOUT)
    );
    return await Promise.race([queryPromise, timeoutPromise]);
  } catch {
    return null;
  }
}

async function fetchNdaStatus(token: string): Promise<NdaStatus | null> {
  try {
    const apiBase = import.meta.env.VITE_API_URL || "/api";
    const res = await fetch(`${apiBase}/platform-nda/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return { signed: !!body?.signed };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [ndaStatus, setNdaStatus] = useState<NdaStatus | null>(null);
  const fetchSeq = useRef(0); // monotonic counter to discard stale profile fetches
  const ndaSeq = useRef(0);

  async function loadProfile(userId: string): Promise<UserProfile | null> {
    const seq = ++fetchSeq.current;
    const profile = await fetchProfile(userId);
    if (fetchSeq.current !== seq) return profile; // superseded by newer fetch
    setUserProfile(profile);
    return profile;
  }

  async function loadNdaStatus(profile: UserProfile | null, token: string | undefined) {
    const seq = ++ndaSeq.current;
    // Admin is considered pre-signed (PDYE company side)
    if (profile?.role === "admin") {
      if (ndaSeq.current === seq) setNdaStatus({ signed: true });
      return;
    }
    if (!token) {
      if (ndaSeq.current === seq) setNdaStatus(null);
      return;
    }
    const status = await fetchNdaStatus(token);
    if (ndaSeq.current !== seq) return;
    setNdaStatus(status ?? { signed: false });
  }

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await loadProfile(s.user.id);
        }
      } catch {
        // network/timeout — leave userProfile as null, ProtectedRoute will retry
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (!mounted) return;
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await loadProfile(s.user.id);
        } else {
          fetchSeq.current++;
          ndaSeq.current++;
          setUserProfile(null);
          setNdaStatus(null);
        }
        // Ensure loading cleared after any auth event
        if (mounted) setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Whenever profile or session changes, (re)load NDA status accordingly
  useEffect(() => {
    if (user && userProfile) {
      loadNdaStatus(userProfile, session?.access_token);
    } else if (!user) {
      ndaSeq.current++;
      setNdaStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userProfile, session?.access_token]);

  async function refreshProfile() {
    if (!user) return;
    await loadProfile(user.id);
  }

  async function refreshNdaStatus() {
    if (!user) return;
    await loadNdaStatus(userProfile, session?.access_token);
  }

  async function login(email: string, password: string): Promise<{ error: string | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    // Hydrate React state BEFORE returning so the caller's setLocation()
    // lands on a route whose ProtectedRoute can immediately read user/profile/nda
    // and route correctly (e.g. → /platform-nda for unsigned users).
    // Without this, there is a race where onAuthStateChange has not yet pushed
    // user into state and ProtectedRoute redirects back to /login.
    if (data.session && data.user) {
      setSession(data.session);
      setUser(data.user);
      const profile = await loadProfile(data.user.id);
      await loadNdaStatus(profile, data.session.access_token);
    }
    return { error: null };
  }

  async function register(email: string, password: string, role: string): Promise<{ error: string | null }> {
    const normalized = email.trim().toLowerCase();

    try {
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const checkRes = await fetch(`${apiBase}/auth/check-email?email=${encodeURIComponent(normalized)}`);
      if (checkRes.ok) {
        const body = await checkRes.json();
        if (body?.exists) {
          return { error: "Этот email уже зарегистрирован. Войдите или используйте восстановление пароля." };
        }
      }
    } catch (e) {
      console.warn("[register] email pre-check failed, continuing:", e);
    }

    const { data, error } = await supabase.auth.signUp({ email: normalized, password });
    if (error) {
      const msg = error.message || "";
      if (/already|exists|registered/i.test(msg)) {
        return { error: "Этот email уже зарегистрирован. Войдите или используйте восстановление пароля." };
      }
      return { error: msg };
    }

    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { error: "Этот email уже зарегистрирован. Войдите или используйте восстановление пароля." };
    }

    if (data.user) {
      await supabase.from("users").upsert([{
        id: data.user.id,
        email: normalized,
        role,
        approved: false,
      }]);
    }

    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
      const profile = await loadProfile(data.session.user.id);
      await loadNdaStatus(profile, data.session.access_token);
    }

    return { error: null };
  }

  async function logout() {
    fetchSeq.current++;
    ndaSeq.current++;
    setUserProfile(null);
    setNdaStatus(null);
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, userProfile, ndaStatus, login, register, logout, refreshProfile, refreshNdaStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
