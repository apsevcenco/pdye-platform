// Audit DB for test data leftovers, orphans, garbage records.
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false }});

const heli = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });

console.log('=== SUPABASE: TEST USERS ===');
const { data: testUsers } = await sb.from('users').select('id,email,role,approved,created_at')
  .or('email.like.e2e_%,email.like.deep_%,email.like.%test.local,email.like.%pdye-test%')
  .order('created_at', { ascending: false });
console.log(`Found ${testUsers?.length || 0} test users:`);
testUsers?.forEach(u => console.log(`  ${u.email}  role=${u.role}  id=${u.id}`));

console.log('\n=== SUPABASE: ALL USERS (for context) ===');
const { data: allUsers } = await sb.from('users').select('id,email,role,approved,name,archived');
console.log(`Total users: ${allUsers?.length}`);
allUsers?.forEach(u => {
  const flag = u.email?.includes('test.local') || u.email?.includes('pdye-test') ? ' ← TEST' : '';
  console.log(`  ${u.email?.padEnd(50)} role=${u.role?.padEnd(10)} approved=${u.approved} archived=${u.archived}${flag}`);
});

console.log('\n=== SUPABASE: YACHTS ===');
const { data: yachts } = await sb.from('yachts').select('id,name,listing_status,owner_id,created_at')
  .order('created_at', { ascending: false });
console.log(`Total yachts: ${yachts?.length}`);
yachts?.forEach(y => console.log(`  "${y.name}"  status=${y.listing_status}  owner=${y.owner_id?.slice(0,8)}…`));

console.log('\n=== SUPABASE: ACCESS_REQUESTS ===');
const { data: areq } = await sb.from('access_requests').select('*').order('created_at', { ascending: false });
console.log(`Total: ${areq?.length}`);
areq?.forEach(r => {
  const isTest = testUsers?.some(u => u.id === r.requester_id) ? ' ← FROM TEST USER' : '';
  console.log(`  id=${r.id?.slice(0,8)}…  yacht=${r.yacht_id?.slice(0,8)}…  status=${r.status}  deal_room=${r.deal_room_id?.slice(0,8) || 'none'}${isTest}`);
});

console.log('\n=== SUPABASE: LEADS ===');
const { data: leads, count } = await sb.from('leads').select('*', { count: 'exact' });
console.log(`Total: ${count || leads?.length}`);
leads?.forEach(l => console.log(`  ${l.email}  type=${l.type || l.role || 'n/a'}  created=${l.created_at}`));

console.log('\n=== HELIUMDB: DEAL_ROOMS ===');
const { rows: rooms } = await heli.query('SELECT id, room_number, status, archived, buyer_user_id, seller_user_id, identities_revealed, commission_status, created_at FROM deal_rooms ORDER BY created_at DESC');
console.log(`Total: ${rooms.length}`);
rooms.forEach(r => {
  const buyerTest = testUsers?.some(u => u.id === r.buyer_user_id);
  const sellerTest = testUsers?.some(u => u.id === r.seller_user_id);
  const flag = (buyerTest || sellerTest) ? ' ← TEST PARTICIPANTS' : '';
  console.log(`  #${r.room_number} status=${r.status}  archived=${r.archived}  reveal=${r.identities_revealed}  commission=${r.commission_status || '—'}${flag}`);
});

console.log('\n=== HELIUMDB: DEAL_ROOM_MESSAGES ===');
const { rows: msgs } = await heli.query('SELECT deal_room_id, COUNT(*)::int FROM deal_room_messages GROUP BY deal_room_id');
console.log('Messages per room:');
msgs.forEach(m => console.log(`  room=${m.deal_room_id?.slice(0,8)}…  count=${m.count}`));

console.log('\n=== HELIUMDB: ORPHANS — messages whose deal_room is gone ===');
const { rows: orphMsg } = await heli.query(`
  SELECT m.id, m.deal_room_id FROM deal_room_messages m
  LEFT JOIN deal_rooms r ON r.id = m.deal_room_id
  WHERE r.id IS NULL`);
console.log(`Orphan messages: ${orphMsg.length}`);

console.log('\n=== HELIUMDB: ORPHANS — participants whose room is gone ===');
const { rows: orphP } = await heli.query(`
  SELECT p.id FROM deal_room_participants p
  LEFT JOIN deal_rooms r ON r.id = p.deal_room_id
  WHERE r.id IS NULL`);
console.log(`Orphan participants: ${orphP.length}`);

console.log('\n=== HELIUMDB: ORPHANS — nda_envelopes whose room is gone ===');
const { rows: orphE } = await heli.query(`SELECT COUNT(*)::int AS c FROM nda_envelopes`).catch(()=>({rows:[{c:'no-table'}]}));
console.log(`nda_envelopes total rows: ${orphE[0].c} (legacy DocuSign-stub table)`);

console.log('\n=== HELIUMDB: PLATFORM_NDA_SIGNATURES ===');
const { rows: pnda } = await heli.query('SELECT COUNT(*)::int AS c, COUNT(DISTINCT user_id)::int AS users FROM platform_nda_signatures');
console.log(`Total signatures: ${pnda[0].c}, unique users: ${pnda[0].users}`);

console.log('\n=== HELIUMDB: DEAL_NDA_SIGNATURES ===');
const { rows: dnda } = await heli.query('SELECT side, COUNT(*)::int FROM deal_nda_signatures GROUP BY side');
dnda.forEach(r => console.log(`  ${r.side}: ${r.count}`));

console.log('\n=== HELIUMDB: DEAL_COMMISSION_SIGNATURES ===');
const { rows: dcom } = await heli.query('SELECT side, COUNT(*)::int FROM deal_commission_signatures GROUP BY side');
dcom.forEach(r => console.log(`  ${r.side}: ${r.count}`));

console.log('\n=== HELIUMDB: AUDIT_LOGS ===');
const { rows: aud } = await heli.query('SELECT entity_type, COUNT(*)::int FROM audit_logs GROUP BY entity_type ORDER BY count DESC');
aud.forEach(r => console.log(`  ${r.entity_type}: ${r.count}`));

console.log('\n=== SUPABASE AUTH: TEST AUTH USERS (no profile) ===');
const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 500 });
const testAuth = list?.users?.filter(u => u.email?.includes('test.local') || u.email?.includes('pdye-test'));
console.log(`Test auth users: ${testAuth?.length || 0}`);
testAuth?.forEach(u => console.log(`  ${u.email}  id=${u.id}  created=${u.created_at}`));

await heli.end();
process.exit(0);
