'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/Spinner'

type Reason = 'expired' | 'used' | 'cross-device'

function getHashParams(): URLSearchParams {
  const hash = window.location.hash
  const query = hash.startsWith('#') ? hash.slice(1) : hash
  return new URLSearchParams(query)
}

// Maps auth errors to the reason codes understood by /auth/error.
// Returns null for anything unrecognized -> generic error message.
function errorToReason(code: string | null, message: string): Reason | null {
  const text = `${code ?? ''} ${message}`.toLowerCase()

  if (text.includes('code_verifier') || text.includes('bad_verification')) {
    return 'cross-device'
  }
  if (text.includes('otp_expired') || text.includes('expired')) {
    return 'expired'
  }
  if (text.includes('already used') || text.includes('already consumed')) {
    return 'used'
  }
  return null
}

function errorRoute(reason: Reason | null): string {
  return reason ? `/auth/error?reason=${reason}` : '/auth/error'
}

export default function ConfirmClient() {
  const router = useRouter()
  const started = useRef(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    // Guard: React StrictMode runs effects twice in dev, and the
    // exchange code is single-use — a second attempt would always fail.
    if (started.current) return
    started.current = true

    const params = getHashParams()
    const hashError = params.get('error')
    const code = params.get('code')

    if (!hashError && !code) {
      router.replace('/auth/error')
      return
    }

    if (hashError) {
      const reason = errorToReason(
        params.get('error_code') ?? hashError,
        params.get('error_description') ?? ''
      )
      router.replace(errorRoute(reason))
      return
    }

    // The happy path: exchange the code (the library parses the hash
    // itself, including the PKCE verifier cookie it shares storage with).
    const supabase = createClient()

    supabase.auth
      .exchangeCodeForSession(window.location.hash)
      .then(({ error: exchangeError }) => {
        if (exchangeError) {
          const reason = errorToReason(
            exchangeError.code ?? null,
            exchangeError.message
          )
          router.replace(errorRoute(reason))
          return
        }

        // Scrub the token from the address bar so it never lands
        // in browser history, then navigate without a history entry.
        window.history.replaceState(null, '', window.location.pathname)
        router.replace('/')
      })
      .catch(() => setFailed(true))
  }, [router])

  if (failed) {
    return (
      <div className='flex flex-col items-center text-center'>
        <p className='text-foreground font-medium'>
          We couldn&apos;t verify this link
        </p>
        <p className='text-muted mt-1.5 text-sm leading-relaxed'>
          Something unexpected went wrong on our side. Requesting a fresh link
          usually fixes it.
        </p>
        <Link
          href='/auth/login'
          className='bg-accent text-accent-foreground hover:bg-accent-hover mt-6 flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors'
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className='flex flex-col items-center text-center'>
      <Spinner className='text-muted size-10' />
      <p className='text-muted mt-4 text-sm'>Verifying your magic link…</p>
    </div>
  )
}
