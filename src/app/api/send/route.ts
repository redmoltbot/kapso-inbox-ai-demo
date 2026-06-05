import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getConversationId } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const KAPSO_API_KEY = process.env.KAPSO_API_KEY!
const KAPSO_PHONE_NUMBER_ID = process.env.KAPSO_PHONE_NUMBER_ID!
const KAPSO_SEND_URL = `https://api.kapso.ai/meta/whatsapp/v17.0/${KAPSO_PHONE_NUMBER_ID}/messages`

export async function POST(request: Request) {
  let to: string, message: string
  try {
    const body = await request.json()
    to = body.to
    message = body.message
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!to || !message) {
    return NextResponse.json({ error: 'Missing required fields: to, message' }, { status: 400 })
  }

  // Call Kapso API
  const kapsoResponse = await fetch(KAPSO_SEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': KAPSO_API_KEY,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    }),
  })

  if (!kapsoResponse.ok) {
    const err = await kapsoResponse.text()
    console.error('[send] Kapso API error:', kapsoResponse.status, err)
    return NextResponse.json(
      { error: 'Failed to send message', detail: err },
      { status: 502 },
    )
  }

  const kapsoData = await kapsoResponse.json()

  // Save outbound message to Supabase
  const fromNumber = KAPSO_PHONE_NUMBER_ID
  const direction = 'outbound' as const
  const supabase = createServerClient()

  const { error: dbError } = await supabase.from('messages').insert({
    conversation_id: getConversationId(direction, fromNumber, to),
    from_number: fromNumber,
    to_number: to,
    body: message,
    direction,
    raw: kapsoData,
  })

  if (dbError) console.error('[send] supabase insert error:', dbError)

  return NextResponse.json({ ok: true })
}
