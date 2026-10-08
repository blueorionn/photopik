import { AuthShell } from '../../components/auth/AuthShell'
import LogoutClient from '../../components/auth/LogoutClient'

export default function LogoutPage() {
  return (
    <AuthShell title='Sign out'>
      <LogoutClient />
    </AuthShell>
  )
}
