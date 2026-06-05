import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

let _client: SupabaseClient | null = null

export function getBrowserClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(url, key)
  }
  return _client
}
