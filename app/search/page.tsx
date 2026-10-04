import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SearchPage from '@/web/search/SearchPage'

export const metadata: Metadata = {
  title: 'Search - photopik',
  robots: { index: false },
}

export default function Search() {
  return (
    <div className='font-sans'>
      <Header />
      <SearchPage />
      <Footer />
    </div>
  )
}
