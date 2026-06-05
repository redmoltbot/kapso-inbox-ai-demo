export async function draftReply(
  incomingMessage: string,
  ragieContext: string,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set')

  const model = process.env.OPENROUTER_MODEL ?? 'openrouter/owl-alpha'
  const siteUrl = process.env.OPENROUTER_SITE_URL ?? ''

  const systemPrompt = ragieContext.trim()
    ? `You are a helpful WhatsApp support assistant. Use the knowledge base context below to answer the user's message. Be concise, friendly, and reply in the same language as the user.\n\nKnowledge base context:\n${ragieContext}`
    : `You are a helpful WhatsApp support assistant. Be concise and friendly. Reply in the same language as the user.`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': siteUrl,
      'X-Title': 'Kapso Inbox AI',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: incomingMessage },
      ],
      max_tokens: 500,
      temperature: 0.4,
    }),
  })

  if (!res.ok) {
    console.error('[OpenRouter] generation failed', res.status, await res.text())
    return ''
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}
