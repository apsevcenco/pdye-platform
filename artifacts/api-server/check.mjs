import { createClient } from "@supabase/supabase-js";
import pg from "pg";
const sb = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

console.log("=== current state of prod data ===");
const { data: ar } = await sb.from("access_requests").select("*");
const { data: y } = await sb.from("yachts").select("id, name, status");
console.log("access_requests:", ar?.length || 0);
console.log("yachts:", y?.length || 0, y?.map(x => x.name));

const dr = await pool.query("SELECT id, status, buyer_user_id, seller_user_id, buyer_nda_status, seller_nda_status, created_at FROM deal_rooms ORDER BY created_at DESC");
console.log("\ndeal_rooms:", dr.rows.length);
for (const r of dr.rows) console.log(" ", r);

const sigs = await pool.query("SELECT id, deal_room_id, side, signature_name, signed_at FROM deal_nda_signatures ORDER BY signed_at DESC");
console.log("\ndeal_nda_signatures:", sigs.rows.length);
for (const r of sigs.rows) console.log(" ", r);

const env = await pool.query("SELECT id, deal_room_id, side, status, signed_at FROM nda_envelopes ORDER BY id DESC");
console.log("\nnda_envelopes:", env.rows.length);
for (const r of env.rows) console.log(" ", r);

await pool.end();
