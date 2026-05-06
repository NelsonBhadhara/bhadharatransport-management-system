'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react'
import * as db from '@/lib/supabase/database'
import type { Booking } from '@/lib/store'

export default function HistoryPage() {
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
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-amber-600" />
      case 'confirmed': return <Package className="h-4 w-4 text-blue-600" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />
      default: return null
    }
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'outline' as const
      case 'confirmed': return 'default' as const
      case 'completed': return 'secondary' as const
      case 'cancelled': return 'destructive' as const
      default: return 'outline' as const
    }
  }

  const renderBookings = (filtered: Booking[]) => {
    if (filtered.length === 0) {
      return <p className="text-sm text-muted-foreground py-8 text-center">No bookings in this category</p>
    }
    return (
      <div className="space-y-3">
        {filtered.map(b => (
          <Card key={b.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {statusIcon(b.status)}
                    <p className="font-medium">{b.loadTypeLabel} × {b.numberOfLoads}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{b.preferredDate} · {b.deliveryAddress}</p>
                  {b.notes && <p className="text-xs text-muted-foreground italic">{b.notes}</p>}
                  {b.estimatedDelivery && (
                    <p className="text-xs text-blue-600">ETA: {b.estimatedDelivery}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Booked: {format(new Date(b.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                </div>
                <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Bookings</h1>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({bookings.filter(b => b.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({bookings.filter(b => b.status === 'confirmed').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({bookings.filter(b => b.status === 'completed').length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">{renderBookings(bookings)}</TabsContent>
        <TabsContent value="pending">{renderBookings(bookings.filter(b => b.status === 'pending'))}</TabsContent>
        <TabsContent value="confirmed">{renderBookings(bookings.filter(b => b.status === 'confirmed'))}</TabsContent>
        <TabsContent value="completed">{renderBookings(bookings.filter(b => b.status === 'completed'))}</TabsContent>
      </Tabs>
    </div>
  )
}
