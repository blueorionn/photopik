import { Search } from 'lucide-react'

export default function SearchPage() {
  return (
    <main className='mx-auto max-w-7xl px-4 pt-6 pb-24 sm:px-6 sm:pb-6'>
      <div className='mx-auto max-w-xl'>
        {/* search stub — wired up when the media API exists */}
        <div className='relative'>
          <Search className='text-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2' />
          <input
            type='search'
            placeholder='Search photos…'
            aria-label='Search photos'
            autoComplete='off'
            className='border-border bg-surface text-foreground placeholder:text-muted/70 focus:border-accent focus:ring-accent/30 w-full rounded-lg border py-2.5 pr-4 pl-10 text-sm transition-colors focus:ring-2 focus:outline-none'
          />
        </div>
      </div>

      <div className='text-muted flex flex-col items-center gap-2 py-24 text-center'>
        <p className='text-sm'>Search results will appear here.</p>
      </div>
    </main>
  )
}
