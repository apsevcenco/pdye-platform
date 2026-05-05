#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Manual verification for migration 007_rls_audit.sql.
 *
 * Run AFTER pasting 007_rls_audit.sql into the Supabase SQL Editor.
 *
 *   node artifacts/pdye/migrations/007_rls_audit_verify.mjs
 *
 * Reads VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 * from the environment.
 *
 * Reports PASS / FAIL for each isolation check and exits non-zero on any failure.
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error("Missing SUPABASE_URL / VITE_SUPABASE_URL, anon key or service-role key.");
  process.exit(2);
}

const anon = createClient(URL, ANON, { auth: { persistSession: false } });
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

let passed = 0;
let failed = 0;
const fails = [];

function ok(name, info = "") {
  console.log(`  PASS  ${name}${info ? "  — " + info : ""}`);
  passed++;
}
function bad(name, info = "") {
  console.log(`  FAIL  ${name}${info ? "  — " + info : ""}`);
  failed++;
  fails.push(name);
}

async function check(name, fn) {
  try {
    await fn();
  } catch (e) {
    bad(name, "threw: " + (e?.message ?? String(e)));
  }
}

console.log("\n──  ANON (public) checks  ──────────────────────────────────────────");

await check("anon CANNOT read public.users", async () => {
  const { data, error } = await anon.from("users").select("id").limit(5);
  if (error) return ok("anon CANNOT read public.users", `denied: ${error.code}`);
  if ((data?.length ?? 0) === 0) return ok("anon CANNOT read public.users", "0 rows returned (RLS hides them)");
  bad("anon CANNOT read public.users", `LEAK — ${data.length} row(s) returned`);
});

await check("anon CANNOT read public.access_requests", async () => {
  const { data, error } = await anon.from("access_requests").select("id").limit(5);
  if (error) return ok("anon CANNOT read public.access_requests", `denied: ${error.code}`);
  if ((data?.length ?? 0) === 0) return ok("anon CANNOT read public.access_requests");
  bad("anon CANNOT read public.access_requests", `LEAK — ${data.length} row(s)`);
});

await check("anon CANNOT read public.leads", async () => {
  const { data, error } = await anon.from("leads").select("id").limit(5);
  if (error) return ok("anon CANNOT read public.leads", `denied: ${error.code}`);
  if ((data?.length ?? 0) === 0) return ok("anon CANNOT read public.leads");
  bad("anon CANNOT read public.leads", `LEAK — ${data.length} row(s)`);
});

await check("anon CANNOT read public.introductions", async () => {
  const { data, error } = await anon.from("introductions").select("id").limit(5);
  if (error) return ok("anon CANNOT read public.introductions", `denied: ${error.code}`);
  if ((data?.length ?? 0) === 0) return ok("anon CANNOT read public.introductions");
  bad("anon CANNOT read public.introductions", `LEAK — ${data.length} row(s)`);
});

await check("anon CANNOT read public.deals", async () => {
  const { data, error } = await anon.from("deals").select("id").limit(5);
  if (error) return ok("anon CANNOT read public.deals", `denied: ${error.code}`);
  if ((data?.length ?? 0) === 0) return ok("anon CANNOT read public.deals");
  bad("anon CANNOT read public.deals", `LEAK — ${data.length} row(s)`);
});

await check("anon CAN read approved yachts only", async () => {
  const { data, error } = await anon.from("yachts").select("id, listing_status").limit(50);
  if (error) return bad("anon CAN read approved yachts only", `unexpected error: ${error.message}`);
  const bad_rows = (data || []).filter(y => y.listing_status !== "approved");
  if (bad_rows.length === 0) return ok("anon CAN read approved yachts only", `${data?.length ?? 0} row(s), all approved`);
  bad("anon CAN read approved yachts only", `LEAK — ${bad_rows.length} non-approved yacht(s) visible`);
});

await check("anon CAN insert into public.leads", async () => {
  const tag = `[rls-verify ${new Date().toISOString()}]`;
  const { data, error } = await anon.from("leads").insert([{
    name: "RLS verification probe", email: "rls-verify@example.com", message: tag,
  }]).select("id").single();
  if (error) return bad("anon CAN insert into public.leads", `unexpectedly denied: ${error.message}`);
  if (!data?.id) return bad("anon CAN insert into public.leads", "no id returned");
  ok("anon CAN insert into public.leads", `inserted id=${data.id}`);
  // cleanup using service role
  await admin.from("leads").delete().eq("id", data.id);
});

await check("anon CANNOT insert into public.users", async () => {
  const probeId = "00000000-0000-0000-0000-0000000face1"; // fake uuid – will fail RLS regardless
  const { error } = await anon.from("users").insert([{
    id: probeId, email: "rls-verify-anon@example.com", role: "admin", approved: true,
  }]);
  if (error) return ok("anon CANNOT insert into public.users", `denied: ${error.code}`);
  bad("anon CANNOT insert into public.users", "LEAK — insert succeeded");
  await admin.from("users").delete().eq("id", probeId);
});

await check("anon CANNOT update yachts", async () => {
  const { data: y } = await admin.from("yachts").select("id, name").limit(1).maybeSingle();
  if (!y) return ok("anon CANNOT update yachts", "skipped — no yachts exist");
  const { data, error } = await anon.from("yachts").update({ name: y.name + " (anon hack)" }).eq("id", y.id).select("id");
  if (error) return ok("anon CANNOT update yachts", `denied: ${error.code}`);
  if (!data || data.length === 0) return ok("anon CANNOT update yachts", "0 rows updated (RLS blocks)");
  bad("anon CANNOT update yachts", "LEAK — update succeeded");
  await admin.from("yachts").update({ name: y.name }).eq("id", y.id);
});

console.log("\n──  Authenticated user (cross-tenant) checks  ─────────────────────");

let testUsers = [];
let createdEmails = [];
try {
  // Create two ephemeral test users via the admin API.
  for (const i of [0, 1]) {
    const email = `rls-verify-user-${Date.now()}-${i}@example.com`;
    createdEmails.push(email);
    const { data: created, error: cerr } = await admin.auth.admin.createUser({
      email, password: "ProbePass123!verify", email_confirm: true,
    });
    if (cerr) throw cerr;
    // Insert matching public.users row (admin bypasses RLS + privilege guard).
    await admin.from("users").upsert([{ id: created.user.id, email, role: "investor", approved: true }]);
    testUsers.push({ id: created.user.id, email });
  }

  // Sign in as user A; attempt to read user B.
  const a = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: signin, error: sErr } = await a.auth.signInWithPassword({
    email: testUsers[0].email, password: "ProbePass123!verify",
  });
  if (sErr) throw sErr;
  if (!signin.session) throw new Error("no session after sign-in");

  await check("user A reads ONLY own users row", async () => {
    const { data, error } = await a.from("users").select("id, email").in("id", [testUsers[0].id, testUsers[1].id]);
    if (error) return bad("user A reads ONLY own users row", `unexpected error: ${error.message}`);
    const ids = (data || []).map(r => r.id);
    if (ids.length === 1 && ids[0] === testUsers[0].id) {
      return ok("user A reads ONLY own users row", `1 row returned (self)`);
    }
    bad("user A reads ONLY own users row",
      `LEAK — got ${ids.length} row(s): ${JSON.stringify(ids)}`);
  });

  await check("user A CANNOT update user B's row", async () => {
    const { data, error } = await a.from("users").update({ email: "hijacked@example.com" }).eq("id", testUsers[1].id).select("id");
    if (error) return ok("user A CANNOT update user B's row", `denied: ${error.code}`);
    if (!data || data.length === 0) return ok("user A CANNOT update user B's row", "0 rows updated");
    bad("user A CANNOT update user B's row", "LEAK — update succeeded");
  });

  await check("user A CANNOT escalate own role to admin", async () => {
    const { error } = await a.from("users").update({ role: "admin", approved: true }).eq("id", testUsers[0].id);
    if (error) return ok("user A CANNOT escalate own role to admin", `denied: ${error.code}`);
    // Even if no error, verify role hasn't changed (server side):
    const { data: after } = await admin.from("users").select("role").eq("id", testUsers[0].id).single();
    if (after?.role === "investor") return ok("user A CANNOT escalate own role to admin", "trigger blocked the change silently");
    bad("user A CANNOT escalate own role to admin", `LEAK — role is now ${after?.role}`);
  });

  await check("user A CANNOT read other users' access_requests", async () => {
    // seed an access_request owned by user B via admin
    const { data: ar } = await admin.from("access_requests").insert([{
      yacht_id: null, requester_id: testUsers[1].id, role: "buyer", status: "pending",
    }]).select("id").single();
    try {
      const { data, error } = await a.from("access_requests").select("id").eq("id", ar.id);
      if (error) return ok("user A CANNOT read other users' access_requests", `denied: ${error.code}`);
      if ((data?.length ?? 0) === 0) return ok("user A CANNOT read other users' access_requests");
      bad("user A CANNOT read other users' access_requests", "LEAK — visible");
    } finally {
      if (ar?.id) await admin.from("access_requests").delete().eq("id", ar.id);
    }
  });

  await check("user A CANNOT insert access_request as user B", async () => {
    const { error } = await a.from("access_requests").insert([{
      yacht_id: null, requester_id: testUsers[1].id, role: "buyer", status: "pending",
    }]);
    if (error) return ok("user A CANNOT insert access_request as user B", `denied: ${error.code}`);
    bad("user A CANNOT insert access_request as user B", "LEAK — insert succeeded");
  });

  await a.auth.signOut();
} catch (e) {
  bad("ephemeral test user setup", e?.message ?? String(e));
} finally {
  // Cleanup test users created above.
  for (const u of testUsers) {
    try { await admin.from("users").delete().eq("id", u.id); } catch {}
    try { await admin.auth.admin.deleteUser(u.id); } catch {}
  }
}

console.log("\n──  Service-role bypass check  ────────────────────────────────────");
await check("service role still reads public.users", async () => {
  const { data, error } = await admin.from("users").select("id").limit(1);
  if (error) return bad("service role still reads public.users", error.message);
  ok("service role still reads public.users", `${data.length} row(s)`);
});

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log("Failures:");
  for (const f of fails) console.log("  - " + f);
  process.exit(1);
}
process.exit(0);
