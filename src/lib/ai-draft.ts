import { searchRagie } from './ragie'
import { draftReply } from './openrouter'
import { createServerClient } from './supabase-server'

export async function generateAiDraft(messageId: string, text: string): Promise<void> {
  if (!text?.trim()) return

  const ragieContext = await searchRagie(text)
  const draft = await draftReply(text, ragieContext)

  if (!draft) return

  const supabase = createServerClient()
  const { error } = await supabase
    .from('messages')
    .update({
      ai_draft: draft,
      ragie_context: ragieContext,
      ai_drafted_at: new Date().toISOString(),
    })
    .eq('id', messageId)

  if (error) console.error('[AI Draft] supabase update error:', error)
}
