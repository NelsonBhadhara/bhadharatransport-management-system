'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { Truck as TruckIcon, Users, FileText, DollarSign, CalendarDays, Loader2 } from 'lucide-react'
import * as db from '@/lib/supabase/database'
import type { Truck, DailyRecord, Booking, Employee } from '@/lib/store'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const [t, r, b, e] = await Promise.all([
        db.getTrucks(),
        db.getRecords(),
        db.getBookings(),
        db.getEmployees(),
      ])
      setTrucks(t)
      setRecords(r)
      setBookings(b)
      setEmployees(e)
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  const activeTrucks = trucks.filter(t => t.status === 'active').length
  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const recentRecords = records.slice(0, 5)
  const drivers = employees.filter(e => e.role === 'driver' && e.status === 'active')
  const thisMonth = format(new Date(), 'yyyy-MM')
  const monthRecords = records.filter(r => r.date.startsWith(thisMonth))
  const monthRevenue = monthRecords.reduce((sum, r) => sum + r.grossRevenue, 0)

  const stats = [
    { label: 'Active Trucks', value: activeTrucks, icon: TruckIcon, color: 'text-blue-600' },
    { label: 'Total Employees', value: employees.length, icon: Users, color: 'text-green-600' },
    { label: 'Pending Bookings', value: pendingBookings.length, icon: FileText, color: 'text-amber-600' },
    { label: 'Revenue (Month)', value: `$${monthRevenue}`, icon: DollarSign, color: 'text-emerald-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending bookings</p>
            ) : (
              <div className="space-y-3">
                {pendingBookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{b.clientName || b.clientUsername}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.loadTypeLabel} × {b.numberOfLoads} — {b.preferredDate}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Records */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Daily Records</CardTitle>
          </CardHeader>
          <CardContent>
            {recentRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">No records yet — start recording transactions</p>
            ) : (
              <div className="space-y-3">
                {recentRecords.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {format(new Date(r.date + 'T12:00:00'), 'dd MMM yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.loads.length} loads · Gross ${r.grossRevenue}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Driver Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Driver Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {drivers.map((driver) => {
                const truck = trucks.find(t => t.driverName === driver.name)
                const driverLoads = monthRecords.flatMap(r =>
                  r.loads.filter(l => l.driverName === driver.name)
                )
                return (
                  <div key={driver.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{driver.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {truck?.plate ?? 'Unassigned'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{driverLoads.length}</p>
                      <p className="text-xs text-muted-foreground">loads this month</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Fleet Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fleet Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trucks.map((truck) => (
                <div key={truck.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{truck.plate}</p>
                    <p className="text-xs text-muted-foreground">{truck.driverName ?? 'Unassigned'}</p>
                  </div>
                  <Badge variant={truck.status === 'active' ? 'default' : 'secondary'}>
                    {truck.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
