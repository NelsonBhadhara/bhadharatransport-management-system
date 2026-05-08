'use client'

import { useEffect, useRef, useState } from 'react'
import { getMessages, sendMessage, markMessagesRead, getProfiles } from '@/lib/supabase/database'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { format, parseISO } from 'date-fns'
import { Send, MessageSquare, Search, User, Check, CheckCheck, ChevronLeft } from 'lucide-react'
import type { Message } from '@/lib/store'

export default function AdminMessagesPage() {
  const { profile: adminProfile } = useAuth()
  const [profiles, setProfiles] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [initialMessages, setInitialMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // IMPORTANT: For Admin, we don't pass selectedUser to the hook filter.
  // This ensures the sidebar stays updated for ALL users while we chat with one.
  const { messages, appendMessage } = useRealtimeMessages(initialMessages)

  useEffect(() => {
    async function loadInitialData() {
      // Load all profiles
      const p = await getProfiles()
      setProfiles(p.filter(u => u.username !== 'admin'))
      
      // Load ALL message history so the sidebar has context for every user
      const m = await getMessages()
      setInitialMessages(m)
      setLoading(false)
    }
    loadInitialData()
  }, [])

  // Auto-scroll chat window
  useEffect(() => {
    if (selectedUser) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, selectedUser])

  // Mark unread messages for the selected user
  useEffect(() => {
    if (!selectedUser || loading) return
    const unread = messages.filter(m => m.fromUser === selectedUser && m.toUser === 'admin' && !m.read)
    if (unread.length > 0) {
      markMessagesRead('admin')
    }
  }, [messages, selectedUser, loading])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || !selectedUser) return
    
    const sent = await sendMessage({
      fromUser: 'admin',
      toUser: selectedUser,
      content: trimmed,
    })
    setText('')

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
    p.username.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse font-black uppercase tracking-widest">Loading messenger...</div>

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background relative">
      {/* Sidebar: User List */}
      <div className={`w-full md:w-80 border-r border-border flex flex-col bg-card transition-all duration-300 ${
        showMobileChat ? '-translate-x-full md:translate-x-0 hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-border space-y-4">
          <h1 className="text-2xl font-black text-foreground tracking-tight">Messages</h1>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredProfiles.length === 0 ? (
            <div className="p-12 text-center space-y-2 opacity-30">
               <User className="w-8 h-8 mx-auto" />
               <p className="text-xs font-bold uppercase tracking-widest">No users found</p>
            </div>
          ) : (
            filteredProfiles.map(p => {
              const userMessages = messages.filter(m => m.fromUser === p.username || m.toUser === p.username)
              const lastMsg = userMessages[userMessages.length - 1]
              const isSelected = selectedUser === p.username
              const hasUnread = userMessages.some(m => m.fromUser === p.username && m.toUser === 'admin' && !m.read)

              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedUser(p.username); setShowMobileChat(true); }}
                  className={`w-full p-4 flex items-center gap-4 border-b border-border/50 transition-all text-left group ${
                    isSelected ? 'bg-primary/5 border-r-4 border-r-primary' : 'hover:bg-secondary/30'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all ${
                      isSelected ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' : 'bg-secondary text-muted-foreground'
                    }`}>
                      {p.username[0].toUpperCase()}
                    </div>
                    {hasUnread && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary border-2 border-card rounded-full shadow-lg" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`font-black truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {p.username}
                      </p>
                      {lastMsg && (
                        <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                          {format(parseISO(lastMsg.timestamp), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                      {lastMsg ? lastMsg.content : 'Start a new conversation'}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-background/50 transition-all duration-300 ${
        showMobileChat ? 'fixed inset-0 z-50 bg-background md:relative md:flex md:z-0' : 'hidden md:flex'
      }`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-primary transition-colors"
                >
                   <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center font-black text-primary border border-primary/20">
                  {selectedUser[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-foreground text-lg leading-tight tracking-tight">{selectedUser}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <p className="text-[10px] font-black uppercase text-green-400 tracking-widest">Connected</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-hide">
              {messages
                .filter(m => m.fromUser === selectedUser || m.toUser === selectedUser)
                .map(msg => {
                  const isMe = msg.fromUser === 'admin'
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isMe 
                            ? 'bg-primary text-primary-foreground rounded-br-sm' 
                            : 'bg-card border border-border text-foreground rounded-bl-sm'
                        }`}>
                          <p className="font-medium">{msg.content}</p>
                        </div>
                        <div className={`flex items-center gap-2 px-1`}>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                            {format(parseISO(msg.timestamp), 'HH:mm')}
                          </span>
                          {isMe && (
                            msg.read ? (
                              <CheckCheck className="w-3 h-3 text-primary" />
                            ) : (
                              <Check className="w-3 h-3 text-muted-foreground" />
                            )
                          )}
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
                  placeholder="Type a message..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-secondary/30 border border-border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50 resize-none leading-relaxed transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim()}
                  className="p-4 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-primary/20 active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
            <div className="w-24 h-24 bg-secondary/30 rounded-[40px] flex items-center justify-center shadow-inner">
              <MessageSquare className="w-10 h-10 text-muted-foreground/20" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-foreground tracking-tight">Your Inbox</h2>
              <p className="text-sm text-muted-foreground max-w-xs font-medium leading-relaxed">
                Select a client from the sidebar to view your chat history and start a conversation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
