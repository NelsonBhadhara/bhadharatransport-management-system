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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2, TrendingUp, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import * as db from '@/lib/supabase/database'
import type { Employee } from '@/lib/store'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [promoteOpen, setPromoteOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', role: 'driver' as Employee['role'], salary: 300, defaultSalary: 300, joinDate: new Date().toISOString().split('T')[0], status: 'active' as Employee['status'] })
  const [promoteForm, setPromoteForm] = useState({ toRole: 'driver' as Employee['role'], newSalary: 0, note: '' })
  const [promoteId, setPromoteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const loadEmployees = async () => {
    const data = await db.getEmployees()
    setEmployees(data)
    setLoading(false)
  }

  useEffect(() => { loadEmployees() }, [])

  const handleSave = async () => {
    setSaving(true)
    if (editId) {
      await db.updateEmployee(editId, form)
      toast({ title: 'Employee updated' })
    } else {
      await db.addEmployee(form)
      toast({ title: 'Employee added' })
    }
    setSaving(false)
    setDialogOpen(false)
    setEditId(null)
    setForm({ name: '', role: 'driver', salary: 300, defaultSalary: 300, joinDate: new Date().toISOString().split('T')[0], status: 'active' })
    loadEmployees()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this employee?')) return
    await db.removeEmployee(id)
    toast({ title: 'Employee removed' })
    loadEmployees()
  }

  const handlePromote = async () => {
    if (!promoteId) return
    setSaving(true)
    await db.promoteEmployee(promoteId, promoteForm.toRole, promoteForm.newSalary, promoteForm.note)
    toast({ title: 'Employee promoted' })
    setSaving(false)
    setPromoteOpen(false)
    setPromoteId(null)
    loadEmployees()
  }

  const openEdit = (emp: Employee) => {
    setEditId(emp.id)
    setForm({ name: emp.name, role: emp.role, salary: emp.salary, defaultSalary: emp.defaultSalary, joinDate: emp.joinDate, status: emp.status })
    setDialogOpen(true)
  }

  const openPromote = (emp: Employee) => {
    setPromoteId(emp.id)
    setPromoteForm({ toRole: emp.role, newSalary: emp.salary, note: '' })
    setPromoteOpen(true)
  }

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => { setEditId(null); setForm({ name: '', role: 'driver', salary: 300, defaultSalary: 300, joinDate: new Date().toISOString().split('T')[0], status: 'active' }); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Add Employee
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell><Badge variant="outline">{emp.role}</Badge></TableCell>
                  <TableCell>${emp.salary}</TableCell>
                  <TableCell>{emp.joinDate}</TableCell>
                  <TableCell>
                    <Badge variant={emp.status === 'active' ? 'default' : 'secondary'}>{emp.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openPromote(emp)} title="Promote">
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(emp)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)} title="Remove" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Employee' : 'Add Employee'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v as Employee['role'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="mechanic">Mechanic</SelectItem>
                  <SelectItem value="worker">Worker</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Salary ($)</Label><Input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: Number(e.target.value) })} /></div>
              <div><Label>Default Salary ($)</Label><Input type="number" value={form.defaultSalary} onChange={e => setForm({ ...form, defaultSalary: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Join Date</Label><Input type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Employee['status'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSave} disabled={saving || !form.name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editId ? 'Update' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote Dialog */}
      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Promote Employee</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>New Role</Label>
              <Select value={promoteForm.toRole} onValueChange={v => setPromoteForm({ ...promoteForm, toRole: v as Employee['role'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="mechanic">Mechanic</SelectItem>
                  <SelectItem value="worker">Worker</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>New Salary ($)</Label><Input type="number" value={promoteForm.newSalary} onChange={e => setPromoteForm({ ...promoteForm, newSalary: Number(e.target.value) })} /></div>
            <div><Label>Note</Label><Input value={promoteForm.note} onChange={e => setPromoteForm({ ...promoteForm, note: e.target.value })} placeholder="Reason for promotion" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteOpen(false)}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handlePromote} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Promote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
