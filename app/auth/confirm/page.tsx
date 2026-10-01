import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/AuthShell'
import ConfirmClient from '@/components/auth/ConfirmClient'

export const metadata: Metadata = {
  title: 'Signing in · photopik',
  robots: { index: false },
}

export default function AuthConfirmPage() {
  return (
    <AuthShell title='Almost there'>
      <ConfirmClient />
    </AuthShell>
  )
}
