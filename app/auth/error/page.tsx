import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/AuthShell'

export const metadata: Metadata = {
  title: 'Sign-in problem · photopik',
  robots: { index: false },
}

function ClockIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' className='size-6' aria-hidden>
      <circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='2' />
      <path
        d='M12 7v5l3 2'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' className='size-6' aria-hidden>
      <path
        d='M3 12a9 9 0 1 0 3-6.7L3 8'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M3 3v5h5'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function DevicesIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' className='size-6' aria-hidden>
      <rect
        x='2'
        y='4'
        width='14'
        height='10'
        rx='2'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M6 18h5'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <rect
        x='16'
        y='9'
        width='6'
        height='11'
        rx='2'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M19 17h.01'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' className='size-6' aria-hidden>
      <circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='2' />
      <path
        d='M12 8v5'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M12 16.5h.01'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

type Reason = 'expired' | 'used' | 'cross-device'

type ReasonConfig = {
  title: string
  body: string
  icon: ReactNode
  tone: string
}

const REASONS: Record<Reason, ReasonConfig> = {
  expired: {
    title: 'This link has expired',
    body: 'Magic links are short-lived by design. Request a fresh one and it should work.',
    icon: <ClockIcon />,
    tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  used: {
    title: 'This link was already used',
    body: 'Each magic link works exactly once. Request a fresh link to sign in.',
    icon: <RefreshIcon />,
    tone: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  },
  'cross-device': {
    title: 'Different browser detected',
    body:
      'You opened this link in a different browser than the one you requested it from. ' +
      'Open it in the original browser (same profile, not a private window).',
    icon: <DevicesIcon />,
    tone: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
}

const FALLBACK: ReasonConfig = {
  title: 'Something went wrong',
  body: 'We could not sign you in with this link. Please request a new one.',
  icon: <AlertIcon />,
  tone: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

// Only reason codes from the fixed whitelist are honored; anything
// else (or nothing at all) falls back to a generic message.
function parseReason(value: string | string[] | undefined): Reason | null {
  if (typeof value !== 'string') return null
  return value in REASONS ? (value as Reason) : null
}

export default async function AuthErrorPage({
  searchParams,
}: PageProps<'/auth/error'>) {
  const params = await searchParams
  const reason = parseReason(params.reason)
  const { title, body, icon, tone } =
    (reason !== null && REASONS[reason]) || FALLBACK

  return (
    <AuthShell
      title={title}
      description={body}
      icon={
        <span
          className={`flex size-14 items-center justify-center rounded-full ${tone}`}
        >
          {icon}
        </span>
      }
    >
      <Link
        href='/auth/login'
        className='flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300'
      >
        Request a new link
      </Link>
    </AuthShell>
  )
}
