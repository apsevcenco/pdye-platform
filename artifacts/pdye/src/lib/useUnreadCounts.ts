import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import { dealRoomApi } from "./dealRoomApi";

const STORAGE_PREFIX = "pdye_seen_";
const EPOCH = "1970-01-01T00:00:00.000Z";

export type SectionKey =
  | "dealroom"
  | "adminAccessRequests"
  | "adminUsers"
  | "adminDealRoom"
  | "adminYachts";

export type UnreadCounts = Partial<Record<SectionKey, number>>;

function storageKey(role: string, section: string): string {
  return `${STORAGE_PREFIX}${role}_${section}`;
}

export function getLastSeen(role: string, section: string): string {
  if (typeof window === "undefined") return EPOCH;
  return localStorage.getItem(storageKey(role, section)) || EPOCH;
}

export function setLastSeen(role: string, section: string, iso: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(storageKey(role, section), iso); } catch {}
}

async function fetchAdminCounts(): Promise<UnreadCounts> {
  const arSeen = getLastSeen("admin", "adminAccessRequests");
  const usSeen = getLastSeen("admin", "adminUsers");
  const drSeen = getLastSeen("admin", "adminDealRoom");
  const yaSeen = getLastSeen("admin", "adminYachts");
  const out: UnreadCounts = {
    adminAccessRequests: 0, adminUsers: 0, adminYachts: 0, adminDealRoom: 0,
  };
  // Supabase query builders return PromiseLike (not Promise) so we wrap each
  // await in try/catch instead of chaining .catch().
  const tasks = [
    (async () => {
      try {
        const { count } = await supabase.from("access_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending").gt("created_at", arSeen);
        out.adminAccessRequests = count || 0;
      } catch { /* keep 0 */ }
    })(),
    (async () => {
      try {
        const { count } = await supabase.from("users")
          .select("id", { count: "exact", head: true })
          .eq("approved", false).gt("created_at", usSeen);
        out.adminUsers = count || 0;
      } catch { /* keep 0 */ }
    })(),
    (async () => {
      try {
        const { count } = await supabase.from("yachts")
          .select("id", { count: "exact", head: true })
          .eq("listing_status", "pending").gt("created_at", yaSeen);
        out.adminYachts = count || 0;
      } catch { /* keep 0 */ }
    })(),
    (async () => {
      try {
        const rooms = (await dealRoomApi.list({})) as any[];
        const arr = Array.isArray(rooms) ? rooms : [];
        out.adminDealRoom = arr.filter((r: any) => {
          const t = r.updated_at || r.created_at;
          return t && t > drSeen && r.status !== "cancelled";
        }).length;
      } catch { /* keep 0 */ }
    })(),
  ];
  await Promise.all(tasks);
  return out;
}

async function fetchUserCounts(role: string, userId: string): Promise<UnreadCounts> {
  const drSeen = getLastSeen(role, "dealroom");
  const out: UnreadCounts = { dealroom: 0 };
  try {
    const rooms = (await dealRoomApi.byUser(userId)) as any[];
    out.dealroom = (rooms || []).filter((r: any) => {
      const t = r.updated_at || r.created_at;
      return t && t > drSeen && r.status !== "cancelled";
    }).length;
  } catch { /* keep 0 */ }
  return out;
}

/**
 * Sidebar unread-badge driver. Polls cheap counts on a 60s interval and
 * persists "last seen" per (role, section) in localStorage. Calling
 * `markSeen(section)` zeroes the badge instantly and bumps last-seen so
 * subsequent polls don't resurrect it.
 *
 * Race-safety:
 *  - Each refresh() captures a monotonic `refreshId`; only the latest
 *    in-flight fetch is allowed to write into state. Older fetches that
 *    resolve later are dropped, so a slow request can't overwrite fresher
 *    data from a newer one.
 *  - markSeen() records the section's seen-at timestamp in a ref so any
 *    in-flight fetch (started before the markSeen) gets clamped to 0 for
 *    that section when it eventually resolves — preventing an old fetch
 *    from resurrecting a badge the user just cleared by clicking.
 */
export function useUnreadCounts(role: string | null, userId: string | null) {
  const [counts, setCounts] = useState<UnreadCounts>({});
  const cancelledRef = useRef(false);
  const latestRefreshIdRef = useRef(0);
  const seenSinceRef = useRef<Partial<Record<SectionKey, number>>>({});

  const refresh = useCallback(async () => {
    if (!role) return;
    const myId = ++latestRefreshIdRef.current;
    let next: UnreadCounts = {};
    if (role === "admin") {
      next = await fetchAdminCounts();
    } else if (userId) {
      next = await fetchUserCounts(role, userId);
    }
    // Drop stale results: only the most recent refresh may write state.
    if (cancelledRef.current || myId !== latestRefreshIdRef.current) return;
    // Clamp any section that was marked-seen AFTER this fetch was started.
    // The fetch ran against an older lastSeen so its count for that
    // section is stale — force it to 0 to honour the user's interaction.
    const clamped: UnreadCounts = { ...next };
    for (const k of Object.keys(seenSinceRef.current) as SectionKey[]) {
      clamped[k] = 0;
    }
    setCounts(clamped);
  }, [role, userId]);

  useEffect(() => {
    cancelledRef.current = false;
    seenSinceRef.current = {};
    refresh();
    const id = setInterval(() => { refresh(); }, 60_000);
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelledRef.current = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  const markSeen = useCallback((section: SectionKey) => {
    if (!role) return;
    setLastSeen(role, section, new Date().toISOString());
    // Remember that this section was just cleared so any in-flight fetch
    // resolving after this point is clamped to 0 (cleared on next refresh).
    seenSinceRef.current[section] = Date.now();
    setCounts(prev => ({ ...prev, [section]: 0 }));
  }, [role]);

  return { counts, markSeen, refresh };
}
