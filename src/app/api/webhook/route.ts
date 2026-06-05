import { NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createServerClient } from '@/lib/supabase-server'
import { parseWebhookMessages, getConversationId } from '@/lib/utils'
import { generateAiDraft } from '@/lib/ai-draft'

export const dynamic = 'force-dynamic'

async function processWebhook(raw: unknown): Promise<void> {
  const messages = parseWebhookMessages(raw)
  if (messages.length === 0) return

  const supabase = createServerClient()

  const rows = messages.map((m) => ({
    conversation_id: getConversationId(m.direction, m.fromNumber, m.toNumber),
    from_number: m.fromNumber,
    to_number: m.toNumber,
    body: m.body,
    direction: m.direction,
    timestamp: new Date(Number(m.timestamp) * 1000).toISOString(),
    raw,
  }))

  const { data: inserted, error } = await supabase
    .from('messages')
    .insert(rows)
    .select('id, body, direction')

  if (error) {
    console.error('[webhook] supabase insert error:', error)
    return
  }

  for (const row of inserted ?? []) {
    if (row.direction === 'inbound' && row.body) {
      await generateAiDraft(row.id, row.body).catch((err) =>
        console.error('[webhook] generateAiDraft failed', err),
      )
    }
  }
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  waitUntil(processWebhook(body))

  return new NextResponse('OK', { status: 200 })
}
