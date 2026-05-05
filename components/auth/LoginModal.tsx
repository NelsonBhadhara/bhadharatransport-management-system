'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Truck, Lock, User, ShieldCheck, Users } from 'lucide-react'
import { store } from '@/lib/store'

type Portal = 'select' | 'admin' | 'client'

export default function LoginModal({ onClose, onSignup }: { onClose: () => void; onSignup: () => void }) {
  const router = useRouter()
  const [portal, setPortal] = useState<Portal>('select')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    setError('')
    setTimeout(() => {
      const user = store.login(username, password)
      if (!user) {
        setError('Invalid username or password. Please try again.')
        setLoading(false)
        return
      }
      if (portal === 'admin' && user.role !== 'admin') {
        setError('Access denied. This portal is for administrators only.')
        store.logout()
        setLoading(false)
        return
      }
      setLoading(false)
      if (user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/client')
      }
    }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">BHADHARA TRANSPORT</p>
              <p className="text-xs text-muted-foreground">Secure Login</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {portal === 'select' ? (
            /* Portal Selection */
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground text-center mb-6">Select Your Portal</h2>
              <button
                onClick={() => setPortal('admin')}
                className="w-full flex items-center gap-4 p-5 border border-border rounded-xl hover:border-primary/60 hover:bg-primary/5 transition-all group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground">Administration Portal</p>
                  <p className="text-sm text-muted-foreground">Full system access — transactions, fleet, employees</p>
                </div>
              </button>
              <button
                onClick={() => setPortal('client')}
                className="w-full flex items-center gap-4 p-5 border border-border rounded-xl hover:border-accent/60 hover:bg-accent/5 transition-all group"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground">Client Portal</p>
                  <p className="text-sm text-muted-foreground">Book loads, view history, inquire & request quotes</p>
                </div>
              </button>
              <div className="pt-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <button onClick={onSignup} className="text-primary hover:underline font-semibold">
                    Sign Up
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* Login Form */
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => { setPortal('select'); setError('') }}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ← Back
                </button>
                <h2 className="text-lg font-bold text-foreground">
                  {portal === 'admin' ? 'Administration Login' : 'Client Login'}
                </h2>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading || !username || !password}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Login'}
              </button>

              {portal === 'client' && (
                <p className="text-center text-sm text-muted-foreground">
                  New client?{' '}
                  <button onClick={onSignup} className="text-primary hover:underline font-semibold">
                    Create an account
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
