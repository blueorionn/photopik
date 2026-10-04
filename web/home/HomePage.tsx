import Image from 'next/image'
import { Spinner } from '@/components/Spinner'
import { cdnUrl, getPublicFeed, type FeedPhoto } from '@/lib/db/queries'

function PhotoCard({ photo }: { photo: FeedPhoto }) {
  return (
    <div className='group border-border relative mb-4 break-inside-avoid overflow-hidden rounded border'>
      <Image
        src={cdnUrl(photo.storage_key)}
        alt={photo.name}
        width={photo.width}
        height={photo.height}
        sizes='(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw'
        className='h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]'
      />
    </div>
  )
}

export default async function HomePage() {
  const photos = await getPublicFeed(20)

  return (
    <main className='mx-auto max-w-7xl px-4 pt-6 pb-24 sm:px-6 sm:pb-6'>
      {photos.length === 0 ? (
        <div className='text-muted flex flex-col items-center gap-2 py-24 text-center'>
          <p className='text-sm'>Nothing to see yet — the gallery is empty.</p>
        </div>
      ) : (
        <div className='columns-2 gap-4 lg:columns-3'>
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <div className='text-muted flex items-center justify-center gap-2 py-10'>
          <Spinner />
          <span className='text-sm'>Loading more…</span>
        </div>
      )}
    </main>
  )
}
