import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/AuthShell'
import LogoutClient from '@/components/auth/LogoutClient'

export const metadata: Metadata = {
  title: 'Sign out - photopik',
  robots: { index: false },
}

export default function LogoutPage() {
  return (
    <AuthShell title='Sign out'>
      <LogoutClient />
    </AuthShell>
  )
}
