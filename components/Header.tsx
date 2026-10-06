import { createClient } from '@/lib/supabase/server'
import HeaderClient from '@/components/HeaderClient'

export default async function Header() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const email = data?.claims.email

  return <HeaderClient userEmail={email} />
}
