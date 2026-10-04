import type { Metadata } from 'next'
import Header from '@/components/Header'
import HomePage from '@/web/home/HomePage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Photopik',
  description: 'A quiet home for your photos.',
}

export default function Home() {
  return (
    <div className='font-sans'>
      <Header />
      <HomePage />
    </div>
  )
}
