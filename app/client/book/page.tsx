'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import * as db from '@/lib/supabase/database'
import { LOAD_LABELS, type LoadType } from '@/lib/store'

export default function BookPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState({
    loadType: 'riversand' as LoadType,
    numberOfLoads: 1,
    preferredDate: '',
    deliveryAddress: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    setSaving(true)
    const booking = await db.createBooking({
      clientUsername: profile.username,
      clientName: profile.username,
      loadType: form.loadType,
      loadTypeLabel: LOAD_LABELS[form.loadType],
      numberOfLoads: form.numberOfLoads,
      preferredDate: form.preferredDate,
      deliveryAddress: form.deliveryAddress,
      status: 'pending',
      notes: form.notes || undefined,
    }, user.id)

    setSaving(false)

    if (booking) {
      setSuccess(true)
      toast({ title: 'Booking created!', description: 'We will confirm your booking soon.' })
    } else {
      toast({ title: 'Error', description: 'Failed to create booking. Please try again.', variant: 'destructive' })
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold">Booking Submitted!</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Your booking for {LOAD_LABELS[form.loadType]} × {form.numberOfLoads} has been submitted.
          We&apos;ll confirm it shortly.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/client/history')}>View Bookings</Button>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => { setSuccess(false); setForm({ loadType: 'riversand', numberOfLoads: 1, preferredDate: '', deliveryAddress: '', notes: '' }) }}>Book Another</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Book a Load</h1>
      <p className="text-muted-foreground text-sm">Pre-book your delivery. We&apos;ll confirm availability and arrange payment meetup via WhatsApp.</p>

      <Card>
        <CardHeader><CardTitle>Booking Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Load Type</Label>
              <Select value={form.loadType} onValueChange={v => setForm({ ...form, loadType: v as LoadType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LOAD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Number of Loads</Label>
              <Input type="number" min={1} max={50} value={form.numberOfLoads} onChange={e => setForm({ ...form, numberOfLoads: Number(e.target.value) })} required />
            </div>

            <div>
              <Label>Preferred Date</Label>
              <Input type="date" value={form.preferredDate} onChange={e => setForm({ ...form, preferredDate: e.target.value })} required min={new Date().toISOString().split('T')[0]} />
            </div>

            <div>
              <Label>Delivery Address</Label>
              <Input value={form.deliveryAddress} onChange={e => setForm({ ...form, deliveryAddress: e.target.value })} placeholder="e.g. Plot 12, Masvingo Road" required />
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any special requirements..." rows={3} />
            </div>

            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Booking'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
