import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://zpvisupiqrtjllavblim.supabase.co"
const supabaseKey = "sb_publishable_Akb48MGUYXpHh-v8F8o1Ug_r-E8Yo5C"

export const supabase = createClient(supabaseUrl, supabaseKey)