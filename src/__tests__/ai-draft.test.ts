import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/ragie', () => ({ searchRagie: vi.fn() }))
vi.mock('../lib/openrouter', () => ({ draftReply: vi.fn() }))
vi.mock('../lib/supabase-server', () => ({
  createServerClient: vi.fn(),
}))

import { generateAiDraft } from '../lib/ai-draft'
import { searchRagie } from '../lib/ragie'
import { draftReply } from '../lib/openrouter'
import { createServerClient } from '../lib/supabase-server'

const mockEq = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })

beforeEach(() => {
  vi.clearAllMocks()
  ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom })
  ;(searchRagie as ReturnType<typeof vi.fn>).mockResolvedValue('KB context')
  ;(draftReply as ReturnType<typeof vi.fn>).mockResolvedValue('Draft reply text')
})

describe('generateAiDraft', () => {
  it('calls searchRagie then draftReply then updates Supabase', async () => {
    await generateAiDraft('msg-uuid-123', 'What are your hours?')

    expect(searchRagie).toHaveBeenCalledWith('What are your hours?')
    expect(draftReply).toHaveBeenCalledWith('What are your hours?', 'KB context')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        ai_draft: 'Draft reply text',
        ragie_context: 'KB context',
      }),
    )
    expect(mockEq).toHaveBeenCalledWith('id', 'msg-uuid-123')
  })

  it('returns early without calling APIs when text is empty', async () => {
    await generateAiDraft('msg-uuid-123', '')

    expect(searchRagie).not.toHaveBeenCalled()
    expect(draftReply).not.toHaveBeenCalled()
  })

  it('returns early without updating Supabase when draft is empty', async () => {
    ;(draftReply as ReturnType<typeof vi.fn>).mockResolvedValue('')

    await generateAiDraft('msg-uuid-123', 'hello')

    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
