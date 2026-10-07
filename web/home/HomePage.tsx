import { cdnUrl, getPublicFeed, MAX_PER_PAGE_LIMIT } from '@/lib/db/queries'
import HomeNav from '@/web/home/HomeNav'
import PhotoFeed from '@/web/home/PhotoFeed'

export default async function HomePage() {
  const photos = await getPublicFeed(MAX_PER_PAGE_LIMIT)

  return (
    <main className='mx-auto max-w-7xl px-4 pt-6 pb-24 sm:px-6 sm:pb-6'>
      <HomeNav />
      <PhotoFeed initialPhotos={photos} cdnPrefix={cdnUrl('')} />
    </main>
  )
}
