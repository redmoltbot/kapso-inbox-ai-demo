import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { draftReply } from '../lib/openrouter'

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('OPENROUTER_API_KEY', 'test-or-key')
  vi.stubEnv('OPENROUTER_MODEL', 'openrouter/owl-alpha')
  vi.stubEnv('OPENROUTER_SITE_URL', 'https://example.com')
})

describe('draftReply', () => {
  it('returns draft from OpenRouter response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '  Hello! Here is my answer.  ' } }],
      }),
    })

    const result = await draftReply('what are your hours?', 'We are open 9-5.')

    expect(result).toBe('Hello! Here is my answer.')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-or-key',
          'HTTP-Referer': 'https://example.com',
          'X-Title': 'Kapso Inbox AI',
        }),
      }),
    )
  })

  it('injects ragie context into system prompt when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'reply' } }] }),
    })

    await draftReply('question', 'KB context here')

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(callBody.messages[0].content).toContain('KB context here')
  })

  it('uses generic prompt when ragie context is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'reply' } }] }),
    })

    await draftReply('question', '')

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(callBody.messages[0].content).not.toContain('Knowledge base context')
  })

  it('returns empty string when API fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'rate limited',
    })

    const result = await draftReply('question', '')
    expect(result).toBe('')
  })

  it('throws when OPENROUTER_API_KEY is not set', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '')
    await expect(draftReply('q', '')).rejects.toThrow('OPENROUTER_API_KEY is not set')
  })
})
