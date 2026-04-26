import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://zpvisupiqrtjllavblim.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwdmlzdXBpcXJ0amxsYXZibGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4Mjc3ODIsImV4cCI6MjA4OTQwMzc4Mn0.3TBnkogeAQCTWDYNzcC-wC92pVVcoMa7f8kAk-08n_I"

export const supabase = createClient(supabaseUrl, supabaseKey)
