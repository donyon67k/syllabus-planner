import type { Metadata, Viewport } from 'next'
import './globals.css'
import { bodyFont, headingFont } from '@/design/fonts'
import { APP_NAME } from '@/design/brand'

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Your courses, organized.',
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBF6EE' },
    { media: '(prefers-color-scheme: dark)', color: '#1C1510' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${headingFont.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}