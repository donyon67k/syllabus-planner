import type { Metadata } from 'next'
import './globals.css'
import { bodyFont, headingFont } from '@/design/fonts'
import { APP_NAME } from '@/design/brand'

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Your courses, organized.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${headingFont.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}