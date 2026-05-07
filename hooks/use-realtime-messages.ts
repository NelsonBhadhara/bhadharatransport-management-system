'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/store'

export function useRealtimeMessages(initialMessages: Message[] = [], username?: string) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const supabaseRef = useRef(createClient())

  // Update local state when initialMessages (history) is loaded
  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    const supabase = supabaseRef.current
    
    // Admins listen to 'all', clients listen to their own username
    const channelName = username
      ? `realtime:messages:${username}`
      : 'realtime:messages:admin_global'

    console.log(`[Realtime] Subscribing to: ${channelName} (Filter User: ${username || 'NONE - ADMIN MODE'})`)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('[Realtime] Payload:', payload.eventType, payload.new?.id)
          
          if (payload.eventType === 'INSERT') {
            const newMessage: Message = {
              id: payload.new.id,
              fromUser: payload.new.from_user,
              toUser: payload.new.to_user,
              content: payload.new.content,
              timestamp: payload.new.created_at,
              read: payload.new.read,
            }

            // Logic: 
            // 1. If no username filter (Admin), accept everything.
            // 2. If username filter (Client), only accept if it involves them.
            const isRelevant = !username || 
                               newMessage.fromUser === username || 
                               newMessage.toUser === username

            if (isRelevant) {
              setMessages((current) => {
                // STRICT DUPLICATE CHECK: Use ID to prevent "similar message" double-ups
                const exists = current.some((m) => m.id === newMessage.id)
                if (exists) {
                  console.log('[Realtime] Duplicate blocked:', newMessage.id)
                  return current
                }
                return [...current, newMessage]
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages((current) =>
              current.map((m) =>
                m.id === payload.new.id
                  ? {
                      ...m,
                      read: payload.new.read,
                      content: payload.new.content,
                    }
                  : m
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setMessages((current) =>
              current.filter((m) => m.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] ${channelName} status:`, status)
      })

    return () => {
      console.log(`[Realtime] Cleaning up: ${channelName}`)
      supabase.removeChannel(channel)
    }
  }, [username])

  const appendMessage = useCallback((msg: Message) => {
    setMessages((current) => {
      if (current.some((m) => m.id === msg.id)) return current
      return [...current, msg]
    })
  }, [])

  return { messages, appendMessage }
}
