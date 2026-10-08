import { useState } from 'react'
import type { FormEvent } from 'react'
import { Spinner } from '../Spinner'

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return

    setStatus('sending')
    setError(null)

    // TODO: request a magic link from the Flask API (with a CAPTCHA token),
    // then set 'sent', or 'idle' + error on failure.
    window.setTimeout(() => setStatus('sent'), 700)
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
        className='border-border text-foreground placeholder:text-muted/60 focus:border-accent focus:ring-accent/30 my-2 w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-sm transition-colors focus:ring-2 focus:outline-none disabled:opacity-60'
      />

      {error ? (
        <p role='alert' className='mt-2 text-sm text-red-500'>
          {error}
        </p>
      ) : null}

      {/* TODO: replace with the real Turnstile widget when the API exists */}
      <div
        aria-hidden
        className='border-border text-muted flex h-16.25 items-center justify-center rounded-lg border border-dashed text-xs'
      >
        Verification challenge placeholder
      </div>

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
