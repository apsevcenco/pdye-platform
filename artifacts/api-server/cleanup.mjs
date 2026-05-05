import { createClient } from "@supabase/supabase-js";
import pg from "pg";
const sb = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

console.log("=== BEFORE ===");
const { count: arBefore } = await sb.from("access_requests").select("*", { count: "exact", head: true });
const blocksBefore = await pool.query("SELECT COUNT(*)::int AS n FROM deal_room_blocks");
console.log(`  access_requests:   ${arBefore}`);
console.log(`  deal_room_blocks:  ${blocksBefore.rows[0].n}`);

console.log("\n=== Orphan deal_room_blocks (no parent in deal_rooms) ===");
const orphanBlocks = await pool.query("SELECT id, deal_room_id, block_key FROM deal_room_blocks WHERE deal_room_id NOT IN (SELECT id FROM deal_rooms)");
for (const r of orphanBlocks.rows) console.log(`  block ${r.id.slice(0,8)} key=${r.block_key} room=${r.deal_room_id.slice(0,8)}`);

console.log("\n=== Orphan access_requests (requester not in users OR yacht_id null/missing) ===");
const { data: allUsers } = await sb.from("users").select("id");
const userIds = new Set((allUsers || []).map(u => u.id));
const { data: allAR } = await sb.from("access_requests").select("id, requester_id, yacht_id, status, created_at");
const orphanAR = (allAR || []).filter(r => !userIds.has(r.requester_id) || !r.yacht_id);
for (const r of orphanAR) console.log(`  ar ${r.id.slice(0,8)} status=${r.status} requester=${r.requester_id?.slice(0,8)} yacht=${r.yacht_id || "null"} created=${r.created_at?.slice(0,10)}`);

console.log("\n=== DELETING ===");
const blockDel = await pool.query("DELETE FROM deal_room_blocks WHERE deal_room_id NOT IN (SELECT id FROM deal_rooms) RETURNING id");
console.log(`  deleted ${blockDel.rowCount} orphan deal_room_blocks`);

if (orphanAR.length > 0) {
  const ids = orphanAR.map(r => r.id);
  const { error: arErr, count: arDelCount } = await sb.from("access_requests").delete({ count: "exact" }).in("id", ids);
  if (arErr) console.log(`  ERROR deleting access_requests: ${arErr.message}`);
  else console.log(`  deleted ${arDelCount} orphan access_requests`);
}

console.log("\n=== AFTER ===");
const { count: arAfter } = await sb.from("access_requests").select("*", { count: "exact", head: true });
const blocksAfter = await pool.query("SELECT COUNT(*)::int AS n FROM deal_room_blocks");
console.log(`  access_requests:   ${arAfter}`);
console.log(`  deal_room_blocks:  ${blocksAfter.rows[0].n}`);

await pool.end();
