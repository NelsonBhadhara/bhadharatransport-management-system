'use client'

import { useState, useEffect } from 'react'
import {
  Plus, Save, ChevronDown, ChevronUp, Trash2, Search,
  Printer, FileText, CalendarDays, CheckCircle, XCircle, Edit3, Settings
} from 'lucide-react'
import {
  store, Load, DailyRecord, Expense, LoadType, LOAD_LABELS,
  computeRecord, DefaultExpenses, LoadPrices, Truck, Employee
} from '@/lib/store'
import {
  getRecords, saveRecord, deleteRecord, getTrucks, getEmployees,
  getSettings, saveSettings
} from '@/lib/supabase/database'
import { useAuth } from '@/components/auth/AuthProvider'
import { format, parseISO } from 'date-fns'


// Removed static DRIVERS constant - using live employee data now
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
    truckPlate: truck?.plate ?? 'AFR4994',
    paymentStatus: 'paid',
    amountPaid: 90,
  }
}

const EMPTY_EXPENSES: Expense = {
  workersFee: 0,
  riversandFee: 0,
  tyres: 0,
  welding: 0,
  other: 0,
}

export default function TransactionsPage() {
  const { profile } = useAuth()
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DailyRecord | null>(null)
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loads, setLoads] = useState<Load[]>([])
  const [expenses, setExpenses] = useState<Expense>(EMPTY_EXPENSES)
  
  const [search, setSearch] = useState('')
  const [saved, setSaved] = useState(false)
  const [defaultExpenses, setDefaultExpenses] = useState<DefaultExpenses>({ workersFeePerLoad: 1, riversandFeePerLoad: 5 })
  const [editingExpenses, setEditingExpenses] = useState(false)
  const [loadPrices, setLoadPrices] = useState<LoadPrices>({ riversand: 90, pitsand: 80, quarrystone: 120, gravel: 70, other: 0 })
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [r, t, e, s] = await Promise.all([
        getRecords(),
        getTrucks(),
        getEmployees(),
        getSettings()
      ])
      setRecords(r)
      setTrucks(t)
      setEmployees(e)
      if (s) {
        setDefaultExpenses(s.defaultExpenses)
        setLoadPrices(s.loadPrices)
      }
    } catch (err) {
      console.error('Failed to load transaction data:', err)
    } finally {
      setLoading(true) // Actually wait for state updates? No, just set false
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const computeResult = () => computeRecord(loads, expenses)
  const computedResult = computeResult()
  const computed = loads.length > 0

  const handleAddLoad = () => {
    setLoads([...loads, newLoad(trucks)])
  }

  const handleRemoveLoad = (id: string) => {
    setLoads(loads.filter(l => l.id !== id))
  }

  const updateLoad = (id: string, updates: Partial<Load>) => {
    setLoads(loads.map(l => {
      if (l.id !== id) return l
      const updated = { ...l, ...updates }
      if (updates.loadType) {
        updated.loadTypeLabel = LOAD_LABELS[updates.loadType as LoadType]
        updated.ratePerLoad = loadPrices[updates.loadType as keyof LoadPrices] || 0
        updated.amountPaid = updated.ratePerLoad * updated.numberOfLoads
      }
      if (updates.numberOfLoads) {
        updated.amountPaid = updated.ratePerLoad * (updates.numberOfLoads || 0)
      }
      if (updates.ratePerLoad) {
        updated.amountPaid = (updates.ratePerLoad || 0) * updated.numberOfLoads
      }
      return updated
    }))
  }

  const handleSave = async () => {
    if (!computed || !profile) { 
      alert('Please compute the record first.')
      return 
    }
    const record: DailyRecord = {
      id: editingRecord?.id ?? Math.random().toString(36).slice(2),
      date: selectedDate,
      loads,
      expenses,
      ...computedResult,
      savedAt: new Date().toISOString(),
      savedBy: profile.username,
    }
    await saveRecord(record)
    await loadData()
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setShowForm(false)
      setEditingRecord(null)
      resetForm()
    }, 1500)
  }

  const resetForm = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
    setLoads([])
    setExpenses(EMPTY_EXPENSES)
    setEditingRecord(null)
  }

  const handleEdit = (record: DailyRecord) => {
    setEditingRecord(record)
    setSelectedDate(record.date)
    setLoads(record.loads)
    setExpenses(record.expenses)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      await deleteRecord(id)
      await loadData()
    }
  }

  const handleSaveSettings = async () => {
    await saveSettings({ defaultExpenses, loadPrices })
    setEditingExpenses(false)
  }

  const filteredRecords = records
    .filter(r => r.date.includes(search) || r.savedBy.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date))

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading transactions...</div>

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaction Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Record and manage daily load transactions and expenses.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditingExpenses(true)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-secondary/50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Pricing Settings
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {showForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Close Form' : 'New Transaction'}
          </button>
        </div>
      </div>

      {/* Pricing Settings Modal */}
      {editingExpenses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                System Pricing Settings
              </h2>
              <button onClick={() => setEditingExpenses(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-primary uppercase tracking-wider">Load Rates (USD)</h3>
                  {(Object.keys(loadPrices) as Array<keyof LoadPrices>).map(type => (
                    <div key={type}>
                      <label className="text-xs text-muted-foreground mb-1 block uppercase">{LOAD_LABELS[type as LoadType] || type}</label>
                      <input
                        type="number"
                        value={loadPrices[type]}
                        onChange={e => setLoadPrices({ ...loadPrices, [type]: Number(e.target.value) })}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-accent uppercase tracking-wider">Default Fees (USD)</h3>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block uppercase">Workers Fee per Load</label>
                    <input
                      type="number"
                      value={defaultExpenses.workersFeePerLoad}
                      onChange={e => setDefaultExpenses({ ...defaultExpenses, workersFeePerLoad: Number(e.target.value) })}
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block uppercase">River Sand Fee per Load</label>
                    <input
                      type="number"
                      value={defaultExpenses.riversandFeePerLoad}
                      onChange={e => setDefaultExpenses({ ...defaultExpenses, riversandFeePerLoad: Number(e.target.value) })}
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border bg-secondary/20 flex justify-end gap-3">
              <button onClick={() => setEditingExpenses(false)} className="px-4 py-2 text-sm font-semibold">Cancel</button>
              <button onClick={handleSaveSettings} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-lg shadow-primary/20">
                Save Global Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CalendarDays className="w-5 h-5 text-primary" />
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="bg-transparent border-none text-xl font-bold focus:ring-0 text-foreground p-0"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddLoad}
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-foreground rounded-lg text-xs font-bold hover:bg-secondary/80"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Load
                  </button>
                </div>
              </div>

              {loads.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-border rounded-xl">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No loads added yet. Click &quot;Add Load&quot; to begin.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {loads.map((load, idx) => (
                    <div key={load.id} className="relative p-4 bg-secondary/30 rounded-xl border border-border group">
                      <button
                        onClick={() => handleRemoveLoad(load.id)}
                        className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">Material</label>
                          <select
                            value={load.loadType}
                            onChange={e => updateLoad(load.id, { loadType: e.target.value as LoadType })}
                            className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                          >
                            {(Object.keys(LOAD_LABELS) as LoadType[]).map(t => (
                              <option key={t} value={t}>{LOAD_LABELS[t]}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">Rate ($)</label>
                          <input
                            type="number"
                            value={load.ratePerLoad}
                            onChange={e => updateLoad(load.id, { ratePerLoad: Number(e.target.value) })}
                            className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">Loads</label>
                          <input
                            type="number"
                            value={load.numberOfLoads}
                            onChange={e => updateLoad(load.id, { numberOfLoads: Number(e.target.value) })}
                            className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">Total ($)</label>
                          <div className="w-full bg-muted/50 rounded-lg px-2 py-1.5 text-xs font-bold text-primary">
                            ${load.amountPaid}
                          </div>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">Driver</label>
                          <select
                            value={load.driverName}
                            onChange={e => {
                              const driver = e.target.value
                              const truck = trucks.find(t => t.driverName === driver)
                              updateLoad(load.id, { driverName: driver, truckPlate: truck?.plate ?? 'UNASSIGNED' })
                            }}
                            className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-xs"
                          >
                            {employees.filter(e => e.role === 'driver').map(d => (
                              <option key={d.id} value={d.name}>{d.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">Truck</label>
                          <div className="w-full bg-muted/50 border border-border rounded-lg px-2 py-1.5 text-xs font-mono">
                            {load.truckPlate}
                          </div>
                        </div>

                        <div className="col-span-2 sm:col-span-2">
                          <label className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">Customer</label>
                          <input
                            type="text"
                            placeholder="Customer Name"
                            value={load.customerName}
                            onChange={e => updateLoad(load.id, { customerName: e.target.value })}
                            className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Expenses Card */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Expenses
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg group">
                   <div className="flex flex-col">
                      <span className="text-xs font-semibold">Workers Fee</span>
                      <span className="text-[10px] text-muted-foreground">Auto-calculated: ${defaultExpenses.workersFeePerLoad}/load</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-accent">${(loads.length * defaultExpenses.workersFeePerLoad)}</span>
                      <button 
                        onClick={() => setExpenses({...expenses, workersFee: (loads.length * defaultExpenses.workersFeePerLoad)})}
                        className="p-1 hover:bg-accent/20 rounded text-accent transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                   </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg group">
                   <div className="flex flex-col">
                      <span className="text-xs font-semibold">River Sand Fee</span>
                      <span className="text-[10px] text-muted-foreground">Auto-calculated: ${defaultExpenses.riversandFeePerLoad}/load</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-accent">${(loads.filter(l => l.loadType === 'riversand').length * defaultExpenses.riversandFeePerLoad)}</span>
                      <button 
                        onClick={() => setExpenses({...expenses, riversandFee: (loads.filter(l => l.loadType === 'riversand').length * defaultExpenses.riversandFeePerLoad)})}
                        className="p-1 hover:bg-accent/20 rounded text-accent transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                   </div>
                </div>
                
                <hr className="border-border my-2" />

                {(Object.keys(expenses) as Array<keyof Expense>).map(key => (
                  key !== 'otherLabel' && (
                    <div key={key}>
                      <label className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </label>
                      <input
                        type="number"
                        value={expenses[key] as number}
                        onChange={e => setExpenses({ ...expenses, [key]: Number(e.target.value) })}
                        className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-sm"
                      />
                    </div>
                  )
                ))}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">Expense Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Tyres from Harare"
                    value={expenses.otherLabel || ''}
                    onChange={e => setExpenses({ ...expenses, otherLabel: e.target.value })}
                    className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Computation Summary */}
            <div className="bg-primary border border-primary/20 rounded-xl p-5 text-primary-foreground">
              <h2 className="font-bold mb-4">Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-80">Gross Revenue</span>
                  <span className="font-bold">${computedResult.grossRevenue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-80">Total Expenses</span>
                  <span className="font-bold text-red-200">-${computedResult.totalExpenses}</span>
                </div>
                <div className="flex justify-between border-t border-primary-foreground/20 pt-2 mt-2">
                  <span className="font-bold">Net Revenue</span>
                  <span className="text-xl font-black">${computedResult.netRevenue}</span>
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={!computed}
                className={`w-full mt-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-xl ${
                  saved 
                    ? 'bg-green-500 text-white scale-95' 
                    : 'bg-white text-primary hover:bg-opacity-90 active:scale-95 disabled:opacity-50'
                }`}
              >
                {saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {saved ? 'Record Saved!' : 'Save Daily Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground text-lg">Recent Daily Records</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by date..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center bg-card border border-border rounded-xl">
              <p className="text-muted-foreground">No records found matching your search.</p>
            </div>
          ) : (
            filteredRecords.map(record => (
              <div key={record.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary rounded-lg flex flex-col items-center justify-center text-primary">
                       <span className="text-[10px] font-bold uppercase">{format(parseISO(record.date), 'MMM')}</span>
                       <span className="text-lg font-black leading-none">{format(parseISO(record.date), 'dd')}</span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{format(parseISO(record.date), 'EEEE, d MMMM yyyy')}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.loads.length} loads recorded • Recorded by {record.savedBy}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                       <p className="text-[10px] text-muted-foreground uppercase font-bold">Net Revenue</p>
                       <p className={`text-lg font-black ${record.netRevenue >= 0 ? 'text-green-400' : 'text-destructive'}`}>
                         ${record.netRevenue.toFixed(2)}
                       </p>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => handleEdit(record)}
                         className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                        >
                         <Edit3 className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleDelete(record.id)}
                         className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

import { TrendingUp } from 'lucide-react'
