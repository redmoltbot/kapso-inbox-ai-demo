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

async function verifySignature(rawBody: string, signature: string | null): Promise<boolean> {
  const secret = process.env.KAPSO_WEBHOOK_SECRET
  if (!secret) return true // skip verification if secret not configured

  if (!signature?.startsWith('sha256=')) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
  const expected = 'sha256=' + Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return expected === signature
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256')

  if (!(await verifySignature(rawBody, signature))) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  waitUntil(processWebhook(body))

  return new NextResponse('OK', { status: 200 })
}
