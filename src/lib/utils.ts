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

// Kapso webhook format: { message: { from, text, timestamp, kapso: { direction } }, phone_number_id }
export function parseWebhookMessages(payload: unknown): ParsedWebhookMessage[] {
  if (!payload || typeof payload !== 'object') return []

  const p = payload as Record<string, unknown>

  // Must have a message object with a from field
  if (!p.message || typeof p.message !== 'object') return []

  const msg = p.message as Record<string, unknown>
  const fromNumber = (msg.from as string) ?? ''
  if (!fromNumber) return []

  const toNumber = (p.phone_number_id as string) ?? ''
  const timestamp = (msg.timestamp as string) ?? ''
  const textObj = msg.text as Record<string, unknown> | undefined
  const body = (textObj?.body as string) ?? null
  const kapso = msg.kapso as Record<string, unknown> | undefined
  const direction: Direction = (kapso?.direction as Direction) === 'outbound' ? 'outbound' : 'inbound'

  return [{
    fromNumber,
    toNumber,
    body,
    direction,
    timestamp,
    rawMessageId: (msg.id as string) ?? '',
  }]
}
