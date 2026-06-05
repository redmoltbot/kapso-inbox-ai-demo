import { describe, it, expect } from 'vitest'
import { getConversationId, parseWebhookMessages } from '../lib/utils'

describe('getConversationId', () => {
  it('returns from_number for inbound messages', () => {
    expect(getConversationId('inbound', '+60123456789', '+18186987588')).toBe('+60123456789')
  })

  it('returns to_number for outbound messages', () => {
    expect(getConversationId('outbound', '+18186987588', '+60123456789')).toBe('+60123456789')
  })
})

describe('parseWebhookMessages', () => {
  it('extracts a message from a Kapso webhook payload', () => {
    const payload = {
      message: {
        id: 'wamid.abc123',
        from: '60123456789',
        timestamp: '1717574400',
        type: 'text',
        text: { body: 'Hello!' },
        kapso: { direction: 'inbound' },
      },
      phone_number_id: '1192487380606031',
      conversation: { phone_number: '60123456789' },
    }

    const result = parseWebhookMessages(payload)
    expect(result).toHaveLength(1)
    expect(result[0].fromNumber).toBe('60123456789')
    expect(result[0].toNumber).toBe('1192487380606031')
    expect(result[0].body).toBe('Hello!')
    expect(result[0].direction).toBe('inbound')
    expect(result[0].timestamp).toBe('1717574400')
    expect(result[0].rawMessageId).toBe('wamid.abc123')
  })

  it('treats missing kapso.direction as inbound', () => {
    const payload = {
      message: { id: 'wamid.x', from: '60123456789', timestamp: '1717574400', text: { body: 'hi' } },
      phone_number_id: '1192487380606031',
    }
    const result = parseWebhookMessages(payload)
    expect(result[0].direction).toBe('inbound')
  })

  it('returns empty array when message object is missing', () => {
    expect(parseWebhookMessages({ phone_number_id: '123' })).toHaveLength(0)
  })

  it('returns empty array for unknown payloads', () => {
    expect(parseWebhookMessages({})).toHaveLength(0)
    expect(parseWebhookMessages(null)).toHaveLength(0)
  })
})
