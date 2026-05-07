'use client'

import { useEffect, useRef, useState } from 'react'
import type { Message } from '@/lib/store'
import { getMessages, sendMessage, markMessagesRead } from '@/lib/supabase/database'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { format, parseISO } from 'date-fns'
import { Send, MessageSquare, ChevronRight } from 'lucide-react'

const ADMIN_WA = [
  { label: '0773 083 687', wa: '263773083687' },
  { label: '0774 049 526', wa: '263774049526' },
  { label: '0770 083 687', wa: '263770083687' },
]

const GENERAL_WA_MSG = encodeURIComponent(
  `*BHADHARA TRANSPORT — General Inquiry*\n\nHello, I would like to inquire about your transport services.\n\nPlease advise on availability, pricing, and how to arrange a cash payment meetup.\n\nThank you.`
)

export default function ClientMessagesPage() {
  const { profile } = useAuth()
  const [initialMessages, setInitialMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Pass profile.username so realtime is scoped to this user's conversation
  const { messages, appendMessage } = useRealtimeMessages(initialMessages, profile?.username)

  useEffect(() => {
    if (!profile) return
    async function loadData() {
      const m = await getMessages(profile.username)
      setInitialMessages(m)
      setLoading(false)
      // Initial mark as read
      await markMessagesRead(profile.username)
    }
    loadData()
  }, [profile])

  // Mark incoming messages as read in real-time
  useEffect(() => {
    if (!profile || loading) return
    const unread = messages.filter(m => m.toUser === profile.username && !m.read)
    if (unread.length > 0) {
      markMessagesRead(profile.username)
    }
  }, [messages, profile, loading])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || !profile) return
    
    const sent = await sendMessage({
      fromUser: profile.username,
      toUser: 'admin',
      content: trimmed,
    })
    setText('')

    // Optimistically append so the message appears instantly
    if (sent) {
      appendMessage(sent)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading messages...</div>

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Leave a message for the Bhadhara Transport team, or contact us directly on WhatsApp for urgent matters.
        </p>
      </div>

      {/* WhatsApp quick contact */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Preferred — WhatsApp for urgent inquiries & payment meetups
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {ADMIN_WA.map(c => (
            <a
              key={c.wa}
              href={`https://wa.me/${c.wa}?text=${GENERAL_WA_MSG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>{c.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </a>
          ))}
        </div>
      </div>

      {/* In-app message thread */}
      <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">In-App Messages</p>
          <p className="text-xs text-muted-foreground">For non-urgent enquiries only. Cash payment meetups must be arranged via WhatsApp.</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-10">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
            </div>
          )}

          {messages.map(msg => {
            const isMe = msg.fromUser === profile?.username
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-secondary text-foreground rounded-bl-sm'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isMe ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground'
                    }`}
                  >
                    {format(parseISO(msg.timestamp), 'HH:mm • d MMM')}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3 flex items-end gap-2">
          <textarea
            rows={1}
            placeholder="Type a message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-input border border-border rounded-xl px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
