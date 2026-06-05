'use client'

import { useCallback, useEffect, useState } from 'react'
import { ConversationList, Conversation } from '@/components/conversation-list'
import { MessagePanel, Message } from '@/components/message-panel'
import { MessageInput } from '@/components/message-input'
import { getBrowserClient } from '@/lib/supabase-browser'

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<string | null>(null)

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

  useEffect(() => {
    const supabase = getBrowserClient()
    const channel = supabase
      .channel('conversation-list-refresh')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => { loadConversations() },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadConversations])

  function handleSelectConversation(id: string) {
    setSelectedId(id)
    setMessages([])
    setPendingDraft(null)
  }

  return (
    <div className="flex h-full">
      <div className="w-80 shrink-0 flex flex-col">
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelectConversation}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedId ? (
          <>
            <div className="px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
              <p className="font-medium text-gray-900">{selectedId}</p>
            </div>

            {loadingMessages ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Loading…
              </div>
            ) : (
              <MessagePanel
                key={selectedId}
                conversationId={selectedId}
                initialMessages={messages}
                onUseDraft={(text) => setPendingDraft(text)}
              />
            )}

            <MessageInput
              conversationId={selectedId}
              injectedText={pendingDraft}
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
