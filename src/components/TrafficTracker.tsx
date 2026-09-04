'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function TrafficTracker() {
  const pathname = usePathname()
  const { status } = useSession()

  useEffect(() => {
    // Skip tracking for admin routes to avoid inflating stats with own usage
    if (pathname.includes('/admin')) return
    if (window.location.pathname.includes('/admin')) return
    
    // Skip tracking if the user is logged in (admin, sala, cocina, etc)
    if (status === 'loading') return // Wait for session to resolve
    if (status === 'authenticated') return // Do not track staff

    // Basic session handling to avoid spamming on internal nav
    const sessionKey = 'el-balconet-session'
    const lastTracked = sessionStorage.getItem(sessionKey)
    const now = Date.now()

    // Track if first time or if more than 30 mins since last page track
    if (!lastTracked || (now - parseInt(lastTracked)) > 1000 * 60 * 30) {
      // Logic for marketing source detection
      const searchParams = new URLSearchParams(window.location.search)
      const src = searchParams.get('src')
      const utmSource = searchParams.get('utm_source')
      
      let effectiveReferrer = document.referrer

      // If the referrer is from our own admin pages, treat as direct (don't count admin navigation)
      try {
        if (effectiveReferrer) {
          const refUrl = new URL(effectiveReferrer)
          if (refUrl.pathname.includes('/admin')) {
            effectiveReferrer = ''
          }
        }
      } catch (_) {}

      if (src === 'qr' || utmSource === 'qr') {
        effectiveReferrer = 'Escaneo QR (Físico)'
      } else if (utmSource === 'instagram') {
        effectiveReferrer = 'https://instagram.com/'
      }

      fetch('/api/public/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: pathname,
          referrer: effectiveReferrer,
          userAgent: navigator.userAgent
        })
      }).catch(err => console.error('Tracking error:', err))
      
      sessionStorage.setItem(sessionKey, now.toString())
    }
  }, [pathname, status])

  return null // Invisible tracker
}
