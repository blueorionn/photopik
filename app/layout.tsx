import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/context/ThemeContext'

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
  'Crypticworld is a lightweight web application built using Flask that allows users to hash any given text using a wide variety of hashing algorithms. This application encodes all input data using UTF-8 encoding before generating the hash.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    images: ['https://raw.githubusercontent.com/blueorionn/crypticworld/refs/heads/main/public/favicon.ico'],
  },
  twitter: {
    title: TITLE,
    description: DESCRIPTION,
    images: ['https://raw.githubusercontent.com/blueorionn/crypticworld/refs/heads/main/public/favicon.ico'],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className='flex min-h-full flex-col'>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
