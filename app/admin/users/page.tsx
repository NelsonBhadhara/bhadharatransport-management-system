'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Mail,
  MoreHorizontal,
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
  const [filterRole, setFilterRole] = useState('all')
  
  // Timed suspension state
  const [suspendingUser, setSuspendingUser] = useState<any | null>(null)
  const [weeks, setWeeks] = useState('1')

  useEffect(() => {
    async function loadUsers() {
      const p = await getProfiles()
      setUsers(p)
      setLoading(false)
    }
    loadUsers()
  }, [])

  const handleRoleChange = async (userId: string, newRole: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    const isPromotion = newRole === 'admin'
    const confirmMessage = isPromotion 
      ? `Are you sure you want to promote ${user.username} to Admin?` 
      : `Are you sure you want to change ${user.username}'s role to ${newRole}?`

    if (!confirm(confirmMessage)) return
    
    const loadingToast = toast.loading(isPromotion ? 'Promoting user...' : 'Updating role...')
    
    const result = await updateProfileRole(userId, newRole)
    
    if (result.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      toast.success(isPromotion ? 'User promoted to Admin successfully!' : 'User role updated successfully.', { id: loadingToast })
    } else {
      toast.error('Failed to update user role. Please try again.', { id: loadingToast })
    }
  }

  const handleStatusChange = async (userId: string, newStatus: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    const action = newStatus === 'active' ? 'reactivate' : 'suspend'
    if (!confirm(`Are you sure you want to ${action} this user?`)) return
    
    const loadingToast = toast.loading(`${action === 'reactivate' ? 'Reactivating' : 'Suspending'} user...`)
    const result = await updateProfileStatus(userId, newStatus, null)
    
    if (result.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus, suspended_until: null } : u))
      toast.success(`User ${action === 'reactivate' ? 'reactivated' : 'suspended'} successfully.`, { id: loadingToast })
    } else {
      toast.error(`Failed to ${action} user.`, { id: loadingToast })
    }
  }

  const handleTimedSuspend = async () => {
    if (!suspendingUser) return
    const numWeeks = parseInt(weeks)
    if (isNaN(numWeeks) || numWeeks <= 0) {
      toast.error('Please enter a valid number of weeks.')
      return
    }
    
    const loadingToast = toast.loading('Setting suspension period...')
    const result = await suspendProfile(suspendingUser.id, numWeeks)
    
    if (result.success) {
      const until = new Date()
      until.setDate(until.getDate() + (numWeeks * 7))
      
      setUsers(users.map(u => u.id === suspendingUser.id ? { 
        ...u, 
        status: 'suspended', 
        suspended_until: until.toISOString() 
      } : u))
      setSuspendingUser(null)
      toast.success(`User suspended for ${numWeeks} week(s).`, { id: loadingToast })
    } else {
      toast.error('Failed to suspend user.', { id: loadingToast })
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) || 
                         (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
    const matchesRole = filterRole === 'all' || u.role === filterRole
    return matchesSearch && matchesRole
  })

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading users...</div>

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage platform access, roles, and security status.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-64"
            />
          </div>
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-secondary/50 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="client">Clients</option>
            <option value="employee">Employees</option>
          </select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => {
                const isSuspended = user.status === 'suspended'
                const hasExpiry = user.suspended_until && isAfter(parseISO(user.suspended_until), new Date())
                
                return (
                  <tr key={user.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                          {user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground flex items-center gap-1.5">
                            {user.username}
                            {user.id === currentAdmin?.id && (
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded uppercase font-black">You</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
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
                      <div>
                        <button
                          onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'suspended' : 'active')}
                          disabled={user.id === currentAdmin?.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            user.status === 'active'
                              ? 'text-green-400 bg-green-400/10 border-green-400/20 hover:bg-green-400/20'
                              : 'text-destructive bg-destructive/10 border-destructive/20 hover:bg-destructive/20'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {user.status === 'active' ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              Suspended
                            </>
                          )}
                        </button>
                        {isSuspended && hasExpiry && (
                          <p className="text-[10px] text-muted-foreground mt-1 ml-1">
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
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Promote to Admin"
                          >
                            <ShieldCheck className="w-5 h-5" />
                          </button>
                        )}
                        {user.id !== currentAdmin?.id && (
                          <button
                            onClick={() => setSuspendingUser(user)}
                            className="p-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
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
