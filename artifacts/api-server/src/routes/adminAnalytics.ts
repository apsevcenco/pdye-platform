import { Router, type IRouter } from "express";
import pg from "pg";
import { requireAdmin } from "../middlewares/auth";

let pool: pg.Pool | null = null;
function db(): pg.Pool {
  if (pool) return pool;
  const dbUrl = process.env["DATABASE_URL"];
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  pool = new pg.Pool({ connectionString: dbUrl, max: 5 });
  return pool;
}

async function safeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    const { rows } = await db().query(sql, params);
    return rows as T[];
  } catch (e: any) {
    const code = e?.code;
    if (code === "42P01" || code === "42703") return [];
    console.warn("[admin-analytics] query failed:", e?.message || e);
    return [];
  }
}

async function safeCount(sql: string, params: any[] = []): Promise<number> {
  const rows = await safeQuery<{ c: number }>(sql, params);
  return rows[0]?.c ?? 0;
}

const router: IRouter = Router();

// GET /api/admin/analytics
// Returns a single aggregated payload powering the admin Analytics page.
router.get("/admin/analytics", requireAdmin, async (_req, res) => {
  try {
    const [
      totalUsers,
      usersLast7,
      usersLast30,
      buyers,
      sellers,
      brokers,
      owners,
      admins,
      totalYachts,
      yachtsApproved,
      yachtsPending,
      yachtsRejected,
      totalDealRooms,
      activeDealRooms,
      commissionSigned,
      totalLeads,
      leadsLast30,
      platformNda,
      dealNda,
      accessRequests,
      pendingRequests,
      messages30,
    ] = await Promise.all([
      safeCount("SELECT COUNT(*)::int AS c FROM users"),
      safeCount("SELECT COUNT(*)::int AS c FROM users WHERE created_at > NOW() - INTERVAL '7 days'"),
      safeCount("SELECT COUNT(*)::int AS c FROM users WHERE created_at > NOW() - INTERVAL '30 days'"),
      safeCount("SELECT COUNT(*)::int AS c FROM users WHERE role IN ('buyer','investor')"),
      safeCount("SELECT COUNT(*)::int AS c FROM users WHERE role = 'seller'"),
      safeCount("SELECT COUNT(*)::int AS c FROM users WHERE role = 'broker'"),
      safeCount("SELECT COUNT(*)::int AS c FROM users WHERE role = 'owner'"),
      safeCount("SELECT COUNT(*)::int AS c FROM users WHERE role = 'admin'"),
      safeCount("SELECT COUNT(*)::int AS c FROM yachts"),
      safeCount("SELECT COUNT(*)::int AS c FROM yachts WHERE listing_status = 'approved' OR listing_status IS NULL"),
      safeCount("SELECT COUNT(*)::int AS c FROM yachts WHERE listing_status = 'pending'"),
      safeCount("SELECT COUNT(*)::int AS c FROM yachts WHERE listing_status = 'rejected'"),
      safeCount("SELECT COUNT(*)::int AS c FROM deal_rooms"),
      safeCount("SELECT COUNT(*)::int AS c FROM deal_rooms WHERE status = 'active'"),
      safeCount("SELECT COUNT(*)::int AS c FROM deal_rooms WHERE commission_fully_signed_at IS NOT NULL"),
      safeCount("SELECT COUNT(*)::int AS c FROM leads"),
      safeCount("SELECT COUNT(*)::int AS c FROM leads WHERE created_at > NOW() - INTERVAL '30 days'"),
      safeCount("SELECT COUNT(*)::int AS c FROM platform_nda_signatures"),
      safeCount("SELECT COUNT(*)::int AS c FROM deal_nda_signatures"),
      safeCount("SELECT COUNT(*)::int AS c FROM access_requests"),
      safeCount("SELECT COUNT(*)::int AS c FROM access_requests WHERE status = 'pending'"),
      safeCount("SELECT COUNT(*)::int AS c FROM deal_room_messages WHERE created_at > NOW() - INTERVAL '30 days' AND is_system = false"),
    ]);

    // Time-series: last 12 weeks, weekly buckets.
    const weeklyBucketsSql = (table: string, timeCol: string, where = "") => `
      WITH weeks AS (
        SELECT generate_series(
          date_trunc('week', NOW() - INTERVAL '11 weeks'),
          date_trunc('week', NOW()),
          INTERVAL '1 week'
        ) AS week_start
      )
      SELECT to_char(w.week_start, 'YYYY-MM-DD') AS week,
             COUNT(t.*)::int AS c
      FROM weeks w
      LEFT JOIN ${table} t
        ON date_trunc('week', t.${timeCol}) = w.week_start ${where ? `AND ${where}` : ""}
      GROUP BY w.week_start
      ORDER BY w.week_start ASC;
    `;

    const [
      weeklySignups,
      weeklyYachts,
      weeklyDealRooms,
      weeklyCommission,
      weeklyLeads,
    ] = await Promise.all([
      safeQuery<{ week: string; c: number }>(weeklyBucketsSql("users", "created_at")),
      safeQuery<{ week: string; c: number }>(weeklyBucketsSql("yachts", "created_at")),
      safeQuery<{ week: string; c: number }>(weeklyBucketsSql("deal_rooms", "created_at")),
      safeQuery<{ week: string; c: number }>(weeklyBucketsSql("deal_rooms", "commission_fully_signed_at", "t.commission_fully_signed_at IS NOT NULL")),
      safeQuery<{ week: string; c: number }>(weeklyBucketsSql("leads", "created_at")),
    ]);

    // Top yachts by access requests + by deal rooms.
    const topByRequests = await safeQuery<{ id: string; name: string; c: number }>(
      `SELECT y.id, y.name, COUNT(a.*)::int AS c
       FROM yachts y
       JOIN access_requests a ON a.yacht_id = y.id
       GROUP BY y.id, y.name
       ORDER BY c DESC
       LIMIT 5;`
    );
    const topByRooms = await safeQuery<{ id: string; name: string; c: number }>(
      `SELECT y.id, y.name, COUNT(d.*)::int AS c
       FROM yachts y
       JOIN deal_rooms d ON d.yacht_id = y.id
       GROUP BY y.id, y.name
       ORDER BY c DESC
       LIMIT 5;`
    );

    // Last 10 deals (commission signed = "closed" stage).
    const recentDeals = await safeQuery<{
      id: string;
      yacht_name: string | null;
      status: string;
      created_at: string;
      commission_fully_signed_at: string | null;
    }>(
      `SELECT d.id,
              y.name AS yacht_name,
              d.status,
              d.created_at,
              d.commission_fully_signed_at
       FROM deal_rooms d
       LEFT JOIN yachts y ON y.id = d.yacht_id
       ORDER BY COALESCE(d.commission_fully_signed_at, d.created_at) DESC
       LIMIT 10;`
    );

    res.json({
      generated_at: new Date().toISOString(),
      kpis: {
        users: { total: totalUsers, last7: usersLast7, last30: usersLast30, buyers, sellers, brokers, owners, admins },
        yachts: { total: totalYachts, approved: yachtsApproved, pending: yachtsPending, rejected: yachtsRejected },
        deals: { total: totalDealRooms, active: activeDealRooms, commission_signed: commissionSigned },
        leads: { total: totalLeads, last30: leadsLast30, pending_access_requests: pendingRequests, total_access_requests: accessRequests },
        signatures: { platform_nda: platformNda, deal_nda: dealNda },
        engagement: { messages_last30: messages30 },
      },
      weekly: {
        signups: weeklySignups,
        yachts: weeklyYachts,
        deal_rooms: weeklyDealRooms,
        commission: weeklyCommission,
        leads: weeklyLeads,
      },
      funnel: {
        users: totalUsers,
        access_requests: accessRequests,
        deal_rooms: totalDealRooms,
        platform_nda: platformNda,
        deal_nda: dealNda,
        commission: commissionSigned,
      },
      top: {
        yachts_by_requests: topByRequests,
        yachts_by_rooms: topByRooms,
      },
      recent_deals: recentDeals,
    });
  } catch (e: any) {
    console.error("[admin-analytics] failed:", e);
    res.status(500).json({ error: e?.message || "analytics failed" });
  }
});

export default router;
