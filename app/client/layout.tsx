'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import {
  Truck, Home, CalendarPlus, History, MessageSquare,
  LogOut, Menu, X, Loader2,
} from 'lucide-react'

const navItems = [
  { href: '/client', label: 'Dashboard', icon: Home },
  { href: '/client/book', label: 'Book a Load', icon: CalendarPlus },
  { href: '/client/history', label: 'My Bookings', icon: History },
  { href: '/client/messages', label: 'Messages', icon: MessageSquare },
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { profile, isLoading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !profile) {
      router.replace('/')
    }
  }, [isLoading, profile, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  if (!profile) return null

  const handleLogout = async () => {
    await signOut()
    router.replace('/')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r bg-card">
        <div className="p-4 border-b">
          <Link href="/client" className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-amber-600" />
            <span className="font-bold text-lg">Bhadhara</span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Welcome, {profile.username}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t">
          <Button variant="ghost" className="w-full justify-start text-red-600" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <Link href="/client" className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-amber-600" />
            <span className="font-bold">Bhadhara</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        {/* Mobile Nav Overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
            <div className="w-64 h-full bg-card border-r p-4 space-y-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-6 w-6 text-amber-600" />
                <span className="font-bold">Bhadhara</span>
              </div>
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
              <Button variant="ghost" className="w-full justify-start text-red-600 mt-4" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
