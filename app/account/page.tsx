import type { Metadata } from 'next'
import Link from 'next/link'
import { Images, Lock, Upload, Settings, Plus, User } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Account - Photopik',
  robots: { index: false },
}

/*
 * UI only — every nav link and button below is a stub (no routes, no
 * handlers). Wiring happens when the features land.
 */

const NAV_ITEMS = [
  { label: 'Collections', icon: Images, href: '#', active: true },
  { label: 'Private photos', icon: Lock, href: '#', active: false },
  { label: 'Upload', icon: Upload, href: '#', active: false },
] as const

const SIDEBAR_ITEM_CLASS =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors'

function AccountIdentity({ email }: { email?: string }) {
  return (
    <div className='flex min-w-0 items-center gap-3 px-3 py-3'>
      <span className='bg-accent text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-full'>
        <User className='size-4' />
      </span>
      <div className='min-w-0'>
        <p className='text-foreground truncate text-sm font-medium'>
          {email ?? 'Not signed in'}
        </p>
        <p className='text-muted-foreground text-xs'>Personal account</p>
      </div>
    </div>
  )
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const email = data?.claims.email

  return (
    <>
      <Header />
      <div className='mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 pt-6 pb-24 sm:px-6 sm:pb-6'>
        {/* sidebar — desktop */}
        <aside className='hidden w-72 shrink-0 sm:block'>
          <div className='border-border bg-surface sticky top-20 flex flex-col rounded-xl border p-2'>
            {/* identity */}
            <div className='border-border mb-2 border-b'>
              <AccountIdentity email={email} />
            </div>

            <nav aria-label='Account'>
              {NAV_ITEMS.map(({ label, icon: Icon, href, active }) => (
                // TODO: real routes (/account/collections, …) when they exist
                <Link
                  key={label}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`${SIDEBAR_ITEM_CLASS} ${
                    active
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer'
                  }`}
                >
                  <Icon className='size-4 shrink-0' />
                  {label}
                </Link>
              ))}

              <div aria-hidden className='bg-border my-2 h-px' />

              {/* pinned to the bottom of the sidebar */}
              {/* TODO: /account/settings route */}
              <Link
                href='#'
                className={`${SIDEBAR_ITEM_CLASS} text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer`}
              >
                <Settings className='size-4 shrink-0' />
                Settings
              </Link>
            </nav>
          </div>
        </aside>

        <div className='min-w-0 flex-1'>
          {/* identity — mobile */}
          <div className='border-border bg-surface mb-4 rounded-xl border p-2 sm:hidden'>
            <AccountIdentity email={email} />
          </div>

          {/* mobile nav strip */}
          <nav
            aria-label='Account'
            className='mb-4 flex gap-2 overflow-x-auto pb-1 sm:hidden'
          >
            {[
              ...NAV_ITEMS,
              { label: 'Settings', icon: Settings, href: '#', active: false },
            ].map(({ label, icon: Icon, href, active }) => (
              <Link
                key={label}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-accent/30 bg-accent/10 text-accent'
                    : 'border-border text-muted-foreground'
                }`}
              >
                <Icon className='size-3.5' />
                {label}
              </Link>
            ))}
          </nav>

          <main>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <h1 className='text-foreground text-2xl font-semibold tracking-tight'>
                  Collections
                </h1>
                <p className='text-muted-foreground text-sm'>0 collections</p>
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

            {/* empty state */}
            <div className='border-border mt-6 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center'>
              <span className='bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full'>
                <Images className='size-5' />
              </span>
              <div>
                <p className='text-foreground font-medium'>
                  No collections yet
                </p>
                <p className='text-muted-foreground mt-1 text-sm'>
                  Group your favorite photos into collections to keep them
                  organized and easy to share.
                </p>
              </div>
              {/* TODO: create-collection flow */}
              <button
                type='button'
                className='bg-accent text-accent-foreground hover:bg-accent-hover cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors'
              >
                Create collection
              </button>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  )
}
