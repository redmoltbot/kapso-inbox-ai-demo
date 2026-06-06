'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { SendHorizonal } from 'lucide-react'

interface MessageInputProps {
  conversationId: string
  injectedText?: string | null
  onSent?: () => void
}

export function MessageInput({ conversationId, injectedText, onSent }: MessageInputProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (injectedText) {
      setText(injectedText)
      textareaRef.current?.focus()
    }
  }, [injectedText])

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
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex gap-2 p-3 border-t border-border bg-card">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message… (Shift+Enter for new line)"
        disabled={sending}
        className="flex-1 resize-none rounded-lg border border-border bg-background text-foreground p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        rows={3}
      />
      <Button
        onClick={send}
        disabled={!text.trim() || sending}
        className="text-white shrink-0 self-end"
        style={{ backgroundColor: '#299963' }}
        size="icon"
        aria-label="Send message"
      >
        <SendHorizonal className="h-4 w-4" />
      </Button>
    </div>
  )
}
