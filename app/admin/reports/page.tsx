'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Search } from 'lucide-react'
import * as db from '@/lib/supabase/database'
import type { DailyRecord, Employee, Truck } from '@/lib/store'

export default function ReportsPage() {
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [filteredRecords, setFilteredRecords] = useState<DailyRecord[]>([])

  useEffect(() => {
    const init = async () => {
      const [r, e, t] = await Promise.all([db.getRecords(), db.getEmployees(), db.getTrucks()])
      setRecords(r); setEmployees(e); setTrucks(t)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    setFilteredRecords(records.filter(r => r.date >= fromDate && r.date <= toDate))
  }, [records, fromDate, toDate])

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-96" /></div>
  }

  const totalGross = filteredRecords.reduce((s, r) => s + r.grossRevenue, 0)
  const totalExpenses = filteredRecords.reduce((s, r) => s + r.totalExpenses, 0)
  const totalNet = filteredRecords.reduce((s, r) => s + r.netRevenue, 0)
  const totalLoads = filteredRecords.reduce((s, r) => s + r.loads.length, 0)

  // Driver stats
  const driverStats = employees
    .filter(e => e.role === 'driver')
    .map(driver => {
      const driverLoads = filteredRecords.flatMap(r => r.loads.filter(l => l.driverName === driver.name))
      const revenue = driverLoads.reduce((s, l) => s + l.ratePerLoad * l.numberOfLoads, 0)
      const loadCount = driverLoads.reduce((s, l) => s + l.numberOfLoads, 0)
      return { name: driver.name, loads: driverLoads.length, totalLoads: loadCount, revenue }
    })
    .sort((a, b) => b.revenue - a.revenue)

  // Load type breakdown
  const allLoads = filteredRecords.flatMap(r => r.loads)
  const loadTypeStats = Object.entries(
    allLoads.reduce<Record<string, { count: number; revenue: number }>>((acc, l) => {
      const key = l.loadTypeLabel
      if (!acc[key]) acc[key] = { count: 0, revenue: 0 }
      acc[key].count += l.numberOfLoads
      acc[key].revenue += l.ratePerLoad * l.numberOfLoads
      return acc
    }, {})
  ).sort(([, a], [, b]) => b.revenue - a.revenue)

  // Payment summary
  const paidLoads = allLoads.filter(l => l.paymentStatus === 'paid')
  const unpaidLoads = allLoads.filter(l => l.paymentStatus === 'unpaid')
  const paidRevenue = paidLoads.reduce((s, l) => s + l.ratePerLoad * l.numberOfLoads, 0)
  const unpaidRevenue = unpaidLoads.reduce((s, l) => s + l.ratePerLoad * l.numberOfLoads, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm">From</Label>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">To</Label>
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40" />
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => { setFromDate(format(subDays(new Date(), 7), 'yyyy-MM-dd')); setToDate(format(new Date(), 'yyyy-MM-dd')) }}>7d</Button>
            <Button variant="outline" size="sm" onClick={() => { setFromDate(format(startOfMonth(new Date()), 'yyyy-MM-dd')); setToDate(format(endOfMonth(new Date()), 'yyyy-MM-dd')) }}>Month</Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-2xl font-bold text-green-600">${totalGross}</p><p className="text-sm text-muted-foreground">Gross Revenue</p></div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-2xl font-bold text-red-600">${totalExpenses}</p><p className="text-sm text-muted-foreground">Total Expenses</p></div>
              <TrendingDown className="h-8 w-8 text-red-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-2xl font-bold">${totalNet}</p><p className="text-sm text-muted-foreground">Net Revenue</p></div>
              <DollarSign className="h-8 w-8 text-foreground opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-2xl font-bold">{totalLoads}</p><p className="text-sm text-muted-foreground">Total Loads</p></div>
              <BarChart3 className="h-8 w-8 text-amber-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="loadtypes">Load Types</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle className="text-lg">Daily Breakdown</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Loads</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Expenses</TableHead>
                    <TableHead>Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{format(new Date(r.date + 'T12:00:00'), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{r.loads.length}</TableCell>
                      <TableCell className="text-green-600">${r.grossRevenue}</TableCell>
                      <TableCell className="text-red-600">${r.totalExpenses}</TableCell>
                      <TableCell className="font-semibold">${r.netRevenue}</TableCell>
                    </TableRow>
                  ))}
                  {filteredRecords.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No records in this date range</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers">
          <Card>
            <CardHeader><CardTitle className="text-lg">Driver Performance</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Trips</TableHead>
                    <TableHead>Total Loads</TableHead>
                    <TableHead>Revenue Generated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {driverStats.map(d => (
                    <TableRow key={d.name}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>{d.loads}</TableCell>
                      <TableCell>{d.totalLoads}</TableCell>
                      <TableCell className="text-green-600 font-semibold">${d.revenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loadtypes">
          <Card>
            <CardHeader><CardTitle className="text-lg">Load Type Breakdown</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Load Type</TableHead>
                    <TableHead>Total Loads</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadTypeStats.map(([type, stats]) => (
                    <TableRow key={type}>
                      <TableCell className="font-medium">{type}</TableCell>
                      <TableCell>{stats.count}</TableCell>
                      <TableCell className="text-green-600 font-semibold">${stats.revenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg text-green-600">Paid</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">${paidRevenue}</p>
                <p className="text-sm text-muted-foreground">{paidLoads.length} loads paid</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg text-amber-600">Unpaid / Outstanding</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-600">${unpaidRevenue}</p>
                <p className="text-sm text-muted-foreground">{unpaidLoads.length} loads unpaid</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
