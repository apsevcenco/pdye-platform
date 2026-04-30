// End-to-end Deal Room test.
// Creates 3 test users (admin, buyer, seller), drives a full deal flow,
// reports outcome of every step. Does NOT auto-cleanup.

import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_SR  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SB_ANON = process.env.VITE_SUPABASE_ANON_KEY;
const API = process.env.E2E_API || 'http://localhost:8080/api';

if (!SB_URL || !SB_SR || !SB_ANON) {
  console.error('Missing Supabase env');
  process.exit(1);
}

const admin = createClient(SB_URL, SB_SR, { auth: { persistSession: false }});

const TS = Date.now();
const PASS = 'TestPass!2026XyZ';
const USERS = {
  admin:  { email: `e2e_admin_${TS}@pdye-test.local`,  role: 'admin',    name: 'E2E Admin' },
  buyer:  { email: `e2e_buyer_${TS}@pdye-test.local`,  role: 'investor', name: 'E2E Buyer' },
  seller: { email: `e2e_seller_${TS}@pdye-test.local`, role: 'seller',   name: 'E2E Seller' },
};

const REPORT = [];
function step(name, ok, detail) {
  const mark = ok ? '✓' : '✗';
  const line = `${mark} ${name}${detail ? ' — ' + detail : ''}`;
  console.log(line);
  REPORT.push({ name, ok, detail });
  return ok;
}

async function call(method, path, token, body) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers['authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }
  return { status: res.status, ok: res.ok, body: json, raw: text };
}

async function createUser(key) {
  const u = USERS[key];
  // Try create. If already exists from a prior failed run, fetch.
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email, password: PASS, email_confirm: true,
  });
  let id;
  if (error) {
    // fallback: lookup
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find(x => x.email === u.email);
    if (!existing) throw new Error(`Could not create or find ${u.email}: ${error.message}`);
    id = existing.id;
  } else {
    id = data.user.id;
  }
  // Upsert profile
  const { error: pErr } = await admin.from('users').upsert({
    id, email: u.email, role: u.role, approved: true, name: u.name,
  });
  if (pErr) throw new Error(`profile upsert ${u.email}: ${pErr.message}`);
  USERS[key].id = id;
  return id;
}

async function signIn(key) {
  const u = USERS[key];
  const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: SB_ANON },
    body: JSON.stringify({ email: u.email, password: PASS }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`signIn ${u.email}: ${JSON.stringify(j)}`);
  USERS[key].token = j.access_token;
  return j.access_token;
}

async function signPlatformNda(key) {
  const u = USERS[key];
  // Get current document
  const doc = await call('GET', '/platform-nda', u.token);
  if (!doc.ok) throw new Error(`get platform-nda failed: ${doc.status} ${doc.raw}`);
  const r = await call('POST', '/platform-nda/sign', u.token, {
    signature_name: u.name,
    accepted_read: true, accepted_understand: true, accepted_agree: true,
    document_id: doc.body.id, content_hash: doc.body.content_hash,
  });
  if (!r.ok) throw new Error(`platform-nda sign ${u.email}: ${r.status} ${r.raw}`);
}

(async () => {
  console.log('=== PDYE Deal Room E2E ===');
  console.log('API:', API);

  // ── PHASE A: USERS ──────────────────────────────────────────────────────
  try {
    for (const k of ['admin', 'buyer', 'seller']) {
      await createUser(k);
      step(`Create user ${k} (${USERS[k].email})`, true, `id=${USERS[k].id}`);
    }
    for (const k of ['admin', 'buyer', 'seller']) {
      await signIn(k);
      step(`Sign in ${k}`, true, 'JWT acquired');
    }
  } catch (e) { step('User setup', false, e.message); return finish(); }

  // ── PHASE B: PLATFORM NDA ───────────────────────────────────────────────
  try {
    for (const k of ['admin', 'buyer', 'seller']) {
      await signPlatformNda(k);
      step(`${k} signs platform NDA`, true);
    }
  } catch (e) { step('Platform NDA sign', false, e.message); return finish(); }

  // ── PHASE C: YACHT (use existing approved yacht if present, else create) ─
  let yachtId, yachtName;
  try {
    const { data: ys } = await admin.from('yachts')
      .select('id,name').eq('listing_status','approved').limit(1);
    if (ys && ys.length > 0) {
      yachtId = ys[0].id; yachtName = ys[0].name;
      // Reassign owner to test_seller for clean test
      const orig = await admin.from('yachts').select('owner_id').eq('id', yachtId).single();
      const { error } = await admin.from('yachts').update({ owner_id: USERS.seller.id }).eq('id', yachtId);
      if (error) throw new Error(error.message);
      step(`Use existing yacht "${yachtName}"`, true, `id=${yachtId}, owner→test_seller (was ${orig.data?.owner_id})`);
      // Save original owner so we can restore later
      USERS._origOwner = orig.data?.owner_id;
    } else {
      throw new Error('No approved yachts in DB');
    }
  } catch (e) { step('Yacht setup', false, e.message); return finish(); }

  // ── PHASE D: BUYER REQUESTS ACCESS ──────────────────────────────────────
  let accessReqId;
  try {
    const { data, error } = await admin.from('access_requests').insert({
      yacht_id: yachtId,
      requester_id: USERS.buyer.id,
      role: 'investor',
      status: 'pending',
    }).select().single();
    if (error) throw new Error(error.message);
    accessReqId = data.id;
    step('Buyer creates access_request', true, `id=${accessReqId}`);
  } catch (e) { step('Buyer access_request', false, e.message); return finish(); }

  // ── PHASE E: ADMIN APPROVES & CREATES DEAL ROOM ─────────────────────────
  let roomId;
  try {
    // approve_spec
    const { error: e1 } = await admin.from('access_requests')
      .update({ status: 'approved_spec' }).eq('id', accessReqId);
    if (e1) throw new Error('approve_spec: ' + e1.message);
    step('Admin approves spec access', true);

    // Create deal room via API (admin token)
    const r = await call('POST', '/deal-rooms', USERS.admin.token, {
      yacht_id: yachtId,
      buyer_user_id: USERS.buyer.id,
      seller_user_id: USERS.seller.id,
      seller_type: 'owner',
      nda_required: true,
      buyer_nda_status: 'not_sent',
      seller_nda_status: 'not_sent',
      status: 'pending_nda',
      notes: 'E2E test deal room',
    });
    if (!r.ok) throw new Error(`POST /deal-rooms ${r.status} ${r.raw}`);
    roomId = r.body.id;
    step('Admin creates deal_room', true, `id=${roomId}, room_number=${r.body.room_number}`);

    // Add participants
    for (const side of [['buyer', USERS.buyer.id, 'investor'], ['seller', USERS.seller.id, 'seller']]) {
      const r2 = await call('POST', `/deal-rooms/${roomId}/participants`, USERS.admin.token, {
        user_id: side[1], role: side[2], side: side[0],
        can_view: true, can_message: true, can_download: true,
      });
      if (!r2.ok) throw new Error(`add ${side[0]} participant ${r2.status} ${r2.raw}`);
    }
    step('Admin adds buyer + seller as participants', true);

    // Link the access_request to the room (escalated)
    await admin.from('access_requests').update({
      status: 'escalated',
      escalated_to_deal_room: true,
      deal_room_id: roomId,
    }).eq('id', accessReqId);

    // Send NDAs to both sides
    const r3 = await call('PATCH', `/deal-rooms/${roomId}`, USERS.admin.token, {
      buyer_nda_status: 'sent', seller_nda_status: 'sent',
      buyer_nda_sent_at: new Date().toISOString(),
      seller_nda_sent_at: new Date().toISOString(),
    });
    if (!r3.ok) throw new Error(`PATCH send NDAs ${r3.status} ${r3.raw}`);
    step('Admin marks both NDAs sent', true);
  } catch (e) { step('Admin deal room setup', false, e.message); return finish(); }

  // ── PHASE F: BUYER + SELLER SIGN DEAL NDA ───────────────────────────────
  try {
    for (const k of ['buyer', 'seller']) {
      const doc = await call('GET', '/deal-nda/document', USERS[k].token);
      if (!doc.ok) throw new Error(`${k} get deal-nda doc ${doc.status} ${doc.raw}`);
      const r = await call('POST', `/deal-rooms/${roomId}/nda/sign`, USERS[k].token, {
        signature_name: USERS[k].name,
        accepted_read: true, accepted_understand: true, accepted_agree: true,
        document_id: doc.body.id, content_hash: doc.body.content_hash,
      });
      if (!r.ok) throw new Error(`${k} NDA sign ${r.status} ${r.raw}`);
      step(`${k} signs Deal NDA`, true);
    }
    // Verify status
    const r = await call('GET', `/deal-rooms/${roomId}`, USERS.admin.token);
    step('Deal room after both NDAs', r.ok,
      `status=${r.body?.status}, buyer_nda=${r.body?.buyer_nda_status}, seller_nda=${r.body?.seller_nda_status}, fully_activated_at=${r.body?.fully_activated_at}`);
  } catch (e) { step('Deal NDA signing', false, e.message); return finish(); }

  // ── PHASE G: MESSAGING ──────────────────────────────────────────────────
  try {
    const lst = await call('GET', '/deal-rooms', USERS.buyer.token);
    step('Buyer GET /deal-rooms', lst.ok, `status=${lst.status}, count=${Array.isArray(lst.body) ? lst.body.length : 'n/a'}`);

    const m1 = await call('POST', `/deal-rooms/${roomId}/messages`, USERS.buyer.token,
      { message: 'Hello from BUYER e2e', is_system: false });
    step('Buyer sends message', m1.ok, `status=${m1.status}${m1.ok?'':' '+m1.raw}`);

    const m2 = await call('POST', `/deal-rooms/${roomId}/messages`, USERS.seller.token,
      { message: 'Hello from SELLER e2e', is_system: false });
    step('Seller sends message', m2.ok, `status=${m2.status}${m2.ok?'':' '+m2.raw}`);

    const ms = await call('GET', `/deal-rooms/${roomId}/messages`, USERS.buyer.token);
    step('Buyer reads messages', ms.ok,
      `status=${ms.status}, count=${Array.isArray(ms.body) ? ms.body.length : 'n/a'}`);

    const all = await call('GET', '/deal-room-messages-all', USERS.admin.token);
    step('Admin GET /deal-room-messages-all', all.ok,
      `status=${all.status}, count=${Array.isArray(all.body) ? all.body.length : 'n/a'}`);
  } catch (e) { step('Messaging', false, e.message); return finish(); }

  // ── PHASE H: COMMISSION + IDENTITY REVEAL ───────────────────────────────
  try {
    const send = await call('POST', `/deal-rooms/${roomId}/commission/send`, USERS.admin.token);
    step('Admin initiates commission', send.ok, `status=${send.status}`);

    for (const k of ['buyer', 'seller']) {
      const doc = await call('GET', '/deal-commission/document', USERS[k].token);
      if (!doc.ok) throw new Error(`${k} get commission doc ${doc.status} ${doc.raw}`);
      const r = await call('POST', `/deal-rooms/${roomId}/commission/sign`, USERS[k].token, {
        signature_name: USERS[k].name,
        accepted_read: true, accepted_understand: true, accepted_agree: true,
        document_id: doc.body.id, content_hash: doc.body.content_hash,
      });
      if (!r.ok) throw new Error(`${k} commission sign ${r.status} ${r.raw}`);
      step(`${k} signs Commission`, true);
    }
    const r = await call('GET', `/deal-rooms/${roomId}`, USERS.buyer.token);
    step('Room after commission', r.ok,
      `commission_status=${r.body?.commission_status}, identities_revealed=${r.body?.identities_revealed}, seller_user_id_visible=${!!r.body?.seller_user_id}`);
  } catch (e) { step('Commission', false, e.message); }

  finish();
})();

function finish() {
  console.log('\n=== SUMMARY ===');
  const okCount = REPORT.filter(r => r.ok).length;
  console.log(`${okCount}/${REPORT.length} steps passed`);
  console.log('\n=== TEST USERS (kept for inspection) ===');
  for (const [k, u] of Object.entries(USERS)) {
    if (k.startsWith('_')) continue;
    console.log(`  ${k}: ${u.email}  (id=${u.id})`);
  }
  console.log(`  password (all): ${PASS}`);
  if (USERS._origOwner) console.log(`  Yacht original owner_id (to restore): ${USERS._origOwner}`);
  process.exit(0);
}
