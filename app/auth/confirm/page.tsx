'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

export default function AuthConfirmPage() {
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

    // Landed here without either param (e.g. URL typed by hand).
    if (!hashError && !code) {
      router.replace('/auth/error')
      return
    }

    // Supabase redirected back with a failure (expired/invalid link).
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
        router.replace('/dashboard')
      })
      .catch(() => setFailed(true))
  }, [router])

  return (
    <main>
      <h1>Signing you in…</h1>
      {failed ? (
        <p>
          Something went wrong. Request a new link from the{' '}
          <a href='/auth/login'>sign-in page</a>.
        </p>
      ) : (
        <p>One moment while we verify your magic link.</p>
      )}
    </main>
  )
}
