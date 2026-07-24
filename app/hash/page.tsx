import { type Metadata } from 'next'
import Header from '@/components/Header'
import HashPage from '@/core/hash/HashPage'

export const metadata: Metadata = {
  title: 'Cryptic World - Hash Page',
}

export default function Page() {
  return (
    <>
      <Header />
      <HashPage />
    </>
  )
}
