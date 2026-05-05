'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  Truck, ClipboardList, Users, Wrench, BarChart3, LogOut, Home, Bell, ChevronRight
} from 'lucide-react'
import { store } from '@/lib/store'
import { useState } from 'react'

const NAV = [
  { label: 'Overview', href: '/admin', icon: Home },
  { label: 'Transactions', href: '/admin/transactions', icon: ClipboardList },
  { label: 'Garage Manager', href: '/admin/garage', icon: Truck },
  { label: 'Employees', href: '/admin/employees', icon: Users },
  { label: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
  { label: 'Messages', href: '/admin/messages', icon: Bell },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const user = store.getCurrentUser()

  const handleLogout = () => {
    store.logout()
    router.push('/')
  }

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-60'} flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 min-h-screen`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 flex-shrink-0 bg-primary rounded-lg flex items-center justify-center">
          <Truck className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-sidebar-foreground whitespace-nowrap">BHADHARA</p>
            <p className="text-xs text-primary whitespace-nowrap">Admin Portal</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`ml-auto text-muted-foreground hover:text-foreground transition-colors ${collapsed ? 'rotate-180' : ''}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                active
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* User / Logout */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-primary truncate">{user?.username}</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
