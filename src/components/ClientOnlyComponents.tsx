'use client'

import dynamic from 'next/dynamic'

// ssr: false is only allowed inside Client Components.
// These components use framer-motion / localStorage / useSearchParams which
// cause hydration mismatches when server-rendered — so we skip SSR entirely.
const LoadingScreen     = dynamic(() => import('@/components/LoadingScreen'),     { ssr: false })
const CookieConsent     = dynamic(() => import('@/components/CookieConsent'),     { ssr: false })
const GoogleReviewButton = dynamic(() => import('@/components/GoogleReviewButton'), { ssr: false })
const EngagementTracker = dynamic(() => import('@/components/EngagementTracker'), { ssr: false })
const TrafficTracker    = dynamic(() => import('@/components/TrafficTracker'),    { ssr: false })

export default function ClientOnlyComponents() {
  return (
    <>
      <LoadingScreen />
      <CookieConsent />
      <GoogleReviewButton />
      <EngagementTracker />
      <TrafficTracker />
    </>
  )
}
