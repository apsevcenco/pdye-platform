import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: yachts, error } = await sb.from('yachts').select('id, name, owner_id, created_at').order('created_at', { ascending: false }).limit(10);
console.log("YACHTS:", error?.message || JSON.stringify(yachts, null, 2));
const { data: u } = await sb.auth.admin.listUsers({ page:1, perPage:200 });
const filt = (u?.users||[]).filter(x => x.email?.match(/owner|asevcenco|test/i));
console.log("USERS-OF-INTEREST:", JSON.stringify(filt.map(x=>({id:x.id,email:x.email})), null, 2));
