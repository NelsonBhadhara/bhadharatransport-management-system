'use client'

import { X, Truck, Phone, MessageCircle } from 'lucide-react'

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
            <h3 className="text-lg font-bold text-foreground mb-3">Our Fleet</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our fleet includes well-maintained 8 cubic meter and 20 cubic meter trucks, including grabbers and tippers, allowing us to efficiently handle a wide range of hauling needs. From large-scale construction projects to smaller deliveries all around Masvingo, we are committed to delivering quality service with precision and reliability.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Materials & Expertise</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We have developed strong expertise in transporting materials such as river sand, pit sand, gravel, quarry stones, and rubbles. In addition, we remain flexible and responsive to client needs, offering tailored transport solutions for various other materials upon request and negotiation.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Our Team</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Behind our operations is a capable and dedicated team of approximately 30 employees, including skilled drivers, truck assistants, mechanics, and a truck supervisor. Each member plays a vital role in ensuring that our services are carried out safely, efficiently, and to the highest professional standards.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Our Founder</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bhadhara Transport was founded by Mr. Nelson Bhadhara, a hardworking and visionary leader whose commitment continues to drive the company forward. Known for his strong work ethic and passion for the industry, he is dedicated to continuous improvement, striving to build a company that not only meets today's demands but is constantly evolving to exceed tomorrow&apos;s expectations. His forward-looking mindset, coupled with a deep hunger for success, inspires the company&apos;s mission to grow, innovate, and expand opportunities for the future.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Customer Commitment</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              At the core of our business is a commitment to customer satisfaction. We understand how critical dependable transport is to construction and development projects, which is why we emphasize punctuality, clear communication, and competitive pricing. Our goal is to build lasting relationships with our clients by consistently delivering dependable and professional service.
            </p>
          </div>

          <div className="bg-secondary/30 rounded-xl p-4 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-foreground mb-2">Our Mission</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                To provide efficient, reliable, and cost-effective transport solutions that support the success of our clients&apos; projects.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground mb-2">Our Vision</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                To become a leading logistics and transport partner in Masvingo and beyond, recognized for excellence, integrity, and continuous growth. We are also committed to securely storing registered user account login and sign-up details with the highest security standards.
              </p>
            </div>
          </div>

          <div className="bg-secondary/30 rounded-xl p-4">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Contact Us
            </h3>
            <div className="space-y-3">
              {[
                { num: '0773 083 687', wa: true },
                { num: '0774 049 526', wa: false },
                { num: '0770 083 687', wa: false },
              ].map(c => (
                <div key={c.num} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {c.wa ? (
                      <MessageCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Phone className="w-4 h-4 text-primary" />
                    )}
                    {c.wa ? (
                      <a 
                        href={`https://wa.me/263${c.num.replace(/^0/, '').replace(/\s/g, '')}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-foreground hover:text-green-400 transition-colors"
                      >
                        {c.num}
                      </a>
                    ) : (
                      <a href={`tel:${c.num.replace(/\s/g, '')}`} className="text-sm text-foreground hover:text-primary transition-colors">
                        {c.num}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              WhatsApp us for load inquiries, booking confirmations and payment meetup locations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
