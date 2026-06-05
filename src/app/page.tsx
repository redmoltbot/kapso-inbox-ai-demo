'use client'

import { useCallback, useEffect, useState } from 'react'
import { ConversationList, Conversation } from '@/components/conversation-list'
import { MessagePanel, Message } from '@/components/message-panel'
import { MessageInput } from '@/components/message-input'

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const loadConversations = useCallback(async () => {
    const res = await fetch('/api/conversations')
    if (res.ok) {
      const data = await res.json()
      setConversations(data)
    }
  }, [])

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true)
    const res = await fetch(`/api/messages/${encodeURIComponent(conversationId)}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data)
    }
    setLoadingMessages(false)
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId)
    }
  }, [selectedId, loadMessages])

  function handleSelectConversation(id: string) {
    setSelectedId(id)
    setMessages([])
  }

  return (
    <div className="flex h-full">
      {/* Left panel — conversation list */}
      <div className="w-80 shrink-0 flex flex-col">
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelectConversation}
        />
      </div>

      {/* Right panel — messages */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedId ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
              <p className="font-medium text-gray-900">{selectedId}</p>
            </div>

            {/* Messages */}
            {loadingMessages ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Loading…
              </div>
            ) : (
              <MessagePanel
                key={selectedId}
                conversationId={selectedId}
                initialMessages={messages}
              />
            )}

            {/* Input */}
            <MessageInput
              conversationId={selectedId}
              onSent={loadConversations}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  )
}
