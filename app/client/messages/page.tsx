'use client'

import { useState, useEffect, useRef } from 'react'
import { getMessages, sendMessage, markMessagesRead } from '@/lib/supabase/database'
import { useAuth } from '@/components/auth/AuthProvider'
import { Message, store } from '@/lib/store'
import { format, parseISO } from 'date-fns'
import { Send, User, Clock, Check, CheckCheck, Loader2, MessageSquare } from 'lucide-react'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'

export default function ClientMessagesPage() {
  const { profile } = useAuth()
  const [initialMessages, setInitialMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = useRealtimeMessages(initialMessages)

  useEffect(() => {
    const currentProfile = profile
    if (!currentProfile) return
    async function loadData() {
      if (!currentProfile) return
      const m = await getMessages(currentProfile.username)
      setInitialMessages(m)
      setLoading(false)
      // Initial mark as read
      await markMessagesRead(currentProfile.username)
    }
    loadData()
  }, [profile])

  // Mark incoming messages as read in real-time
  useEffect(() => {
    const currentProfile = profile
    if (!currentProfile || loading) return
    const unread = messages.filter(m => m.toUser === currentProfile.username && !m.read)
    if (unread.length > 0) {
      markMessagesRead(currentProfile.username)
    }
  }, [messages, profile, loading])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = text.trim()
    const currentProfile = profile
    if (!trimmed || !currentProfile) return
    
    await sendMessage({
      fromUser: currentProfile.username,
      toUser: 'admin',
      content: trimmed
    })
    setText('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">Support Chat</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Admin Support
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/5 border-x border-border custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold">Start a conversation</p>
            <p className="text-sm text-muted-foreground">Ask anything about your bookings or our services.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.fromUser === profile?.username
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[70%] space-y-1`}>
                  <div className={`p-3 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/10' 
                      : 'bg-card border border-border text-foreground rounded-tl-none shadow-sm'
                  }`}>
                    {m.content}
                  </div>
                  <div className={`flex items-center gap-1.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <p className="text-[10px] text-muted-foreground">
                      {format(parseISO(m.timestamp), 'HH:mm')}
                    </p>
                    {isMe && (
                      m.read ? (
                        <CheckCheck className="w-3 h-3 text-blue-400" />
                      ) : (
                        <Check className="w-3 h-3 text-muted-foreground" />
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="p-4 bg-card border border-border rounded-b-2xl">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
