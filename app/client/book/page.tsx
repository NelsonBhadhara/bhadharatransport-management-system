'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, FileText, CheckCircle, ChevronRight, Info, MessageSquare } from 'lucide-react'
import { store, LoadType, LOAD_RATES, LOAD_LABELS } from '@/lib/store'
import { format } from 'date-fns'

const ADMIN_WHATSAPP_NUMBERS = [
  { label: '0773 083 687', wa: '263773083687' },
  { label: '0774 049 526', wa: '263774049526' },
  { label: '0770 083 687', wa: '263770083687' },
]

function buildWhatsAppMessage(params: {
  clientName: string
  loadTypeLabel: string
  numberOfLoads: number
  ratePerLoad: number
  estimatedTotal: number
  preferredDate: string
  deliveryAddress: string
  notes?: string
}) {
  const { clientName, loadTypeLabel, numberOfLoads, ratePerLoad, estimatedTotal, preferredDate, deliveryAddress, notes } = params
  const lines = [
    `*BHADHARA TRANSPORT – Load Inquiry*`,
    ``,
    `Hello, I would like to place a cash load order. Here are my details:`,
    ``,
    `*Client:* ${clientName}`,
    `*Material:* ${loadTypeLabel}`,
    `*No. of Loads:* ${numberOfLoads}`,
    `*Rate per Load:* $${ratePerLoad} USD`,
    `*Estimated Total:* $${estimatedTotal} USD (cash)`,
    `*Preferred Date:* ${preferredDate}`,
    `*Delivery Site:* ${deliveryAddress}`,
  ]
  if (notes) lines.push(`*Notes:* ${notes}`)
  lines.push(``)
  lines.push(`Please advise on the meetup place and time for payment finalisation.`)
  lines.push(``)
  lines.push(`Thank you.`)
  return lines.join('\n')
}

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
  const [bookingId, setBookingId] = useState<string | null>(null)

  const rate = LOAD_RATES[loadType]
  const isOther = loadType === 'other'
  const estimatedTotal = isOther ? 0 : rate * numberOfLoads

  const waMessage = buildWhatsAppMessage({
    clientName: user?.username ?? 'Client',
    loadTypeLabel: LOAD_LABELS[loadType],
    numberOfLoads,
    ratePerLoad: rate,
    estimatedTotal,
    preferredDate,
    deliveryAddress,
    notes: notes || undefined,
  })
  const waEncoded = encodeURIComponent(waMessage)

  const handleSubmit = () => {
    if (!deliveryAddress.trim()) { alert('Please enter a delivery address.'); return }
    setLoading(true)
    setTimeout(() => {
      const b = store.saveBooking({
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
      setBookingId(b.id)
      setLoading(false)
      setSubmitted(true)
    }, 500)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        {/* Success header */}
        <div className="flex flex-col items-center text-center gap-3 py-8">
          <div className="w-16 h-16 bg-green-400/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Booking Submitted!</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Your booking request is saved. Since all payments are handled in cash, please WhatsApp us now using the
            button below — your full order details and pricing are pre-filled in the message.
          </p>
        </div>

        {/* Order summary card */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Order Summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Material</span>
              <span className="text-foreground font-semibold">{LOAD_LABELS[loadType]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loads</span>
              <span className="text-foreground font-semibold">{numberOfLoads}</span>
            </div>
            {!isOther && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate per load</span>
                  <span className="text-foreground font-semibold">${rate} USD</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 mt-2">
                  <span className="text-muted-foreground font-semibold">Total (cash)</span>
                  <span className="text-primary font-bold text-base">${estimatedTotal} USD</span>
                </div>
              </>
            )}
            {isOther && (
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="text-muted-foreground font-semibold">Total</span>
                <span className="text-primary font-bold text-base">Custom — discuss via WhatsApp</span>
              </div>
            )}
            <div className="flex justify-between pt-1">
              <span className="text-muted-foreground">Preferred date</span>
              <span className="text-foreground font-semibold">{preferredDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery site</span>
              <span className="text-foreground font-semibold text-right max-w-[55%]">{deliveryAddress}</span>
            </div>
          </div>
        </div>

        {/* Payment notice */}
        <div className="flex gap-3 p-4 bg-orange-400/5 border border-orange-400/20 rounded-xl mb-5">
          <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Cash payment only.</span> No online payments are processed.
            WhatsApp our team and they will reply with a meetup place and time to finalise your order in person.
          </p>
        </div>

        {/* WhatsApp buttons */}
        <div className="space-y-3 mb-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact us to finalise</p>
          {ADMIN_WHATSAPP_NUMBERS.map(c => (
            <a
              key={c.wa}
              href={`https://wa.me/${c.wa}?text=${waEncoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-5 py-4 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5" />
                <span>WhatsApp {c.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </a>
          ))}
        </div>

        {/* Pre-written message preview */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Pre-filled message preview</p>
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">{waMessage}</pre>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/client')}
            className="flex-1 py-2.5 border border-border text-foreground rounded-xl font-semibold text-sm hover:border-primary transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => { setSubmitted(false); setDeliveryAddress(''); setNotes(''); setBookingId(null) }}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          >
            New Booking
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Book a Load</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in your order details. After submitting, you&apos;ll be guided to WhatsApp us to arrange cash payment and a meetup.
        </p>
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
                {LOAD_RATES[type] > 0 && (
                  <p className="text-primary text-xs mt-0.5">${LOAD_RATES[type]} / load</p>
                )}
                {type === 'other' && (
                  <p className="text-muted-foreground text-xs mt-0.5">Rate discussed on WhatsApp</p>
                )}
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
            onChange={e => setNumberOfLoads(Math.max(1, Number(e.target.value)))}
            className="w-full bg-input border border-border rounded-lg px-3 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
          {!isOther && (
            <p className="text-xs text-muted-foreground mt-1.5">
              Rate: <span className="text-foreground font-semibold">${rate}/load</span>
              {' — '}
              Estimated cash total:{' '}
              <span className="text-primary font-bold text-sm">${estimatedTotal} USD</span>
            </p>
          )}
        </div>

        {/* Preferred date */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Preferred Delivery Date</label>
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
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Delivery Address / Site <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 45 Samora Machel Ave, Harare"
            value={deliveryAddress}
            onChange={e => setDeliveryAddress(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Additional Notes <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Special instructions, gate codes, access details..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
          />
        </div>

        {/* Payment notice */}
        <div className="flex gap-3 p-4 bg-orange-400/5 border border-orange-400/20 rounded-xl">
          <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">All transactions are cash only.</span> After submitting,
            you will be redirected to WhatsApp with your full order details and pricing pre-filled. Our team will
            reply with a meetup place and time to finalise payment in person.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <>
              Submit &amp; Get WhatsApp Link
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
