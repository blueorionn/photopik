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
        <Spinner className='size-10 text-zinc-400 dark:text-zinc-500' />
        <p className='mt-4 text-sm text-zinc-500 dark:text-zinc-400'>
          Signing you out…
        </p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className='animate-fade-up flex flex-col items-center text-center motion-reduce:animate-none'>
        <p className='font-medium text-zinc-900 dark:text-zinc-50'>
          Couldn&apos;t sign you out
        </p>
        <p className='mt-1.5 text-sm text-zinc-500 dark:text-zinc-400'>
          Check your connection and try again.
        </p>
        <button
          type='button'
          onClick={() => window.location.reload()}
          className='mt-6 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300'
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className='animate-fade-up flex flex-col items-center text-center motion-reduce:animate-none'>
      <span className='flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
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
      <p className='mt-4 font-medium text-zinc-900 dark:text-zinc-50'>
        You&apos;re signed out
      </p>
      <p className='mt-1.5 text-sm text-zinc-500 dark:text-zinc-400'>
        See you soon.
      </p>
      <Link
        href='/auth/login'
        className='mt-6 flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300'
      >
        Sign in again
      </Link>
    </div>
  )
}
