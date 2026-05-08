'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  ClipboardList, 
  DollarSign, 
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  X
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
  { icon: ClipboardList, label: 'Transactions', href: '/admin/transactions' },
  { icon: Truck, label: 'Garage', href: '/admin/garage' },
  { icon: Users, label: 'Employees', href: '/admin/employees' },
  { icon: ShieldAlert, label: 'Users', href: '/admin/users' },
  { icon: MessageSquare, label: 'Messages', href: '/admin/messages' },
  { icon: DollarSign, label: 'Reports', href: '/admin/reports' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
]

interface AdminSidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export default function AdminSidebar({ mobileOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300
    md:relative md:translate-x-0
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
    ${collapsed ? 'md:w-20' : 'md:w-64'}
    w-64
  `

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className={`flex items-center gap-2 transition-opacity duration-300 ${collapsed ? 'md:opacity-0' : 'opacity-100'}`}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-black text-foreground tracking-tighter whitespace-nowrap">BHADHARA</span>
          </div>
          
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <button 
            onClick={onClose}
            className="md:hidden p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-foreground' : 'group-hover:scale-110 transition-transform'}`} />
                <span className={`transition-all duration-300 ${collapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button 
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors font-semibold"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={`transition-all duration-300 ${collapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
