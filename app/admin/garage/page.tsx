'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Loader2, Truck as TruckIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import * as db from '@/lib/supabase/database'
import type { Truck, Employee } from '@/lib/store'

export default function GaragePage() {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTruck, setEditTruck] = useState<Truck | null>(null)
  const [form, setForm] = useState({ plate: '', driverName: '' as string | null, status: 'inactive' as Truck['status'] })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const loadData = async () => {
    const [t, e] = await Promise.all([db.getTrucks(), db.getEmployees()])
    setTrucks(t)
    setEmployees(e)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const drivers = employees.filter(e => e.role === 'driver' && e.status === 'active')

  const handleSave = async () => {
    setSaving(true)
    if (editTruck) {
      await db.updateTruck(editTruck.id, {
        plate: form.plate,
        driverName: form.driverName || null,
        status: form.status,
        assignedAt: form.driverName ? new Date().toISOString() : undefined,
      })
      toast({ title: 'Truck updated' })
    } else {
      const newTruck = await db.addTruck(form.plate)
      if (newTruck && (form.driverName || form.status !== 'inactive')) {
        await db.updateTruck(newTruck.id, {
          driverName: form.driverName || null,
          status: form.status,
          assignedAt: form.driverName ? new Date().toISOString() : undefined,
        })
      }
      toast({ title: 'Truck added' })
    }
    setSaving(false)
    setDialogOpen(false)
    setEditTruck(null)
    loadData()
  }

  const openEdit = (truck: Truck) => {
    setEditTruck(truck)
    setForm({ plate: truck.plate, driverName: truck.driverName, status: truck.status })
    setDialogOpen(true)
  }

  const openAdd = () => {
    setEditTruck(null)
    setForm({ plate: '', driverName: null, status: 'inactive' })
    setDialogOpen(true)
  }

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div></div>
  }

  const statusColor = (s: string) => s === 'active' ? 'default' : s === 'maintenance' ? 'destructive' : 'secondary'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Garage / Fleet</h1>
        <Button className="bg-amber-600 hover:bg-amber-700" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" /> Add Truck
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trucks.map(truck => (
          <Card key={truck.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TruckIcon className="h-5 w-5 text-amber-600" />
                  {truck.plate}
                </CardTitle>
                <Badge variant={statusColor(truck.status)}>{truck.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Driver: <span className="font-medium text-foreground">{truck.driverName ?? 'Unassigned'}</span>
              </p>
              {truck.assignedAt && (
                <p className="text-xs text-muted-foreground mt-1">Assigned: {new Date(truck.assignedAt).toLocaleDateString()}</p>
              )}
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => openEdit(truck)}>
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editTruck ? 'Edit Truck' : 'Add Truck'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Plate Number</Label><Input value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} placeholder="e.g. AFR4994" /></div>
            <div><Label>Assign Driver</Label>
              <Select value={form.driverName ?? 'none'} onValueChange={v => setForm({ ...form, driverName: v === 'none' ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {drivers.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Truck['status'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSave} disabled={saving || !form.plate}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editTruck ? 'Update' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
