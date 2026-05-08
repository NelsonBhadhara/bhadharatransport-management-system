'use client'

import { useState } from 'react'
import { Truck, Phone, MessageCircle, Info, LogIn, UserPlus, CheckCircle, Star, Shield, Clock, Menu, X } from 'lucide-react'
import LoginModal from '@/components/auth/LoginModal'
import SignupModal from '@/components/auth/SignupModal'
import AboutModal from '@/components/auth/AboutModal'

export default function WelcomePage() {
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
        <nav className="relative z-20 flex items-center justify-between px-6 py-4 md:px-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-lg leading-none text-foreground">BHADHARA</p>
              <p className="text-xs text-primary leading-none tracking-widest uppercase">Transport</p>
            </div>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-semibold shadow-lg shadow-primary/20"
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>

          {/* Mobile Nav Toggle */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-10 bg-background/95 backdrop-blur-md pt-24 px-6 md:hidden">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => { setShowAbout(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl text-lg font-semibold"
              >
                <Info className="w-5 h-5 text-primary" />
                About Us
              </button>
              <button
                onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl text-lg font-semibold"
              >
                <LogIn className="w-5 h-5 text-primary" />
                Login to Portal
              </button>
              <button
                onClick={() => { setShowSignup(true); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-4 bg-primary text-primary-foreground rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
              >
                <UserPlus className="w-5 h-5" />
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] sm:text-xs font-semibold mb-6 tracking-wider uppercase">
            <Truck className="w-3 h-3" />
            Professional Haulage Services — Masvingo, Zimbabwe
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-balance text-foreground mb-6 leading-[1.1]">
            Moving Zimbabwe&apos;s
            <br />
            <span className="text-primary">Heavy Loads</span>
          </h1>
          <p className="max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed text-pretty mb-10">
            Specialising in quarry stone, river sand and pit sand transport with a fleet of 16-tonne tippers and
            grabbers. Reliable, punctual and professional.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 w-full sm:w-auto"
            >
              <LogIn className="w-5 h-5" />
              Access Portal
            </button>
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center justify-center gap-2 px-8 py-4 border border-border text-foreground rounded-xl font-semibold text-base hover:border-primary hover:text-primary transition-colors w-full sm:w-auto"
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
        <div className="max-w-5xl mx-auto grid grid-cols-2 divide-x divide-border">
          {[
            { label: 'Years in Service', value: '5+' },
            { label: 'Loads Delivered', value: '10K+' },
          ].map(stat => (
            <div key={stat.label} className="flex flex-col items-center py-8 px-4">
              <p className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 text-center uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">What We Carry</h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
            Fixed-rate bulk material haulage across Masvingo — reliable and professional service.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              name: 'River Sand',
              desc: 'Premium quality riversand for construction and building projects.',
              icon: '🪨',
            },
            {
              name: 'Pit Sand',
              desc: 'Fine pit sand ideal for plastering, rendering and masonry work.',
              icon: '⛏️',
            },
            {
              name: 'Quarry Stone',
              desc: 'Crushed quarry stone for foundations, roads and aggregate use.',
              icon: '🏗️',
            },
            {
              name: 'Gravel',
              desc: 'Quality gravel for driveways, landscaping and construction needs.',
              icon: '🪨',
            },
          ].map(service => (
            <div
              key={service.name}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                {service.icon}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">{service.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why Us ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-12 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-12 text-center">Why Choose Bhadhara Transport</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 sm:gap-6">
            {[
              { icon: CheckCircle, title: 'Reliable', desc: 'On-time delivery, every time.' },
              { icon: Shield, title: 'Trusted', desc: 'Years of proven service excellence.' },
              { icon: Star, title: 'Professional', desc: 'Experienced, licensed drivers.' },
              { icon: Clock, title: 'Efficient', desc: 'Fast turnaround and scheduling.' },
            ].map(item => (
              <div key={item.title} className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact / Footer ─────────────────────────────────────────────── */}
      <footer className="bg-background border-t border-border py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground tracking-tight">BHADHARA TRANSPORT</p>
                <p className="text-xs text-primary uppercase tracking-widest font-semibold">Professional Haulage</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Zimbabwe&apos;s trusted heavy haulage specialists. Moving your materials, building your future.
            </p>
          </div>

          {/* Contact */}
          <div className="lg:col-span-1">
            <h3 className="font-bold text-foreground mb-6 uppercase text-xs tracking-widest">Contact Us</h3>
            <div className="flex flex-col gap-4">
              {[
                { num: '0773 083 687', whatsapp: true },
                { num: '0774 049 526', whatsapp: false },
                { num: '0770 083 687', whatsapp: false },
              ].map(c => (
                <div key={c.num} className="flex items-center gap-3">
                  {c.whatsapp ? (
                    <a
                      href={`https://wa.me/263${c.num.replace(/^0/, '').replace(/\s/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-green-400 transition-colors group"
                      title="WhatsApp"
                    >
                      <div className="w-8 h-8 rounded-full bg-green-400/10 flex items-center justify-center group-hover:bg-green-400/20">
                        <MessageCircle className="w-4 h-4 text-green-400" />
                      </div>
                      {c.num}
                    </a>
                  ) : (
                    <a
                      href={`tel:${c.num.replace(/\s/g, '')}`}
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>
                      {c.num}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-foreground mb-6 uppercase text-xs tracking-widest">Portals</h3>
            <div className="flex flex-col gap-3">
              <button onClick={() => setShowLogin(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors text-left flex items-center gap-2">
                <Shield className="w-3 h-3" /> Admin Portal
              </button>
              <button onClick={() => setShowLogin(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors text-left flex items-center gap-2">
                <CheckCircle className="w-3 h-3" /> Client Portal
              </button>
              <button onClick={() => setShowSignup(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors text-left flex items-center gap-2">
                <UserPlus className="w-3 h-3" /> Create Account
              </button>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-foreground mb-6 uppercase text-xs tracking-widest">Company</h3>
            <div className="flex flex-col gap-3">
              <button onClick={() => setShowAbout(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors text-left">
                About Bhadhara
              </button>
              <button className="text-sm text-muted-foreground hover:text-primary transition-colors text-left">
                Services
              </button>
              <button className="text-sm text-muted-foreground hover:text-primary transition-colors text-left">
                Terms of Service
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Bhadhara Transport. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
             <p className="text-[10px] text-muted-foreground/60">Hosted on Spaceship.com</p>
          </div>
        </div>
      </footer>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSignup={() => { setShowLogin(false); setShowSignup(true) }} />}
      {showSignup && <SignupModal onClose={() => setShowSignup(false)} onLogin={() => { setShowSignup(false); setShowLogin(true) }} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </main>
  )
}
