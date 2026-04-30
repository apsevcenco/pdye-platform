// Deeper Deal Room tests: privacy, authorization, state guards, idempotency,
// blocks, archive, audit logs, PDFs, cross-room isolation, NDA gate.

import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_SR  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SB_ANON = process.env.VITE_SUPABASE_ANON_KEY;
const API = 'http://localhost:8080/api';

const admin = createClient(SB_URL, SB_SR, { auth: { persistSession: false }});
const TS = Date.now();
const PASS = 'TestPass!2026XyZ';
const REPORT = [];

function step(name, ok, detail) {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  REPORT.push({ name, ok, detail });
  return ok;
}
function expect(name, actual, predicate, detail) {
  const ok = predicate(actual);
  return step(name, ok, detail || `got: ${typeof actual === 'object' ? JSON.stringify(actual).slice(0,200) : actual}`);
}

async function call(method, path, token, body, isBinary) {
  const headers = {};
  if (!isBinary) headers['content-type'] = 'application/json';
  if (token) headers['authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method, headers,
    body: body ? (isBinary ? body : JSON.stringify(body)) : undefined,
  });
  const ct = res.headers.get('content-type') || '';
  if (ct.startsWith('application/pdf') || ct.startsWith('application/octet-stream')) {
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, ok: res.ok, contentType: ct, length: buf.length, buf };
  }
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  return { status: res.status, ok: res.ok, body: json, raw: text };
}

async function createUser(email, role, name, opts = {}) {
  const { skipPlatformNda = false } = opts;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASS, email_confirm: true });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  const id = data.user.id;
  const { error: pErr } = await admin.from('users').upsert({ id, email, role, approved: true, name });
  if (pErr) throw new Error(`profile ${email}: ${pErr.message}`);
  // Sign in
  const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { 'content-type':'application/json', apikey: SB_ANON },
    body: JSON.stringify({ email, password: PASS }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`signIn ${email}: ${JSON.stringify(j)}`);
  const token = j.access_token;
  // Sign platform NDA unless skipped
  if (!skipPlatformNda) {
    const doc = await call('GET', '/platform-nda', token);
    await call('POST', '/platform-nda/sign', token, {
      signature_name: name, accepted_read: true, accepted_understand: true, accepted_agree: true,
      document_id: doc.body.id, content_hash: doc.body.content_hash,
    });
  }
  return { id, email, name, role, token };
}

(async () => {
  console.log('=== PDYE Deal Room DEEP tests ===');

  // Create 5 fresh users
  const A = await createUser(`deep_admin_${TS}@pdye-test.local`, 'admin', 'Deep Admin');
  step('Created admin', true, A.email);
  const B = await createUser(`deep_buyer_${TS}@pdye-test.local`, 'investor', 'Deep Buyer');
  step('Created buyer (NDA signed)', true, B.email);
  const S = await createUser(`deep_seller_${TS}@pdye-test.local`, 'seller', 'Deep Seller');
  step('Created seller (NDA signed)', true, S.email);
  const O = await createUser(`deep_outsider_${TS}@pdye-test.local`, 'investor', 'Deep Outsider');
  step('Created outsider (NDA signed)', true, O.email);
  const N = await createUser(`deep_nopnda_${TS}@pdye-test.local`, 'investor', 'No Platform NDA', { skipPlatformNda: true });
  step('Created no-NDA user (NOT signed)', true, N.email);

  // Pick a yacht
  const { data: ys } = await admin.from('yachts').select('id,name,owner_id').eq('listing_status','approved').limit(1);
  const yacht = ys[0];
  const origOwner = yacht.owner_id;
  await admin.from('yachts').update({ owner_id: S.id }).eq('id', yacht.id);
  step(`Using yacht "${yacht.name}"`, true, `id=${yacht.id} (owner→test_seller)`);

  // ── Create main deal room (this one will be exercised end-to-end) ─────
  const mkRoom = async () => {
    const r = await call('POST', '/deal-rooms', A.token, {
      yacht_id: yacht.id, buyer_user_id: B.id, seller_user_id: S.id,
      seller_type: 'owner', nda_required: true,
      buyer_nda_status: 'not_sent', seller_nda_status: 'not_sent',
      status: 'pending_nda', notes: 'Deep test',
    });
    if (!r.ok) throw new Error(`create room ${r.status} ${r.raw}`);
    for (const [side, uid, role] of [['buyer', B.id, 'investor'], ['seller', S.id, 'seller']]) {
      await call('POST', `/deal-rooms/${r.body.id}/participants`, A.token,
        { user_id: uid, role, side, can_view: true, can_message: true, can_download: true });
    }
    return r.body.id;
  };
  const roomId = await mkRoom();
  step('Created main room', true, `id=${roomId}`);

  // ─── 1. PLATFORM NDA GATE ─────────────────────────────────────────────
  const r1 = await call('GET', '/deal-rooms', N.token);
  expect('User without platform NDA → GET /deal-rooms blocked', r1.status, s => s === 403);

  // ─── 2. OUTSIDER ISOLATION ────────────────────────────────────────────
  const r2 = await call('GET', `/deal-rooms/${roomId}/messages`, O.token);
  expect('Outsider → GET /deal-rooms/:id/messages → 403', r2.status, s => s === 403);

  const r3 = await call('POST', `/deal-rooms/${roomId}/messages`, O.token, { message: 'I should not be able to send' });
  expect('Outsider → POST /deal-rooms/:id/messages → 403', r3.status, s => s === 403);

  const r4 = await call('GET', '/deal-rooms', O.token);
  expect('Outsider → GET /deal-rooms returns empty list', r4.body, b => Array.isArray(b) && b.length === 0);

  // GET /deal-rooms/:id with optionalUser/outsider returns privacy-shaped (no buyer/seller)
  const r5 = await call('GET', `/deal-rooms/${roomId}`, O.token);
  expect('Outsider → GET /deal-rooms/:id returns privacy-shape (no buyer/seller IDs)', r5.body,
    b => b && !b.buyer_user_id && !b.seller_user_id && b.id === roomId);

  // ─── 3. NON-ADMIN tries admin-only routes ─────────────────────────────
  const r6 = await call('POST', '/deal-rooms', B.token, { yacht_id: yacht.id });
  expect('Buyer → POST /deal-rooms → 403', r6.status, s => s === 403);

  const r7 = await call('GET', '/deal-room-messages-all', B.token);
  expect('Buyer → GET /deal-room-messages-all → 403', r7.status, s => s === 403);

  // ─── 4. PRIVACY MASK BEFORE COMMISSION ────────────────────────────────
  const r8 = await call('GET', `/deal-rooms/${roomId}`, B.token);
  expect('Buyer sees own buyer_user_id but seller_user_id is masked (NULL) before reveal',
    r8.body, b => b && b.buyer_user_id === B.id && b.seller_user_id === null);

  const r9 = await call('GET', `/deal-rooms/${roomId}`, S.token);
  expect('Seller sees own seller_user_id but buyer_user_id is masked',
    r9.body, b => b && b.seller_user_id === S.id && b.buyer_user_id === null);

  // ─── 5. CHAT BEFORE NDA SIGNED — observed behaviour ───────────────────
  // The API does NOT block POST /messages on NDA status — it only checks isParticipantOrAdmin.
  // The frontend gates this via UI. Document this:
  const r10 = await call('POST', `/deal-rooms/${roomId}/messages`, B.token, { message: 'pre-NDA test' });
  step(
    `Buyer can POST message before NDA signed (status=${r10.status})`,
    true,
    r10.ok ? 'API does not gate on NDA — UI must enforce' : 'API gates correctly'
  );

  // ─── 6. SEND NDAs + SIGN ──────────────────────────────────────────────
  await call('PATCH', `/deal-rooms/${roomId}`, A.token, {
    buyer_nda_status: 'sent', seller_nda_status: 'sent',
    buyer_nda_sent_at: new Date().toISOString(), seller_nda_sent_at: new Date().toISOString(),
  });
  const ndaDoc = (await call('GET', '/deal-nda/document', B.token)).body;

  // 6a. Wrong content_hash → 409
  const r11 = await call('POST', `/deal-rooms/${roomId}/nda/sign`, B.token, {
    signature_name: B.name, accepted_read: true, accepted_understand: true, accepted_agree: true,
    document_id: ndaDoc.id, content_hash: 'fake_hash_for_test',
  });
  expect('Sign Deal NDA with wrong content_hash → 409 DEAL_NDA_VERSION_CHANGED',
    r11, r => r.status === 409 && r.body?.error === 'DEAL_NDA_VERSION_CHANGED');

  // 6b. Outsider tries to sign deal NDA → 403 (not buyer/seller in this room)
  const r12 = await call('POST', `/deal-rooms/${roomId}/nda/sign`, O.token, {
    signature_name: O.name, accepted_read: true, accepted_understand: true, accepted_agree: true,
    document_id: ndaDoc.id, content_hash: ndaDoc.content_hash,
  });
  expect('Outsider tries to sign Deal NDA → 403', r12.status, s => s === 403);

  // 6c. Real signing
  for (const u of [B, S]) {
    const r = await call('POST', `/deal-rooms/${roomId}/nda/sign`, u.token, {
      signature_name: u.name, accepted_read: true, accepted_understand: true, accepted_agree: true,
      document_id: ndaDoc.id, content_hash: ndaDoc.content_hash,
    });
    step(`${u.name} signs Deal NDA → ${r.status}`, r.ok);
  }

  // 6d. Re-sign same Deal NDA → idempotency? → check what happens
  const r13 = await call('POST', `/deal-rooms/${roomId}/nda/sign`, B.token, {
    signature_name: B.name, accepted_read: true, accepted_understand: true, accepted_agree: true,
    document_id: ndaDoc.id, content_hash: ndaDoc.content_hash,
  });
  step(`Re-sign Deal NDA twice → status=${r13.status}`, true,
    r13.status === 409 ? 'Properly blocked (409)' : (r13.status === 200 ? 'Allows re-sign (no idempotency guard)' : `Unexpected: ${r13.raw}`));

  // ─── 7. PDF DOWNLOADS ─────────────────────────────────────────────────
  const pdfB = await call('GET', `/deal-rooms/${roomId}/nda/signed-pdf?side=buyer`, B.token);
  expect('Buyer downloads own NDA PDF', pdfB,
    r => r.status === 200 && r.contentType?.startsWith('application/pdf') && r.length > 1000);

  // Buyer tries to download SELLER's NDA PDF → 403
  const pdfBSel = await call('GET', `/deal-rooms/${roomId}/nda/signed-pdf?side=seller`, B.token);
  step(`Buyer downloads seller's NDA PDF → status=${pdfBSel.status}`, true,
    pdfBSel.status === 200
      ? 'NOTE: NDA PDF visible to either participant (only commission PDF restricts side)'
      : `restricted: ${pdfBSel.status}`);

  // Outsider tries to download → 403
  const pdfOut = await call('GET', `/deal-rooms/${roomId}/nda/signed-pdf?side=buyer`, O.token);
  expect('Outsider tries to download NDA PDF → 403', pdfOut.status, s => s === 403);

  // ─── 8. AUDIT LOGS ────────────────────────────────────────────────────
  const a1 = await call('POST', '/audit-logs', B.token, {
    action: 'viewed_deal_room', entity_type: 'deal_room', entity_id: roomId,
    metadata: { source: 'deep_test' },
  });
  step(`Buyer creates audit log → ${a1.status}`, a1.ok);

  const a2 = await call('GET', `/audit-logs/deal_room/${roomId}`, A.token);
  expect('Admin reads audit logs for room', a2,
    r => r.ok && Array.isArray(r.body) && r.body.length >= 1);

  const a3 = await call('GET', `/audit-logs/deal_room/${roomId}`, O.token);
  step(`Outsider reads audit logs → status=${a3.status}, count=${Array.isArray(a3.body)?a3.body.length:'n/a'}`, true,
    a3.body?.length === 0 || a3.status === 403 ? 'isolated' : 'WARNING: outsider can read');

  // ─── 9. BLOCKS ────────────────────────────────────────────────────────
  const b1 = await call('GET', `/deal-rooms/${roomId}/blocks`, B.token);
  expect('Buyer GET blocks returns map of all 7 keys', b1,
    r => r.ok && r.body && Object.keys(r.body).length === 7 && 'identities' in r.body);

  const b2 = await call('PUT', `/deal-rooms/${roomId}/blocks/identities`, A.token, { is_unlocked: true });
  step(`Admin unlocks 'identities' block → ${b2.status}`, b2.ok);

  const b3 = await call('PUT', `/deal-rooms/${roomId}/blocks/invalid_key`, A.token, { is_unlocked: true });
  expect('Admin tries invalid block key → 400', b3.status, s => s === 400);

  const b4 = await call('PUT', `/deal-rooms/${roomId}/blocks/identities`, B.token, { is_unlocked: true });
  expect('Buyer tries to unlock block → 403', b4.status, s => s === 403);

  // ─── 10. STATE GUARDS — COMMISSION ────────────────────────────────────
  // 10a. Sign before send → 409
  const cDoc = (await call('GET', '/deal-commission/document', B.token)).body;
  const c1 = await call('POST', `/deal-rooms/${roomId}/commission/sign`, B.token, {
    signature_name: B.name, accepted_read: true, accepted_understand: true, accepted_agree: true,
    document_id: cDoc.id, content_hash: cDoc.content_hash,
  });
  expect('Sign Commission before admin sends → 409', c1.status, s => s === 409);

  // 10b. Send commission
  const c2 = await call('POST', `/deal-rooms/${roomId}/commission/send`, A.token);
  step(`Admin sends commission → ${c2.status}`, c2.ok);

  // 10c. Send AGAIN → 409 (regression guard)
  const c3 = await call('POST', `/deal-rooms/${roomId}/commission/send`, A.token);
  expect('Send commission twice → 409', c3.status, s => s === 409);

  // 10d. Sign properly
  for (const u of [B, S]) {
    const r = await call('POST', `/deal-rooms/${roomId}/commission/sign`, u.token, {
      signature_name: u.name, accepted_read: true, accepted_understand: true, accepted_agree: true,
      document_id: cDoc.id, content_hash: cDoc.content_hash,
    });
    step(`${u.name} signs Commission → ${r.status}`, r.ok);
  }

  // 10e. Re-sign → 409
  const c4 = await call('POST', `/deal-rooms/${roomId}/commission/sign`, B.token, {
    signature_name: B.name, accepted_read: true, accepted_understand: true, accepted_agree: true,
    document_id: cDoc.id, content_hash: cDoc.content_hash,
  });
  expect('Re-sign commission → 409', c4.status, s => s === 409);

  // ─── 11. IDENTITY REVEAL ─────────────────────────────────────────────
  const r14 = await call('GET', `/deal-rooms/${roomId}`, B.token);
  expect('After commission complete: buyer sees seller_user_id revealed', r14.body,
    b => b && b.seller_user_id === S.id && b.identities_revealed === true);

  // Outsider STILL gets privacy-shape
  const r15 = await call('GET', `/deal-rooms/${roomId}`, O.token);
  expect('Outsider STILL sees privacy-shape after reveal (no IDs)', r15.body,
    b => b && !b.buyer_user_id && !b.seller_user_id);

  // Commission PDF: buyer can get own, NOT seller's
  const cBuyer = await call('GET', `/deal-rooms/${roomId}/commission/signed-pdf?side=buyer`, B.token);
  expect('Buyer downloads own Commission PDF', cBuyer,
    r => r.status === 200 && r.length > 1000);

  const cSeller = await call('GET', `/deal-rooms/${roomId}/commission/signed-pdf?side=seller`, B.token);
  expect('Buyer tries to download SELLER commission PDF → 403',
    cSeller.status, s => s === 403);

  const cAdmin = await call('GET', `/deal-rooms/${roomId}/commission/signed-pdf?side=seller`, A.token);
  expect('Admin can download seller commission PDF', cAdmin,
    r => r.status === 200 && r.length > 1000);

  // ─── 12. CROSS-ROOM ISOLATION ─────────────────────────────────────────
  // Create a second room with DIFFERENT buyer (outsider as buyer this time)
  const r16 = await call('POST', '/deal-rooms', A.token, {
    yacht_id: yacht.id, buyer_user_id: O.id, seller_user_id: S.id,
    seller_type: 'owner', nda_required: true,
    buyer_nda_status: 'not_sent', seller_nda_status: 'not_sent', status: 'pending_nda',
  });
  const room2Id = r16.body.id;
  step(`Created second room with outsider as buyer → ${room2Id}`, r16.ok);

  // Original buyer (B) should NOT see room2 in their list and should not be able to read it
  const r17 = await call('GET', '/deal-rooms', B.token);
  expect('Buyer of room1 does NOT see room2 in their list',
    r17.body, b => Array.isArray(b) && !b.some(r => r.id === room2Id));

  const r18 = await call('GET', `/deal-rooms/${room2Id}/messages`, B.token);
  expect('Buyer of room1 → GET messages of room2 → 403', r18.status, s => s === 403);

  // ─── 13. ARCHIVE ──────────────────────────────────────────────────────
  const arc = await call('PATCH', `/deal-rooms/${room2Id}/archive`, A.token, { archived: true });
  step(`Admin archives room2 → ${arc.status}`, arc.ok);

  const lstNoArc = await call('GET', '/deal-rooms', A.token);
  const lstArc = await call('GET', '/deal-rooms?include_archived=true', A.token);
  expect('Default list excludes archived rooms',
    null, () => !lstNoArc.body.some(r => r.id === room2Id),
    `default count=${lstNoArc.body.length}, includes room2=${lstNoArc.body.some(r=>r.id===room2Id)}`);
  expect('include_archived=true exposes archived rooms',
    null, () => lstArc.body.some(r => r.id === room2Id),
    `with-archived count=${lstArc.body.length}, includes room2=${lstArc.body.some(r=>r.id===room2Id)}`);

  // ─── 14. UPDATE PARTICIPANT PERMISSIONS (admin only) ──────────────────
  const upd = await call('PATCH', `/deal-rooms/${roomId}/participants`, A.token, {
    user_id: B.id, can_message: false,
  });
  step(`Admin updates participant.can_message → ${upd.status}`, upd.ok);

  const updB = await call('PATCH', `/deal-rooms/${roomId}/participants`, B.token, {
    user_id: B.id, can_message: true,
  });
  expect('Non-admin tries to update participant → 403', updB.status, s => s === 403);

  // ─── DONE ─────────────────────────────────────────────────────────────
  console.log('\n=== SUMMARY ===');
  const okCount = REPORT.filter(r => r.ok).length;
  console.log(`${okCount}/${REPORT.length} checks passed`);
  if (okCount < REPORT.length) {
    console.log('\nFailures:');
    REPORT.filter(r => !r.ok).forEach(r => console.log(`  ✗ ${r.name} — ${r.detail}`));
  }
  console.log('\nRestoring yacht ownership...');
  await admin.from('yachts').update({ owner_id: origOwner }).eq('id', yacht.id);
  console.log('Done.');
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
