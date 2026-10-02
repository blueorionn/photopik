import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
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
      <header className='border-border bg-background/80 sticky top-0 z-10 border-b backdrop-blur'>
        <div className='mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6'>
          <Link href='/' className='flex shrink-0 items-center gap-2'>
            <Image
              src='/photopik.svg'
              alt='photopik logo'
              width={32}
              height={32}
              priority
              className='size-8'
            />
            <span className='text-foreground text-base font-semibold tracking-tight'>
              photopik<span className='text-accent'>.</span>
            </span>
          </Link>

          {/* search stub — wired up when the media API exists */}
          <input
            type='search'
            placeholder='Search photos…'
            aria-label='Search photos'
            className='border-border bg-surface text-foreground placeholder:text-muted/70 focus:border-accent focus:ring-accent/30 mx-auto hidden w-full max-w-md rounded-lg border px-4 py-2 text-sm transition-colors focus:ring-2 focus:outline-none sm:block'
          />

          <Link
            href='/auth/login'
            className='bg-accent text-accent-foreground hover:bg-accent-hover shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors'
          >
            Sign in
          </Link>
        </div>
      </header>

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
