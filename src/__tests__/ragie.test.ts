import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { searchRagie } from '../lib/ragie'

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('RAGIE_API_KEY', 'test-ragie-key')
  vi.stubEnv('RAGIE_TOP_K', '3')
})

describe('searchRagie', () => {
  it('returns joined chunk text on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        scored_chunks: [
          { text: 'Chunk one' },
          { text: 'Chunk two' },
        ],
      }),
    })

    const result = await searchRagie('what is the return policy?')

    expect(result).toBe('Chunk one\n\n---\n\nChunk two')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.ragie.ai/retrievals',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-ragie-key',
        }),
        body: expect.stringContaining('"query":"what is the return policy?"'),
      }),
    )
  })

  it('returns empty string when API fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    })

    const result = await searchRagie('test query')
    expect(result).toBe('')
  })

  it('returns empty string when scored_chunks is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    const result = await searchRagie('test query')
    expect(result).toBe('')
  })

  it('throws when RAGIE_API_KEY is not set', async () => {
    vi.stubEnv('RAGIE_API_KEY', '')
    await expect(searchRagie('test')).rejects.toThrow('RAGIE_API_KEY is not set')
  })
})
