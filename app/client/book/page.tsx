'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Truck, MapPin, FileText, CheckCircle } from 'lucide-react'
import { store, LoadType, LOAD_RATES, LOAD_LABELS } from '@/lib/store'
import { format } from 'date-fns'

export default function BookPage() {
  const router = useRouter()
  const user = store.getCurrentUser()

  const [loadType, setLoadType] = useState<LoadType>('riversand')
  const [numberOfLoads, setNumberOfLoads] = useState(1)
  const [preferredDate, setPreferredDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const rate = LOAD_RATES[loadType]
  const estimatedTotal = rate * numberOfLoads

  const handleSubmit = () => {
    if (!deliveryAddress.trim()) { alert('Please enter a delivery address.'); return }
    setLoading(true)
    setTimeout(() => {
      store.saveBooking({
        clientUsername: user?.username ?? '',
        clientName: user?.username ?? '',
        loadType,
        loadTypeLabel: LOAD_LABELS[loadType],
        numberOfLoads,
        preferredDate,
        deliveryAddress,
        status: 'pending',
        notes: notes || undefined,
      })
      setLoading(false)
      setSubmitted(true)
    }, 500)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center gap-4">
        <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Booking Received!</h2>
        <p className="text-muted-foreground max-w-sm">
          Your booking request has been submitted. Our team will confirm your load shortly and provide an expected delivery time.
        </p>
        <p className="text-sm text-muted-foreground">
          WhatsApp us at <span className="text-primary font-semibold">0773 083 687</span> for immediate confirmation.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/client')}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => { setSubmitted(false); setDeliveryAddress(''); setNotes('') }}
            className="px-6 py-2.5 border border-border text-foreground rounded-lg font-semibold text-sm hover:border-primary transition-colors"
          >
            Book Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Book a Load</h1>
        <p className="text-sm text-muted-foreground mt-1">Pre-book or schedule your material delivery</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        {/* Load type */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Material Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LOAD_LABELS) as LoadType[]).map(type => (
              <button
                key={type}
                onClick={() => setLoadType(type)}
                className={`p-3 border rounded-xl text-sm text-left transition-colors ${
                  loadType === type
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <p className="font-semibold">{LOAD_LABELS[type]}</p>
                {LOAD_RATES[type] > 0 && <p className="text-primary text-xs mt-0.5">${LOAD_RATES[type]}/load</p>}
                {type === 'other' && <p className="text-muted-foreground text-xs mt-0.5">Custom rate</p>}
              </button>
            ))}
          </div>
        </div>

        {/* Number of loads */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Number of Loads</label>
          <input
            type="number"
            min={1}
            value={numberOfLoads}
            onChange={e => setNumberOfLoads(Number(e.target.value))}
            className="w-full bg-input border border-border rounded-lg px-3 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
          {LOAD_RATES[loadType] > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Estimated total: <span className="text-primary font-bold">${estimatedTotal}</span>
            </p>
          )}
        </div>

        {/* Preferred date */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Preferred Date
          </label>
          <input
            type="date"
            value={preferredDate}
            min={format(new Date(), 'yyyy-MM-dd')}
            onChange={e => setPreferredDate(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        {/* Delivery address */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Delivery Address / Site *
          </label>
          <input
            type="text"
            placeholder="Enter delivery location or site name"
            value={deliveryAddress}
            onChange={e => setDeliveryAddress(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Additional Notes (optional)
          </label>
          <textarea
            rows={3}
            placeholder="Special instructions, access details, etc."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
          />
        </div>

        {/* Payment info */}
        <div className="p-4 bg-secondary/30 rounded-xl">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Payment:</span> Loads are paid in USD cash or EcoCash.
            WhatsApp us at <span className="text-primary">0773 083 687</span> to arrange a meetup location for payment
            confirmation. Loads are dispatched after payment arrangement is confirmed.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'Submitting...' : 'Submit Booking Request'}
        </button>
      </div>
    </div>
  )
}
