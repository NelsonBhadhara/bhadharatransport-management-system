'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarPlus, History, MessageSquare, Package, Clock, CheckCircle } from 'lucide-react'
import * as db from '@/lib/supabase/database'
import type { Booking } from '@/lib/store'

export default function ClientDashboard() {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      db.getBookings(profile.username).then(data => {
        setBookings(data)
        setLoading(false)
      })
    }
  }, [profile])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  const pending = bookings.filter(b => b.status === 'pending')
  const confirmed = bookings.filter(b => b.status === 'confirmed')
  const completed = bookings.filter(b => b.status === 'completed')

  const stats = [
    { label: 'Pending', value: pending.length, icon: Clock, color: 'text-amber-600' },
    { label: 'Confirmed', value: confirmed.length, icon: Package, color: 'text-blue-600' },
    { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'text-green-600' },
  ]

  const contacts = [
    { label: '+263 77 123 4567', num: '263771234567' },
    { label: '+263 71 987 6543', num: '263719876543' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {profile?.username}</h1>
        <p className="text-muted-foreground text-sm">Manage your loads and arrange cash payment meetups.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${s.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {pending.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              {pending.length === 1 ? '1 booking awaiting payment' : `${pending.length} bookings awaiting payment`}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              All payments are in cash. WhatsApp us to arrange a meetup place and time.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/client/book">
          <Card className="hover:border-amber-400 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <CalendarPlus className="h-8 w-8 mx-auto text-amber-600 mb-2" />
              <p className="font-semibold">Book a Load</p>
              <p className="text-xs text-muted-foreground">Pre-book a delivery</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/client/history">
          <Card className="hover:border-amber-400 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <History className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="font-semibold">My Bookings</p>
              <p className="text-xs text-muted-foreground">View & follow up on orders</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/client/messages">
          <Card className="hover:border-amber-400 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="font-semibold">Messages</p>
              <p className="text-xs text-muted-foreground">Chat with our team</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {confirmed.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Confirmed Loads</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {confirmed.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{b.loadTypeLabel} × {b.numberOfLoads}</p>
                    <p className="text-xs text-muted-foreground">{b.preferredDate} · {b.deliveryAddress}</p>
                    {b.estimatedDelivery && (
                      <p className="text-xs text-blue-600">ETA: {b.estimatedDelivery}</p>
                    )}
                  </div>
                  <Badge>Confirmed</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Direct WhatsApp Contact</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            For payment meetups, urgent enquiries, or to confirm load availability — reach us directly on WhatsApp.
          </p>
          <div className="flex flex-wrap gap-3">
            {contacts.map(c => (
              <Button key={c.num} variant="outline" asChild>
                <a href={`https://wa.me/${c.num}`} target="_blank" rel="noopener noreferrer">
                  {c.label}
                </a>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
