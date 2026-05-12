'use client'

import { useState, useEffect } from 'react'
import { Bell, MessageCircle, CheckCircle, Calendar, Clock, X, Send, Check } from 'lucide-react'
import { store, Booking, Message } from '@/lib/store'
import { getBookings, getMessages, updateBookingStatus, sendMessage, markMessagesRead } from '@/lib/supabase/database'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { format, parseISO } from 'date-fns'

export default function AdminMessagesPage() {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [initialMessages, setInitialMessages] = useState<Message[]>([])
  const [tab, setTab] = useState<'bookings' | 'messages'>('bookings')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [loading, setLoading] = useState(true)

  const messages = useRealtimeMessages(initialMessages)

  const loadData = async () => {
    const [b, m] = await Promise.all([
      getBookings(),
      getMessages()
    ])
    setBookings(b)
    setInitialMessages(m)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    const currentProfile = profile
    if (!currentProfile) return
    if (tab === 'messages' && replyTo) {
      const unread = messages.filter(m => m.fromUser === replyTo && m.toUser === currentProfile.username && !m.read)
      if (unread.length > 0) {
        markMessagesRead(currentProfile.username)
      }
    }
  }, [tab, replyTo, messages, profile])

  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
  const allBookings = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const handleConfirm = async (id: string) => {
    await updateBookingStatus(id, 'confirmed', deliveryTime || undefined)
    await loadData()
    setDeliveryTime('')
  }

  const handleCancel = async (id: string) => {
    await updateBookingStatus(id, 'cancelled')
    await loadData()
  }

  const handleComplete = async (id: string) => {
    await updateBookingStatus(id, 'completed')
    await loadData()
  }

  const handleSendReply = async (toUser: string) => {
    const currentProfile = profile
    if (!replyText.trim() || !currentProfile) return
    await sendMessage({ fromUser: currentProfile.username, toUser, content: replyText })
    setReplyTo(null)
    setReplyText('')
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading messages...</div>

  const conversations = (() => {
    const users = new Set([...messages.map(m => m.fromUser), ...messages.map(m => m.toUser)])
    const adminUser = profile?.username ?? 'admin'
    return Array.from(users)
      .filter(u => u !== adminUser)
      .map(u => ({
        username: u,
        messages: messages.filter(m => m.fromUser === u || m.toUser === u).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
        unread: messages.filter(m => m.fromUser === u && !m.read).length,
      }))
  })()

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages & Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">Client bookings, inquiries and messages</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingBookings.length > 0 && (
            <span className="px-2.5 py-1 bg-orange-400/10 text-orange-400 border border-orange-400/20 rounded-full text-xs font-bold">
              {pendingBookings.length} pending
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/30 p-1 rounded-xl mb-6 w-fit">
        {(['bookings', 'messages'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
              tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'bookings' ? `Bookings (${allBookings.length})` : `Messages (${conversations.length})`}
          </button>
        ))}
      </div>

      {tab === 'bookings' && (
        <div className="space-y-4">
          {allBookings.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No bookings yet.</p>
            </div>
          ) : (
            allBookings.map(booking => (
              <div key={booking.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-foreground">{booking.clientName}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full border font-semibold ${
                        booking.status === 'pending' ? 'bg-orange-400/10 text-orange-400 border-orange-400/20'
                          : booking.status === 'confirmed' ? 'bg-green-400/10 text-green-400 border-green-400/20'
                          : booking.status === 'completed' ? 'bg-accent/10 text-accent border-accent/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {booking.loadTypeLabel} × {booking.numberOfLoads} load{booking.numberOfLoads > 1 ? 's' : ''} —
                      Preferred: {booking.preferredDate}
                    </p>
                    {booking.deliveryAddress && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Delivery: {booking.deliveryAddress}
                      </p>
                    )}
                    {booking.estimatedDelivery && (
                      <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> ETA: {booking.estimatedDelivery}
                      </p>
                    )}
                    {booking.notes && (
                      <p className="text-xs text-muted-foreground italic mt-1">&quot;{booking.notes}&quot;</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Booked: {format(parseISO(booking.createdAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>

                  {booking.status === 'pending' && (
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <input
                        type="text"
                        placeholder="Expected delivery time (e.g. 2hrs)"
                        value={deliveryTime}
                        onChange={e => setDeliveryTime(e.target.value)}
                        className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-64"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirm(booking.id)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-green-400/10 text-green-400 border border-green-400/20 rounded-lg text-xs font-bold hover:bg-green-400/20 transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Confirm
                        </button>
                        <button
                          onClick={() => handleCancel(booking.id)}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-bold hover:bg-destructive/20 transition-all"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleComplete(booking.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-lg text-xs font-semibold hover:bg-accent/20 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'messages' && (
        <div className="space-y-4">
          {conversations.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No messages yet.</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div key={conv.username} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-sm">
                      {conv.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{conv.username}</p>
                      {conv.unread > 0 && (
                        <span className="text-xs text-orange-400">{conv.unread} unread</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyTo(replyTo === conv.username ? null : conv.username)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Reply
                  </button>
                </div>

                <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                  {conv.messages.map(msg => {
                    const isAdmin = msg.fromUser !== conv.username
                    return (
                      <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                          isAdmin ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                        }`}>
                          <p>{msg.content}</p>
                          <p className="text-xs opacity-60 mt-0.5">{format(parseISO(msg.timestamp), 'dd/MM HH:mm')}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {replyTo === conv.username && (
                  <div className="flex gap-2 p-4 border-t border-border">
                    <input
                      type="text"
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendReply(conv.username)}
                      className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      onClick={() => handleSendReply(conv.username)}
                      disabled={!replyText.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
