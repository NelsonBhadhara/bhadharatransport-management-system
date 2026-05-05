'use client'

import { useState, useEffect } from 'react'
import {
  Users, Plus, Edit3, Trash2, TrendingUp, DollarSign, Save, X, ChevronDown, ChevronUp, Calendar
} from 'lucide-react'
import { store, Employee } from '@/lib/store'
import { format } from 'date-fns'

const ROLES: Employee['role'][] = ['driver', 'mechanic', 'admin', 'worker']

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showPromoteId, setShowPromoteId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Add form
  const [addName, setAddName] = useState('')
  const [addRole, setAddRole] = useState<Employee['role']>('driver')
  const [addSalary, setAddSalary] = useState(300)
  const [addJoin, setAddJoin] = useState(format(new Date(), 'yyyy-MM-dd'))

  // Edit form
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<Employee['role']>('driver')
  const [editSalary, setEditSalary] = useState(300)
  const [editStatus, setEditStatus] = useState<Employee['status']>('active')

  // Promote form
  const [promoteRole, setPromoteRole] = useState<Employee['role']>('driver')
  const [promoteSalary, setPromoteSalary] = useState(300)
  const [promoteNote, setPromoteNote] = useState('')

  useEffect(() => {
    setEmployees(store.getEmployees())
  }, [])

  const refresh = () => setEmployees(store.getEmployees())

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id)
    setEditName(emp.name)
    setEditRole(emp.role)
    setEditSalary(emp.salary)
    setEditStatus(emp.status)
  }

  const saveEdit = (id: string) => {
    store.updateEmployee(id, { name: editName, role: editRole, salary: editSalary, status: editStatus })
    refresh()
    setEditingId(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleAdd = () => {
    if (!addName.trim()) return
    store.addEmployee({
      name: addName,
      role: addRole,
      salary: addSalary,
      defaultSalary: addSalary,
      joinDate: addJoin,
      status: 'active',
    })
    refresh()
    setShowAdd(false)
    setAddName('')
    setAddSalary(300)
  }

  const handleRemove = (id: string) => {
    if (!confirm('Remove this employee permanently?')) return
    store.removeEmployee(id)
    refresh()
  }

  const handlePromote = (id: string) => {
    store.promoteEmployee(id, promoteRole, promoteSalary, promoteNote)
    refresh()
    setShowPromoteId(null)
    setPromoteNote('')
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const totalSalaries = employees.filter(e => e.status === 'active').reduce((s, e) => s + e.salary, 0)
  const activeCount = employees.filter(e => e.status === 'active').length

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage staff, salaries, roles and promotions</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {saved && (
        <div className="mb-4 p-3 bg-green-400/10 border border-green-400/30 rounded-lg text-sm text-green-400">
          Changes saved successfully.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Active Employees</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-primary">${totalSalaries}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Monthly Salaries</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-accent">{employees.filter(e => e.role === 'driver').length}</p>
          <p className="text-xs text-muted-foreground mt-1">Drivers</p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-card border border-primary rounded-2xl p-5 mb-6 space-y-4">
          <h3 className="font-bold text-foreground">Add New Employee</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
              <input
                type="text"
                placeholder="Name"
                value={addName}
                onChange={e => setAddName(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Role</label>
              <select
                value={addRole}
                onChange={e => setAddRole(e.target.value as Employee['role'])}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 capitalize"
              >
                {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Monthly Salary ($)</label>
              <input
                type="number"
                min={0}
                value={addSalary}
                onChange={e => setAddSalary(Number(e.target.value))}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Join Date</label>
              <input
                type="date"
                value={addJoin}
                onChange={e => setAddJoin(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!addName.trim()}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Add Employee
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-border text-muted-foreground rounded-lg text-sm hover:border-primary transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Employee cards */}
      <div className="space-y-3">
        {employees.map(emp => {
          const isEditing = editingId === emp.id
          const isExpanded = expandedId === emp.id
          const isPromoting = showPromoteId === emp.id

          return (
            <div key={emp.id} className={`bg-card border rounded-2xl overflow-hidden transition-colors ${isEditing ? 'border-primary' : 'border-border'}`}>
              <div className="flex flex-wrap items-center justify-between p-5 gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-base font-bold text-primary">
                    {emp.name[0]}
                  </div>
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="bg-input border border-border rounded-lg px-2 py-1 text-foreground font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    ) : (
                      <p className="font-bold text-foreground">{emp.name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 text-xs rounded-full border capitalize ${
                        emp.role === 'driver' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20'
                          : emp.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-secondary text-muted-foreground border-border'
                      }`}>
                        {emp.role}
                      </span>
                      <span className={`text-xs ${emp.status === 'active' ? 'text-green-400' : 'text-muted-foreground'}`}>
                        {emp.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={editRole}
                        onChange={e => setEditRole(e.target.value as Employee['role'])}
                        className="bg-input border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none capitalize"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={editSalary}
                        onChange={e => setEditSalary(Number(e.target.value))}
                        className="w-20 bg-input border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                        placeholder="Salary"
                      />
                      <select
                        value={editStatus}
                        onChange={e => setEditStatus(e.target.value as Employee['status'])}
                        className="bg-input border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                      <button onClick={() => saveEdit(emp.id)} className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 border border-border text-muted-foreground rounded-lg hover:border-primary">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-right">
                        <p className="font-bold text-primary text-lg">${emp.salary}</p>
                        <p className="text-xs text-muted-foreground">/ month</p>
                      </div>
                      <button onClick={() => startEdit(emp)} className="p-2 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:border-primary transition-colors" title="Edit">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setShowPromoteId(isPromoting ? null : emp.id); setPromoteRole(emp.role); setPromoteSalary(emp.salary); setPromoteNote('') }}
                        className="p-2 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:border-primary transition-colors"
                        title="Promote"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : emp.id)}
                        className="p-2 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:border-primary transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleRemove(emp.id)} className="p-2 text-muted-foreground hover:text-destructive border border-border rounded-lg hover:border-destructive/50 transition-colors" title="Remove">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Promote form */}
              {isPromoting && !isEditing && (
                <div className="border-t border-border p-5 bg-secondary/20 space-y-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Promote / Change Role
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">New Role</label>
                      <select
                        value={promoteRole}
                        onChange={e => setPromoteRole(e.target.value as Employee['role'])}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none capitalize"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">New Salary ($)</label>
                      <input
                        type="number"
                        min={0}
                        value={promoteSalary}
                        onChange={e => setPromoteSalary(Number(e.target.value))}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Note</label>
                      <input
                        type="text"
                        placeholder="Promotion note..."
                        value={promoteNote}
                        onChange={e => setPromoteNote(e.target.value)}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePromote(emp.id)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Confirm Promotion
                    </button>
                    <button onClick={() => setShowPromoteId(null)} className="px-4 py-2 border border-border text-muted-foreground rounded-lg text-sm hover:border-primary transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded history */}
              {isExpanded && !isEditing && (
                <div className="border-t border-border p-5 bg-secondary/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Join Date</p>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {format(new Date(emp.joinDate), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Default Salary</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">${emp.defaultSalary}</p>
                    </div>
                  </div>
                  {emp.promotions.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Promotion History</p>
                      <div className="space-y-2">
                        {emp.promotions.map((p, i) => (
                          <div key={i} className="flex items-start gap-3 text-xs text-muted-foreground">
                            <TrendingUp className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                            <span>
                              {format(new Date(p.date), 'dd MMM yyyy')} — {p.fromRole} → <span className="text-foreground font-semibold capitalize">{p.toRole}</span>
                              {p.note && ` · ${p.note}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No promotion history yet.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
