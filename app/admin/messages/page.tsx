'use client'

import { useEffect, useRef, useState } from 'react'
import { getMessages, sendMessage, markMessagesRead, getProfiles } from '@/lib/supabase/database'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { format, parseISO } from 'date-fns'
import { Send, MessageSquare, Search, User, Check, CheckCheck } from 'lucide-react'
import type { Message } from '@/lib/store'

export default function AdminMessagesPage() {
  const { profile: adminProfile } = useAuth()
  const [profiles, setProfiles] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [initialMessages, setInitialMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Pass selectedUser so the hook only processes messages relevant to this thread
  const { messages, appendMessage } = useRealtimeMessages(initialMessages, selectedUser ?? undefined)

  useEffect(() => {
    async function loadProfiles() {
      const p = await getProfiles()
      // Filter out self and only show clients/employees
      setProfiles(p.filter(u => u.username !== 'admin'))
      setLoading(false)
    }
    loadProfiles()
  }, [])

  useEffect(() => {
    if (!selectedUser) return
    async function loadThread() {
      const m = await getMessages(selectedUser)
      setInitialMessages(m)
      // Mark as read when opening thread
      await markMessagesRead('admin')
    }
    loadThread()
  }, [selectedUser])

  // Real-time read receipt handling
  useEffect(() => {
    if (!selectedUser || loading) return
    const unread = messages.filter(m => m.toUser === 'admin' && m.fromUser === selectedUser && !m.read)
    if (unread.length > 0) {
      markMessagesRead('admin')
    }
  }, [messages, selectedUser, loading])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || !selectedUser) return
    
    const sent = await sendMessage({
      fromUser: 'admin',
      toUser: selectedUser,
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

  const filteredProfiles = profiles.filter(p => 
    p.username.toLowerCase().includes(search.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading messenger...</div>

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Sidebar: User List */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground mb-4">Messages</h1>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredProfiles.map(p => {
            const lastMsg = messages.filter(m => m.fromUser === p.username || m.toUser === p.username).pop()
            const isSelected = selectedUser === p.username
            const hasUnread = messages.some(m => m.fromUser === p.username && m.toUser === 'admin' && !m.read)

            return (
              <button
                key={p.id}
                onClick={() => setSelectedUser(p.username)}
                className={`w-full p-4 flex items-center gap-3 border-b border-border/50 transition-colors text-left ${
                  isSelected ? 'bg-primary/10 border-r-2 border-r-primary' : 'hover:bg-secondary/30'
                }`}
              >
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {p.username[0].toUpperCase()}
                  </div>
                  {hasUnread && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary border-2 border-card rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-bold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {p.username}
                    </p>
                    {lastMsg && (
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {format(parseISO(lastMsg.timestamp), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {lastMsg ? lastMsg.content : 'No messages yet'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background/50">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                  {selectedUser[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-foreground">{selectedUser}</p>
                  <p className="text-xs text-green-400 font-medium">Online</p>
                </div>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.filter(m => m.fromUser === selectedUser || m.toUser === selectedUser).map(msg => {
                const isMe = msg.fromUser === 'admin'
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] group`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-br-sm' 
                          : 'bg-card border border-border text-foreground rounded-bl-sm'
                      }`}>
                        <p>{msg.content}</p>
                        <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-[10px] ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                            {format(parseISO(msg.timestamp), 'HH:mm')}
                          </span>
                          {isMe && (
                            msg.read ? (
                              <CheckCheck className="w-3 h-3 text-primary-foreground/60" />
                            ) : (
                              <Check className="w-3 h-3 text-primary-foreground/60" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-card border-t border-border">
              <div className="max-w-4xl mx-auto flex items-end gap-3">
                <textarea
                  rows={1}
                  placeholder="Type your message..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none leading-relaxed"
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim()}
                  className="p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Select a conversation</h2>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Choose a user from the sidebar to start messaging. You can see their online status and message history.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
