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
      <div className="max-w-lg mx-auto p-4 sm:p-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Success header */}
        <div className="flex flex-col items-center text-center gap-4 py-6">
          <div className="w-20 h-20 bg-green-400/10 rounded-3xl flex items-center justify-center shadow-xl shadow-green-400/5">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <div className="space-y-1">
             <h2 className="text-3xl font-black text-foreground tracking-tight">Booking Saved!</h2>
             <p className="text-sm text-muted-foreground max-w-sm text-pretty font-medium">
               Your booking request is recorded. Since all payments are handled in cash, please WhatsApp us now to finalise your order.
             </p>
          </div>
        </div>

        {/* Order summary card */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <FileText className="w-20 h-20" />
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Official Order Summary</p>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Material Type</span>
              <span className="text-foreground font-black">{LOAD_LABELS[loadType]}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Total Loads</span>
              <span className="text-foreground font-black">{numberOfLoads}</span>
            </div>
            {!isOther && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Rate per load</span>
                  <span className="text-foreground font-black">${rate} <span className="text-[10px] opacity-50 uppercase">USD</span></span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="text-muted-foreground font-black uppercase tracking-tighter">Total Due (Cash)</span>
                  <span className="text-2xl font-black text-primary tracking-tighter">${estimatedTotal} <span className="text-xs">USD</span></span>
                </div>
              </>
            )}
            {isOther && (
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <span className="text-muted-foreground font-black uppercase tracking-tighter">Estimated Total</span>
                <span className="text-primary font-black text-sm">Custom Pricing</span>
              </div>
            )}
            <div className="pt-2 space-y-2">
               <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <Calendar className="w-3 h-3" /> Preferred Date: <span className="text-foreground">{preferredDate}</span>
               </div>
               <div className="flex items-start gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <MapPin className="w-3 h-3 mt-0.5" /> Delivery: <span className="text-foreground text-right flex-1">{deliveryAddress}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Payment notice */}
        <div className="flex gap-4 p-5 bg-orange-400/5 border border-orange-400/20 rounded-2xl">
          <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
            <span className="font-black text-foreground uppercase tracking-tighter mr-1">Important: Cash Only.</span>
            We do not process online payments. WhatsApp our team and they will reply with a meetup location and time.
          </p>
        </div>

        {/* WhatsApp buttons */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Contact an agent now</p>
          {ADMIN_WHATSAPP_NUMBERS.map(c => (
            <a
              key={c.wa}
              href={`https://wa.me/${c.wa}?text=${waEncoded}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-6 py-4 bg-green-500 text-white rounded-2xl font-black text-sm hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 group"
            >
              <div className="flex items-center gap-4">
                <MessageSquare className="w-6 h-6" />
                <span>WhatsApp {c.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
            </a>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={() => router.push('/client')}
            className="flex-1 py-4 border border-border text-foreground rounded-2xl font-black text-sm hover:border-primary transition-all bg-card shadow-sm"
          >
            Dashboard
          </button>
          <button
            onClick={() => { setSubmitted(false); setDeliveryAddress(''); setNotes(''); setBookingId(null) }}
            className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            New Booking
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-0">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground tracking-tight">Book a Load</h1>
        <p className="text-sm text-muted-foreground mt-2 text-pretty font-medium leading-relaxed">
          Fill in your order details. After submitting, you&apos;ll be guided to WhatsApp us to arrange cash payment and a meetup.
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl shadow-primary/5">
        {/* Load type */}
        <div className="space-y-3">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Select Material</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(LOAD_LABELS) as LoadType[]).map(type => (
              <button
                key={type}
                onClick={() => setLoadType(type)}
                className={`p-4 border-2 rounded-2xl text-left transition-all relative overflow-hidden group ${
                  loadType === type
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                    : 'border-border bg-secondary/20 hover:border-primary/30'
                }`}
              >
                <div className="relative z-10">
                   <p className="font-black text-foreground tracking-tight">{LOAD_LABELS[type]}</p>
                   {LOAD_RATES[type] > 0 && (
                     <p className="text-primary text-xs font-black mt-1">${LOAD_RATES[type]} / load</p>
                   )}
                   {type === 'other' && (
                     <p className="text-muted-foreground text-[10px] font-bold mt-1 uppercase">Discuss pricing on WhatsApp</p>
                   )}
                </div>
                {loadType === type && (
                  <div className="absolute -right-2 -bottom-2 opacity-10">
                     <CheckCircle className="w-12 h-12 text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           {/* Number of loads */}
          <div className="space-y-2">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Quantity (Loads)</label>
            <input
              type="number"
              min={1}
              value={numberOfLoads}
              onChange={e => setNumberOfLoads(Math.max(1, Number(e.target.value)))}
              className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-foreground font-black focus:ring-2 focus:ring-primary/50 outline-none text-sm"
            />
            {!isOther && (
              <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-wide">
                Est. Total: <span className="text-primary font-black ml-1">${estimatedTotal} USD (Cash)</span>
              </p>
            )}
          </div>

          {/* Preferred date */}
          <div className="space-y-2">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Preferred Date</label>
            <input
              type="date"
              value={preferredDate}
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={e => setPreferredDate(e.target.value)}
              className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-foreground font-black focus:ring-2 focus:ring-primary/50 outline-none text-sm"
            />
          </div>
        </div>

        {/* Delivery address */}
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
            Delivery Address / Site <span className="text-destructive">*</span>
          </label>
          <div className="relative">
             <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input
               type="text"
               placeholder="e.g. 45 Samora Machel Ave, Harare"
               value={deliveryAddress}
               onChange={e => setDeliveryAddress(e.target.value)}
               className="w-full bg-secondary/30 border border-border rounded-xl pl-12 pr-4 py-3 text-foreground font-medium placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50 outline-none text-sm"
             />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">
            Additional Notes <span className="text-muted-foreground font-bold lowercase tracking-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Special instructions, gate codes, access details..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/50 outline-none text-sm resize-none font-medium"
          />
        </div>

        {/* Payment notice */}
        <div className="flex gap-4 p-5 bg-orange-400/5 border border-orange-400/20 rounded-2xl">
          <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
            <span className="font-black text-foreground uppercase tracking-tighter mr-1">Cash Only.</span>
            All transactions are cash only. After submitting, you will be directed to WhatsApp with your full order details.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center gap-3 shadow-xl shadow-primary/30 active:scale-[0.98]"
        >
          {loading ? (
            <span className="w-5 h-5 border-3 border-primary-foreground border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <>
              Confirm &amp; Get WhatsApp Link
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
