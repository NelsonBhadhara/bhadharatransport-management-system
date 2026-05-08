'use client'

import { useState, useEffect } from 'react'
import {
  Plus, Save, ChevronDown, ChevronUp, Trash2, Search,
  Printer, FileText, CalendarDays, CheckCircle, XCircle, Edit3, Settings, DollarSign
} from 'lucide-react'
import {
  store, Load, DailyRecord, Expense, LoadType, LOAD_LABELS,
  computeRecord, DefaultExpenses, LoadPrices
} from '@/lib/store'
import { format, parseISO } from 'date-fns'

const DRIVERS = ['Gombe', 'Tanya', 'Tinashe', 'Fidza']
const PAID_PRESETS = [80, 90, 100]

function newLoad(trucks: any[] = []): Load {
  const defaultDriver = 'Gombe'
  const truck = trucks.find(t => t.driverName === defaultDriver)
  return {
    id: Math.random().toString(36).slice(2),
    loadType: 'riversand',
    loadTypeLabel: 'River Sand',
    ratePerLoad: 90,
    numberOfLoads: 1,
    customerName: '',
    driverName: defaultDriver,
    truckPlate: truck?.plate ?? '',
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
  const [loads, setLoads] = useState<Load[]>([newLoad(store.getTrucks())])
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

  useEffect(() => {
    setRecords(store.getRecords())
    setTrucks(store.getTrucks())
  }, [])

  const filteredRecords = records
    .filter(r => {
      if (searchQuery && !r.date.includes(searchQuery) &&
          !r.loads.some(l => l.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.driverName.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false
      }
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
      if (updates.driverName) {
        const truck = trucks.find(t => t.driverName === updates.driverName)
        updated.truckPlate = truck?.plate ?? ''
      }
      return updated
    })
    setLoads(updatedLoads)
    const total = updatedLoads.reduce((s, l) => s + l.numberOfLoads, 0)
    const riverSandLoads = updatedLoads.filter(l => l.loadType === 'riversand').reduce((s, l) => s + l.numberOfLoads, 0)
    setExpenses(prev => ({
      ...prev,
      workersFee: total > 0 ? total * defaultExpenses.workersFeePerLoad : 0,
      riversandFee: riverSandLoads > 0 ? riverSandLoads * defaultExpenses.riversandFeePerLoad : 0,
    }))
    setComputed(false)
  }

  const addLoad = () => {
    const last = loads[loads.length - 1]
    const newLoads = [...loads, { ...newLoad(trucks), driverName: last?.driverName ?? 'Gombe' }]
    setLoads(newLoads)
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
    const total = newLoads.reduce((s, l) => s + l.numberOfLoads, 0)
    const riverSandLoads = newLoads.filter(l => l.loadType === 'riversand').reduce((s, l) => s + l.numberOfLoads, 0)
    setExpenses(prev => ({
      ...prev,
      workersFee: total > 0 ? total * defaultExpenses.workersFeePerLoad : 0,
      riversandFee: riverSandLoads > 0 ? riverSandLoads * defaultExpenses.riversandFeePerLoad : 0,
    }))
    setComputed(false)
  }

  const handleCompute = () => {
    const total = loads.reduce((s, l) => s + l.numberOfLoads, 0)
    const riverSandLoads = loads.filter(l => l.loadType === 'riversand').reduce((s, l) => s + l.numberOfLoads, 0)
    const updatedExpenses = {
      ...expenses,
      workersFee: total > 0 ? total * defaultExpenses.workersFeePerLoad : 0,
      riversandFee: riverSandLoads > 0 ? riverSandLoads * defaultExpenses.riversandFeePerLoad : 0,
    }
    const result = computeRecord(loads, updatedExpenses)
    setComputedResult(result)
    setExpenses(updatedExpenses)
    setComputed(true)
  }

  const handleSaveAndCompute = () => {
    handleCompute()
    setTimeout(() => {
      const total = loads.reduce((s, l) => s + l.numberOfLoads, 0)
      const riverSandLoads = loads.filter(l => l.loadType === 'riversand').reduce((s, l) => s + l.numberOfLoads, 0)
      const updatedExpenses = {
        ...expenses,
        workersFee: total > 0 ? total * defaultExpenses.workersFeePerLoad : 0,
        riversandFee: riverSandLoads > 0 ? riverSandLoads * defaultExpenses.riversandFeePerLoad : 0,
      }
      const result = computeRecord(loads, updatedExpenses)
      const user = store.getCurrentUser()
      const record: DailyRecord = {
        id: editingRecord?.id ?? Math.random().toString(36).slice(2),
        date: selectedDate,
        loads,
        expenses: updatedExpenses,
        ...result,
        savedAt: new Date().toISOString(),
        savedBy: user?.username ?? 'admin',
      }
      store.saveRecord(record)
      setRecords(store.getRecords())
      setSaved(true)
      setComputed(true)
      setComputedResult(result)
      setTimeout(() => {
        setSaved(false)
        setShowForm(false)
        setEditingRecord(null)
        setLoads([newLoad(trucks)])
        setExpenses(newExpense())
        setComputed(false)
      }, 1200)
    }, 50)
  }

  const handleNewRecord = () => {
    setShowForm(!showForm)
    setEditingRecord(null)
    setLoads([newLoad(trucks)])
    setExpenses(newExpense())
    setComputed(false)
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
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 text-foreground">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1 text-pretty">Record, manage and print daily load transactions for the fleet.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-52 bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value as typeof paymentFilter)}
              className="flex-1 sm:flex-none bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid Only</option>
              <option value="unpaid">Unpaid Only</option>
            </select>
            <button
              onClick={() => setEditingExpenses(!editingExpenses)}
              className="p-2.5 border border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-all bg-card"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleNewRecord()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              New Record
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {editingExpenses && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Configuration</h2>
            <button onClick={() => setEditingExpenses(false)} className="text-muted-foreground hover:text-foreground p-1">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Expense Rates</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">Workers ($/load)</label>
                  <input
                    type="number"
                    value={defaultExpenses.workersFeePerLoad}
                    onChange={e => setDefaultExpenses(prev => ({ ...prev, workersFeePerLoad: Number(e.target.value) }))}
                    className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">Riversand ($/load)</label>
                  <input
                    type="number"
                    value={defaultExpenses.riversandFeePerLoad}
                    onChange={e => setDefaultExpenses(prev => ({ ...prev, riversandFeePerLoad: Number(e.target.value) }))}
                    className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2 text-sm font-bold"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Material Prices</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(loadPrices).map(type => (
                  <div key={type}>
                    <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">{type}</label>
                    <input
                      type="number"
                      value={loadPrices[type as LoadType]}
                      onChange={e => setLoadPrices(prev => ({ ...prev, [type]: Number(e.target.value) }))}
                      className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2 text-sm font-bold"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              store.saveDefaultExpenses(defaultExpenses)
              store.saveLoadPrices(loadPrices)
              setSaved(true)
              setTimeout(() => { setSaved(false); setEditingExpenses(false); }, 1500)
            }}
            className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20"
          >
            {saved ? 'Settings Updated!' : 'Update All Settings'}
          </button>
        </div>
      )}

      {/* Form Section */}
      {showForm && (
        <div className="bg-card border-2 border-primary/20 rounded-3xl p-4 sm:p-8 shadow-xl space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-black">
                {editingRecord ? 'Modify Transaction' : 'New Transaction Entry'}
              </h2>
              <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-xl border border-border w-fit">
                <CalendarDays className="w-4 h-4 text-primary ml-2" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-bold outline-none px-2"
                />
              </div>
           </div>

           {/* Loads List */}
           <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Load Details</h3>
                <button onClick={addLoad} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4" /> Add Load
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {loads.map((load, idx) => (
                  <div key={load.id} className="relative bg-secondary/10 border border-border rounded-2xl p-5 space-y-5">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Material Load</span>
                       </div>
                       {loads.length > 1 && (
                         <button onClick={() => removeLoad(idx)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                         </button>
                       )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Customer</label>
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={load.customerName}
                            onChange={e => updateLoad(idx, { customerName: e.target.value })}
                            className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Driver</label>
                          <select
                            value={load.driverName}
                            onChange={e => updateLoad(idx, { driverName: e.target.value })}
                            className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            {DRIVERS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Material</label>
                          <select
                            value={load.loadType}
                            onChange={e => updateLoad(idx, { loadType: e.target.value as LoadType })}
                            className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            <option value="riversand">River Sand (${loadPrices.riversand})</option>
                            <option value="pitsand">Pit Sand (${loadPrices.pitsand})</option>
                            <option value="quarrystone">Quarry Stone (${loadPrices.quarrystone})</option>
                            <option value="gravel">Gravel (${loadPrices.gravel})</option>
                            <option value="other">Other (Custom)</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Quantity (Loads)</label>
                          <input
                            type="number"
                            min={1}
                            value={load.numberOfLoads}
                            onChange={e => updateLoad(idx, { numberOfLoads: Number(e.target.value) })}
                            className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/50 text-primary"
                          />
                       </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-border/50 gap-4">
                       <div className="flex items-center gap-3 w-full sm:w-auto">
                          <button
                            onClick={() => updateLoad(idx, { paymentStatus: load.paymentStatus === 'paid' ? 'unpaid' : 'paid' })}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                              load.paymentStatus === 'paid' ? 'bg-green-400 text-white border-green-400' : 'bg-destructive/10 text-destructive border-destructive/20'
                            }`}
                          >
                            {load.paymentStatus === 'paid' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            {load.paymentStatus}
                          </button>
                          {load.paymentStatus === 'paid' && (
                             <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                                {PAID_PRESETS.map(p => (
                                  <button
                                    key={p}
                                    onClick={() => updateLoad(idx, { amountPaid: p })}
                                    className={`px-3 py-2 rounded-lg text-xs font-black border transition-all ${load.amountPaid === p ? 'bg-primary text-white border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary'}`}
                                  >
                                    ${p}
                                  </button>
                                ))}
                             </div>
                          )}
                       </div>
                       <div className="text-right w-full sm:w-auto">
                          <p className="text-[10px] font-black uppercase text-muted-foreground">Subtotal</p>
                          <p className="text-xl font-black text-primary">${(load.ratePerLoad * load.numberOfLoads).toFixed(2)}</p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           {/* Expenses Section */}
           <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Operational Expenses</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                 {[
                   { key: 'workersFee', label: 'Workers' },
                   { key: 'riversandFee', label: 'Riversand' },
                   { key: 'tyres', label: 'Tyres' },
                   { key: 'welding', label: 'Welding' },
                   { key: 'other', label: 'Other' },
                 ].map(exp => (
                   <div key={exp.key} className="bg-secondary/20 border border-border rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{exp.label}</span>
                         { (exp.key === 'workersFee' || exp.key === 'riversandFee') && (
                            <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black">AUTO</span>
                         )}
                      </div>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <input
                          type="number"
                          value={expenses[exp.key as keyof Expense]}
                          onChange={e => {
                            if (exp.key !== 'workersFee' && exp.key !== 'riversandFee') {
                              setExpenses(prev => ({ ...prev, [exp.key]: Number(e.target.value) }))
                            }
                          }}
                          disabled={exp.key === 'workersFee' || exp.key === 'riversandFee'}
                          className="w-full bg-card border border-border rounded-xl pl-8 pr-3 py-2 text-sm font-bold outline-none disabled:opacity-60"
                        />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Summary and Save */}
           <div className="pt-6 border-t border-border flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
              {computed ? (
                <div className="flex flex-wrap items-center gap-6">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Gross Revenue</span>
                      <span className="text-xl font-black">${computedResult.grossRevenue.toFixed(2)}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Total Expenses</span>
                      <span className="text-xl font-black text-destructive">${computedResult.totalExpenses.toFixed(2)}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Net Profit</span>
                      <span className={`text-2xl font-black ${computedResult.netRevenue >= 0 ? 'text-green-400' : 'text-destructive'}`}>
                        ${computedResult.netRevenue.toFixed(2)}
                      </span>
                   </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground font-medium italic">Pending calculation...</p>
              )}
              
              <div className="flex flex-col sm:flex-row items-center gap-3">
                 <button
                   onClick={() => { setShowForm(false); setEditingRecord(null); }}
                   className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                 >
                   Discard
                 </button>
                 <button
                   onClick={handleSaveAndCompute}
                   className="w-full sm:w-auto px-12 py-3.5 bg-primary text-primary-foreground rounded-2xl font-black text-sm shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                 >
                   {saved ? 'Successfully Recorded!' : editingRecord ? 'Update Record' : 'Submit & Save'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* History List */}
      <div className="space-y-6">
        <h2 className="text-lg font-black border-l-4 border-primary pl-4">Transaction History</h2>
        {filteredRecords.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-border rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">No records matching your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRecords.map(record => (
              <div key={record.id} className="bg-card border border-border rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                      <CalendarDays className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-lg leading-tight">{format(new Date(record.date + 'T12:00:00'), 'dd MMM yyyy')}</p>
                      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">
                        {record.loads.length} Loads · Gross ${record.grossRevenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="mr-4 text-right hidden sm:block">
                       <p className="text-[10px] font-black uppercase text-muted-foreground">Net Revenue</p>
                       <p className={`text-xl font-black ${record.netRevenue >= 0 ? 'text-green-400' : 'text-destructive'}`}>
                         ${record.netRevenue.toFixed(2)}
                       </p>
                    </div>
                    <button onClick={() => handleEdit(record)} className="p-2.5 bg-secondary/50 rounded-xl hover:bg-primary hover:text-white transition-all">
                       <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handlePrint(record)} className="p-2.5 bg-secondary/50 rounded-xl hover:bg-primary hover:text-white transition-all">
                       <Printer className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(record.id)} className="p-2.5 bg-secondary/50 text-destructive rounded-xl hover:bg-destructive hover:text-white transition-all">
                       <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Table View */}
                <div className="border-t border-border overflow-x-auto bg-secondary/5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-secondary/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <th className="px-6 py-3 text-left whitespace-nowrap">Customer</th>
                        <th className="px-4 py-3 text-left whitespace-nowrap">Driver</th>
                        <th className="px-4 py-3 text-left whitespace-nowrap">Material</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">Qty</th>
                        <th className="px-4 py-3 text-right whitespace-nowrap">Amount</th>
                        <th className="px-4 py-3 text-center whitespace-nowrap">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {record.loads.map(load => (
                        <tr key={load.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-4 font-bold whitespace-nowrap">{load.customerName || 'N/A'}</td>
                          <td className="px-4 py-4 text-muted-foreground font-medium whitespace-nowrap">{load.driverName}</td>
                          <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{load.loadTypeLabel}</td>
                          <td className="px-4 py-4 text-right font-black">{load.numberOfLoads}</td>
                          <td className="px-4 py-4 text-right font-black text-primary whitespace-nowrap">${(load.ratePerLoad * load.numberOfLoads).toFixed(2)}</td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                              load.paymentStatus === 'paid' ? 'bg-green-400/10 text-green-400 border border-green-400/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
                            }`}>
                              {load.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
