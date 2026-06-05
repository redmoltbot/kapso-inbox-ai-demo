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

  return NextResponse.json({
    __debug: true,
    url_len: process.env.SUPABASE_URL?.length,
    key_len: process.env.SUPABASE_ANON_KEY?.length,
    url_trimmed: process.env.SUPABASE_URL?.trim(),
    data,
    error,
  })
}
