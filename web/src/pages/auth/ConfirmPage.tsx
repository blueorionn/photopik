import { AuthShell } from '../../components/auth/AuthShell'
import ConfirmClient from '../../components/auth/ConfirmClient'

export default function ConfirmPage() {
  return (
    <AuthShell title='Almost there'>
      <ConfirmClient />
    </AuthShell>
  )
}
