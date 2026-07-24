'use client'
import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    if (
      window.location.protocol === 'http:' &&
      window.location.hostname !== 'localhost'
    ) {
      console.warn('[PWA] ServiceWorker requires HTTPS')
      return
    }

    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('[PWA] ServiceWorker registration failed:', err)
    })
  }, [])

  return null
}
