'use client'

import { X, Truck, Phone, MessageCircle, MapPin } from 'lucide-react'

export default function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="font-bold text-foreground">About Bhadhara Transport</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Who We Are</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bhadhara Transport is a professional heavy haulage company based in Zimbabwe, specialising in the
              transport of bulk construction materials including quarry stone, river sand and pit sand. With a
              dedicated fleet of 16-tonne tipper and grabber trucks, we serve construction companies, developers
              and individual clients across the region.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Our Services</h3>
            <div className="space-y-2">
              {[
                'River Sand transport — $90/load',
                'Pit Sand transport — $85/load',
                'Quarry Stone transport — $85/load',
                'Custom bulk haulage — quoted per load',
                'Pre-booking & scheduling available',
              ].map(s => (
                <div key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Our Fleet</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We operate a fleet of 7 trucks — 16-tonne tippers and grabbers — driven by our team of four
              experienced, licensed drivers. All trucks are regularly maintained to ensure safe and timely
              delivery of your materials.
            </p>
          </div>

          <div className="bg-secondary/30 rounded-xl p-4">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Contact & WhatsApp
            </h3>
            <div className="space-y-3">
              {[
                { num: '0773 083 687', wa: '263773083687' },
                { num: '0774 049 526', wa: '263774049526' },
                { num: '0770 083 687', wa: '263770083687' },
              ].map(c => (
                <div key={c.num} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <a href={`tel:${c.num.replace(/\s/g, '')}`} className="text-sm text-foreground hover:text-primary transition-colors">
                      {c.num}
                    </a>
                  </div>
                  <a
                    href={`https://wa.me/${c.wa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg text-xs hover:bg-green-500/20 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              WhatsApp us for load inquiries, booking confirmations and payment meetup locations.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">Zimbabwe — serving construction sites and projects nationwide.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
