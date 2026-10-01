'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    setLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Check your email for the magic link.')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type='email'
        placeholder='you@example.com'
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <button type='submit' disabled={loading}>
        {loading ? 'Sending...' : 'Send magic link'}
      </button>

      {message && <p>{message}</p>}
    </form>
  )
}
