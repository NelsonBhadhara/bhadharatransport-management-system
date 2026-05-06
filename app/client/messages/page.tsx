'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { Send, MessageSquare } from 'lucide-react'

export default function ClientMessagesPage() {
  const { profile } = useAuth()
  const username = profile?.username ?? ''
  const { messages, sendMessage, unreadCount, isLoading, markAsRead } = useRealtimeMessages(username)
  const [newMessage, setNewMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Client messages go to admin by default
  const adminUsername = 'admin'

  // Filter messages between this client and admin(s)
  const myMessages = messages

  useEffect(() => {
    markAsRead()
  }, [messages, markAsRead])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim()) return
    // Send to the most recent admin who messaged, or default 'admin'
    const lastAdminMsg = [...messages].reverse().find(m => m.fromUser !== username)
    const toUser = lastAdminMsg?.fromUser ?? adminUsername
    await sendMessage(newMessage.trim(), toUser)
    setNewMessage('')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px]" />
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

      <Card className="flex flex-col h-[calc(100vh-250px)]">
        <CardHeader className="py-3 border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Chat with Bhadhara Transport
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {myMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No messages yet. Send us a message!
              </div>
            ) : (
              <div className="space-y-3">
                {myMessages.map(m => (
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
        </CardContent>
      </Card>
    </div>
  )
}
