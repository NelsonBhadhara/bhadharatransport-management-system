'use client'

import { useEffect, useState } from 'react'
import { store, Booking, LoadPrices } from '@/lib/store'
import { getBookings, getSettings } from '@/lib/supabase/database'
import { useAuth } from '@/components/auth/AuthProvider'
import { MessageSquare, ChevronRight, Clock, CheckCircle, XCircle, Truck, Info, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const ADMIN_WA = [
  { label: '0773 083 687', wa: '263773083687' },
  { label: '0774 049 526', wa: '263774049526' },
  { label: '0770 083 687', wa: '263770083687' },
]

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/20',
  },
  completed: {
    label: 'Completed',
    icon: Truck,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
  },
}

function buildFollowUpMessage(booking: Booking, loadPrices: LoadPrices) {
  const rate = booking.loadType === 'other' ? 0 : loadPrices[booking.loadType as keyof LoadPrices] || 0
  const isOther = booking.loadType === 'other'
  const total = isOther ? 0 : rate * booking.numberOfLoads

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
    isOther ? '' : `*Total (cash):* $${total} USD`,
    `*Preferred Date:* ${booking.preferredDate}`,
    `*Delivery Site:* ${booking.deliveryAddress}`,
    `*Status:* ${booking.status.toUpperCase()}`,
    booking.notes ? `*Notes:* ${booking.notes}` : '',
    ``,
    `Please advise on the meetup place and time for cash payment finalisation.`,
    ``,
    `Thank you.`,
  ]
  return lines.filter(l => l !== '').join('\n')
}

export default function HistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const { profile } = useAuth()
  const [loadPrices, setLoadPrices] = useState<LoadPrices>({ riversand: 90, pitsand: 80, quarrystone: 120, gravel: 70, other: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!profile) return
      const [all, s] = await Promise.all([
        getBookings(),
        getSettings()
      ])
      const mine = all
        .filter(b => b.clientUsername === profile.username)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      setBookings(mine)
      if (s) setLoadPrices(s.loadPrices)
      setLoading(false)
    }
    loadData()
  }, [profile?.username])

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading history...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All your load bookings and their current status. Tap a booking to view details and send a WhatsApp follow-up.
        </p>
      </div>

      {bookings.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center">
            <Truck className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">No bookings yet</p>
          <p className="text-sm text-muted-foreground">Your submitted load bookings will appear here.</p>
        </div>
      )}

      <div className="space-y-3">
        {bookings.map(booking => {
          const cfg = STATUS_CONFIG[booking.status]
          const StatusIcon = cfg.icon
          const rate = booking.loadType === 'other' ? 0 : loadPrices[booking.loadType as keyof LoadPrices] || 0
          const isOther = booking.loadType === 'other'
          const total = isOther ? null : rate * booking.numberOfLoads
          const isOpen = expanded === booking.id
          const waMsg = buildFollowUpMessage(booking, loadPrices)
          const waEncoded = encodeURIComponent(waMsg)

          return (
            <div
              key={booking.id}
              className="bg-card border border-border rounded-2xl overflow-hidden transition-all"
            >
              {/* Row header — always visible */}
              <button
                onClick={() => setExpanded(isOpen ? null : booking.id)}
                className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-secondary/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${cfg.bg} shrink-0`}>
                    <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {booking.loadTypeLabel} × {booking.numberOfLoads}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {booking.preferredDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {total !== null && (
                    <span className="text-sm font-bold text-primary hidden sm:block">${total} USD</span>
                  )}
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full border font-semibold ${cfg.bg} ${cfg.color} ${cfg.border}`}
                  >
                    {cfg.label}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  />
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-border p-4 space-y-4">
                  {/* Detail grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Booking Ref</p>
                      <p className="font-mono font-semibold text-foreground text-xs mt-0.5">
                        #{booking.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Submitted</p>
                      <p className="font-semibold text-foreground text-xs mt-0.5">
                        {format(parseISO(booking.createdAt), 'd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Material</p>
                      <p className="font-semibold text-foreground text-xs mt-0.5">{booking.loadTypeLabel}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Loads</p>
                      <p className="font-semibold text-foreground text-xs mt-0.5">{booking.numberOfLoads}</p>
                    </div>
                    {!isOther && (
                      <>
                        <div>
                          <p className="text-muted-foreground text-xs">Rate per load</p>
                          <p className="font-semibold text-foreground text-xs mt-0.5">${rate} USD</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Total (cash)</p>
                          <p className="font-bold text-primary text-sm mt-0.5">${total} USD</p>
                        </div>
                      </>
                    )}
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Delivery Site</p>
                      <p className="font-semibold text-foreground text-xs mt-0.5">{booking.deliveryAddress}</p>
                    </div>
                    {booking.estimatedDelivery && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs">Estimated Delivery</p>
                        <p className="font-semibold text-green-400 text-xs mt-0.5">{booking.estimatedDelivery}</p>
                      </div>
                    )}
                    {booking.notes && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs">Notes</p>
                        <p className="font-semibold text-foreground text-xs mt-0.5">{booking.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Cash payment notice */}
                  {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                    <div className="flex gap-3 p-3 bg-orange-400/5 border border-orange-400/20 rounded-xl">
                      <Info className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <span className="font-semibold text-foreground">Cash payment required.</span> WhatsApp
                        us to arrange a meetup for payment finalisation. The pre-filled message includes your full
                        booking details.
                      </p>
                    </div>
                  )}

                  {/* WhatsApp buttons */}
                  {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {booking.status === 'pending' ? 'Finalise payment via WhatsApp' : 'Follow up via WhatsApp'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {ADMIN_WA.map(c => (
                          <a
                            key={c.wa}
                            href={`https://wa.me/${c.wa}?text=${waEncoded}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg font-semibold text-xs hover:bg-green-600 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {c.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {booking.status === 'completed' && (
                    <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <p className="text-xs text-foreground font-semibold">
                        This load has been completed and payment has been received. Thank you!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
