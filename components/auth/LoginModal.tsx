'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Truck, Shield, Users, ArrowLeft, Loader2 } from 'lucide-react'

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignup?: () => void
}

export function LoginModal({ open, onOpenChange, onSwitchToSignup }: LoginModalProps) {
  const [portal, setPortal] = useState<'select' | 'admin' | 'client'>('select')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { signIn } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn(email, password)

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      // Check if user role matches selected portal
      if (portal === 'admin' && result.role !== 'admin') {
        setError('Access denied. This account does not have admin privileges.')
        setLoading(false)
        return
      }

      onOpenChange(false)
      router.push(result.role === 'admin' ? '/admin' : '/client')
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError('')
    setPortal('select')
    setLoading(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Truck className="h-6 w-6 text-amber-600" />
            <span className="text-lg font-bold tracking-tight">BHADHARA TRANSPORT</span>
          </div>
          <DialogTitle>Secure Login</DialogTitle>
          <DialogDescription>
            {portal === 'select'
              ? 'Select your portal to continue'
              : `Sign in to your ${portal === 'admin' ? 'Administration' : 'Client'} account`}
          </DialogDescription>
        </DialogHeader>

        {portal === 'select' ? (
          <div className="space-y-4 py-4">
            <h3 className="text-sm font-semibold text-center text-muted-foreground">Select Your Portal</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                onClick={() => setPortal('admin')}
              >
                <Shield className="h-8 w-8 text-amber-600" />
                <span className="text-xs font-medium">Administration Portal</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                onClick={() => setPortal('client')}
              >
                <Users className="h-8 w-8 text-blue-600" />
                <span className="text-xs font-medium">Client Portal</span>
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Don&apos;t have an account?{' '}
              <button
                className="text-amber-600 hover:underline font-medium"
                onClick={() => {
                  onOpenChange(false)
                  onSwitchToSignup?.()
                }}
              >
                Sign Up
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 py-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mb-2"
              onClick={() => { setPortal('select'); setError('') }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h3 className="text-sm font-semibold">
              {portal === 'admin' ? 'Administration Login' : 'Client Login'}
            </h3>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </Button>

            {portal === 'client' && (
              <p className="text-xs text-center text-muted-foreground">
                New client?{' '}
                <button
                  type="button"
                  className="text-amber-600 hover:underline font-medium"
                  onClick={() => {
                    onOpenChange(false)
                    onSwitchToSignup?.()
                  }}
                >
                  Create an account
                </button>
              </p>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
