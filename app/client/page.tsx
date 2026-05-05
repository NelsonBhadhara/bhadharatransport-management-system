'use client'

import { useEffect, useState } from 'react'
import { store, Booking } from '@/lib/store'
import { Calendar, FileText, MessageCircle, Phone, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'

export default function ClientDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const user = store.getCurrentUser()

  useEffect(() => {
    const all = store.getBookings()
    setBookings(all.filter(b => b.clientUsername === user?.username))
  }, [user?.username])

  const pending = bookings.filter(b => b.status === 'pending')
  const confirmed = bookings.filter(b => b.status === 'confirmed')
  const completed = bookings.filter(b => b.status === 'completed')
  const messages = store.getMessages().filter(m => m.fromUser === user?.username || m.toUser === user?.username)
  const unreadCount = messages.filter(m => m.toUser === user?.username && !m.read).length

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, <span className="text-primary">{user?.username}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your loads, bookings and inquiries.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending Bookings', value: pending.length, color: 'text-orange-400', icon: Clock },
          { label: 'Confirmed Loads', value: confirmed.length, color: 'text-green-400', icon: CheckCircle },
          { label: 'Completed', value: completed.length, color: 'text-primary', icon: FileText },
          { label: 'Unread Messages', value: unreadCount, color: 'text-accent', icon: MessageCircle },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/client/book"
          className="flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors group"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground">Book a Load</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pre-book or schedule a delivery</p>
          </div>
        </Link>
        <Link
          href="/client/history"
          className="flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors group"
        >
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <FileText className="w-6 h-6 text-accent" />
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground">Transaction History</p>
            <p className="text-xs text-muted-foreground mt-0.5">View and print your records</p>
          </div>
        </Link>
        <Link
          href="/client/messages"
          className="flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors group"
        >
          <div className="w-12 h-12 bg-green-400/10 rounded-xl flex items-center justify-center group-hover:bg-green-400/20 transition-colors">
            <MessageCircle className="w-6 h-6 text-green-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground">Messages</p>
            <p className="text-xs text-muted-foreground mt-0.5">Chat with our team</p>
          </div>
        </Link>
      </div>

      {/* Active bookings */}
      {bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4">Your Active Bookings</h2>
          <div className="space-y-3">
            {bookings
              .filter(b => b.status === 'pending' || b.status === 'confirmed')
              .map(booking => (
                <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 p-4 bg-secondary/20 rounded-xl">
                  <div>
                    <p className="font-semibold text-foreground">
                      {booking.loadTypeLabel} × {booking.numberOfLoads}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Preferred date: {booking.preferredDate}
                    </p>
                    {booking.estimatedDelivery && (
                      <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        Expected delivery: {booking.estimatedDelivery}
                      </p>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full border font-semibold ${
                    booking.status === 'pending'
                      ? 'bg-orange-400/10 text-orange-400 border-orange-400/20'
                      : 'bg-green-400/10 text-green-400 border-green-400/20'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Contact */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-bold text-foreground mb-3">Contact Bhadhara Transport</h2>
        <p className="text-sm text-muted-foreground mb-4">
          WhatsApp us for load confirmations, payment meetup locations or urgent inquiries.
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { num: '0773 083 687', wa: '263773083687' },
            { num: '0774 049 526', wa: '263774049526' },
            { num: '0770 083 687', wa: '263770083687' },
          ].map(c => (
            <a
              key={c.num}
              href={`https://wa.me/${c.wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-sm font-semibold hover:bg-green-500/20 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              {c.num}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
