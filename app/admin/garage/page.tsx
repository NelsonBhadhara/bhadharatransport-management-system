'use client'

import { useState, useEffect } from 'react'
import { Truck, Plus, Edit3, Save, X, UserX, RefreshCw, Wrench } from 'lucide-react'
import { store, Truck as TruckType } from '@/lib/store'

export default function GaragePage() {
  const [trucks, setTrucks] = useState<TruckType[]>([])
  const [editMode, setEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPlate, setEditPlate] = useState('')
  const [editDriver, setEditDriver] = useState('')
  const [editStatus, setEditStatus] = useState<TruckType['status']>('active')
  const [newPlate, setNewPlate] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [saved, setSaved] = useState(false)

  const employees = store.getEmployees()
  const drivers = employees.filter(e => e.role === 'driver' && e.status === 'active')

  useEffect(() => {
    setTrucks(store.getTrucks())
  }, [])

  const startEdit = (truck: TruckType) => {
    setEditingId(truck.id)
    setEditPlate(truck.plate)
    setEditDriver(truck.driverName ?? '')
    setEditStatus(truck.status)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditPlate('')
    setEditDriver('')
  }

  const saveEdit = (id: string) => {
    store.updateTruck(id, {
      plate: editPlate.toUpperCase().trim(),
      driverName: editDriver || null,
      status: editStatus,
    })
    setTrucks(store.getTrucks())
    setEditingId(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleAddTruck = () => {
    if (!newPlate.trim()) return
    store.addTruck(newPlate.toUpperCase().trim())
    setTrucks(store.getTrucks())
    setNewPlate('')
    setShowAddForm(false)
  }

  const assignedDrivers = trucks.filter(t => t.driverName).map(t => t.driverName)
  const unassignedDrivers = drivers.filter(d => !assignedDrivers.includes(d.name))

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Garage Manager</h1>
          <p className="text-sm text-muted-foreground mt-1 text-pretty">Manage fleet, number plates and driver assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              editMode
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                : 'bg-card border-border text-muted-foreground hover:border-primary hover:text-foreground'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            {editMode ? 'Edit Mode ON' : 'Edit Mode'}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Add Truck
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-green-400/10 border border-green-400/20 rounded-2xl text-sm text-green-400 font-bold animate-in fade-in slide-in-from-top-1">
          Changes saved successfully.
        </div>
      )}

      {/* Add truck form */}
      {showAddForm && (
        <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary">Register New Fleet Truck</h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground mb-1.5 block ml-1">Plate Number</label>
              <input
                type="text"
                placeholder="e.g. AB12CD"
                value={newPlate}
                onChange={e => setNewPlate(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTruck()}
                className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-foreground font-mono text-sm uppercase placeholder:normal-case focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddTruck}
                disabled={!newPlate.trim()}
                className="flex-1 sm:flex-none px-6 py-3 bg-primary text-primary-foreground rounded-xl font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-40 shadow-lg shadow-primary/20"
              >
                Register
              </button>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="px-4 py-3 border border-border text-muted-foreground rounded-xl text-sm font-bold hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Trucks', value: trucks.length, color: 'text-foreground', bg: 'bg-secondary/20' },
          { label: 'Active & Assigned', value: trucks.filter(t => t.status === 'active' && t.driverName).length, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Unassigned', value: trucks.filter(t => !t.driverName).length, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
          { label: 'Maintenance', value: trucks.filter(t => t.status === 'maintenance').length, color: 'text-orange-400', bg: 'bg-orange-400/10' },
        ].map(s => (
          <div key={s.label} className={`border border-border rounded-2xl p-5 ${s.bg}`}>
            <p className={`text-3xl font-black ${s.color} tracking-tighter`}>{s.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Trucks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trucks.map(truck => {
          const isEditing = editingId === truck.id && editMode
          return (
            <div
              key={truck.id}
              className={`bg-card border rounded-3xl p-6 transition-all shadow-sm hover:shadow-md ${
                isEditing ? 'border-primary ring-4 ring-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Truck className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editPlate}
                        onChange={e => setEditPlate(e.target.value)}
                        className="bg-secondary/50 border border-border rounded-xl px-3 py-1.5 text-foreground font-mono text-lg font-black focus:ring-2 focus:ring-primary/50 outline-none w-32 uppercase"
                      />
                    ) : (
                      <p className="font-mono font-black text-2xl text-foreground tracking-tight">{truck.plate}</p>
                    )}
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-0.5">Fleet ID: {truck.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                      truck.status === 'active'
                        ? 'bg-green-400/10 text-green-400 border-green-400/20'
                        : truck.status === 'maintenance'
                        ? 'bg-orange-400/10 text-orange-400 border-orange-400/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {truck.status}
                    </span>
                  )}
                  {editMode && !isEditing && (
                    <button
                      onClick={() => startEdit(truck)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Assign Driver</label>
                    <select
                      value={editDriver}
                      onChange={e => setEditDriver(e.target.value)}
                      className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">-- No Assignment --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Fleet Status</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as TruckType['status'])}
                      className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="active">Active Service</option>
                      <option value="maintenance">Maintenance/Garage</option>
                      <option value="inactive">Decommissioned</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => saveEdit(truck.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-black shadow-lg shadow-primary/20"
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                    <button onClick={cancelEdit} className="p-2.5 border border-border text-muted-foreground rounded-xl hover:bg-secondary transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    {truck.driverName ? (
                      <>
                        <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center text-sm font-black text-accent">
                          {truck.driverName[0]}
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1">Primary Driver</p>
                           <p className="text-sm font-black text-foreground leading-none">{truck.driverName}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-muted-foreground/40">
                           <UserX className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-sm font-black text-muted-foreground italic">Unassigned</p>
                           {editMode && (
                              <p className="text-[8px] font-black uppercase text-yellow-400 tracking-widest mt-0.5">Action Required</p>
                           )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Unassigned drivers info */}
      {unassignedDrivers.length > 0 && (
        <div className="bg-card border-2 border-yellow-400/20 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center">
                <UserX className="w-5 h-5 text-yellow-400" />
             </div>
             <div>
                <h3 className="font-black text-foreground leading-tight">Pending Driver Assignments</h3>
                <p className="text-xs text-muted-foreground">The following drivers are active but not linked to a truck.</p>
             </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassignedDrivers.map(d => (
              <span key={d.id} className="px-4 py-2 bg-yellow-400/5 text-yellow-400 border border-yellow-400/10 rounded-xl text-xs font-black uppercase tracking-wider">
                {d.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
