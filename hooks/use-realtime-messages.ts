'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/store'

export function useRealtimeMessages(initialMessages: Message[] = [], username?: string) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  // Use a ref to hold the Supabase client so it's created only once
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    const supabase = supabaseRef.current

    // Build a unique channel name scoped to this user if provided
    const channelName = username
      ? `realtime:messages:${username}`
      : 'realtime:messages:all'

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
          const newRecord = payload.new as Record<string, any>
          const oldRecord = payload.old as Record<string, any>

          if (payload.eventType === 'INSERT') {
            const newMessage: Message = {
              id: newRecord.id,
              fromUser: newRecord.from_user,
              toUser: newRecord.to_user,
              content: newRecord.content,
              timestamp: newRecord.created_at,
              read: newRecord.read,
            }

            // Only add if this message is relevant to the current conversation
            if (
              !username ||
              newMessage.fromUser === username ||
              newMessage.toUser === username
            ) {
              setMessages((current) => {
                // Avoid duplicates
                if (current.some((m) => m.id === newMessage.id)) return current
                return [...current, newMessage]
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages((current) =>
              current.map((m) =>
                m.id === newRecord.id
                  ? {
                      ...m,
                      read: newRecord.read,
                      content: newRecord.content,
                    }
                  : m
              )
            )
          } else if (payload.eventType === 'DELETE') {
            // FIX: was === (kept deleted msg), now !== (removes it)
            setMessages((current) =>
              current.filter((m) => m.id !== oldRecord.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // username is the only real dependency; supabaseRef is stable
  }, [username])

  // Optimistic append — call this right after sendMessage() succeeds
  const appendMessage = useCallback((msg: Message) => {
    setMessages((current) => {
      if (current.some((m) => m.id === msg.id)) return current
      return [...current, msg]
    })
  }, [])

  return { messages, appendMessage }
}
