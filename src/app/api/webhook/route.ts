import { NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createServerClient } from '@/lib/supabase-server'
import { parseWebhookMessages, getConversationId } from '@/lib/utils'

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

  const { error } = await supabase.from('messages').insert(rows)
  if (error) console.error('[webhook] supabase insert error:', error)
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Debug: always save raw payload so we can inspect it in Supabase
  waitUntil((async () => {
    const supabase = createServerClient()
    await supabase.from('messages').insert({
      conversation_id: '_debug',
      from_number: '_debug',
      to_number: '_debug',
      body: JSON.stringify(body),
      direction: 'inbound',
      raw: body,
    })
    await processWebhook(body)
  })())

  return new NextResponse('OK', { status: 200 })
}
