'use client'

import { useEffect, useState } from 'react'
import { store, Booking, LOAD_RATES } from '@/lib/store'
import {
  Calendar, FileText, MessageCircle, MessageSquare, Clock,
  CheckCircle, XCircle, Truck, ChevronRight, Info,
} from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'

const ADMIN_WA = [
  { label: '0773 083 687', wa: '263773083687' },
  { label: '0774 049 526', wa: '263774049526' },
  { label: '0770 083 687', wa: '263770083687' },
]

function buildPaymentMessage(booking: Booking) {
  const rate = LOAD_RATES[booking.loadType]
  const isOther = booking.loadType === 'other'
  const total = isOther ? null : rate * booking.numberOfLoads
  const lines = [
    `*BHADHARA TRANSPORT – Payment Follow-Up*`,
    ``,
    `Hello, I am following up on my load booking.`,
    ``,
    `*Booking Ref:* ${booking.id.slice(0, 8).toUpperCase()}`,
    `*Client:* ${booking.clientName}`,
    `*Material:* ${booking.loadTypeLabel}`,
    `*No. of Loads:* ${booking.numberOfLoads}`,
    isOther ? '' : `*Rate per Load:* $${rate} USD`,
    total !== null ? `*Total (cash):* $${total} USD` : '',
    `*Preferred Date:* ${booking.preferredDate}`,
    `*Delivery Site:* ${booking.deliveryAddress}`,
    booking.notes ? `*Notes:* ${booking.notes}` : '',
    ``,
    `Please advise on the meetup place and time for cash payment finalisation.`,
    ``,
    `Thank you.`,
  ]
  return encodeURIComponent(lines.filter(l => l !== '').join('\n'))
}

export default function ClientDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const user = store.getCurrentUser()

  useEffect(() => {
    const all = store.getBookings()
    setBookings(all.filter(b => b.clientUsername === user?.username).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  }, [user?.username])

  const pending = bookings.filter(b => b.status === 'pending')
  const confirmed = bookings.filter(b => b.status === 'confirmed')
  const completed = bookings.filter(b => b.status === 'completed')
  const messages = store.getMessages().filter(m => m.fromUser === user?.username || m.toUser === user?.username)
  const unreadCount = messages.filter(m => m.toUser === user?.username && !m.read).length
  const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed')

  return (
    <div className="space-y-7">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground text-balance">
          Welcome back, <span className="text-primary">{user?.username}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your loads and arrange cash payment meetups.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Awaiting Payment', value: pending.length, color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Clock },
          { label: 'Confirmed Loads', value: confirmed.length, color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle },
          { label: 'Completed', value: completed.length, color: 'text-primary', bg: 'bg-primary/10', icon: Truck },
          { label: 'Unread Messages', value: unreadCount, color: 'text-accent', bg: 'bg-accent/10', icon: MessageCircle },
        ].map(s => (
          <div key={s.label} className={`bg-card border border-border rounded-xl p-4`}>
            <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending payments — WhatsApp CTAs */}
      {pending.length > 0 && (
        <div className="bg-card border border-orange-400/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground text-sm">
                {pending.length === 1 ? '1 booking awaiting payment' : `${pending.length} bookings awaiting payment`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                All payments are in cash. WhatsApp us to arrange a meetup place and time — your full order details
                and pricing are pre-filled in the message.
              </p>
            </div>
          </div>

          {pending.map(booking => {
            const rate = LOAD_RATES[booking.loadType]
            const isOther = booking.loadType === 'other'
            const total = isOther ? null : rate * booking.numberOfLoads
            const waMsg = buildPaymentMessage(booking)
            return (
              <div key={booking.id} className="bg-secondary/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {booking.loadTypeLabel} × {booking.numberOfLoads}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{booking.preferredDate} · {booking.deliveryAddress}</p>
                  </div>
                  {total !== null && (
                    <span className="text-primary font-bold text-sm shrink-0">${total} USD</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ADMIN_WA.map(c => (
                    <a
                      key={c.wa}
                      href={`https://wa.me/${c.wa}?text=${waMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg font-semibold text-xs hover:bg-green-600 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {c.label}
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/client/book"
          className="flex flex-col items-center gap-3 p-5 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors group"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground text-sm">Book a Load</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pre-book a delivery</p>
          </div>
        </Link>
        <Link
          href="/client/history"
          className="flex flex-col items-center gap-3 p-5 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors group"
        >
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground text-sm">My Bookings</p>
            <p className="text-xs text-muted-foreground mt-0.5">View & follow up on orders</p>
          </div>
        </Link>
        <Link
          href="/client/messages"
          className="relative flex flex-col items-center gap-3 p-5 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors group"
        >
          {unreadCount > 0 && (
            <span className="absolute top-3 right-3 w-5 h-5 bg-destructive text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
          <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center group-hover:bg-green-400/20 transition-colors">
            <MessageCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground text-sm">Messages</p>
            <p className="text-xs text-muted-foreground mt-0.5">Chat with our team</p>
          </div>
        </Link>
      </div>

      {/* Confirmed loads */}
      {confirmed.length > 0 && (
        <div className="bg-card border border-green-400/20 rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Confirmed Loads
          </h2>
          <div className="space-y-3">
            {confirmed.map(b => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-secondary/20 rounded-xl">
                <div>
                  <p className="font-semibold text-foreground text-sm">{b.loadTypeLabel} × {b.numberOfLoads}</p>
                  <p className="text-xs text-muted-foreground">{b.preferredDate} · {b.deliveryAddress}</p>
                  {b.estimatedDelivery && (
                    <p className="text-xs text-green-400 mt-0.5">ETA: {b.estimatedDelivery}</p>
                  )}
                </div>
                <span className="px-2 py-0.5 text-xs bg-green-400/10 text-green-400 border border-green-400/20 rounded-full font-semibold">
                  Confirmed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct WhatsApp contact */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-bold text-foreground mb-1 text-sm">Direct WhatsApp Contact</h2>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          For payment meetups, urgent enquiries, or to confirm load availability — reach us directly on WhatsApp.
          Our team will reply with a meetup location and time.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {ADMIN_WA.map(c => (
            <a
              key={c.wa}
              href={`https://wa.me/${c.wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-sm font-semibold hover:bg-green-500/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {c.label}
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
