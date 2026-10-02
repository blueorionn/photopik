'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/auth/Spinner'

type Status = 'signing-out' | 'done' | 'failed'

export default function LogoutClient() {
  const started = useRef(false)
  const [status, setStatus] = useState<Status>('signing-out')

  useEffect(() => {
    // Guard against StrictMode's double effect run — one sign-out is enough.
    if (started.current) return
    started.current = true

    createClient()
      .auth.signOut()
      .then(() => setStatus('done'))
      .catch((error) => {
        console.error('Sign-out failed:', error)
        setStatus('failed')
      })
  }, [])

  if (status === 'signing-out') {
    return (
      <div className='flex flex-col items-center text-center'>
        <Spinner className='text-muted size-10' />
        <p className='text-muted mt-4 text-sm'>Signing you out…</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className='animate-fade-up flex flex-col items-center text-center motion-reduce:animate-none'>
        <p className='text-foreground font-medium'>
          Couldn&apos;t sign you out
        </p>
        <p className='text-muted mt-1.5 text-sm'>
          Check your connection and try again.
        </p>
        <button
          type='button'
          onClick={() => window.location.reload()}
          className='bg-accent text-accent-foreground hover:bg-accent-hover mt-6 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors'
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className='animate-fade-up flex flex-col items-center text-center motion-reduce:animate-none'>
      <span className='bg-accent/10 text-accent flex size-10 items-center justify-center rounded-full'>
        <svg viewBox='0 0 24 24' fill='none' className='size-5' aria-hidden>
          <path
            d='m5 13 4 4L19 7'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </span>
      <p className='text-foreground mt-4 font-medium'>You&apos;re signed out</p>
      <p className='text-muted mt-1.5 text-sm'>See you soon.</p>
      <Link
        href='/auth/login'
        className='bg-accent text-accent-foreground hover:bg-accent-hover mt-6 flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors'
      >
        Sign in again
      </Link>
    </div>
  )
}
