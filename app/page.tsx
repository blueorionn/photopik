import type { Metadata } from 'next'
import Header from '@/components/Header'
import { Spinner } from '@/components/Spinner'

export const metadata: Metadata = {
  title: 'photopik',
  description: 'A quiet home for your photos.',
}

type Photo = {
  aspect: string
  fill: string
}

const PHOTOS: Photo[] = [
  { aspect: 'aspect-[3/4]', fill: 'from-accent/25' },
  { aspect: 'aspect-[2/3]', fill: 'from-accent/10' },
  { aspect: 'aspect-[4/5]', fill: 'from-sky-500/15' },
  { aspect: 'aspect-[3/2]', fill: 'from-accent/15' },
  { aspect: 'aspect-square', fill: 'from-amber-500/15' },
  { aspect: 'aspect-[2/3]', fill: 'from-accent/20' },
  { aspect: 'aspect-[3/4]', fill: 'from-accent/10' },
  { aspect: 'aspect-[16/10]', fill: 'from-transparent' },
  { aspect: 'aspect-[9/16]', fill: 'from-accent/15' },
  { aspect: 'aspect-[4/5]', fill: 'from-accent/25' },
  { aspect: 'aspect-[3/4]', fill: 'from-sky-500/10' },
  { aspect: 'aspect-square', fill: 'from-accent/10' },
  { aspect: 'aspect-[3/2]', fill: 'from-accent/20' },
  { aspect: 'aspect-[4/5]', fill: 'from-transparent' },
  { aspect: 'aspect-[2/3]', fill: 'from-accent/15' },
  { aspect: 'aspect-[16/10]', fill: 'from-accent/10' },
  { aspect: 'aspect-[3/4]', fill: 'from-accent/25' },
  { aspect: 'aspect-square', fill: 'from-accent/15' },
  { aspect: 'aspect-[4/5]', fill: 'from-accent/10' },
  { aspect: 'aspect-[9/16]', fill: 'from-transparent' },
  { aspect: 'aspect-[3/2]', fill: 'from-accent/20' },
]

function PhotoCard({ aspect, fill }: Photo) {
  return (
    <div className='group border-border relative mb-4 break-inside-avoid overflow-hidden rounded-xl border'>
      <div
        className={`bg-surface w-full bg-linear-to-br ${fill} to-transparent transition-transform duration-300 group-hover:scale-[1.03] ${aspect}`}
      />
    </div>
  )
}

export default function Home() {
  return (
    <div className='font-sans'>
      <Header />
      <main className='mx-auto max-w-7xl px-4 py-6 sm:px-6'>
        <div className='columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5'>
          {PHOTOS.map((photo, index) => (
            <PhotoCard key={index} {...photo} />
          ))}
        </div>

        <div className='text-muted flex items-center justify-center gap-2 py-10'>
          <Spinner />
          <span className='text-sm'>Loading more…</span>
        </div>
      </main>
    </div>
  )
}
