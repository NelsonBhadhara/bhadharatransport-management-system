'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { Send, MessageSquare, Users } from 'lucide-react'
import * as db from '@/lib/supabase/database'

export default function AdminMessagesPage() {
  const { profile } = useAuth()
  const username = profile?.username ?? ''
  const { messages, sendMessage, unreadCount, isLoading, markAsRead } = useRealtimeMessages(username)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [clients, setClients] = useState<{ username: string; role: string }[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    db.getProfiles().then(profiles => {
      setClients(profiles.filter(p => p.role === 'client').map(p => ({ username: p.username, role: p.role })))
    })
  }, [])

  useEffect(() => {
    if (selectedUser) markAsRead()
  }, [selectedUser, markAsRead])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, selectedUser])

  const conversationUsers = Array.from(
    new Set(messages.map(m => m.fromUser === username ? m.toUser : m.fromUser))
  )

  // Include clients who haven't messaged yet
  const allUsers = Array.from(
    new Set([...conversationUsers, ...clients.map(c => c.username)])
  ).filter(u => u !== username)

  const filteredMessages = selectedUser
    ? messages.filter(
        m => (m.fromUser === selectedUser && m.toUser === username) ||
             (m.fromUser === username && m.toUser === selectedUser)
      )
    : []

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUser) return
    await sendMessage(newMessage.trim(), selectedUser)
    setNewMessage('')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
          <Skeleton className="h-full" />
          <Skeleton className="h-full col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
        {unreadCount > 0 && (
          <Badge variant="destructive">{unreadCount} unread</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* User List */}
        <Card className="overflow-hidden">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              {allUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">No clients yet</p>
              ) : (
                allUsers.map(u => {
                  const unread = messages.filter(m => m.fromUser === u && m.toUser === username && !m.read).length
                  return (
                    <button
                      key={u}
                      className={`w-full text-left px-4 py-3 border-b hover:bg-muted transition-colors flex items-center justify-between ${
                        selectedUser === u ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedUser(u)}
                    >
                      <span className="text-sm font-medium">{u}</span>
                      {unread > 0 && (
                        <Badge variant="destructive" className="text-xs">{unread}</Badge>
                      )}
                    </button>
                  )
                })
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="col-span-2 flex flex-col overflow-hidden">
          <CardHeader className="py-3 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {selectedUser ? `Chat with ${selectedUser}` : 'Select a client to start chatting'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {!selectedUser ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Select a client from the list to view messages
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No messages yet. Send the first message!
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMessages.map(m => (
                    <div
                      key={m.id}
                      className={`flex ${m.fromUser === username ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                          m.fromUser === username
                            ? 'bg-amber-600 text-white'
                            : 'bg-muted'
                        }`}
                      >
                        <p>{m.content}</p>
                        <p className={`text-xs mt-1 ${
                          m.fromUser === username ? 'text-amber-200' : 'text-muted-foreground'
                        }`}>
                          {format(new Date(m.timestamp), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {selectedUser && (
              <div className="p-3 border-t flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <Button onClick={handleSend} size="icon" className="bg-amber-600 hover:bg-amber-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
