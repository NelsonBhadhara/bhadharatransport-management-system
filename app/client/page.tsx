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
    <div className="space-y-8 p-4 sm:p-0">
      {/* Welcome */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-foreground tracking-tight">
          Welcome back, <span className="text-primary">{user?.username}</span>
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">Manage your loads and arrange cash payment meetups.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Awaiting Payment', value: pending.length, color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Clock },
          { label: 'Confirmed Loads', value: confirmed.length, color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle },
          { label: 'Completed', value: completed.length, color: 'text-primary', bg: 'bg-primary/10', icon: Truck },
          { label: 'Unread Messages', value: unreadCount, color: 'text-accent', bg: 'bg-accent/10', icon: MessageCircle },
        ].map(s => (
          <div key={s.label} className={`bg-card border border-border rounded-2xl p-5 shadow-sm`}>
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-4`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className={`text-3xl font-black ${s.color} tracking-tighter`}>{s.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending payments — WhatsApp CTAs */}
      {pending.length > 0 && (
        <div className="bg-card border-2 border-orange-400/20 rounded-3xl p-6 space-y-6 shadow-xl shadow-orange-400/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-400/10 rounded-xl flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="font-black text-foreground text-lg leading-tight">
                {pending.length === 1 ? '1 load needs payment' : `${pending.length} loads need payment`}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed text-pretty">
                All payments are in cash. WhatsApp us to arrange a meetup place and time — your full order details
                and pricing are pre-filled in the message.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {pending.map(booking => {
              const rate = LOAD_RATES[booking.loadType]
              const isOther = booking.loadType === 'other'
              const total = isOther ? null : rate * booking.numberOfLoads
              const waMsg = buildPaymentMessage(booking)
              return (
                <div key={booking.id} className="bg-secondary/30 border border-border rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-foreground text-base">
                        {booking.loadTypeLabel} × {booking.numberOfLoads}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">{booking.preferredDate} · {booking.deliveryAddress}</p>
                    </div>
                    {total !== null && (
                      <div className="text-right">
                         <p className="text-[10px] font-black uppercase text-muted-foreground">Amount Due</p>
                         <p className="text-2xl font-black text-primary">${total} <span className="text-xs font-bold text-muted-foreground">USD</span></p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {ADMIN_WA.map(c => (
                      <a
                        key={c.wa}
                        href={`https://wa.me/${c.wa}?text=${waMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 px-4 py-3 bg-green-500 text-white rounded-xl font-black text-xs hover:bg-green-600 transition-all shadow-lg shadow-green-500/10 hover:scale-[1.02]"
                      >
                        <MessageSquare className="w-4 h-4" />
                        WhatsApp {c.label}
                      </a>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/client/book"
          className="flex flex-col items-center gap-4 p-6 bg-card border border-border rounded-3xl hover:border-primary/50 transition-all group hover:shadow-lg shadow-sm"
        >
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-all">
            <Calendar className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-black text-foreground text-base tracking-tight">Book a Load</p>
            <p className="text-xs text-muted-foreground mt-1">Pre-book a delivery</p>
          </div>
        </Link>
        <Link
          href="/client/history"
          className="flex flex-col items-center gap-4 p-6 bg-card border border-border rounded-3xl hover:border-primary/50 transition-all group hover:shadow-lg shadow-sm"
        >
          <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center group-hover:bg-accent/20 transition-all">
            <FileText className="w-7 h-7 text-accent" />
          </div>
          <div className="text-center">
            <p className="font-black text-foreground text-base tracking-tight">My Bookings</p>
            <p className="text-xs text-muted-foreground mt-1">View & follow up on orders</p>
          </div>
        </Link>
        <Link
          href="/client/messages"
          className="relative flex flex-col items-center gap-4 p-6 bg-card border border-border rounded-3xl hover:border-primary/50 transition-all group hover:shadow-lg shadow-sm"
        >
          {unreadCount > 0 && (
            <span className="absolute top-4 right-4 w-6 h-6 bg-destructive text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg animate-pulse">
              {unreadCount}
            </span>
          )}
          <div className="w-14 h-14 bg-green-400/10 rounded-2xl flex items-center justify-center group-hover:bg-green-400/20 transition-all">
            <MessageCircle className="w-7 h-7 text-green-400" />
          </div>
          <div className="text-center">
            <p className="font-black text-foreground text-base tracking-tight">Messages</p>
            <p className="text-xs text-muted-foreground mt-1">Chat with our team</p>
          </div>
        </Link>
      </div>

      {/* Confirmed loads */}
      {confirmed.length > 0 && (
        <div className="bg-card border border-green-400/20 rounded-3xl p-6 shadow-sm">
          <h2 className="font-black text-foreground mb-4 flex items-center gap-2 text-base">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Active Confirmed Deliveries
          </h2>
          <div className="space-y-3">
            {confirmed.map(b => (
              <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-secondary/20 border border-border/50 rounded-2xl">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-green-400" />
                   </div>
                   <div>
                     <p className="font-black text-foreground text-sm leading-tight">{b.loadTypeLabel} × {b.numberOfLoads}</p>
                     <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-wider">{b.preferredDate} · {b.deliveryAddress}</p>
                     {b.estimatedDelivery && (
                       <p className="text-[10px] text-green-400 mt-1 font-black uppercase tracking-widest">ETA: {b.estimatedDelivery}</p>
                     )}
                   </div>
                </div>
                <span className="px-3 py-1 text-[10px] font-black bg-green-400/10 text-green-400 border border-green-400/20 rounded-full uppercase tracking-widest text-center">
                  In Transit
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct WhatsApp contact */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <h2 className="font-black text-foreground mb-1 text-base">Direct WhatsApp Inquiry</h2>
        <p className="text-xs text-muted-foreground mb-5 leading-relaxed text-pretty">
          For general enquiries, urgent support, or to confirm material availability — reach us directly on WhatsApp.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ADMIN_WA.map(c => (
            <a
              key={c.wa}
              href={`https://wa.me/${c.wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-5 py-4 bg-green-500/10 text-green-400 border border-green-500/20 rounded-2xl text-sm font-black hover:bg-green-500/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5" />
                {c.label}
              </div>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
