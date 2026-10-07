'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Spinner } from '@/components/Spinner'
import { createClient } from '@/lib/supabase/client'
import { PUBLIC_FEED_LICENSES } from '@/lib/feed-filters'
import type { FeedPhoto } from '@/lib/db/queries'

// Keep in sync with MAX_PER_PAGE_LIMIT in lib/db/queries.ts — the server
// renders the first page with the same size.
const PAGE_SIZE = 25

const DESKTOP_QUERY = '(min-width: 1024px)'

function useColumnCount(): number {
  const [count, setCount] = useState(2)

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY)
    const update = () => setCount(mq.matches ? 3 : 2)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return count
}

/**
 * Greedy shortest-column placement, using each photo's aspect ratio as a
 * height proxy (every column has the same width, so aspect ~ rendered height).
 *
 * The algorithm is prefix-stable: an item's column depends only on the items
 * before it. Appending a new page therefore never moves existing photos —
 * new items only extend the bottom of the shortest column. A full reflow
 * happens only when the column count changes (breakpoint crossing), which is
 * expected. This is why we don't use CSS columns: the browser rebalances the
 * whole container on every insertion and reshuffles everything above the
 * fold.
 */
function distribute(photos: FeedPhoto[], count: number): FeedPhoto[][] {
  const columns: FeedPhoto[][] = Array.from({ length: count }, () => [])
  const heights = new Array<number>(count).fill(0)

  for (const photo of photos) {
    let shortest = 0
    for (let i = 1; i < count; i++) {
      if (heights[i] < heights[shortest]) shortest = i
    }
    columns[shortest].push(photo)
    heights[shortest] += photo.height / photo.width
  }

  return columns
}

function PhotoCard({
  photo,
  cdnPrefix,
}: {
  photo: FeedPhoto
  cdnPrefix: string
}) {
  return (
    <div className='group border-border relative mb-4 overflow-hidden rounded border'>
      <Image
        src={`${cdnPrefix}${photo.storage_key}`}
        alt={photo.name}
        width={photo.width}
        height={photo.height}
        sizes='(min-width: 1024px) 33vw, 50vw'
        className='h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]'
      />
    </div>
  )
}

export default function PhotoFeed({
  initialPhotos,
  cdnPrefix,
}: {
  initialPhotos: FeedPhoto[]
  cdnPrefix: string
}) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [hasMore, setHasMore] = useState(initialPhotos.length === PAGE_SIZE)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  // Total rows requested so far — the offset for the next page.
  const offsetRef = useRef(initialPhotos.length)
  const loadingRef = useRef(false)

  const columnCount = useColumnCount()
  const columns = useMemo(
    () => distribute(photos, columnCount),
    [photos, columnCount]
  )

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return

    loadingRef.current = true
    setIsFetching(true)
    setError(null)

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
      .in('license', PUBLIC_FEED_LICENSES)
      .order('upload_time', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    loadingRef.current = false
    setIsFetching(false)

    if (fetchError) {
      console.error('Feed page failed:', fetchError.message)
      setError('Could not load more photos.')
      return
    }

    const page = (data ?? []) as FeedPhoto[]
    offsetRef.current += page.length
    setHasMore(page.length === PAGE_SIZE)
    setPhotos((prev) => {
      const seen = new Set(prev.map((photo) => photo.id))
      return [...prev, ...page.filter((photo) => !seen.has(photo.id))]
    })
  }, [hasMore])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || error) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore()
      },
      { rootMargin: '600px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
    // Re-observe after every appended page so the observer fires again when
    // the sentinel is still inside the margin (tall screens), and pause
    // while an error is showing so we don't hammer the API.
  }, [hasMore, error, loadMore, photos.length])

  if (photos.length === 0) {
    return (
      <div className='text-muted flex flex-col items-center gap-2 py-24 text-center'>
        <p className='text-sm'>Nothing to see yet — the gallery is empty.</p>
      </div>
    )
  }

  return (
    <>
      <div className='flex items-start gap-4'>
        {columns.map((column, i) => (
          <div key={i} className='min-w-0 flex-1'>
            {column.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} cdnPrefix={cdnPrefix} />
            ))}
          </div>
        ))}
      </div>

      <div
        ref={sentinelRef}
        aria-live='polite'
        className='text-muted flex min-h-12 items-center justify-center gap-2 py-10'
      >
        {error ? (
          <button
            type='button'
            onClick={() => void loadMore()}
            className='text-accent hover:text-accent-hover cursor-pointer text-sm font-medium transition-colors'
          >
            {error} Tap to retry.
          </button>
        ) : isFetching ? (
          <>
            <Spinner />
            <span className='text-sm'>Loading more…</span>
          </>
        ) : !hasMore ? (
          <span className='text-xs'>You&rsquo;re all caught up.</span>
        ) : null}
      </div>
    </>
  )
}
