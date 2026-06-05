import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

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

  if (error) {
    console.error('[conversations] query error:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }

  // Keep only the most recent message per conversation_id
  const seen = new Set<string>()
  const conversations: ConversationSummary[] = []
  for (const row of data ?? []) {
    if (!seen.has(row.conversation_id)) {
      seen.add(row.conversation_id)
      conversations.push(row as ConversationSummary)
    }
  }

  // Sort by most recent first
  conversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return NextResponse.json(conversations)
}
