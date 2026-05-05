'use client'

import { useState, useEffect } from 'react'
import {
  Plus, Save, Calculator, ChevronDown, ChevronUp, Trash2, Search,
  Printer, FileText, CalendarDays, CheckCircle, XCircle, Edit3, Settings
} from 'lucide-react'
import {
  store, Load, DailyRecord, Expense, LoadType, LOAD_LABELS,
  WORKERS_FEE_PER_LOAD, RIVERSAND_FEE_PER_LOAD, computeRecord, DefaultExpenses, LoadPrices
} from '@/lib/store'
import { format, parseISO } from 'date-fns'
import { v4 as uuid } from 'crypto'

const DRIVERS = ['Gombe', 'Tanya', 'Tinashe', 'Fidza']
const PAID_PRESETS = [80, 90, 100]

function newLoad(): Load {
  return {
    id: Math.random().toString(36).slice(2),
    loadType: 'riversand',
    loadTypeLabel: 'River Sand',
    ratePerLoad: 90,
    numberOfLoads: 1,
    customerName: '',
    driverName: 'Gombe',
    truckPlate: '',
    paymentStatus: 'unpaid',
    amountPaid: 0,
    notes: '',
  }
}

function newExpense(): Expense {
  return { workersFee: 0, riversandFee: 0, tyres: 0, welding: 0, other: 0 }
}

export default function TransactionsPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null)
  const [loads, setLoads] = useState<Load[]>([newLoad()])
  const [expenses, setExpenses] = useState<Expense>(newExpense())
  const [expenseChecks, setExpenseChecks] = useState({
    workersFee: false, riversandFee: false, tyres: false, welding: false, other: false
  })
  const [computed, setComputed] = useState(false)
  const [computedResult, setComputedResult] = useState({ grossRevenue: 0, totalExpenses: 0, netRevenue: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [showForm, setShowForm] = useState(false)
  const [trucks, setTrucks] = useState(store.getTrucks())
  const [saved, setSaved] = useState(false)
  const [defaultExpenses, setDefaultExpenses] = useState<DefaultExpenses>(store.getDefaultExpenses())
  const [editingExpenses, setEditingExpenses] = useState(false)
  const [loadPrices, setLoadPrices] = useState<LoadPrices>(store.getLoadPrices())
  const [editingPrices, setEditingPrices] = useState(false)

  useEffect(() => {
    setRecords(store.getRecords())
    setTrucks(store.getTrucks())
  }, [])

  const filteredRecords = records
    .filter(r => {
      // Search filter
      if (searchQuery && !r.date.includes(searchQuery) &&
          !r.loads.some(l => l.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.driverName.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false
      }
      // Payment status filter
      if (paymentFilter === 'paid') return r.loads.some(l => l.paymentStatus === 'paid')
      if (paymentFilter === 'unpaid') return r.loads.some(l => l.paymentStatus === 'unpaid')
      return true
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  const dateRecord = records.find(r => r.date === selectedDate)

  const updateLoad = (idx: number, updates: Partial<Load>) => {
    const updatedLoads = loads.map((l, i) => {
      if (i !== idx) return l
      const updated = { ...l, ...updates }
      if (updates.loadType) {
        updated.loadTypeLabel = LOAD_LABELS[updates.loadType as LoadType]
        updated.ratePerLoad = loadPrices[updates.loadType as LoadType]
      }
      // auto-set truck plate from driver
      if (updates.driverName) {
        const truck = trucks.find(t => t.driverName === updates.driverName)
        updated.truckPlate = truck?.plate ?? ''
      }
      return updated
    })
    setLoads(updatedLoads)
    // Auto-calculate expenses whenever any load is updated
    const total = updatedLoads.reduce((s, l) => s + l.numberOfLoads, 0)
    const riverSandLoads = updatedLoads.filter(l => l.loadType === 'riversand').reduce((s, l) => s + l.numberOfLoads, 0)
    setExpenses(prev => ({
      ...prev,
      // Workers fee is per load - auto-added whenever loads exist
      workersFee: total > 0 ? total * defaultExpenses.workersFeePerLoad : 0,
      // Riversand fee only for riversand loads
      riversandFee: riverSandLoads > 0 ? riverSandLoads * defaultExpenses.riversandFeePerLoad : 0,
    }))
    setComputed(false)
    setComputed(false)
  }

  const addLoad = () => {
    const last = loads[loads.length - 1]
    const newLoads = [...loads, { ...newLoad(), driverName: last?.driverName ?? 'Gombe' }]
    setLoads(newLoads)
    // Auto-calculate expenses when a new load is added
    const total = newLoads.reduce((s, l) => s + l.numberOfLoads, 0)
    const riverSandLoads = newLoads.filter(l => l.loadType === 'riversand').reduce((s, l) => s + l.numberOfLoads, 0)
    setExpenses(prev => ({
      ...prev,
      workersFee: total > 0 ? total * defaultExpenses.workersFeePerLoad : 0,
      riversandFee: riverSandLoads > 0 ? riverSandLoads * defaultExpenses.riversandFeePerLoad : 0,
    }))
    setComputed(false)
  }

  const removeLoad = (idx: number) => {
    const newLoads = loads.filter((_, i) => i !== idx)
    setLoads(newLoads)
    // Recalculate expenses after removing a load
    const total = newLoads.reduce((s, l) => s + l.numberOfLoads, 0)
    const riverSandLoads = newLoads.filter(l => l.loadType === 'riversand').reduce((s, l) => s + l.numberOfLoads, 0)
    setExpenses(prev => ({
      ...prev,
      workersFee: total > 0 ? total * defaultExpenses.workersFeePerLoad : 0,
      riversandFee: riverSandLoads > 0 ? riverSandLoads * defaultExpenses.riversandFeePerLoad : 0,
    }))
    setComputed(false)
  }

  const autoCalculateExpenses = (currentLoads: Load[]) => {
    const total = currentLoads.reduce((s, l) => s + l.numberOfLoads, 0)
    const riverSandLoads = currentLoads.filter(l => l.loadType === 'riversand').reduce((s, l) => s + l.numberOfLoads, 0)
    setExpenses(prev => ({
      ...prev,
      // Auto-check workers fee if at least one load
      workersFee: total > 0 ? total * defaultExpenses.workersFeePerLoad : 0,
      // Auto-add riversand fee if any riversand loads
      riversandFee: riverSandLoads > 0 ? riverSandLoads * defaultExpenses.riversandFeePerLoad : 0,
    }))
  }

  const handleCompute = () => {
    autoCalculateExpenses(loads)
    const result = computeRecord(loads, expenses)
    setComputedResult(result)
    setComputed(true)
  }

  const handleSave = () => {
    if (!computed) { alert('Please compute the record first.'); return }
    const user = store.getCurrentUser()
    const record: DailyRecord = {
      id: editingRecord?.id ?? Math.random().toString(36).slice(2),
      date: selectedDate,
      loads,
      expenses,
      ...computedResult,
      savedAt: new Date().toISOString(),
      savedBy: user?.username ?? 'admin',
    }
    store.saveRecord(record)
    setRecords(store.getRecords())
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setShowForm(false)
      setLoads([newLoad()])
      setExpenses(newExpense())
      setExpenseChecks({ workersFee: false, riversandFee: false, tyres: false, welding: false, other: false })
      setComputed(false)
      setEditingRecord(null)
    }, 1500)
  }

  const handleEdit = (record: DailyRecord) => {
    setEditingRecord(record)
    setLoads(record.loads)
    setExpenses(record.expenses)
    setSelectedDate(record.date)
    setShowForm(true)
    setComputed(false)
    setSaved(false)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this record permanently?')) return
    store.deleteRecord(id)
    setRecords(store.getRecords())
  }

  const handlePrint = (record: DailyRecord) => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>Bhadhara Transport — ${record.date}</title>
    <style>body{font-family:sans-serif;padding:20px;color:#111}table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f5f5f5}
    .total{font-weight:bold}.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
    </style></head><body>
    <div class="header"><div><h2>Bhadhara Transport</h2><p>Daily Transaction Report — ${record.date}</p></div>
    <div><p>Saved by: ${record.savedBy}</p><p>${record.savedAt ? format(parseISO(record.savedAt), 'dd/MM/yyyy HH:mm') : ''}</p></div></div>
    <table><thead><tr><th>#</th><th>Customer</th><th>Driver</th><th>Truck</th><th>Load Type</th><th>Loads</th><th>Rate</th><th>Gross</th><th>Status</th><th>Paid</th></tr></thead>
    <tbody>${record.loads.map((l, i) => `<tr><td>${i + 1}</td><td>${l.customerName}</td><td>${l.driverName}</td><td>${l.truckPlate}</td><td>${l.loadTypeLabel}</td><td>${l.numberOfLoads}</td><td>$${l.ratePerLoad}</td><td>$${l.ratePerLoad * l.numberOfLoads}</td><td>${l.paymentStatus}</td><td>$${l.amountPaid}</td></tr>`).join('')}
    </tbody></table>
    <h3>Expenses</h3><table><tbody>
    <tr><td>Workers Fee</td><td>$${record.expenses.workersFee}</td></tr>
    <tr><td>Riversand Fee</td><td>$${record.expenses.riversandFee}</td></tr>
    <tr><td>Tyres</td><td>$${record.expenses.tyres}</td></tr>
    <tr><td>Welding</td><td>$${record.expenses.welding}</td></tr>
    <tr><td>Other</td><td>$${record.expenses.other}</td></tr>
    </tbody></table>
    <table><tbody>
    <tr class="total"><td>Gross Revenue</td><td>$${record.grossRevenue}</td></tr>
    <tr class="total"><td>Total Expenses</td><td>$${record.totalExpenses}</td></tr>
    <tr class="total"><td>Net Revenue</td><td>$${record.netRevenue}</td></tr>
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
          <h1 className="text-2xl font-bold text-foreground">Daily Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">Record, manage and print daily load transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-input border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-52"
            />
          </div>
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value as typeof paymentFilter)}
            className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Transactions</option>
            <option value="paid">Paid Only</option>
            <option value="unpaid">Unpaid Only</option>
          </select>
          <button
            onClick={() => setEditingExpenses(!editingExpenses)}
            className="p-2 border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            title="Edit default expense rates"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setEditingRecord(null); setLoads([newLoad()]); setExpenses(newExpense()); setComputed(false) }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Record
          </button>
        </div>
      </div>

      {/* Date Browser */}
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="w-4 h-4 text-primary" />
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {dateRecord && (
          <span className="text-sm text-muted-foreground">
            Record found — {dateRecord.loads.length} loads · Net ${dateRecord.netRevenue.toFixed(2)}
          </span>
        )}
      </div>

      {/* ── Expense Settings Modal ─────────────────────────────────────────── */}
      {editingExpenses && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Settings</h2>
            <button onClick={() => setEditingExpenses(false)} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>

          {/* Default Expense Rates */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Default Expense Rates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Workers Fee Per Load ($)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={defaultExpenses.workersFeePerLoad}
                  onChange={e => setDefaultExpenses(prev => ({ ...prev, workersFeePerLoad: Number(e.target.value) }))}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Riversand Fee Per Load ($)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={defaultExpenses.riversandFeePerLoad}
                  onChange={e => setDefaultExpenses(prev => ({ ...prev, riversandFeePerLoad: Number(e.target.value) }))}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <button
              onClick={() => {
                store.saveDefaultExpenses(defaultExpenses)
                setSaved(true)
                setTimeout(() => setSaved(false), 1500)
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Save Expense Rates
            </button>
          </div>

          {/* Load Prices */}
          <div className="space-y-4 border-t border-border pt-6">
            <h3 className="font-semibold text-foreground">Load Prices</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                ['riversand', 'pitsand', 'quarrystone', 'gravel'] as (keyof LoadPrices)[]
              ).map(type => (
                <div key={type}>
                  <label className="text-xs text-muted-foreground mb-1 block capitalize">
                    {type === 'riversand' ? 'River Sand' : type === 'pitsand' ? 'Pit Sand' : type === 'quarrystone' ? 'Quarry Stone' : 'Gravel'} Price Per Load ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={loadPrices[type]}
                    onChange={e => setLoadPrices(prev => ({ ...prev, [type]: Number(e.target.value) }))}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                store.saveLoadPrices(loadPrices)
                setSaved(true)
                setTimeout(() => setSaved(false), 1500)
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Save Load Prices
            </button>
          </div>
        </div>
      )}

      {/* ── New / Edit Form ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              {editingRecord ? `Edit Record — ${editingRecord.date}` : `New Record — ${selectedDate}`}
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Loads */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Loads</h3>
              <button onClick={addLoad} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-4 h-4" /> Add Load
              </button>
            </div>
            <div className="space-y-3">
              {loads.map((load, idx) => (
                <div key={load.id} className="border border-border rounded-xl p-4 bg-secondary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Load #{idx + 1}</span>
                    {loads.length > 1 && (
                      <button onClick={() => removeLoad(idx)} className="text-destructive hover:text-destructive/80 text-xs flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Customer */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Customer Name</label>
                      <input
                        type="text"
                        placeholder="Enter customer name"
                        value={load.customerName}
                        onChange={e => updateLoad(idx, { customerName: e.target.value })}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    {/* Driver */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Driver</label>
                      <select
                        value={load.driverName}
                        onChange={e => updateLoad(idx, { driverName: e.target.value })}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {DRIVERS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    {/* Truck */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Truck Plate</label>
                      <input
                        type="text"
                        value={load.truckPlate}
                        onChange={e => updateLoad(idx, { truckPlate: e.target.value })}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                      />
                    </div>

                    {/* Load Type */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Load Type</label>
                      <select
                        value={load.loadType}
                        onChange={e => updateLoad(idx, { loadType: e.target.value as LoadType })}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="riversand">River Sand — ${loadPrices.riversand}/load</option>
                        <option value="pitsand">Pit Sand — ${loadPrices.pitsand}/load</option>
                        <option value="quarrystone">Quarry Stone — ${loadPrices.quarrystone}/load</option>
                        <option value="gravel">Gravel — ${loadPrices.gravel}/load</option>
                        <option value="other">Other (custom rate)</option>
                      </select>
                    </div>

                    {/* Custom rate */}
                    {load.loadType === 'other' && (
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Custom Rate ($)</label>
                        <input
                          type="number"
                          min={0}
                          value={load.ratePerLoad}
                          onChange={e => updateLoad(idx, { ratePerLoad: Number(e.target.value) })}
                          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    )}

                    {/* Number of loads */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Number of Loads</label>
                      <input
                        type="number"
                        min={1}
                        value={load.numberOfLoads}
                        onChange={e => updateLoad(idx, { numberOfLoads: Number(e.target.value) })}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    {/* Subtotal */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Subtotal</label>
                      <div className="bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm font-bold text-primary">
                        ${(load.ratePerLoad * load.numberOfLoads).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground font-semibold">Payment:</span>
                    <button
                      onClick={() => updateLoad(idx, { paymentStatus: load.paymentStatus === 'paid' ? 'unpaid' : 'paid' })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        load.paymentStatus === 'paid'
                          ? 'bg-green-400/15 text-green-400 border border-green-400/30'
                          : 'bg-destructive/10 text-destructive border border-destructive/30'
                      }`}
                    >
                      {load.paymentStatus === 'paid' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {load.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </button>

                    {load.paymentStatus === 'paid' && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {PAID_PRESETS.map(preset => (
                          <button
                            key={preset}
                            onClick={() => updateLoad(idx, { amountPaid: preset })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                              load.amountPaid === preset
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                            }`}
                          >
                            ${preset}
                          </button>
                        ))}
                        <input
                          type="number"
                          placeholder="Custom $"
                          min={0}
                          value={load.amountPaid || ''}
                          onChange={e => updateLoad(idx, { amountPaid: Number(e.target.value) })}
                          className="w-24 bg-input border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Expenses</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(
                [
                  { key: 'workersFee', label: 'Workers Fee', hint: `Auto: $${loads.reduce((s, l) => s + l.numberOfLoads, 0) * defaultExpenses.workersFeePerLoad} ($${defaultExpenses.workersFeePerLoad}/load)` },
                  { key: 'riversandFee', label: 'Riversand Fee', hint: `Auto: $${loads.filter(l => l.loadType === 'riversand').reduce((s, l) => s + l.numberOfLoads, 0) * defaultExpenses.riversandFeePerLoad} ($${defaultExpenses.riversandFeePerLoad}/load)` },
                  { key: 'tyres', label: 'Tyres', hint: '' },
                  { key: 'welding', label: 'Welding', hint: '' },
                  { key: 'other', label: 'Other', hint: '' },
                ] as { key: keyof Expense; label: string; hint: string }[]
              ).map(exp => (
                <div key={exp.key} className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={expenseChecks[exp.key as keyof typeof expenseChecks]}
                      onChange={e => setExpenseChecks(prev => ({ ...prev, [exp.key]: e.target.checked }))}
                      className="accent-primary"
                    />
                    <span className="text-muted-foreground">{exp.label}</span>
                  </label>
                  {expenseChecks[exp.key as keyof typeof expenseChecks] && (
                    <div>
                      <input
                        type="number"
                        min={0}
                        value={expenses[exp.key]}
                        onChange={e => setExpenses(prev => ({ ...prev, [exp.key]: Number(e.target.value) }))}
                        placeholder="Amount ($)"
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      {exp.hint && <p className="text-xs text-muted-foreground mt-0.5">{exp.hint}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Computed result */}
          {computed && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-secondary/30 rounded-xl border border-border">
              <div>
                <p className="text-xs text-muted-foreground">Gross Revenue</p>
                <p className="text-lg font-bold text-foreground">${computedResult.grossRevenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-lg font-bold text-destructive">${computedResult.totalExpenses.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Net Revenue</p>
                <p className={`text-lg font-bold ${computedResult.netRevenue >= 0 ? 'text-green-400' : 'text-destructive'}`}>
                  ${computedResult.netRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCompute}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Calculator className="w-4 h-4" />
              Compute
            </button>
            <button
              onClick={handleSave}
              disabled={!computed}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saved ? 'Saved!' : 'Save Record'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingRecord(null); setComputed(false) }}
              className="px-5 py-2.5 border border-border text-muted-foreground rounded-lg text-sm hover:border-primary hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Records List ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No records found. Click &quot;New Record&quot; to start recording transactions.</p>
          </div>
        ) : (
          filteredRecords.map(record => (
            <div key={record.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Record header */}
              <div className="flex flex-wrap items-center justify-between p-5 gap-3">
                <div>
                  <p className="font-bold text-foreground">{format(new Date(record.date + 'T12:00:00'), 'EEEE, d MMMM yyyy')}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {record.loads.length} loads · Gross ${record.grossRevenue} · Expenses ${record.totalExpenses}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${record.netRevenue >= 0 ? 'text-green-400' : 'text-destructive'}`}>
                    Net ${record.netRevenue.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleEdit(record)}
                    className="p-2 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:border-primary transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePrint(record)}
                    className="p-2 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:border-primary transition-colors"
                    title="Print"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-2 text-muted-foreground hover:text-destructive border border-border rounded-lg hover:border-destructive/50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Load rows */}
              <div className="border-t border-border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/30">
                      <th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Customer</th>
                      <th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Driver</th>
                      <th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Truck</th>
                      <th className="text-left px-4 py-2 text-xs text-muted-foreground font-semibold">Load</th>
                      <th className="text-right px-4 py-2 text-xs text-muted-foreground font-semibold">Loads</th>
                      <th className="text-right px-4 py-2 text-xs text-muted-foreground font-semibold">Gross</th>
                      <th className="text-center px-4 py-2 text-xs text-muted-foreground font-semibold">Status</th>
                      <th className="text-right px-4 py-2 text-xs text-muted-foreground font-semibold">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.loads.map((load, i) => (
                      <tr key={load.id} className={i % 2 === 0 ? '' : 'bg-secondary/10'}>
                        <td className="px-4 py-2 text-foreground">{load.customerName || '—'}</td>
                        <td className="px-4 py-2 text-foreground">{load.driverName}</td>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{load.truckPlate}</td>
                        <td className="px-4 py-2 text-foreground">{load.loadTypeLabel}</td>
                        <td className="px-4 py-2 text-right text-foreground">{load.numberOfLoads}</td>
                        <td className="px-4 py-2 text-right font-semibold text-foreground">${load.ratePerLoad * load.numberOfLoads}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            load.paymentStatus === 'paid'
                              ? 'bg-green-400/10 text-green-400'
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {load.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-foreground">${load.amountPaid}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
