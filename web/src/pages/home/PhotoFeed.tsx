import { useEffect, useMemo, useState } from 'react'
import { Spinner } from '../../components/Spinner'
import type { FeedPhoto } from '../../lib/types'

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
function distribute<T extends { width: number; height: number }>(
  items: T[],
  count: number
): T[][] {
  const columns: T[][] = Array.from({ length: count }, () => [])
  const heights = new Array<number>(count).fill(0)

  for (const item of items) {
    let shortest = 0
    for (let i = 1; i < count; i++) {
      if (heights[i] < heights[shortest]) shortest = i
    }
    columns[shortest].push(item)
    heights[shortest] += item.height / item.width
  }

  return columns
}

// Decoy aspect ratios for the loading skeleton — replaced by real photos
// from the feed API.
const SKELETON_ASPECTS = [
  { width: 3, height: 4 },
  { width: 4, height: 5 },
  { width: 1, height: 1 },
  { width: 3, height: 2 },
  { width: 2, height: 3 },
  { width: 4, height: 3 },
  { width: 5, height: 7 },
  { width: 16, height: 10 },
  { width: 2, height: 3 },
  { width: 1, height: 1 },
  { width: 4, height: 5 },
  { width: 3, height: 4 },
]

function SkeletonCard({ width, height }: { width: number; height: number }) {
  return (
    <div
      className='border-border relative mb-4 overflow-hidden rounded border'
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <div className='bg-muted/25 absolute inset-0' />
      <div
        aria-hidden
        className='animate-card-shimmer via-foreground/10 absolute inset-x-0 -top-1/2 h-1/2 bg-linear-to-b from-transparent to-transparent motion-reduce:animate-none'
      />
    </div>
  )
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
      <img
        src={`${cdnPrefix}${photo.storage_key}`}
        alt={photo.name}
        width={photo.width}
        height={photo.height}
        sizes='(min-width: 1024px) 33vw, 50vw'
        loading='lazy'
        className='h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]'
      />
    </div>
  )
}

export default function PhotoFeed({
  photos = [],
  cdnPrefix = '',
}: {
  photos?: FeedPhoto[]
  cdnPrefix?: string
}) {
  const columnCount = useColumnCount()

  const skeletonColumns = useMemo(
    () => distribute(SKELETON_ASPECTS, columnCount),
    [columnCount]
  )
  const columns = useMemo(
    () => distribute(photos, columnCount),
    [photos, columnCount]
  )

  // TODO: fetch pages from the feed API (infinite scroll + the empty state
  // come with it). Until then a photo-less feed renders the loading skeleton.
  if (photos.length === 0) {
    return (
      <>
        <div aria-busy='true' className='flex items-start gap-4'>
          {skeletonColumns.map((column, i) => (
            <div key={i} className='min-w-0 flex-1'>
              {column.map(({ width, height }, j) => (
                <SkeletonCard key={j} width={width} height={height} />
              ))}
            </div>
          ))}
        </div>

        <div
          aria-live='polite'
          className='text-muted flex min-h-12 items-center justify-center gap-2 py-10'
        >
          <Spinner />
          <span className='text-sm'>Loading the gallery…</span>
        </div>
      </>
    )
  }

  return (
    <div className='flex items-start gap-4'>
      {columns.map((column, i) => (
        <div key={i} className='min-w-0 flex-1'>
          {column.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} cdnPrefix={cdnPrefix} />
          ))}
        </div>
      ))}
    </div>
  )
}
