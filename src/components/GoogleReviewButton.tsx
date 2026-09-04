'use client'

// ─────────────────────────────────────────────────────────────────────────────
// TODO: Replace this URL with the direct "Write a review" link from Google
//       Business Profile → Inicio → "Consigue más reseñas" → "Compartir enlace"
//       It will look like: https://g.page/r/XXXXXXXXXXXXXXXX/review
// ─────────────────────────────────────────────────────────────────────────────
const GOOGLE_WRITE_REVIEW_URL =
  'https://www.google.es/maps/place/El+Nou+Balconet+de+Premia+de+Dalt/@41.5045512,2.345625,17z/data=!3m1!4b1!4m6!3m5!1s0x12a4b793ac442081:0xc6e94b35d91a3f60!8m2!3d41.5045472!4d2.3481999!16s%2Fg%2F11yl5zlw8r?entry=ttu&g_ep=EgoyMDI2MDkwMi4wIKXMDSoASAFQAw%3D%3D'


import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X } from 'lucide-react'
import { useI18n } from '@/context/I18nContext'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function GoogleReviewButton() {
  const { t } = useI18n()
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  // Show when the user scrolls down a bit anywhere on the site
  const [sectionVisible, setSectionVisible] = useState(false)

  useEffect(() => {
    if (dismissed) return

    const handleScroll = () => {
      // Muestra el botón cuando el usuario ha bajado 100px (mejor para móviles)
      if (window.scrollY > 100) {
        setSectionVisible(true)
      } else {
        setSectionVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    // Comprobar estado inicial por si ya han hecho scroll al cargar
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [dismissed])

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissed(true)
    setSectionVisible(false)
    setExpanded(false)
  }

  const visible = sectionVisible && !dismissed

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -60, scale: 0.85 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -60, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="fixed bottom-6 left-4 md:bottom-8 md:left-6 z-[130] !flex flex-col items-start gap-2"
          id="feedback-widget"
        >
          {/* Tooltip expandido */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-[#111] border border-[#D4AF37]/30 rounded-xl p-4 shadow-2xl max-w-[210px] text-left"
              >
                <p className="text-white text-xs font-semibold mb-1 leading-snug">
                  {t('reviews.float_enjoyed')}
                </p>
                <p className="text-white/50 text-xs leading-snug mb-3">
                  {t('reviews.float_desc')}
                </p>
                <div className="flex justify-start gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className="text-[#D4AF37] fill-[#D4AF37]" />
                  ))}
                </div>
                <a
                  href={GOOGLE_WRITE_REVIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#D4AF37] text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#E8C84A] transition-colors"
                  onClick={() => {
                    fetch('/api/public/track-event', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        eventType: 'click',
                        eventValue: 'google_review_btn',
                        metadata: { source: 'floating_widget' }
                      })
                    }).catch(() => {})
                    setExpanded(false)
                  }}
                >
                  <GoogleIcon />
                  {t('reviews.float_write')}
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón principal */}
          <div className="relative flex items-center gap-2">
            {/* Botón dismiss — aparece a la derecha del botón principal */}
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: expanded ? 1 : 0, scale: expanded ? 1 : 0 }}
              onClick={handleDismiss}
              className="w-6 h-6 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors order-last"
              aria-label="Cerrar"
            >
              <X size={12} />
            </motion.button>

            {/* Botón circular con pulso */}
            <button
              onClick={() => setExpanded(!expanded)}
              aria-label={t('reviews.float_label')}
              className="relative w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform duration-200 focus:outline-none"
            >
              {/* Anillo pulsante */}
              <span className="absolute inset-0 rounded-full bg-[#D4AF37]/20 animate-ping" />
              <span className="absolute inset-[3px] rounded-full bg-white" />
              <span className="relative z-10">
                <GoogleIcon />
              </span>
              {/* Estrella decorativa en el borde */}
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-lg">
                <Star size={10} className="text-white fill-white" />
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
