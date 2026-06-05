import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export interface ConversationSummary {
  conversation_id: string
  from_number: string
  to_number: string
  body: string | null
  direction: string
  timestamp: string
}

export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('messages')
    .select('conversation_id, from_number, to_number, body, direction, timestamp')
    .order('conversation_id', { ascending: true })
    .order('timestamp', { ascending: false })

  // Debug: raw fetch bypass JS client
  const rawUrl = process.env.SUPABASE_URL?.trim()
  const rawKey = process.env.SUPABASE_ANON_KEY?.trim()
  const rawRes = await fetch(`${rawUrl}/rest/v1/messages?select=conversation_id,body&limit=5`, {
    headers: { apikey: rawKey!, Authorization: `Bearer ${rawKey}` },
  })
  const rawData = await rawRes.json()

  return NextResponse.json({
    __debug: true,
    supabase_client_data: data,
    supabase_client_error: error,
    raw_fetch_status: rawRes.status,
    raw_fetch_data: rawData,
  })
}
