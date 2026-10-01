import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sign-in problem',
  robots: { index: false },
}

const REASONS = {
  expired: {
    title: 'This link has expired',
    body: 'Magic links are short-lived. Request a fresh one and it should work.',
  },
  used: {
    title: 'This link was already used',
    body: 'Each magic link works exactly once. Request a fresh link to sign in.',
  },
  'cross-device': {
    title: 'Different browser detected',
    body:
      'You opened this link in a different browser than the one you requested it from. ' +
      'Open it in the original browser (same profile, not a private window).',
  },
} as const

type Reason = keyof typeof REASONS

const FALLBACK = {
  title: 'Something went wrong',
  body: 'We could not sign you in with this link. Please request a new one.',
}

function parseReason(value: string | string[] | undefined): Reason | null {
  if (typeof value !== 'string') return null
  return value in REASONS ? (value as Reason) : null
}

export default async function AuthErrorPage({
  searchParams,
}: PageProps<'/auth/error'>) {
  const params = await searchParams
  const reason = parseReason(params.reason)
  const { title, body } = (reason !== null && REASONS[reason]) || FALLBACK

  return (
    <main>
      <h1>{title}</h1>
      <p>{body}</p>
      <Link href="/auth/login">Request a new link</Link>
    </main>
  )
}
