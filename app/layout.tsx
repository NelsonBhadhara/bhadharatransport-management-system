import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Bhadhara Transport | Professional Haulage & Transport Services',
  description:
    'Bhadhara Transport — Zimbabwe\'s trusted heavy haulage specialists. Quarry stone, riversand, pit sand and bulk material transport with a fleet of 16-tonne tippers and grabbers.',
  keywords: 'transport, haulage, Zimbabwe, quarry stone, riversand, tipper trucks, grabber trucks',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
