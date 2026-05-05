import { createClient } from "@supabase/supabase-js";
import pg from "pg";
const sb = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

console.log("=== SUPABASE: users ===");
const { data: users } = await sb.from("users").select("id, email, role, approved, created_at").order("created_at", { ascending: true });
for (const u of users || []) console.log(`  ${u.created_at?.slice(0,10)}  ${u.role.padEnd(10)} ${u.approved ? "[approved]" : "[ pending]"}  ${u.email}  (${u.id.slice(0,8)})`);
console.log(`  total: ${users?.length || 0}`);

console.log("\n=== SUPABASE: yachts ===");
const { data: yachts } = await sb.from("yachts").select("id, name, owner_user_id, status, created_at").order("created_at", { ascending: true });
for (const y of yachts || []) console.log(`  ${y.created_at?.slice(0,10)}  ${(y.status||"").padEnd(10)}  "${y.name}"  owner=${y.owner_user_id?.slice(0,8) || "—"}  (${y.id.slice(0,8)})`);
console.log(`  total: ${yachts?.length || 0}`);

console.log("\n=== SUPABASE: access_requests ===");
const { data: ar } = await sb.from("access_requests").select("id, yacht_id, requester_id, status, created_at").order("created_at", { ascending: true });
for (const r of ar || []) console.log(`  ${r.created_at?.slice(0,10)}  ${(r.status||"").padEnd(15)}  yacht=${r.yacht_id?.slice(0,8)}  user=${r.requester_id?.slice(0,8)}  (${r.id.slice(0,8)})`);
console.log(`  total: ${ar?.length || 0}`);

console.log("\n=== SUPABASE: leads ===");
const { data: leads } = await sb.from("leads").select("id, email, status, created_at").order("created_at", { ascending: true });
for (const l of leads || []) console.log(`  ${l.created_at?.slice(0,10)}  ${(l.status||"").padEnd(12)}  ${l.email}  (${l.id.slice(0,8)})`);
console.log(`  total: ${leads?.length || 0}`);

console.log("\n=== HELIUMDB: deal_rooms ===");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const dr = await pool.query("SELECT id, yacht_id, buyer_user_id, seller_user_id, status, archived, created_at FROM deal_rooms ORDER BY created_at");
for (const r of dr.rows) console.log(`  ${r.created_at?.toISOString().slice(0,10)}  ${(r.status||"").padEnd(10)}  ${r.archived ? "[arch]" : "[live]"}  yacht=${r.yacht_id?.slice(0,8)}  buyer=${r.buyer_user_id?.slice(0,8) || "—"}  seller=${r.seller_user_id?.slice(0,8) || "—"}  (${r.id.slice(0,8)})`);
console.log(`  total: ${dr.rows.length}`);

console.log("\n=== HELIUMDB: counts of related rows ===");
for (const t of ["deal_room_participants","deal_room_messages","deal_room_documents","deal_room_blocks","nda_envelopes","audit_logs","deal_nda_signatures","deal_commission_signatures"]) {
  try {
    const r = await pool.query(`SELECT COUNT(*)::int AS n FROM ${t}`);
    console.log(`  ${t.padEnd(30)} ${r.rows[0].n}`);
  } catch (e) {
    console.log(`  ${t.padEnd(30)} (table missing or error: ${e.message.slice(0,60)})`);
  }
}

console.log("\n=== HELIUMDB: deal_nda_documents (templates) ===");
try {
  const t = await pool.query("SELECT id, version, title, is_active, created_at FROM deal_nda_documents ORDER BY created_at");
  for (const r of t.rows) console.log(`  ${r.created_at?.toISOString().slice(0,10)}  v${r.version}  ${r.is_active ? "[ACTIVE]" : "[ archive]"}  "${r.title}"  (${r.id.slice(0,8)})`);
  console.log(`  total: ${t.rows.length}`);
} catch (e) { console.log(`  error: ${e.message}`); }

console.log("\n=== HELIUMDB: deal_commission_documents (templates) ===");
try {
  const t = await pool.query("SELECT id, version, title, audience, is_active, created_at FROM deal_commission_documents ORDER BY created_at");
  for (const r of t.rows) console.log(`  ${r.created_at?.toISOString().slice(0,10)}  v${r.version}  ${(r.audience||"").padEnd(8)} ${r.is_active ? "[ACTIVE]" : "[archive]"}  "${r.title}"  (${r.id.slice(0,8)})`);
  console.log(`  total: ${t.rows.length}`);
} catch (e) { console.log(`  error: ${e.message}`); }

await pool.end();
