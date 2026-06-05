import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Direction = 'inbound' | 'outbound'

export interface ParsedWebhookMessage {
  fromNumber: string
  toNumber: string
  body: string | null
  direction: Direction
  timestamp: string
  rawMessageId: string
}

export function getConversationId(
  direction: Direction,
  fromNumber: string,
  toNumber: string,
): string {
  return direction === 'inbound' ? fromNumber : toNumber
}

export function parseWebhookMessages(payload: unknown): ParsedWebhookMessage[] {
  if (!payload || typeof payload !== 'object') return []

  const p = payload as Record<string, unknown>
  const entries = Array.isArray(p.entry) ? p.entry : []
  const results: ParsedWebhookMessage[] = []

  for (const entry of entries) {
    const changes = Array.isArray((entry as Record<string, unknown>).changes)
      ? ((entry as Record<string, unknown>).changes as unknown[])
      : []

    for (const change of changes) {
      const value = (change as Record<string, unknown>).value as Record<string, unknown> | undefined
      if (!value) continue

      const messages = Array.isArray(value.messages) ? value.messages : []
      const meta = (value.metadata as Record<string, unknown>) ?? {}
      const toNumber = (meta.phone_number_id as string) ?? ''

      for (const msg of messages) {
        const m = msg as Record<string, unknown>
        const fromNumber = (m.from as string) ?? ''
        const timestamp = (m.timestamp as string) ?? new Date().toISOString()
        const textObj = m.text as Record<string, unknown> | undefined
        const body = (textObj?.body as string) ?? null

        results.push({
          fromNumber,
          toNumber,
          body,
          direction: 'inbound',
          timestamp,
          rawMessageId: (m.id as string) ?? '',
        })
      }
    }
  }

  return results
}
