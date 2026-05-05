import { createClient } from '@supabase/supabase-js'

// Prefer build-time env vars (set in Render → Environment / .env.local).
// These two values are PUBLIC by Supabase design (anon key is meant to ship
// to the browser and is gated by RLS), but keeping them in env makes key
// rotation possible without a code change. Hardcoded fallback kept so a
// missing env on a fresh deploy doesn't break the live site.
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://zpvisupiqrtjllavblim.supabase.co"
const supabaseKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwdmlzdXBpcXJ0amxsYXZibGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4Mjc3ODIsImV4cCI6MjA4OTQwMzc4Mn0.3TBnkogeAQCTWDYNzcC-wC92pVVcoMa7f8kAk-08n_I"

export const supabase = createClient(supabaseUrl, supabaseKey)
