import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Spinner } from '@/components/auth/Spinner'

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
    <div className='group relative mb-4 break-inside-avoid overflow-hidden rounded-xl border border-border'>
      <div
        className={`w-full bg-surface bg-linear-to-br ${fill} to-transparent transition-transform duration-300 group-hover:scale-[1.03] ${aspect}`}
      />
    </div>
  )
}

export default function Home() {
  return (
    <div className='font-sans'>
      <header className='sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur'>
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
            <span className='text-base font-semibold tracking-tight text-foreground'>
              photopik<span className='text-accent'>.</span>
            </span>
          </Link>

          {/* search stub — wired up when the media API exists */}
          <input
            type='search'
            placeholder='Search photos…'
            aria-label='Search photos'
            className='mx-auto hidden w-full max-w-md rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:block'
          />

          <Link
            href='/auth/login'
            className='shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover'
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

        <div className='flex items-center justify-center gap-2 py-10 text-muted'>
          <Spinner />
          <span className='text-sm'>Loading more…</span>
        </div>
      </main>
    </div>
  )
}
