'use client'

import { useState } from 'react'
import { Truck, Phone, MessageCircle, Info, LogIn, UserPlus, CheckCircle, Star, Shield, Clock } from 'lucide-react'
import LoginModal from '@/components/auth/LoginModal'
import SignupModal from '@/components/auth/SignupModal'
import AboutModal from '@/components/auth/AboutModal'

export default function WelcomePage() {
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-trucks.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background/95" />
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-lg leading-none text-foreground">BHADHARA</p>
              <p className="text-xs text-primary leading-none tracking-widest uppercase">Transport</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAbout(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Info className="w-4 h-4" />
              About Us
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-border text-foreground rounded-lg hover:border-primary hover:text-primary transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
            <button
              onClick={() => setShowSignup(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-semibold"
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-6 tracking-wider uppercase">
            <Truck className="w-3 h-3" />
            Professional Haulage Services — Zimbabwe
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-balance text-foreground mb-6 leading-tight">
            Moving Zimbabwe&apos;s
            <br />
            <span className="text-primary">Heavy Loads</span>
          </h1>
          <p className="max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed text-pretty mb-10">
            Specialising in quarry stone, river sand and pit sand transport with a fleet of 16-tonne tippers and
            grabbers. Reliable, punctual and professional.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              <LogIn className="w-5 h-5" />
              Access Portal
            </button>
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center gap-2 px-8 py-4 border border-border text-foreground rounded-xl font-semibold text-base hover:border-primary hover:text-primary transition-colors"
            >
              <Info className="w-5 h-5" />
              Learn More
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 flex justify-center pb-8 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/40 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-primary rounded-full" />
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <section className="bg-card border-y border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {[
            { label: 'Trucks in Fleet', value: '7' },
            { label: 'Active Drivers', value: '4' },
            { label: 'Years in Service', value: '5+' },
            { label: 'Loads Delivered', value: '10K+' },
          ].map(stat => (
            <div key={stat.label} className="flex flex-col items-center py-6 px-4">
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1 text-center">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-12 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-foreground mb-4">What We Carry</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
          Fixed-rate bulk material haulage across Zimbabwe — transparent pricing, no surprises.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'River Sand',
              rate: '$90/load',
              desc: 'Premium quality riversand for construction and building projects.',
              icon: '🪨',
            },
            {
              name: 'Pit Sand',
              rate: '$85/load',
              desc: 'Fine pit sand ideal for plastering, rendering and masonry work.',
              icon: '⛏️',
            },
            {
              name: 'Quarry Stone',
              rate: '$85/load',
              desc: 'Crushed quarry stone for foundations, roads and aggregate use.',
              icon: '🏗️',
            },
          ].map(service => (
            <div
              key={service.name}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl mb-4">
                {service.icon}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{service.name}</h3>
              <p className="text-primary font-bold text-xl mb-3">{service.rate}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why Us ───────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 md:px-12 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-10 text-center">Why Choose Bhadhara Transport</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: CheckCircle, title: 'Reliable', desc: 'On-time delivery, every time.' },
              { icon: Shield, title: 'Trusted', desc: 'Years of proven service excellence.' },
              { icon: Star, title: 'Professional', desc: 'Experienced, licensed drivers.' },
              { icon: Clock, title: 'Efficient', desc: 'Fast turnaround and scheduling.' },
            ].map(item => (
              <div key={item.title} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact / Footer ─────────────────────────────────────────────── */}
      <footer className="bg-background border-t border-border py-12 px-6 md:px-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">BHADHARA TRANSPORT</p>
                <p className="text-xs text-primary">Professional Haulage</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Zimbabwe&apos;s trusted heavy haulage specialists. Moving your materials, building your future.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Contact Us</h3>
            <div className="flex flex-col gap-3">
              {[
                { num: '0773 083 687', whatsapp: true },
                { num: '0774 049 526', whatsapp: true },
                { num: '0770 083 687', whatsapp: true },
              ].map(c => (
                <div key={c.num} className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <a
                      href={`tel:${c.num.replace(/\s/g, '')}`}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Phone className="w-4 h-4 text-primary" />
                      {c.num}
                    </a>
                    {c.whatsapp && (
                      <a
                        href={`https://wa.me/263${c.num.replace(/^0/, '').replace(/\s/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WA
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => setShowLogin(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors text-left">
                Admin Portal
              </button>
              <button onClick={() => setShowLogin(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors text-left">
                Client Portal
              </button>
              <button onClick={() => setShowSignup(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors text-left">
                Create Account
              </button>
              <button onClick={() => setShowAbout(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors text-left">
                About Bhadhara
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Bhadhara Transport. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Hosted on Spaceship.com</p>
        </div>
      </footer>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSignup={() => { setShowLogin(false); setShowSignup(true) }} />}
      {showSignup && <SignupModal onClose={() => setShowSignup(false)} onLogin={() => { setShowSignup(false); setShowLogin(true) }} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </main>
  )
}
