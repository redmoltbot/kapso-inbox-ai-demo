'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface Conversation {
  conversation_id: string
  body: string | null
  direction: string
  timestamp: string
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function getInitial(phone: string): string {
  return phone.replace(/\D/g, '').slice(-2)
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-[#25D366]">
        <h1 className="text-white font-semibold text-lg">Kapso Inbox</h1>
      </div>
      <ScrollArea className="flex-1">
        {conversations.length === 0 && (
          <p className="p-4 text-sm text-gray-400">No conversations yet.</p>
        )}
        {conversations.map((conv) => (
          <button
            key={conv.conversation_id}
            onClick={() => onSelect(conv.conversation_id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100',
              selectedId === conv.conversation_id && 'bg-green-50 border-l-4 border-l-[#25D366]',
            )}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-medium">
                {getInitial(conv.conversation_id)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {conv.conversation_id}
                </span>
                <span className="text-xs text-gray-400 ml-2 shrink-0">
                  {formatTime(conv.timestamp)}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {conv.direction === 'outbound' ? '✓ ' : ''}
                {conv.body ?? '(no text)'}
              </p>
            </div>
          </button>
        ))}
      </ScrollArea>
    </div>
  )
}
