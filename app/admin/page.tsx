'use client'

import { useEffect, useState } from 'react'
import { Truck as TruckIcon, DollarSign, ClipboardList, Users, TrendingUp, Bell, Calendar } from 'lucide-react'
import type { DailyRecord, Booking, Truck, Employee } from '@/lib/store'
import { getRecords, getBookings, getTrucks, getEmployees } from '@/lib/supabase/database'
import { format } from 'date-fns'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'

export default function AdminOverviewPage() {
  const { profile } = useAuth()
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const [r, b, t, e] = await Promise.all([
        getRecords(),
        getBookings(),
        getTrucks(),
        getEmployees()
      ])
      setRecords(r)
      setBookings(b)
      setTrucks(t)
      setEmployees(e)
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse font-medium">Loading dashboard...</div>

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayRecord = records.find(r => r.date === today)
  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const thisMonthRecords = records.filter(r => r.date.startsWith(format(new Date(), 'yyyy-MM')))
  const monthRevenue = thisMonthRecords.reduce((s, r) => s + r.netRevenue, 0)
  const monthLoads = thisMonthRecords.reduce((s, r) => s + r.loads.length, 0)
  const activeTrucks = trucks.filter(t => t.status === 'active' && t.driverName).length

  const stats = [
    {
      label: "Today's Net Revenue",
      value: todayRecord ? `$${todayRecord.netRevenue.toFixed(2)}` : '$0.00',
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Monthly Revenue',
      value: `$${monthRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: "Today's Loads",
      value: todayRecord ? String(todayRecord.loads.length) : '0',
      icon: ClipboardList,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    {
      label: 'Monthly Loads',
      value: String(monthLoads),
      icon: TruckIcon,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Active Trucks',
      value: `${activeTrucks}/7`,
      icon: TruckIcon,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
    {
      label: 'Pending Bookings',
      value: String(pendingBookings.length),
      icon: Bell,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
  ]

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <Link
          href="/admin/transactions"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 w-full sm:w-auto"
        >
          <ClipboardList className="w-4 h-4" />
          New Transaction
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${stat.color} tracking-tight`}>{stat.value}</p>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Bookings */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Pending Bookings
            </h2>
            <Link href="/admin/messages" className="text-xs font-bold text-primary hover:underline">View all</Link>
          </div>
          {pendingBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
               <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-muted-foreground/40" />
               </div>
               <p className="text-sm text-muted-foreground">No pending bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBookings.slice(0, 5).map(b => (
                <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border/50 gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{b.clientName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.loadTypeLabel} × {b.numberOfLoads} — {b.preferredDate}
                    </p>
                  </div>
                  <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-orange-400/10 text-orange-400 rounded-full border border-orange-400/20 w-fit">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Records */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Recent Daily Records
            </h2>
            <Link href="/admin/transactions" className="text-xs font-bold text-primary hover:underline">View all</Link>
          </div>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No records yet — start recording transactions</p>
          ) : (
            <div className="space-y-3">
              {[...records]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 5)
                .map(r => (
                  <div key={r.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border/50">
                    <div>
                      <p className="text-sm font-bold text-foreground">{format(new Date(r.date + 'T12:00:00'), 'dd MMM yyyy')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.loads.length} loads · Gross ${r.grossRevenue}</p>
                    </div>
                    <span className={`text-sm font-black ${r.netRevenue >= 0 ? 'text-green-400' : 'text-destructive'}`}>
                      ${r.netRevenue.toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Driver Overview */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Driver Performance
            </h2>
            <Link href="/admin/employees" className="text-xs font-bold text-primary hover:underline">Manage</Link>
          </div>
          <div className="space-y-3">
            {employees.filter(e => e.role === 'driver').map(driver => {
              const driverLoads = records.filter(r => r.date.startsWith(format(new Date(), 'yyyy-MM'))).flatMap(r => r.loads).filter(l => l.driverName === driver.name)
              return (
                <div key={driver.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary border border-primary/20">
                      {driver.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{driver.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{trucks.find(t => t.driverName === driver.name)?.plate ?? 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-primary leading-none">{driverLoads.length}</p>
                    <p className="text-[10px] uppercase tracking-tighter text-muted-foreground mt-1">loads this month</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Fleet quick view */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <TruckIcon className="w-4 h-4 text-primary" />
              Fleet Status
            </h2>
            <Link href="/admin/garage" className="text-xs font-bold text-primary hover:underline">Manage</Link>
          </div>
          <div className="space-y-3">
            {trucks.map(truck => (
              <div key={truck.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-border/50">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center">
                      <TruckIcon className="w-5 h-5 text-muted-foreground/60" />
                   </div>
                   <div>
                    <p className="text-sm font-bold text-foreground font-mono">{truck.plate}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{truck.driverName ?? 'Unassigned'}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                    truck.status === 'active'
                      ? 'bg-green-400/10 text-green-400 border-green-400/20'
                      : truck.status === 'maintenance'
                      ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {truck.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
