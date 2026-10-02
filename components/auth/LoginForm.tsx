'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/Spinner'

type Status = 'idle' | 'sending' | 'sent'

function CheckIcon() {
  return (
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
        <p className='text-foreground mt-4 font-medium'>Check your inbox</p>
        <p className='text-muted mt-1.5 text-sm leading-relaxed'>
          We sent a sign-in link to <strong>{email}</strong>. It works once,
          expires soon, and must be opened in this browser.
        </p>
        <button
          type='button'
          onClick={() => {
            setStatus('idle')
            setError(null)
          }}
          className='text-accent hover:text-accent-hover mt-6 text-sm font-medium transition-colors'
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
        className='text-foreground block text-sm font-medium'
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
        className='border-border text-foreground placeholder:text-muted/60 focus:border-accent focus:ring-accent/30 mt-2 w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-sm transition-colors focus:ring-2 focus:outline-none disabled:opacity-60'
      />

      {error ? (
        <p role='alert' className='mt-2 text-sm text-red-500'>
          {error}
        </p>
      ) : null}

      <button
        type='submit'
        disabled={status === 'sending'}
        className='bg-accent text-accent-foreground hover:bg-accent-hover mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60'
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

      <p className='text-foreground/80 mt-6 text-center text-xs leading-relaxed'>
        New here? Your account is created automatically the first time you sign
        in.
      </p>
    </form>
  )
}
