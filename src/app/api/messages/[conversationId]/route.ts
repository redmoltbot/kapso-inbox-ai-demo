import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { conversationId: string } },
) {
  const { conversationId } = params

  if (!conversationId) {
    return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, from_number, to_number, body, direction, timestamp')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true })

  if (error) {
    console.error('[messages] query error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
