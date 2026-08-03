import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import PwaRegister from '@/components/PwaRegister'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const TITLE = 'Crypticworld - Text Encrypter'
const DESCRIPTION =
  'A growing toolkit for everyday security tasks — hash text, decode JWTs, and encode or decode data, all in one place. This application encodes all input data using UTF-8 before running any operation.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  manifest: '/manifest.json',
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    images: [
      'https://raw.githubusercontent.com/blueorionn/crypticworld/refs/heads/main/public/favicon.ico',
    ],
  },
  twitter: {
    title: TITLE,
    description: DESCRIPTION,
    images: [
      'https://raw.githubusercontent.com/blueorionn/crypticworld/refs/heads/main/public/favicon.ico',
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='en'
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className='flex min-h-full flex-col'>
        {children}
        <PwaRegister />
      </body>
    </html>
  )
}
