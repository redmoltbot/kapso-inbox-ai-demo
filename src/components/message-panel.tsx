'use client'

import { useEffect, useRef, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase-browser'
import { cn } from '@/lib/utils'

export interface Message {
  id: string
  conversation_id: string
  from_number: string
  to_number: string
  body: string | null
  direction: string
  timestamp: string
  ai_draft?: string | null
  ragie_context?: string | null
  ai_drafted_at?: string | null
}

interface MessagePanelProps {
  conversationId: string
  initialMessages: Message[]
  onUseDraft?: (text: string) => void
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const dateStr = date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  })
  const timeStr = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${dateStr} ${timeStr}`
}

export function MessagePanel({ conversationId, initialMessages, onUseDraft }: MessagePanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const supabase = getBrowserClient()
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === (payload.new as Message).id)
            if (exists) return prev
            return [...prev, payload.new as Message]
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === (payload.new as Message).id ? { ...m, ...(payload.new as Message) } : m,
            ),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  useEffect(() => {
    setMessages(initialMessages)
  }, [conversationId, initialMessages])

  async function handleRegenerate(messageId: string) {
    setRegenerating(messageId)
    try {
      await fetch(`/api/ai/${messageId}`, { method: 'POST' })
    } catch (err) {
      console.error('[regenerate] failed', err)
    } finally {
      setRegenerating(null)
    }
  }

  const lastInboundIndex = messages.reduce(
    (acc, msg, idx) => (msg.direction === 'inbound' ? idx : acc),
    -1,
  )

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-2">
      <div className="flex flex-col gap-2">
        {messages.map((msg, idx) => {
          const isOutbound = msg.direction === 'outbound'
          const showDraftPanel = idx === lastInboundIndex

          return (
            <div key={msg.id}>
              <div className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[70%] rounded-lg px-3 py-2 shadow-sm',
                    isOutbound
                      ? 'text-white rounded-br-none'
                      : 'bg-muted text-foreground rounded-bl-none',
                  )}
                  style={
                    isOutbound
                      ? { backgroundColor: '#299963' }
                      : {}
                  }
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.body ?? '(no text)'}
                  </p>
                  <p
                    className={cn(
                      'text-[10px] mt-1 text-right',
                      isOutbound ? 'text-green-100' : 'text-gray-400',
                    )}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>

              {showDraftPanel && (
                <div className="mt-2 ml-1 max-w-[80%]">
                  {msg.ai_draft ? (
                    <div
                      className="rounded-lg border border-dashed p-3"
                      style={{
                        backgroundColor: '#e1f2e0',
                        borderColor: '#299963',
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-black uppercase tracking-wide">
                          ✨ AI Draft
                        </span>
                        <button
                          className="text-xs px-2 py-1 rounded font-medium text-black hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: '#299963', color: '#fff' }}
                          onClick={() => onUseDraft?.(msg.ai_draft!)}
                        >
                          Use Draft
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.ai_draft}</p>
                      <div className="mt-2 flex justify-end">
                        <button
                          className="text-xs px-2 py-1 rounded font-medium text-white hover:opacity-80 transition-opacity disabled:opacity-50"
                          style={{ backgroundColor: '#299963' }}
                          disabled={regenerating === msg.id}
                          onClick={() => handleRegenerate(msg.id)}
                        >
                          {regenerating === msg.id ? 'Regenerating…' : 'Regenerate'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="rounded-lg border border-dashed px-3 py-2"
                      style={{
                        backgroundColor: '#e1f2e0',
                        borderColor: '#299963',
                      }}
                    >
                      <span className="text-xs font-medium text-black">✨ Drafting reply…</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
