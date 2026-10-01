'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/auth/Spinner'

type Status = 'idle' | 'sending' | 'sent'

function CheckIcon() {
  return (
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
  )
}

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return

    setStatus('sending')
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (error) {
      // Details stay in the console; users get a generic message
      // (prevents leaking server-side details to the browser).
      console.error('Magic link request failed:', error.message)
      setError('That did not work. Check the address and try again shortly.')
      setStatus('idle')
      return
    }

    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <div
        key='sent'
        className='animate-fade-up flex flex-col items-center text-center motion-reduce:animate-none'
      >
        <CheckIcon />
        <p className='mt-4 font-medium text-zinc-900 dark:text-zinc-50'>
          Check your inbox
        </p>
        <p className='mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400'>
          We sent a sign-in link to <strong>{email}</strong>. It works once,
          expires soon, and must be opened in this browser.
        </p>
        <button
          type='button'
          onClick={() => {
            setStatus('idle')
            setError(null)
          }}
          className='mt-6 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300'
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate={false}>
      <label
        htmlFor='email'
        className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'
      >
        Email address
      </label>
      <input
        id='email'
        type='email'
        name='email'
        autoComplete='email'
        autoFocus
        required
        placeholder='you@example.com'
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={status === 'sending'}
        className='mt-2 w-full rounded-lg border border-zinc-300 bg-transparent px-3.5 py-2.5 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-indigo-400'
      />

      {error ? (
        <p role='alert' className='mt-2 text-sm text-red-600 dark:text-red-400'>
          {error}
        </p>
      ) : null}

      <button
        type='submit'
        disabled={status === 'sending'}
        className='mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-zinc-700 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300'
      >
        {status === 'sending' ? (
          <>
            <Spinner />
            Sending link…
          </>
        ) : (
          'Send magic link'
        )}
      </button>

      <p className='mt-6 text-center text-xs leading-relaxed text-zinc-400 dark:text-zinc-600'>
        New here? Your account is created automatically the first time you sign
        in.
      </p>
    </form>
  )
}
