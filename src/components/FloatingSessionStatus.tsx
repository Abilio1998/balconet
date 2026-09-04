'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Zap, Sparkles, ShieldAlert } from 'lucide-react'
import { useI18n } from '@/context/I18nContext'

interface FloatingSessionStatusProps {
  settings: any
}

export default function FloatingSessionStatus({ settings }: FloatingSessionStatusProps) {
  const { t } = useI18n()
  const [status, setStatus] = useState<{
    type: 'closing' | 'opening'
    session: 'breakfast' | 'lunch' | 'dinner'
    time: string
    isTomorrow: boolean
  } | null>(null)

  useEffect(() => {
    if (!settings) return

    const updateStatus = () => {
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }))
      const currentTime = now.getHours() * 60 + now.getMinutes()

      const parseTime = (t: string) => {
        if (!t) return 0
        const [h, m] = t.split(':').map(Number)
        return h * 60 + (m || 0)
      }

      const bStart = parseTime(settings.breakfast_start)
      const bEnd   = parseTime(settings.breakfast_end)
      const lStart = parseTime(settings.lunch_start)
      const lEnd   = parseTime(settings.lunch_end)
      const dStart = parseTime(settings.dinner_start)
      const dEnd   = parseTime(settings.dinner_end)

      const isWithinTime = (current: number, start: number, end: number) => {
        if (end < start) return current >= start || current <= end
        return current >= start && current <= end
      }

      const getDiff = (target: number, current: number) => {
        let diff = target - current
        if (diff < 0) diff += 24 * 60
        return diff
      }

      const formatDiff = (diff: number) => {
        const h = Math.floor(diff / 60)
        const m = diff % 60
        return h > 0 ? `${h}h ${m}m` : `${m}m`
      }

      if (isWithinTime(currentTime, bStart, bEnd) && settings.breakfast_menu_active) {
        setStatus({ type: 'closing', session: 'breakfast', time: formatDiff(getDiff(bEnd, currentTime)), isTomorrow: false })
      } else if (isWithinTime(currentTime, lStart, lEnd) && settings.lunch_menu_active) {
        setStatus({ type: 'closing', session: 'lunch', time: formatDiff(getDiff(lEnd, currentTime)), isTomorrow: false })
      } else if (isWithinTime(currentTime, dStart, dEnd) && settings.dinner_menu_active) {
        setStatus({ type: 'closing', session: 'dinner', time: formatDiff(getDiff(dEnd, currentTime)), isTomorrow: false })
      } else {
        if (currentTime < bStart) {
          setStatus({ type: 'opening', session: 'breakfast', time: formatDiff(getDiff(bStart, currentTime)), isTomorrow: false })
        } else if (currentTime < lStart) {
          setStatus({ type: 'opening', session: 'lunch', time: formatDiff(getDiff(lStart, currentTime)), isTomorrow: false })
        } else if (currentTime < dStart) {
          setStatus({ type: 'opening', session: 'dinner', time: formatDiff(getDiff(dStart, currentTime)), isTomorrow: false })
        } else {
          setStatus({ type: 'opening', session: 'breakfast', time: formatDiff(getDiff(bStart, currentTime)), isTomorrow: true })
        }
      }
    }

    updateStatus()
    const interval = setInterval(updateStatus, 60000)
    return () => clearInterval(interval)
  }, [settings])

  // ── Only show while the #gastronomy section is on screen ──
  const [sectionVisible, setSectionVisible] = useState(false)

  useEffect(() => {
    const observe = () => {
      // On /menu page there is no #gastronomy — show always there
      const section = document.getElementById('gastronomy')
      if (!section) {
        setSectionVisible(true)
        return
      }
      const observer = new IntersectionObserver(
        ([entry]) => setSectionVisible(entry.isIntersecting),
        { threshold: 0 } // Use 0 threshold for mobile where tall sections might never reach 5% intersection
      )
      observer.observe(section)
      return () => observer.disconnect()
    }

    const timer = setTimeout(observe, 300)
    return () => clearTimeout(timer)
  }, [])

  if (!status || !sectionVisible) return null


  const isClosing = status.type === 'closing'

  const getSessionIcon = () => {
    if (status.session === 'breakfast') return <Clock size={15} />
    if (status.session === 'lunch') return <Zap size={15} />
    return <Sparkles size={15} />
  }

  const sessionName =
    status.session === 'breakfast' ? t('sessions.breakfast') :
    status.session === 'lunch'     ? t('sessions.lunch') :
    t('sessions.dinner')

  const label = isClosing
    ? t('sessions.closing_in') || 'Cierre en'
    : t('sessions.next_turn') || 'Siguiente turno'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="fixed bottom-6 right-4 md:bottom-8 md:right-6 z-[120] no-print flex flex-col items-end gap-2"
      >
        {/* ── Allergen notice pill ── */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="flex items-center gap-2 bg-black/75 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 shadow-lg max-w-[220px] md:max-w-xs"
        >
          <div className="w-5 h-5 flex-shrink-0 rounded-full bg-amber-500/15 flex items-center justify-center">
            <ShieldAlert size={11} className="text-amber-400" />
          </div>
          <span className="text-[10px] md:text-[11px] text-white/55 leading-tight font-medium">
            {t('allergens.notice')}
          </span>
        </motion.div>

        {/* ── Session status pill ── */}
        <div
          className={`
            flex items-center gap-2.5 md:gap-3
            bg-black/85 backdrop-blur-md
            border rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)]
            pl-2.5 pr-4 py-2 md:pl-3 md:pr-5 md:py-2.5
            transition-colors duration-300
            ${isClosing
              ? 'border-red-500/35 hover:border-red-500/60'
              : 'border-[#D4AF37]/40 hover:border-[#D4AF37]/70'
            }
          `}
        >
          {/* Icon circle */}
          <div
            className={`
              w-8 h-8 md:w-9 md:h-9 rounded-full flex-shrink-0
              flex items-center justify-center
              ${isClosing
                ? 'bg-red-500/20 text-red-400'
                : 'bg-[#D4AF37]/20 text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.25)]'
              }
            `}
          >
            {isClosing
              ? <Clock size={15} className="animate-pulse" />
              : getSessionIcon()
            }
          </div>

          {/* Text */}
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-[0.18em] text-white/45 leading-none mb-1">
              {label}
            </span>
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="text-[11px] md:text-[13px] font-bold text-white uppercase tracking-wide leading-none">
                {sessionName}
                {status.isTomorrow && (
                  <span className="ml-1 text-white/40 font-normal normal-case tracking-normal text-[9px] md:text-[10px]">
                    ({t('sessions.tomorrow') || 'Mañana'})
                  </span>
                )}
              </span>
              <span className={`text-[11px] md:text-[13px] font-bold tabular-nums leading-none ${isClosing ? 'text-red-400' : 'text-[#D4AF37]'}`}>
                {status.time}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
