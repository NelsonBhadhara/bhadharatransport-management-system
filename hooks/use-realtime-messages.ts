'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/store'

export function useRealtimeMessages(initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const supabase = createClient()

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    const channel = supabase
      .channel('realtime:messages')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage: Message = {
              id: payload.new.id,
              fromUser: payload.new.from_user,
              toUser: payload.new.to_user,
              content: payload.new.content,
              timestamp: payload.new.created_at,
              read: payload.new.read,
            }
            setMessages((current) => {
              // Avoid duplicates if we already have it (e.g. from a quick refresh)
              if (current.some(m => m.id === newMessage.id)) return current
              return [...current, newMessage]
            })
          } else if (payload.eventType === 'UPDATE') {
            setMessages((current) => 
              current.map(m => m.id === payload.new.id ? {
                ...m,
                read: payload.new.read,
                content: payload.new.content, // in case content was edited
              } : m)
            )
          } else if (payload.eventType === 'DELETE') {
            setMessages((current) => current.filter(m => m.id === payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return messages
}
