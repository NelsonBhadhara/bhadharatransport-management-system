'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Save, Trash2, Loader2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import * as db from '@/lib/supabase/database'
import {
  type Load, type Expense, type DailyRecord, type Truck, type Employee,
  type LoadType, type PaymentStatus, LOAD_LABELS, computeRecord,
} from '@/lib/store'

const emptyExpense: Expense = { workersFee: 0, riversandFee: 0, tyres: 0, welding: 0, other: 0, otherLabel: '' }

export default function TransactionsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Current day form
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loads, setLoads] = useState<Load[]>([])
  const [expenses, setExpenses] = useState<Expense>(emptyExpense)
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)

  // Load dialog
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [editLoadIdx, setEditLoadIdx] = useState<number | null>(null)
  const [loadForm, setLoadForm] = useState<Omit<Load, 'id'>>({
    loadType: 'riversand', loadTypeLabel: 'River Sand', ratePerLoad: 90,
    numberOfLoads: 1, customerName: '', driverName: '', truckPlate: '',
    paymentStatus: 'unpaid', amountPaid: 0, notes: '',
  })

  const [loadPrices, setLoadPrices] = useState({ riversand: 90, pitsand: 85, quarrystone: 85, gravel: 90, other: 0 })
  const [defaultExp, setDefaultExp] = useState({ workersFeePerLoad: 20, riversandFeePerLoad: 5 })

  useEffect(() => {
    const init = async () => {
      const [r, t, e, lp, de] = await Promise.all([
        db.getRecords(), db.getTrucks(), db.getEmployees(),
        db.getLoadPrices(), db.getDefaultExpenses(),
      ])
      setRecords(r); setTrucks(t); setEmployees(e)
      setLoadPrices(lp); setDefaultExp(de)
      setLoading(false)
    }
    init()
  }, [])

  // Load existing record when date changes
  useEffect(() => {
    const existing = records.find(r => r.date === selectedDate)
    if (existing) {
      setLoads(existing.loads)
      setExpenses(existing.expenses)
      setEditingRecordId(existing.id)
    } else {
      setLoads([])
      setExpenses(emptyExpense)
      setEditingRecordId(null)
    }
  }, [selectedDate, records])

  const drivers = employees.filter(e => e.role === 'driver' && e.status === 'active')
  const activeTrucks = trucks.filter(t => t.status === 'active')

  const openAddLoad = () => {
    setEditLoadIdx(null)
    setLoadForm({
      loadType: 'riversand', loadTypeLabel: 'River Sand', ratePerLoad: loadPrices.riversand,
      numberOfLoads: 1, customerName: '', driverName: drivers[0]?.name ?? '',
      truckPlate: activeTrucks[0]?.plate ?? '', paymentStatus: 'unpaid', amountPaid: 0, notes: '',
    })
    setLoadDialogOpen(true)
  }

  const openEditLoad = (idx: number) => {
    const l = loads[idx]
    setEditLoadIdx(idx)
    setLoadForm({ ...l })
    setLoadDialogOpen(true)
  }

  const saveLoad = () => {
    if (editLoadIdx !== null) {
      const updated = [...loads]
      updated[editLoadIdx] = { ...updated[editLoadIdx], ...loadForm }
      setLoads(updated)
    } else {
      setLoads([...loads, { id: crypto.randomUUID(), ...loadForm }])
    }
    setLoadDialogOpen(false)
  }

  const removeLoad = (idx: number) => {
    setLoads(loads.filter((_, i) => i !== idx))
  }

  const handleLoadTypeChange = (lt: LoadType) => {
    const price = loadPrices[lt] ?? 0
    setLoadForm({ ...loadForm, loadType: lt, loadTypeLabel: LOAD_LABELS[lt], ratePerLoad: price })
  }

  // Auto-compute expenses based on loads
  const autoExpenses = {
    workersFee: loads.reduce((s, l) => s + l.numberOfLoads, 0) * defaultExp.workersFeePerLoad,
    riversandFee: loads.filter(l => l.loadType === 'riversand').reduce((s, l) => s + l.numberOfLoads, 0) * defaultExp.riversandFeePerLoad,
  }

  const computed = computeRecord(loads, {
    ...expenses,
    workersFee: expenses.workersFee || autoExpenses.workersFee,
    riversandFee: expenses.riversandFee || autoExpenses.riversandFee,
  })

  const handleSaveRecord = async () => {
    setSaving(true)
    const finalExpenses = {
      ...expenses,
      workersFee: expenses.workersFee || autoExpenses.workersFee,
      riversandFee: expenses.riversandFee || autoExpenses.riversandFee,
    }
    const record: DailyRecord = {
      id: editingRecordId || crypto.randomUUID(),
      date: selectedDate,
      loads,
      expenses: finalExpenses,
      ...computeRecord(loads, finalExpenses),
      savedAt: new Date().toISOString(),
      savedBy: profile?.username ?? 'admin',
    }
    await db.saveRecord(record)
    toast({ title: 'Record saved to cloud' })
    const updatedRecords = await db.getRecords()
    setRecords(updatedRecords)
    setSaving(false)
  }

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Delete this record permanently?')) return
    await db.deleteRecord(id)
    toast({ title: 'Record deleted' })
    const updatedRecords = await db.getRecords()
    setRecords(updatedRecords)
  }

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Daily Transactions</h1>
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-44" />
        </div>
      </div>

      <Tabs defaultValue="record">
        <TabsList>
          <TabsTrigger value="record">Today&apos;s Record</TabsTrigger>
          <TabsTrigger value="history">Past Records ({records.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="space-y-6">
          {/* Loads Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Loads for {format(new Date(selectedDate + 'T12:00:00'), 'dd MMM yyyy')}</CardTitle>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={openAddLoad}>
                <Plus className="h-4 w-4 mr-1" /> Add Load
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loads.length === 0 ? (
                <p className="text-sm text-muted-foreground p-6 text-center">No loads added yet. Click &quot;Add Load&quot; to start.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Truck</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loads.map((l, i) => (
                        <TableRow key={l.id}>
                          <TableCell>{l.loadTypeLabel}</TableCell>
                          <TableCell>{l.customerName || '-'}</TableCell>
                          <TableCell>{l.driverName}</TableCell>
                          <TableCell>{l.truckPlate}</TableCell>
                          <TableCell>{l.numberOfLoads}</TableCell>
                          <TableCell>${l.ratePerLoad}</TableCell>
                          <TableCell className="font-semibold">${l.ratePerLoad * l.numberOfLoads}</TableCell>
                          <TableCell>
                            <Badge variant={l.paymentStatus === 'paid' ? 'default' : 'outline'}>
                              {l.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditLoad(i)}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeLoad(i)} className="text-red-600">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Expenses</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div><Label>Workers Fee</Label><Input type="number" value={expenses.workersFee || autoExpenses.workersFee} onChange={e => setExpenses({ ...expenses, workersFee: Number(e.target.value) })} /></div>
                <div><Label>Riversand Fee</Label><Input type="number" value={expenses.riversandFee || autoExpenses.riversandFee} onChange={e => setExpenses({ ...expenses, riversandFee: Number(e.target.value) })} /></div>
                <div><Label>Tyres</Label><Input type="number" value={expenses.tyres} onChange={e => setExpenses({ ...expenses, tyres: Number(e.target.value) })} /></div>
                <div><Label>Welding</Label><Input type="number" value={expenses.welding} onChange={e => setExpenses({ ...expenses, welding: Number(e.target.value) })} /></div>
                <div><Label>Other</Label><Input type="number" value={expenses.other} onChange={e => setExpenses({ ...expenses, other: Number(e.target.value) })} /></div>
              </div>
            </CardContent>
          </Card>

          {/* Summary & Save */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div><p className="text-sm text-muted-foreground">Gross Revenue</p><p className="text-xl font-bold text-green-600">${computed.grossRevenue}</p></div>
                <div><p className="text-sm text-muted-foreground">Total Expenses</p><p className="text-xl font-bold text-red-600">${computed.totalExpenses}</p></div>
                <div><p className="text-sm text-muted-foreground">Net Revenue</p><p className="text-xl font-bold">${computed.netRevenue}</p></div>
              </div>
              <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={handleSaveRecord} disabled={saving || loads.length === 0}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Record to Cloud</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground p-6 text-center">No records saved yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Loads</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Expenses</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Saved By</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map(r => (
                      <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedDate(r.date)}>
                        <TableCell className="font-medium">{format(new Date(r.date + 'T12:00:00'), 'dd MMM yyyy')}</TableCell>
                        <TableCell>{r.loads.length}</TableCell>
                        <TableCell className="text-green-600">${r.grossRevenue}</TableCell>
                        <TableCell className="text-red-600">${r.totalExpenses}</TableCell>
                        <TableCell className="font-semibold">${r.netRevenue}</TableCell>
                        <TableCell>{r.savedBy}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteRecord(r.id) }} className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Load Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editLoadIdx !== null ? 'Edit Load' : 'Add Load'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Load Type</Label>
                <Select value={loadForm.loadType} onValueChange={v => handleLoadTypeChange(v as LoadType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOAD_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Rate/Load ($)</Label><Input type="number" value={loadForm.ratePerLoad} onChange={e => setLoadForm({ ...loadForm, ratePerLoad: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Number of Loads</Label><Input type="number" min={1} value={loadForm.numberOfLoads} onChange={e => setLoadForm({ ...loadForm, numberOfLoads: Number(e.target.value) })} /></div>
              <div><Label>Customer Name</Label><Input value={loadForm.customerName} onChange={e => setLoadForm({ ...loadForm, customerName: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Driver</Label>
                <Select value={loadForm.driverName} onValueChange={v => setLoadForm({ ...loadForm, driverName: v })}>
                  <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                  <SelectContent>
                    {drivers.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Truck</Label>
                <Select value={loadForm.truckPlate} onValueChange={v => setLoadForm({ ...loadForm, truckPlate: v })}>
                  <SelectTrigger><SelectValue placeholder="Select truck" /></SelectTrigger>
                  <SelectContent>
                    {activeTrucks.map(t => <SelectItem key={t.id} value={t.plate}>{t.plate}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Payment Status</Label>
                <Select value={loadForm.paymentStatus} onValueChange={v => setLoadForm({ ...loadForm, paymentStatus: v as PaymentStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Amount Paid ($)</Label><Input type="number" value={loadForm.amountPaid} onChange={e => setLoadForm({ ...loadForm, amountPaid: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Notes</Label><Input value={loadForm.notes ?? ''} onChange={e => setLoadForm({ ...loadForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={saveLoad}>{editLoadIdx !== null ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
