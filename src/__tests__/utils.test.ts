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
  it('extracts messages from a Meta webhook payload', () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'messages',
          value: {
            metadata: { phone_number_id: '1192487380606031' },
            messages: [{
              id: 'wamid.abc123',
              from: '60123456789',
              timestamp: '1717574400',
              type: 'text',
              text: { body: 'Hello!' },
            }],
          },
        }],
      }],
    }

    const result = parseWebhookMessages(payload)
    expect(result).toHaveLength(1)
    expect(result[0].fromNumber).toBe('60123456789')
    expect(result[0].body).toBe('Hello!')
    expect(result[0].direction).toBe('inbound')
  })

  it('returns empty array for status-only payloads', () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'messages',
          value: {
            metadata: { phone_number_id: '1192487380606031' },
            statuses: [{ id: 'wamid.abc', status: 'delivered' }],
          },
        }],
      }],
    }
    expect(parseWebhookMessages(payload)).toHaveLength(0)
  })

  it('returns empty array for unknown payloads', () => {
    expect(parseWebhookMessages({})).toHaveLength(0)
    expect(parseWebhookMessages(null)).toHaveLength(0)
  })
})
