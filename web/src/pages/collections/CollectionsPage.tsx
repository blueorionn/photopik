import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { GalleryVertical, Images, Lock, Plus } from 'lucide-react'

// Decoy data — replaced by the collections API when it exists.
type Collection = {
  id: string
  name: string
  count: number
  isPrivate: boolean
}

const DECOY_COLLECTIONS: Collection[] = [
  { id: '1', name: 'Iceland, summer 2026', count: 24, isPrivate: false },
  { id: '2', name: 'Morning fog', count: 12, isPrivate: false },
  { id: '3', name: 'Film scans', count: 37, isPrivate: true },
  { id: '4', name: 'Moody blues', count: 9, isPrivate: false },
  { id: '5', name: 'Street lights', count: 18, isPrivate: true },
  { id: '6', name: 'Analog skies', count: 21, isPrivate: false },
  { id: '7', name: 'Macro textures', count: 15, isPrivate: false },
  { id: '8', name: 'Golden hour', count: 42, isPrivate: false },
]

function CardAction({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <button
      type='button'
      aria-label={label}
      className='group/action text-muted-foreground hover:bg-muted/50 hover:text-foreground relative flex size-7 cursor-pointer items-center justify-center rounded transition-colors'
    >
      {children}
      <span
        role='tooltip'
        className='bg-foreground text-background pointer-events-none absolute right-0 bottom-full mb-1.5 rounded px-2 py-1 text-xs font-medium whitespace-nowrap opacity-0 transition-opacity group-hover/action:opacity-100 group-focus-visible/action:opacity-100'
      >
        {label}
      </span>
    </button>
  )
}

function CollectionCard({ name, count, isPrivate }: Omit<Collection, 'id'>) {
  return (
    <div className='group border-border hover:border-accent/40 overflow-hidden rounded border transition-colors'>
      {/* TODO: link to the collection detail page when it exists */}
      <Link to='#' className='block'>
        <div className='from-muted/30 to-muted/10 relative aspect-4/3 bg-linear-to-br'>
          <Images className='text-muted-foreground/30 absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2' />
          {isPrivate && (
            <span
              aria-label='Private collection'
              className='bg-background/80 text-muted-foreground absolute top-2 right-2 flex size-6 items-center justify-center rounded-full backdrop-blur'
            >
              <Lock className='size-3' />
            </span>
          )}
        </div>
      </Link>

      <div className='flex items-center justify-between gap-2 px-3 py-2.5'>
        <Link to='#' className='min-w-0 flex-1'>
          <p className='text-foreground group-hover:text-accent truncate text-sm font-medium transition-colors'>
            {name}
          </p>
          <p className='text-muted-foreground text-xs'>{count} photos</p>
        </Link>

        <div className='flex shrink-0 items-center gap-0.5'>
          {/* TODO: upload-into-collection flow */}
          <CardAction label='Add photos'>
            <Plus className='size-4' />
          </CardAction>
          {/* TODO: open this collection in scroll mode */}
          <CardAction label='Scroll collection'>
            <GalleryVertical className='size-4 rotate-90' />
          </CardAction>
        </div>
      </div>
    </div>
  )
}

export default function CollectionsPage() {
  return (
    <main className='mx-auto max-w-7xl px-4 pt-6 pb-24 sm:px-6 sm:pb-6'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-foreground text-2xl font-semibold tracking-tight'>
            Collections
          </h1>
          <p className='text-muted-foreground text-sm'>
            {DECOY_COLLECTIONS.length} collections
          </p>
        </div>
        {/* TODO: create-collection flow */}
        <button
          type='button'
          className='bg-accent text-accent-foreground hover:bg-accent-hover flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors'
        >
          <Plus className='size-4' />
          New collection
        </button>
      </div>

      <div className='mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
        {DECOY_COLLECTIONS.map(({ id, name, count, isPrivate }) => (
          <CollectionCard
            key={id}
            name={name}
            count={count}
            isPrivate={isPrivate}
          />
        ))}
      </div>
    </main>
  )
}
