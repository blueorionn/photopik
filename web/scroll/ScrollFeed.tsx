'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { FeedPhoto } from '@/lib/db/queries'

// Keep in sync with getPublicFeed in lib/db/queries.ts — same filters,
// same order, smaller pages (one photo fills the viewport here).
const PAGE_SIZE = 10

// Start fetching the next page when the viewer gets this close to the end.
const PREFETCH_AHEAD = 3

export default function ScrollFeed({
  initialPhotos,
  cdnPrefix,
}: {
  initialPhotos: FeedPhoto[]
  cdnPrefix: string
}) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [hasMore, setHasMore] = useState(initialPhotos.length === PAGE_SIZE)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(initialPhotos.length)
  const loadingRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return

    loadingRef.current = true
    setIsFetching(true)

    // Same filters/order as getPublicFeed in lib/db/queries.ts — keep in sync.
    const supabase = createClient()
    const from = offsetRef.current
    const { data, error: fetchError } = await supabase
      .from('photos')
      .select(
        'id, slug, name, width, height, storage_key, license, upload_time'
      )
      .eq('is_private', false)
      .is('deleted_at', null)
      .eq('is_nsfw', false)
      .order('upload_time', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    loadingRef.current = false
    setIsFetching(false)

    if (fetchError) {
      console.error('Scroll page failed:', fetchError.message)
      setError(true)
      return
    }

    setError(false)
    const page = (data ?? []) as FeedPhoto[]
    offsetRef.current += page.length
    setHasMore(page.length === PAGE_SIZE)
    setPhotos((prev) => {
      const seen = new Set(prev.map((photo) => photo.id))
      return [...prev, ...page.filter((photo) => !seen.has(photo.id))]
    })
  }, [hasMore])

  // Prefetch ahead of the viewer so swipes never wait on the network.
  useEffect(() => {
    if (activeIndex >= photos.length - PREFETCH_AHEAD) void loadMore()
  }, [activeIndex, photos.length, loadMore])

  // Track which photo fills the viewport (snap makes this exact).
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const index = Math.round(el.scrollTop / el.clientHeight)
    setActiveIndex((prev) => (prev === index ? prev : index))
  }, [])

  // Keyboard: arrows / page keys advance one photo at a time.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(event.key)) {
        return
      }
      event.preventDefault()
      const el = containerRef.current
      if (!el) return
      const direction =
        event.key === 'ArrowDown' || event.key === 'PageDown' ? 1 : -1
      el.scrollBy({ top: direction * el.clientHeight, behavior: 'smooth' })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className='relative h-full'>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className='h-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain'
      >
        {photos.map((photo, index) => (
          <section
            key={photo.id}
            aria-label={photo.name}
            className='relative flex h-full snap-start items-center justify-center'
          >
            <Image
              src={`${cdnPrefix}${photo.storage_key}`}
              alt={photo.name}
              fill
              sizes='100vw'
              priority={index === 0}
              className='object-contain'
            />

            <div
              aria-hidden
              className='pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-20'
            >
              <p className='text-sm text-white/90'>{photo.name}</p>
            </div>
          </section>
        ))}

        {!hasMore && photos.length > 0 && (
          <section className='flex h-full snap-start flex-col items-center justify-center gap-4'>
            <p className='text-sm text-white/60'>You&rsquo;re all caught up.</p>
            <Link
              href='/'
              className='rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20'
            >
              Back to gallery
            </Link>
          </section>
        )}
      </div>

      {/* Chrome — sits above the snap container so it never scrolls away */}
      <Link
        href='/'
        aria-label='Back to gallery'
        className='absolute top-4 left-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20'
      >
        <X className='size-4' />
      </Link>

      <div
        aria-live='polite'
        className='absolute top-4 right-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur'
      >
        {Math.min(activeIndex + 1, photos.length)} / {photos.length}
      </div>

      {(isFetching || error) && hasMore && (
        <div className='absolute bottom-4 left-1/2 z-10 -translate-x-1/2'>
          {error ? (
            <button
              type='button'
              onClick={() => void loadMore()}
              className='cursor-pointer rounded-full bg-white/10 px-4 py-1.5 text-xs text-white backdrop-blur transition-colors hover:bg-white/20'
            >
              Couldn&rsquo;t load more — retry
            </button>
          ) : (
            <span className='rounded-full bg-white/10 px-4 py-1.5 text-xs text-white/80 backdrop-blur'>
              Loading…
            </span>
          )}
        </div>
      )}
    </div>
  )
}
