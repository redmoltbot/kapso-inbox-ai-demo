export async function searchRagie(query: string): Promise<string> {
  const apiKey = process.env.RAGIE_API_KEY
  if (!apiKey) throw new Error('RAGIE_API_KEY is not set')

  const topK = parseInt(process.env.RAGIE_TOP_K ?? '5', 10)

  const res = await fetch('https://api.ragie.ai/retrievals', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, rerank: true, top_k: topK }),
  })

  if (!res.ok) {
    console.error('[Ragie] retrieval failed', res.status, await res.text())
    return ''
  }

  const data = await res.json()
  const chunks: Array<{ text: string }> = data.scored_chunks ?? []
  return chunks.map((c) => c.text).join('\n\n---\n\n')
}
