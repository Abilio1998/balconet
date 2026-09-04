'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function EngagementTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSection = useRef<string | null>(null)
  const startTime = useRef<number>(0)
  const observedElements = useRef<Set<Element>>(new Set())

  useEffect(() => {
    // Track on landing page and menu page, supporting locales (e.g., /es/menu)
    const isMenuPage = pathname.includes('/menu')
    const isLandingPage = pathname === '/' || pathname.length === 3 // matches /es, /ca, etc.
    
    if (!isMenuPage && !isLandingPage) return


    // Activity tracking to distinguish between active reading and idle tabs
    let lastActivity = Date.now()
    const updateActivity = () => { lastActivity = Date.now() }
    window.addEventListener('scroll', updateActivity, { passive: true })
    window.addEventListener('mousemove', updateActivity, { passive: true })
    window.addEventListener('click', updateActivity)
    window.addEventListener('touchstart', updateActivity, { passive: true })
    window.addEventListener('touchmove', updateActivity, { passive: true })

    const observer = new IntersectionObserver((entries) => {
      // Sort entries by intersection ratio to find the most prominent one
      const visibleSections = entries
        .filter(entry => entry.isIntersecting && entry.intersectionRatio > 0)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

      if (visibleSections.length > 0) {
        const mostProminent = visibleSections[0]
        const sectionId = mostProminent.target.getAttribute('data-engagement-label') || mostProminent.target.id
        
        if (activeSection.current !== sectionId && mostProminent.intersectionRatio >= 0.1) {
          handleSectionChange(sectionId)
        }
      }
    }, {
      threshold: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      rootMargin: '-20% 0px -20% 0px' 
    })

    const handleSectionChange = (newSectionId: string) => {
      if (activeSection.current === newSectionId) return

      // 1. Report time spent on the previous section
      if (activeSection.current) {
        const now = Date.now()
        const duration = (now - startTime.current) / 1000
        const isStillActive = (now - lastActivity) < 15000

        if (duration >= 10 && duration < 600 && isStillActive && activeSection.current !== 'home') {
          fetch('/api/public/track-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: 'dwell_time',
              eventValue: activeSection.current,
              metadata: {
                duration: parseFloat(duration.toFixed(2)),
                path: pathname,
                src: searchParams.get('src') || 'direct',
                is_precise: true
              }
            }),
            keepalive: true
          }).catch(() => { })
        }
      }

      // 2. Set the new active section
      activeSection.current = newSectionId
      startTime.current = Date.now()
    }

    // Monitor attribute changes (like ID changes when switching tabs)
    const attrObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && (mutation.attributeName === 'id' || mutation.attributeName === 'data-engagement-label')) {
          const target = mutation.target as HTMLElement
          // If this element is currently the most prominent one in the middle
          const rect = target.getBoundingClientRect()
          const centerY = window.innerHeight / 2
          if (rect.top <= centerY && rect.bottom >= centerY) {
            const newId = target.getAttribute('data-engagement-label') || target.id
            handleSectionChange(newId)
          }
        }
      })
    })

    const scanAndObserve = () => {
      const currentSections = document.querySelectorAll('section[id], [id^="cat-"], [id^="menu-"], [data-engagement-label]')
      currentSections.forEach(s => {
        if (!observedElements.current.has(s)) {
          observer.observe(s)
          attrObserver.observe(s, { attributes: true })
          observedElements.current.add(s)
        }
      })
    }

    // Initial scan
    scanAndObserve()

    // Periodic re-scan to catch lazy-loaded sections (like menu categories)
    const scanInterval = setInterval(scanAndObserve, 2000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && activeSection.current) {
        const now = Date.now()
        const duration = (now - startTime.current) / 1000
        const isStillActive = (now - lastActivity) < 20000

        if (duration >= 10 && duration < 600 && isStillActive && activeSection.current !== 'home') {
          const data = JSON.stringify({
            eventType: 'dwell_time',
            eventValue: activeSection.current,
            metadata: {
              duration: parseFloat(duration.toFixed(2)),
              path: pathname,
              src: searchParams.get('src') || 'direct',
              is_precise: true
            }
          })

          if (navigator.sendBeacon) {
            const blob = new Blob([data], { type: 'application/json' })
            navigator.sendBeacon('/api/public/track-event', blob)
          }
        }
        activeSection.current = null
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      observer.disconnect()
      attrObserver.disconnect()
      clearInterval(scanInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('scroll', updateActivity)
      window.removeEventListener('mousemove', updateActivity)
      window.removeEventListener('click', updateActivity)
      window.removeEventListener('touchstart', updateActivity)
      window.removeEventListener('touchmove', updateActivity)
    }
  }, [pathname])

  return null
}
