'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/store'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeMessagesReturn {
  messages: Message[]
  sendMessage: (content: string, toUser: string) => Promise<void>
  unreadCount: number
  isLoading: boolean
  markAsRead: () => Promise<void>
}

export function useRealtimeMessages(username: string): UseRealtimeMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`from_user.eq.${username},to_user.eq.${username}`)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data.map(m => ({
        id: m.id,
        fromUser: m.from_user,
        toUser: m.to_user,
        content: m.content,
        timestamp: m.created_at,
        read: m.read,
      })))
    }
    setIsLoading(false)
  }, [username, supabase])

  // Subscribe to realtime changes
  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel(`messages:${username}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const m = payload.new as Record<string, unknown>
          // Only add if relevant to this user
          if (m.from_user === username || m.to_user === username) {
            const newMsg: Message = {
              id: m.id as string,
              fromUser: m.from_user as string,
              toUser: m.to_user as string,
              content: m.content as string,
              timestamp: m.created_at as string,
              read: m.read as boolean,
            }
            setMessages(prev => {
              // Prevent duplicates
              if (prev.find(p => p.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const m = payload.new as Record<string, unknown>
          if (m.from_user === username || m.to_user === username) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === m.id ? { ...msg, read: m.read as boolean } : msg
              )
            )
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [username, supabase, fetchMessages])

  const sendMessage = useCallback(async (content: string, toUser: string) => {
    await supabase.from('messages').insert({
      from_user: username,
      to_user: toUser,
      content,
    })
  }, [username, supabase])

  const markAsRead = useCallback(async () => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('to_user', username)
      .eq('read', false)

    setMessages(prev =>
      prev.map(m => m.toUser === username ? { ...m, read: true } : m)
    )
  }, [username, supabase])

  const unreadCount = messages.filter(m => m.toUser === username && !m.read).length

  return { messages, sendMessage, unreadCount, isLoading, markAsRead }
}
