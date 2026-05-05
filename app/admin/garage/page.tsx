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
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Garage Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage fleet, number plates and driver assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              editMode
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            {editMode ? 'Edit Mode ON' : 'Edit Mode'}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Truck
          </button>
        </div>
      </div>

      {saved && (
        <div className="mb-4 p-3 bg-green-400/10 border border-green-400/30 rounded-lg text-sm text-green-400">
          Changes saved successfully.
        </div>
      )}

      {/* Add truck form */}
      {showAddForm && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6 flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">New Truck Plate Number</label>
            <input
              type="text"
              placeholder="e.g. AFR1234"
              value={newPlate}
              onChange={e => setNewPlate(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTruck()}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={handleAddTruck}
            disabled={!newPlate.trim()}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Add
          </button>
          <button onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-border text-muted-foreground rounded-lg text-sm hover:border-primary transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Trucks', value: trucks.length, color: 'text-foreground' },
          { label: 'Active & Assigned', value: trucks.filter(t => t.status === 'active' && t.driverName).length, color: 'text-green-400' },
          { label: 'Unassigned', value: trucks.filter(t => !t.driverName).length, color: 'text-yellow-400' },
          { label: 'Maintenance', value: trucks.filter(t => t.status === 'maintenance').length, color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Trucks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trucks.map(truck => {
          const isEditing = editingId === truck.id && editMode
          return (
            <div
              key={truck.id}
              className={`bg-card border rounded-2xl p-5 transition-colors ${
                isEditing ? 'border-primary' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editPlate}
                        onChange={e => setEditPlate(e.target.value)}
                        className="bg-input border border-border rounded-lg px-2 py-1 text-foreground font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 w-32"
                      />
                    ) : (
                      <p className="font-mono font-bold text-xl text-foreground">{truck.plate}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Truck ID: {truck.id.slice(0, 6)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
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
                      className="p-1.5 text-muted-foreground hover:text-primary border border-border hover:border-primary rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Assign Driver</label>
                    <select
                      value={editDriver}
                      onChange={e => setEditDriver(e.target.value)}
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">-- Unassigned --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as TruckType['status'])}
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => saveEdit(truck.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                    <button onClick={cancelEdit} className="p-2 border border-border text-muted-foreground rounded-lg hover:border-primary transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {truck.driverName ? (
                      <>
                        <div className="w-7 h-7 bg-accent/10 rounded-full flex items-center justify-center text-xs font-bold text-accent">
                          {truck.driverName[0]}
                        </div>
                        <span className="text-sm font-semibold text-foreground">{truck.driverName}</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground italic">Unassigned</span>
                        {editMode && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-400/10 text-yellow-400 rounded-full border border-yellow-400/20">
                            Needs Driver
                          </span>
                        )}
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
        <div className="mt-8 bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <UserX className="w-4 h-4 text-yellow-400" />
            Drivers Without Truck Assignment
          </h3>
          <div className="flex flex-wrap gap-2">
            {unassignedDrivers.map(d => (
              <span key={d.id} className="px-3 py-1.5 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-lg text-sm font-semibold">
                {d.name}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Toggle Edit Mode to assign these drivers to trucks.
          </p>
        </div>
      )}
    </div>
  )
}
