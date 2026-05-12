'use client'

import { useEffect, useState } from 'react'
import { 
  Users, Search, Filter, Shield, User, 
  MoreHorizontal, CheckCircle, XCircle, Trash2,
  ShieldAlert, ShieldCheck, Mail, AlertTriangle, RotateCcw,
  UserPlus, UserMinus, ShieldEllipsis, ChevronRight
} from 'lucide-react'
import { getProfiles, updateProfileRole, updateProfileStatus, suspendProfile } from '@/lib/supabase/database'
import { useAuth } from '@/components/auth/AuthProvider'
import { format, isAfter, parseISO } from 'date-fns'
import { toast } from 'sonner'

interface ProfileData {
  id: string
  username: string
  role: string
  email: string | null
  status: string
  suspended_until: string | null
  created_at: string
}

export default function UserManagementPage() {
  const { profile: currentAdmin } = useAuth()
  const [users, setUsers] = useState<ProfileData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'client' | 'employee'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [suspendingUser, setSuspendingUser] = useState<ProfileData | null>(null)
  const [weeks, setWeeks] = useState('1')

  const loadUsers = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    const data = await getProfiles()
    setUsers(data as ProfileData[])
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

    const action = newStatus === 'active' ? 'unblock' : 'suspend'
    if (!confirm(`Are you sure you want to ${action} this user?`)) return
    
    const loadingToast = toast.loading(`${action === 'unblock' ? 'Unblocking' : 'Suspending'} user...`)
    const result = await updateProfileStatus(userId, newStatus, null)
    
    if (result.success) {
      toast.success(`User ${action === 'unblock' ? 'unblocked' : 'suspended'} successfully.`, { id: loadingToast })
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
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  if (loading && users.length === 0) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading user management...</div>
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Portal Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage portal access, roles, and security.</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 bg-card border border-border p-1.5 rounded-xl shadow-sm">
          <div className="px-2 md:px-3 py-1 md:py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] md:text-sm font-bold flex items-center gap-1.5 md:gap-2">
            <ShieldCheck className="w-3 h-3 md:w-4 md:h-4" />
            {users.filter(u => u.role === 'admin').length} Admins
          </div>
          <div className="px-2 md:px-3 py-1 md:py-1.5 bg-secondary text-muted-foreground rounded-lg text-[10px] md:text-sm font-semibold">
            {users.length} Total Users
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
          />
        </div>
        <div className="grid grid-cols-2 md:flex gap-2 md:gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={roleFilter}
              onChange={(e: any) => setRoleFilter(e.target.value)}
              className="w-full md:w-40 bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="client">Clients</option>
              <option value="employee">Employees</option>
            </select>
          </div>
          <div className="relative">
            <ShieldEllipsis className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="w-full md:w-40 bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">User Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => {
                const isSuspended = user.status === 'suspended'
                const hasExpiry = user.suspended_until && isAfter(parseISO(user.suspended_until), new Date())
                const isSelf = user.id === currentAdmin?.id
                
                return (
                  <tr key={user.id} className={`hover:bg-secondary/20 transition-colors group ${isSuspended ? 'bg-destructive/[0.02]' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-10 h-10 ${isSuspended ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'} rounded-full flex items-center justify-center font-bold shadow-inner`}>
                            {user.username[0].toUpperCase()}
                          </div>
                          {isSuspended && (
                            <div className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 border-2 border-card shadow-sm">
                              <XCircle className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground">
                              {user.username}
                            </p>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] rounded-md uppercase font-black border border-primary/20">Me</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 opacity-70">
                            <Mail className="w-3 h-3" />
                            {user.email || 'No email provided'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border outline-none transition-all cursor-pointer disabled:cursor-not-allowed uppercase tracking-tight ${
                          user.role === 'admin' 
                            ? 'bg-primary/10 text-primary border-primary/30' 
                            : 'bg-secondary text-muted-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        <option value="client">Client</option>
                        <option value="admin">Admin</option>
                        <option value="employee">Employee</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        {isSuspended ? (
                          <div className="px-2.5 py-1 bg-destructive/10 text-destructive border border-destructive/20 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 animate-pulse">
                            <ShieldAlert className="w-3 h-3" />
                            Suspended
                          </div>
                        ) : (
                          <div className="px-2.5 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </div>
                        )}
                        {isSuspended && hasExpiry && (
                          <span className="text-[9px] text-destructive/70 font-bold">
                            Until {format(parseISO(user.suspended_until), 'dd/MM/yy')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {!isSelf && (
                          <>
                            {isSuspended ? (
                              <button
                                onClick={() => handleStatusChange(user.id, 'active')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:shadow-lg transition-all"
                                title="Unblock User"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Unblock
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                {user.role !== 'admin' && (
                                  <button
                                    onClick={() => handleRoleChange(user.id, 'admin')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Promote
                                  </button>
                                )}
                                <button
                                  onClick={() => handleStatusChange(user.id, 'suspended')}
                                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
                                  title="Quick Suspend"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setSuspendingUser(user)}
                                  className="p-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors border border-transparent hover:border-border"
                                  title="Timed Suspension"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Fully Optimized */}
        <div className="md:hidden divide-y divide-border">
          {filteredUsers.map((user) => {
            const isSuspended = user.status === 'suspended'
            const isSelf = user.id === currentAdmin?.id
            
            return (
              <div key={user.id} className={`p-4 space-y-4 ${isSuspended ? 'bg-destructive/[0.02]' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${isSuspended ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'} rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm`}>
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-foreground text-sm leading-none">{user.username}</p>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] rounded uppercase font-black">You</span>
                        )}
                        {isSuspended && (
                          <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive text-[8px] rounded uppercase font-black border border-destructive/20">Blocked</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]">{user.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase border tracking-tight ${
                      user.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary text-muted-foreground border-border'
                    }`}>
                      {user.role}
                    </span>
                    <p className="text-[8px] text-muted-foreground mt-1 uppercase font-bold">Joined {user.created_at ? format(new Date(user.created_at), 'MMM yy') : 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {!isSelf && (
                    <>
                      {isSuspended ? (
                        <button
                          onClick={() => handleStatusChange(user.id, 'active')}
                          className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Unblock User
                        </button>
                      ) : (
                        <>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleRoleChange(user.id, 'admin')}
                              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Promote
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusChange(user.id, 'suspended')}
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-xs font-bold ${user.role === 'admin' ? 'col-span-2' : ''}`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Suspend
                          </button>
                          <button
                            onClick={() => setSuspendingUser(user)}
                            className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 bg-secondary text-muted-foreground rounded-xl border border-border text-xs font-bold"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                            Advanced Suspension...
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="p-16 md:p-20 text-center">
            <Users className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium text-sm">No users match your criteria.</p>
          </div>
        )}
      </div>

      {/* Timed Suspension Modal */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">Timed Suspension</h3>
                <p className="text-xs text-muted-foreground">Blocking access for {suspendingUser.username}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 block">Choose Duration</label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {['1', '2', '4', '12'].map(w => (
                    <button
                      key={w}
                      onClick={() => setWeeks(w)}
                      className={`py-3 text-xs font-black rounded-xl border transition-all ${
                        weeks === w 
                          ? 'bg-primary text-primary-foreground border-primary shadow-md' 
                          : 'bg-secondary text-muted-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {w}W
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Weeks</span>
                  <input
                    type="number"
                    placeholder="Custom period..."
                    value={weeks}
                    onChange={(e) => setWeeks(e.target.value)}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSuspendingUser(null)}
                  className="flex-1 px-4 py-3 text-sm font-bold text-muted-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTimedSuspend}
                  className="flex-1 px-4 py-3 text-sm font-black text-white bg-destructive rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-destructive/20"
                >
                  Block User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        
      {/* Info Card */}
      <div className="bg-primary/[0.03] border border-primary/10 rounded-2xl p-4 md:p-6 flex items-start gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-bold text-foreground text-sm">Security & Access Management</p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Administrative actions are logged and immediate. Promoting a user to Admin grants full system visibility. 
            Suspended users are blocked from all portal routes via server-side middleware and can only be restored by another administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
