'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  BarChart3, Printer, Download, TrendingUp, TrendingDown, DollarSign, Truck, Users, AlertCircle
} from 'lucide-react'
import { store, DailyRecord } from '@/lib/store'
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns'

const COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#f97316', '#a855f7']

export default function ReportsPage() {
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [tab, setTab] = useState<'master' | 'driver' | 'monthly'>('master')

  useEffect(() => {
    setRecords(store.getRecords())
  }, [])

  const filteredRecords = records.filter(r => r.date >= fromDate && r.date <= toDate)

  // ── Aggregates ────────────────────────────────────────────────────────────
  const totalGross = filteredRecords.reduce((s, r) => s + r.grossRevenue, 0)
  const totalExpenses = filteredRecords.reduce((s, r) => s + r.totalExpenses, 0)
  const totalNet = filteredRecords.reduce((s, r) => s + r.netRevenue, 0)
  const totalLoads = filteredRecords.reduce((s, r) => s + r.loads.length, 0)
  const paidLoads = filteredRecords.reduce((s, r) => s + r.loads.filter(l => l.paymentStatus === 'paid').length, 0)
  const unpaidLoads = totalLoads - paidLoads

  // Daily chart data
  const dailyData = filteredRecords
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({
      date: format(parseISO(r.date), 'dd/MM'),
      gross: r.grossRevenue,
      expenses: r.totalExpenses,
      net: r.netRevenue,
      loads: r.loads.length,
    }))

  // Driver performance
  const employees = store.getEmployees()
  const driverData = employees
    .filter(e => e.role === 'driver')
    .map(driver => {
      const driverLoads = filteredRecords.flatMap(r => r.loads).filter(l => l.driverName === driver.name)
      const revenue = driverLoads.reduce((s, l) => s + l.ratePerLoad * l.numberOfLoads, 0)
      const paid = driverLoads.filter(l => l.paymentStatus === 'paid').reduce((s, l) => s + l.amountPaid, 0)
      return {
        name: driver.name,
        loads: driverLoads.length,
        revenue,
        paid,
        salary: driver.salary,
        net: paid - driver.salary,
      }
    })

  // Load type breakdown
  const loadTypeData = (() => {
    const counts: Record<string, number> = {}
    filteredRecords.flatMap(r => r.loads).forEach(l => {
      counts[l.loadTypeLabel] = (counts[l.loadTypeLabel] ?? 0) + l.numberOfLoads
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  })()

  // Monthly trend (last 6 months)
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), 5 - i)
    const prefix = format(d, 'yyyy-MM')
    const monthRecords = records.filter(r => r.date.startsWith(prefix))
    return {
      month: format(d, 'MMM yy'),
      gross: monthRecords.reduce((s, r) => s + r.grossRevenue, 0),
      net: monthRecords.reduce((s, r) => s + r.netRevenue, 0),
      loads: monthRecords.reduce((s, r) => s + r.loads.length, 0),
    }
  })

  // Driver comparison (this month vs last)
  const thisMonth = format(new Date(), 'yyyy-MM')
  const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM')
  const driverComparison = employees.filter(e => e.role === 'driver').map(driver => {
    const thisLoads = records.filter(r => r.date.startsWith(thisMonth)).flatMap(r => r.loads).filter(l => l.driverName === driver.name).length
    const lastLoads = records.filter(r => r.date.startsWith(lastMonth)).flatMap(r => r.loads).filter(l => l.driverName === driver.name).length
    const change = thisLoads - lastLoads
    const pct = lastLoads ? ((change / lastLoads) * 100).toFixed(0) : '—'
    return { name: driver.name, thisLoads, lastLoads, change, pct }
  })

  const handlePrintReport = () => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>Bhadhara Transport — Master Report</title>
    <style>
      body{font-family:sans-serif;padding:20px;color:#111}
      h1,h2,h3{color:#1a1a2e}
      table{width:100%;border-collapse:collapse;margin-bottom:20px}
      th,td{border:1px solid #ccc;padding:8px;text-align:left}
      th{background:#f5f5f5}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
      .stat{padding:12px;border:1px solid #ccc;border-radius:8px;text-align:center}
      .stat-val{font-size:24px;font-weight:bold;color:#f59e0b}
    </style></head><body>
    <h1>Bhadhara Transport — Master Report</h1>
    <p>Period: ${fromDate} to ${toDate} &nbsp;&nbsp; Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
    <div class="summary">
      <div class="stat"><div class="stat-val">$${totalGross}</div><div>Gross Revenue</div></div>
      <div class="stat"><div class="stat-val">$${totalExpenses}</div><div>Total Expenses</div></div>
      <div class="stat"><div class="stat-val">$${totalNet}</div><div>Net Revenue</div></div>
      <div class="stat"><div class="stat-val">${totalLoads}</div><div>Total Loads</div></div>
    </div>
    <h2>Driver Performance</h2>
    <table><thead><tr><th>Driver</th><th>Loads</th><th>Gross Revenue</th><th>Amount Collected</th><th>Salary</th><th>Net Contribution</th></tr></thead>
    <tbody>${driverData.map(d => `<tr><td>${d.name}</td><td>${d.loads}</td><td>$${d.revenue}</td><td>$${d.paid}</td><td>$${d.salary}</td><td style="color:${d.net >= 0 ? 'green' : 'red'}">$${d.net}</td></tr>`).join('')}
    </tbody></table>
    <h2>Daily Records</h2>
    <table><thead><tr><th>Date</th><th>Loads</th><th>Gross</th><th>Expenses</th><th>Net</th></tr></thead>
    <tbody>${filteredRecords.sort((a,b) => b.date.localeCompare(a.date)).map(r => `<tr><td>${r.date}</td><td>${r.loads.length}</td><td>$${r.grossRevenue}</td><td>$${r.totalExpenses}</td><td style="color:${r.netRevenue >= 0 ? 'green' : 'red'}">$${r.netRevenue}</td></tr>`).join('')}
    </tbody></table>
    <p style="text-align:center;color:#888;font-size:12px">Bhadhara Transport &mdash; 0773 083 687 | 0774 049 526 | 0770 083 687</p>
    </body></html>`)
    win.document.close()
    win.print()
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Financial performance, driver stats and monthly trends</p>
        </div>
        <button
          onClick={handlePrintReport}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Printer className="w-4 h-4" />
          Print Master Report
        </button>
      </div>

      {/* Date range */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-card border border-border rounded-xl">
        <span className="text-sm text-muted-foreground font-semibold">Period:</span>
        <input
          type="date"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
          className="bg-input border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <span className="text-muted-foreground text-sm">to</span>
        <input
          type="date"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
          className="bg-input border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <span className="text-xs text-muted-foreground">{filteredRecords.length} records found</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Gross Revenue', value: `$${totalGross.toFixed(2)}`, icon: DollarSign, color: 'text-primary' },
          { label: 'Total Expenses', value: `$${totalExpenses.toFixed(2)}`, icon: TrendingDown, color: 'text-destructive' },
          { label: 'Net Revenue', value: `$${totalNet.toFixed(2)}`, icon: TrendingUp, color: totalNet >= 0 ? 'text-green-400' : 'text-destructive' },
          { label: 'Total Loads', value: String(totalLoads), icon: Truck, color: 'text-accent' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/30 p-1 rounded-xl mb-6 w-fit">
        {(['master', 'driver', 'monthly'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
              tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'master' ? 'Overview' : t === 'driver' ? 'By Driver' : 'Monthly Trend'}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ─────────────────────────────────────────────────── */}
      {tab === 'master' && (
        <div className="space-y-6">
          {/* Daily bar chart */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-bold text-foreground mb-4">Daily Revenue</h2>
            {dailyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm">No data for selected period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dailyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.015 240)" />
                  <XAxis dataKey="date" tick={{ fill: 'oklch(0.6 0.01 240)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'oklch(0.6 0.01 240)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'oklch(0.17 0.015 240)', border: '1px solid oklch(0.28 0.015 240)', borderRadius: '8px' }}
                    labelStyle={{ color: 'oklch(0.95 0.005 240)' }}
                  />
                  <Legend />
                  <Bar dataKey="gross" name="Gross ($)" fill="oklch(0.55 0.16 220)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="net" name="Net ($)" fill="oklch(0.72 0.18 45)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Load type pie + paid/unpaid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4">Load Type Distribution</h2>
              {loadTypeData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={loadTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {loadTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'oklch(0.17 0.015 240)', border: '1px solid oklch(0.28 0.015 240)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold text-foreground mb-4">Payment Status</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Paid Loads</span>
                    <span className="font-bold text-green-400">{paidLoads}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full transition-all"
                      style={{ width: totalLoads ? `${(paidLoads / totalLoads) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Unpaid Loads</span>
                    <span className="font-bold text-destructive">{unpaidLoads}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-destructive rounded-full transition-all"
                      style={{ width: totalLoads ? `${(unpaidLoads / totalLoads) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <div className="pt-2 text-sm text-muted-foreground">
                  Collection rate: <span className="font-bold text-foreground">{totalLoads ? ((paidLoads / totalLoads) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Driver Tab ───────────────────────────────────────────────────── */}
      {tab === 'driver' && (
        <div className="space-y-6">
          {/* Driver bar chart */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-bold text-foreground mb-4">Driver Loads Comparison (this month vs last)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={driverComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.015 240)" />
                <XAxis dataKey="name" tick={{ fill: 'oklch(0.6 0.01 240)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'oklch(0.6 0.01 240)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'oklch(0.17 0.015 240)', border: '1px solid oklch(0.28 0.015 240)', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="lastLoads" name="Last Month" fill="oklch(0.55 0.16 220)" radius={[3,3,0,0]} />
                <Bar dataKey="thisLoads" name="This Month" fill="oklch(0.72 0.18 45)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Driver performance cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {driverData.map(driver => (
              <div key={driver.name} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center font-bold text-primary">
                    {driver.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{driver.name}</p>
                    <p className="text-xs text-muted-foreground">{driver.loads} loads in period</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Gross Revenue', value: `$${driver.revenue}`, color: 'text-foreground' },
                    { label: 'Collected', value: `$${driver.paid}`, color: 'text-primary' },
                    { label: 'Salary', value: `$${driver.salary}`, color: 'text-muted-foreground' },
                    { label: 'Net Contribution', value: `$${driver.net}`, color: driver.net >= 0 ? 'text-green-400' : 'text-destructive' },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className={`text-base font-bold ${s.color} mt-0.5`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Performance suggestion */}
                <div className="mt-3 p-3 bg-secondary/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const comp = driverComparison.find(d => d.name === driver.name)
                      if (!comp) return 'No comparison data.'
                      if (comp.change > 0) return `Up ${comp.change} loads vs last month (+${comp.pct}%). Great momentum — maintain consistent scheduling.`
                      if (comp.change < 0) return `Down ${Math.abs(comp.change)} loads vs last month (${comp.pct}%). Review route efficiency and scheduling to recover.`
                      return 'Performance steady vs last month. Consider targeting additional customers for growth.'
                    })()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Monthly Tab ──────────────────────────────────────────────────── */}
      {tab === 'monthly' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-bold text-foreground mb-4">Monthly Revenue Trend (Last 6 Months)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.015 240)" />
                <XAxis dataKey="month" tick={{ fill: 'oklch(0.6 0.01 240)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'oklch(0.6 0.01 240)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'oklch(0.17 0.015 240)', border: '1px solid oklch(0.28 0.015 240)', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="gross" name="Gross ($)" stroke="oklch(0.55 0.16 220)" strokeWidth={2} dot={{ fill: 'oklch(0.55 0.16 220)' }} />
                <Line type="monotone" dataKey="net" name="Net ($)" stroke="oklch(0.72 0.18 45)" strokeWidth={2} dot={{ fill: 'oklch(0.72 0.18 45)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-bold text-foreground mb-4">Monthly Loads</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.015 240)" />
                <XAxis dataKey="month" tick={{ fill: 'oklch(0.6 0.01 240)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'oklch(0.6 0.01 240)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'oklch(0.17 0.015 240)', border: '1px solid oklch(0.28 0.015 240)', borderRadius: '8px' }} />
                <Bar dataKey="loads" name="Loads" fill="oklch(0.72 0.18 45)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly summary table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-bold text-foreground">Monthly Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/30">
                    <th className="text-left px-5 py-3 text-xs text-muted-foreground font-semibold">Month</th>
                    <th className="text-right px-5 py-3 text-xs text-muted-foreground font-semibold">Loads</th>
                    <th className="text-right px-5 py-3 text-xs text-muted-foreground font-semibold">Gross</th>
                    <th className="text-right px-5 py-3 text-xs text-muted-foreground font-semibold">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((m, i) => (
                    <tr key={m.month} className={i % 2 === 0 ? '' : 'bg-secondary/10'}>
                      <td className="px-5 py-3 font-semibold text-foreground">{m.month}</td>
                      <td className="px-5 py-3 text-right text-foreground">{m.loads}</td>
                      <td className="px-5 py-3 text-right text-foreground">${m.gross}</td>
                      <td className={`px-5 py-3 text-right font-bold ${m.net >= 0 ? 'text-green-400' : 'text-destructive'}`}>${m.net}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
