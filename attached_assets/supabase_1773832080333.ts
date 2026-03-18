import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://zpvisupiqrtjllavblim.supabase.co"
const supabaseKey = "zpvisupiqrtjllavblim"

export const supabase = createClient(supabaseUrl, supabaseKey)