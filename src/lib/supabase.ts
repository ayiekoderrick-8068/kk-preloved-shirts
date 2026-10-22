import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config, hasSupabase } from './config'

/** Null when Supabase env vars are not set - callers must fall back to demo mode. */
export const supabase: SupabaseClient | null = hasSupabase ? createClient(config.supabaseUrl, config.supabaseAnonKey) : null
