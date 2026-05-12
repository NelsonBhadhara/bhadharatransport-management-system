'use client'

import { useEffect, useState } from 'react'
import { 
  Users, Search, Filter, Shield, User, 
  MoreHorizontal, CheckCircle, XCircle, Trash2,
  ShieldAlert, ShieldCheck, Mail, AlertTriangle, RotateCcw
} from 'lucide-react'
import { getProfiles, updateProfileRole, updateProfileStatus, suspendProfile } from '@/lib/supabase/database'
import { useAuth } from '@/components/auth/AuthProvider'
import { format, isAfter, parseISO } from 'date-fns'
import { toast } from 'sonner'

export default function UserManagementPage() {
  const { profile: currentAdmin } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'admin' | 'client' | 'employee'>('all')
  const [suspendingUser, setSuspendingUser] = useState<any | null>(null)
  const [weeks, setWeeks] = useState('1')

  const loadUsers = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    const data = await getProfiles()
    setUsers(data)
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentAdmin?.id) {
      toast.error("You cannot change your own role.")
      return
    }

    const user = users.find(u => u.id === userId)
    if (!user) return

    const isPromotion = newRole === 'admin'
    const confirmMsg = isPromotion 
      ? `Are you sure you want to promote ${user.username} to Admin?` 
      : `Are you sure you want to change ${user.username}'s role to ${newRole}?`

    if (!confirm(confirmMsg)) return
    
    const loadingToast = toast.loading(isPromotion ? 'Promoting user...' : 'Updating role...')
    const result = await updateProfileRole(userId, newRole)
    
    if (result.success) {
      toast.success(isPromotion ? 'User promoted to Admin successfully!' : 'User role updated successfully.', { id: loadingToast })
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } else {
      toast.error('Failed to update user role.', { id: loadingToast })
    }
  }

  const handleStatusChange = async (userId: string, newStatus: string) => {
    if (userId === currentAdmin?.id) {
      toast.error("You cannot change your own status.")
      return
    }

    const action = newStatus === 'active' ? 'reactivate' : 'suspend'
    if (!confirm(`Are you sure you want to ${action} this user?`)) return
    
    const loadingToast = toast.loading(`${action === 'reactivate' ? 'Reactivating' : 'Suspending'} user...`)
    const result = await updateProfileStatus(userId, newStatus, null)
    
    if (result.success) {
      toast.success(`User ${action === 'reactivate' ? 'reactivated' : 'suspended'} successfully.`, { id: loadingToast })
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus, suspended_until: null } : u))
    } else {
      toast.error(`Failed to ${action} user.`, { id: loadingToast })
    }
  }

  const handleTimedSuspend = async () => {
    if (!suspendingUser) return
    const w = parseInt(weeks)
    if (isNaN(w) || w <= 0) {
      toast.error('Please enter a valid number of weeks.')
      return
    }
    
    const loadingToast = toast.loading('Setting suspension period...')
    const result = await suspendProfile(suspendingUser.id, w)
    
    if (result.success) {
      const until = new Date()
      until.setDate(until.getDate() + (w * 7))
      
      toast.success(`User suspended for ${w} week(s).`, { id: loadingToast })
      setUsers(users.map(u => u.id === suspendingUser.id ? { 
        ...u, 
        status: 'suspended', 
        suspended_until: until.toISOString() 
      } : u))
      setSuspendingUser(null)
    } else {
      toast.error('Failed to suspend user.', { id: loadingToast })
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) || 
                          (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
    const matchesFilter = filter === 'all' || u.role === filter
    return matchesSearch && matchesFilter
  })

  if (loading && users.length === 0) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading user management...</div>
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Portal Users</h1>
          <p className="text-muted-foreground mt-1">Manage portal access, roles, and security.</p>
        </div>
        <div className="flex items-center gap-3 bg-card border border-border p-1.5 rounded-xl shadow-sm">
          <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            {users.filter(u => u.role === 'admin').length} Admins
          </div>
          <div className="px-3 py-1.5 bg-secondary text-muted-foreground rounded-lg text-sm font-semibold">
            {users.length} Total Users
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e: any) => setFilter(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="client">Clients</option>
            <option value="employee">Employees</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => {
                const isSuspended = user.status === 'suspended'
                const hasExpiry = user.suspended_until && isAfter(parseISO(user.suspended_until), new Date())
                
                return (
                  <tr key={user.id} className={`hover:bg-secondary/20 transition-colors group ${isSuspended ? 'bg-destructive/5' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-10 h-10 ${isSuspended ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'} rounded-full flex items-center justify-center font-bold`}>
                            {user.username[0].toUpperCase()}
                          </div>
                          {isSuspended && (
                            <div className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 border-2 border-card">
                              <XCircle className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground">
                              {user.username}
                            </p>
                            {user.id === currentAdmin?.id && (
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded uppercase font-black tracking-tighter">You</span>
                            )}
                            {isSuspended && (
                              <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive text-[10px] rounded uppercase font-black border border-destructive/20 animate-pulse">Suspended</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3 opacity-60" />
                            {user.email || 'No email provided'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        disabled={user.id === currentAdmin?.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border outline-none transition-all cursor-pointer disabled:cursor-not-allowed ${
                          user.role === 'admin' 
                            ? 'bg-primary/10 text-primary border-primary/20' 
                            : 'bg-secondary text-muted-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        <option value="client">Client</option>
                        <option value="admin">Admin</option>
                        <option value="employee">Employee</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {isSuspended ? (
                          <button
                            onClick={() => handleStatusChange(user.id, 'active')}
                            disabled={user.id === currentAdmin?.id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Unsuspend User
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(user.id, 'suspended')}
                            disabled={user.id === currentAdmin?.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-green-400/20 text-green-400 bg-green-400/10 hover:bg-green-400/20 transition-all disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Active
                          </button>
                        )}
                        {isSuspended && hasExpiry && (
                          <p className="text-[10px] text-destructive font-semibold ml-1 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Until {format(parseISO(user.suspended_until), 'dd/MM/yyyy')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleRoleChange(user.id, 'admin')}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20 shadow-sm bg-card"
                            title="Promote to Admin"
                          >
                            <ShieldCheck className="w-5 h-5" />
                          </button>
                        )}
                        {user.id !== currentAdmin?.id && !isSuspended && (
                          <button
                            onClick={() => setSuspendingUser(user)}
                            className="p-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors border border-transparent hover:border-border shadow-sm bg-card"
                            title="Timed Suspension"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-border">
          {filteredUsers.map((user) => {
            const isSuspended = user.status === 'suspended'
            const hasExpiry = user.suspended_until && isAfter(parseISO(user.suspended_until), new Date())
            
            return (
              <div key={user.id} className={`p-5 space-y-4 hover:bg-secondary/10 transition-colors ${isSuspended ? 'bg-destructive/5' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-10 h-10 ${isSuspended ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'} rounded-full flex items-center justify-center font-bold`}>
                        {user.username[0].toUpperCase()}
                      </div>
                      {isSuspended && (
                        <div className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5">
                          <XCircle className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground">
                          {user.username}
                        </p>
                        {user.id === currentAdmin?.id && (
                          <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded uppercase font-black">You</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{user.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase border ${
                      user.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary text-muted-foreground border-border'
                    }`}>
                      {user.role}
                    </span>
                    <p className="text-[10px] text-muted-foreground">Joined {user.created_at ? format(new Date(user.created_at), 'dd/MM/yy') : 'N/A'}</p>
                  </div>
                </div>

                {isSuspended && (
                  <div className="px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-tight">Account Suspended</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                  <div className="flex gap-2">
                    {isSuspended ? (
                      <button
                        onClick={() => handleStatusChange(user.id, 'active')}
                        disabled={user.id === currentAdmin?.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Unsuspend
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStatusChange(user.id, 'suspended')}
                          disabled={user.id === currentAdmin?.id}
                          className="px-3 py-2 bg-green-400/10 text-green-400 border border-green-400/20 rounded-lg text-xs font-bold"
                        >
                          Active
                        </button>
                        {user.id !== currentAdmin?.id && (
                          <button
                            onClick={() => setSuspendingUser(user)}
                            className="px-3 py-2 bg-secondary text-muted-foreground rounded-lg border border-border text-xs font-bold"
                          >
                            Timed...
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => handleRoleChange(user.id, 'admin')}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold"
                    >
                      Set Admin
                    </button>
                  )}
                </div>
                {isSuspended && hasExpiry && (
                  <p className="text-[10px] text-destructive font-semibold">
                    Expires {format(parseISO(user.suspended_until), 'dd MMM yyyy')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="p-20 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No users found matching your search.</p>
          </div>
        )}
      </div>

      {/* Timed Suspension Modal */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Timed Suspension</h3>
                <p className="text-xs text-muted-foreground">Set suspension period for {suspendingUser.username}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Duration (Weeks)</label>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '2', '4', '12'].map(w => (
                    <button
                      key={w}
                      onClick={() => setWeeks(w)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        weeks === w 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-secondary text-muted-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {w}w
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Custom weeks..."
                  value={weeks}
                  onChange={(e) => setWeeks(e.target.value)}
                  className="mt-2 w-full bg-input border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setSuspendingUser(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-muted-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTimedSuspend}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-destructive rounded-xl hover:opacity-90 transition-opacity"
                >
                  Suspend User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        
      {/* Info Card */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-foreground text-sm">Security Policy</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Admin accounts have full access to financial records, employee data, and fleet management. 
            Only existing admins can promote users to the admin role. 
            Suspended accounts are immediately blocked from accessing the portal.
          </p>
        </div>
      </div>
    </div>
  )
}
