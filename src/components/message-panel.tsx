'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
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
}

interface MessagePanelProps {
  conversationId: string
  initialMessages: Message[]
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MessagePanel({ conversationId, initialMessages }: MessagePanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Supabase Realtime subscription
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  // Reset messages when conversation changes
  useEffect(() => {
    setMessages(initialMessages)
  }, [conversationId, initialMessages])

  return (
    <ScrollArea className="flex-1 px-4 py-2">
      <div className="flex flex-col gap-2">
        {messages.map((msg) => {
          const isOutbound = msg.direction === 'outbound'
          return (
            <div
              key={msg.id}
              className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[70%] rounded-lg px-3 py-2 shadow-sm',
                  isOutbound
                    ? 'bg-[#25D366] text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none',
                )}
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
          )
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
