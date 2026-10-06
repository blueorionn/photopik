import type { Metadata } from 'next'
import { cdnUrl, getPublicFeed } from '@/lib/db/queries'
import ScrollFeed from '@/web/scroll/ScrollFeed'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Scroll - Photopik',
  robots: { index: false },
}

export default async function ScrollPage() {
  // Small first page — the viewer shows one photo at a time, so a full
  // page-size payload would be wasted bytes up front.
  const photos = await getPublicFeed(10)

  return (
    <main className='h-dvh bg-black'>
      <ScrollFeed initialPhotos={photos} cdnPrefix={cdnUrl('')} />
    </main>
  )
}
