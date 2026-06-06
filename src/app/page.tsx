'use client'

import { useCallback, useEffect, useState } from 'react'
import { ConversationList, Conversation } from '@/components/conversation-list'
import { MessagePanel, Message } from '@/components/message-panel'
import { MessageInput } from '@/components/message-input'
import { getBrowserClient } from '@/lib/supabase-browser'
import { Menu, Moon, Sun } from 'lucide-react'

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark'
    setIsDark(isDarkMode)
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  function toggleTheme() {
    const newDark = !isDark
    setIsDark(newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
    if (newDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

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
    setDrawerOpen(false)
  }

  return (
    <div className="flex h-full overflow-hidden relative">

      {/* Mobile backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Conversation sidebar — drawer on mobile, static column on md+ */}
      <div
        className={[
          // Mobile: fixed overlay drawer that slides in from the left
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-card shadow-xl',
          'w-72 transition-transform duration-300 ease-in-out',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: normal static column, always visible
          'md:static md:translate-x-0 md:z-auto md:shadow-none md:w-80 md:shrink-0 md:transition-none',
        ].join(' ')}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelectConversation}
        />
      </div>

      {/* Main chat area — always full width on mobile, flex-1 on desktop */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {selectedId ? (
          <>
            {/* Chat header with hamburger on mobile */}
            <div className="px-3 py-3 border-b border-border bg-card shadow-sm flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  className="md:hidden p-1.5 rounded hover:bg-muted text-muted-foreground shrink-0"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open conversations"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <p className="font-medium text-foreground truncate text-sm">{selectedId}</p>
              </div>
              <button
                className="p-1.5 rounded hover:bg-muted text-muted-foreground shrink-0"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
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
          /* Empty state — show on desktop; on mobile prompt to open drawer */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground text-sm">
            <p className="hidden md:block">Select a conversation to start messaging</p>
            <div className="md:hidden flex flex-col items-center gap-3">
              <p>No conversation selected</p>
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                onClick={() => setDrawerOpen(true)}
              >
                Open Conversations
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
