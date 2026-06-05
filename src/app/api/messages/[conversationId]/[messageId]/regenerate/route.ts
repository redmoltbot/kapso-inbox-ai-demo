import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { generateAiDraft } from '@/lib/ai-draft'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: { conversationId: string; messageId: string } },
) {
  const { messageId } = params
  const supabase = createServerClient()

  const { data: message, error } = await supabase
    .from('messages')
    .select('body')
    .eq('id', messageId)
    .single()

  if (error || !message?.body) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  try {
    await generateAiDraft(messageId, message.body)
  } catch (err) {
    console.error('[regenerate] failed', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }

  const { data: updated } = await supabase
    .from('messages')
    .select('ai_draft')
    .eq('id', messageId)
    .single()

  return NextResponse.json({ draft: updated?.ai_draft ?? '' })
}
