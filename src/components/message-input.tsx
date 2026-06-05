'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SendHorizonal } from 'lucide-react'

interface MessageInputProps {
  conversationId: string
  onSent?: () => void
}

export function MessageInput({ conversationId, onSent }: MessageInputProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function send() {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setSending(true)
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: conversationId, message: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(`Send failed: ${data.error ?? 'Unknown error'}`)
        return
      }
      setText('')
      onSent?.()
    } catch (err) {
      alert('Network error — check console')
      console.error(err)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex items-center gap-2 p-3 border-t border-gray-200 bg-gray-50">
      <Input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message…"
        disabled={sending}
        className="flex-1 bg-white"
      />
      <Button
        onClick={send}
        disabled={!text.trim() || sending}
        className="bg-[#25D366] hover:bg-[#1ebe5d] text-white shrink-0"
        size="icon"
        aria-label="Send message"
      >
        <SendHorizonal className="h-4 w-4" />
      </Button>
    </div>
  )
}
