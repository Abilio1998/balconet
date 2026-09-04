'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, Heart, ChefHat, Utensils, Instagram, CalendarCheck } from 'lucide-react'
import { useI18n } from '@/context/I18nContext'
import Link from 'next/link'
import { getBrand } from '@/lib/brand-config'

type Supplement = {
  name: string
  name_ca?: string | null
  name_en?: string | null
  name_fr?: string | null
  price: number
}

type FeaturedProduct = {
  id: string
  name: string
  name_ca?: string | null
  name_en?: string | null
  name_fr?: string | null
  description: string
  description_ca?: string | null
  description_en?: string | null
  description_fr?: string | null
  price: number
  price_exterior?: number | null
  likes_count: number
  image_url?: string | null
  image_alt?: string | null
  supplements?: Supplement[]
}

export default function FeaturedDishModal({ previewProduct, onClosePreview }: { previewProduct?: FeaturedProduct | null, onClosePreview?: () => void } = {}) {
  const { t, locale, setLocale } = useI18n()
  const [fetchedFeatured, setFetchedFeatured] = useState<FeaturedProduct | null>(null)
  const [visible, setVisible] = useState(false)

  const isPreview = !!previewProduct
  const featured = previewProduct || fetchedFeatured
  const brand = getBrand()

  useEffect(() => {
    if (isPreview) {
      setVisible(true)
      return
    }

    fetch('/api/public/carta-dynamic')
      .then(r => r.json())
      .then(data => {
        if (!data.carta) return

        // Helpers para determinar si una promoción está activa según su horario
        const getSpainTime = () => {
          const d = new Date()
          const options: Intl.DateTimeFormatOptions = { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false }
          return new Intl.DateTimeFormat('en-US', options).format(d)
        }
        
        const getSpainDay = () => {
          const d = new Date()
          // 0 = Sun, 1 = Mon, ..., 6 = Sat
          const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', weekday: 'short' })
          const dayName = formatter.format(d).toLowerCase() // e.g. "mon"
          return dayName
        }

        const currentHHMM = getSpainTime()
        const currentDay = getSpainDay()

        for (const cat of data.carta) {
          const found = cat.products.find((p: any) => {
            // Si tiene horarios programados, comprobamos si alguno coincide
            if (p.promo_schedules && p.promo_schedules.length > 0) {
              return p.promo_schedules.some((sched: any) => {
                const isActiveDay = sched.days.includes(currentDay)
                const isActiveTime = currentHHMM >= sched.start && currentHHMM <= sched.end
                return isActiveDay && isActiveTime
              })
            }
            // Si no tiene horarios pero tiene la estrellita (is_web_featured = true)
            return p.is_web_featured
          })
          
          if (found) {
            setFetchedFeatured(found)
            setVisible(true)
            break
          }
        }
      })
      .catch(() => {})
  }, [])

  const close = () => {
    setVisible(false)
    if (onClosePreview) {
      setTimeout(onClosePreview, 350) // Wait for animation to finish
    }
  }

  if (!featured) return null

  const displayName =
    (locale !== 'es' ? (featured as any)[`name_${locale}`] : null) || featured.name
  const displayDescription =
    (locale !== 'es' ? (featured as any)[`description_${locale}`] : null) || featured.description

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
            onClick={close}
          />

          {/* Modal — bottom-sheet on mobile, centered card on sm+ */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.article
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="pointer-events-auto w-full max-w-sm sm:max-w-md border border-white/10 rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.98)] max-h-[90vh] flex flex-col"
              style={{ backgroundColor: '#080808' }}
              onClick={e => e.stopPropagation()}
            >

              {/* ── Image ── */}
              <div className="relative w-full overflow-hidden bg-[#111]">
                {featured.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={featured.image_url}
                    alt={featured.image_alt || displayName}
                    className="w-full object-cover"
                    style={{ maxHeight: '52vw', minHeight: '200px', display: 'block' }}
                  />
                ) : (
                  <div className="w-full flex items-center justify-center text-white/10 py-16 bg-[#111]">
                    <Utensils size={72} strokeWidth={0.5} />
                  </div>
                )}

                {/* Gradient so badge & content read clearly */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C] via-transparent to-black/20 pointer-events-none" />

                {/* Badge — top left */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 bg-[#D4AF37] text-black px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-lg">
                  <Star size={10} className="fill-black flex-shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                    {t('featured.our_star')}
                  </span>
                </div>

                {/* Close — top right */}
                <button
                  onClick={close}
                  aria-label="Cerrar"
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/85 active:scale-90 transition-all"
                >
                  <X size={15} />
                </button>
              </div>

              {/* ── Content ── */}
              <div
                className="px-5 pb-6 pt-4 sm:px-7 sm:pb-8 sm:pt-5 space-y-4 sm:space-y-5 overflow-y-auto"
                style={{ background: 'linear-gradient(160deg, #0f0f0f 0%, #0a0a0a 60%, #0d0b08 100%)' }}
              >

                {/* Label + name */}
                <div>
                  <p className="text-[#D4AF37] text-[9px] sm:text-[10px] uppercase tracking-[0.45em] font-bold mb-1">
                    {t('featured.chef_suggestion')}
                  </p>
                  <h2 className="font-serif text-[1.6rem] sm:text-3xl text-white leading-tight">
                    {displayName}
                  </h2>
                  {displayDescription && (
                    <p className="text-white/45 text-[13px] sm:text-sm mt-1.5 leading-relaxed line-clamp-2">
                      {displayDescription}
                    </p>
                  )}
                </div>

                {/* Price + likes */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between pt-0.5">
                    {featured.price_exterior && featured.price_exterior !== featured.price ? (
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="flex flex-col">
                          <span className="text-[9px] sm:text-[10px] text-[#D4AF37]/60 uppercase tracking-[0.2em] font-medium mb-1">
                            {t('featured.interior')}
                          </span>
                          <span className="text-2xl sm:text-3xl font-serif text-[#D4AF37] tabular-nums leading-none">
                            {featured.price?.toFixed(2)}€
                          </span>
                        </div>
                        <div className="w-px h-8 sm:h-10 bg-white/10 rounded-full" />
                        <div className="flex flex-col">
                          <span className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium mb-1">
                            {t('featured.exterior')}
                          </span>
                          <span className="text-xl sm:text-2xl font-serif text-white/70 tabular-nums leading-none">
                            {featured.price_exterior.toFixed(2)}€
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[2rem] sm:text-4xl font-serif text-[#D4AF37] tabular-nums leading-none">
                        {featured.price?.toFixed(2)}€
                      </span>
                    )}

                    {featured.likes_count > 0 && (
                      <div className="flex items-center gap-1.5 text-white/30 text-xs">
                        <Heart size={12} className="text-red-400 fill-red-400 flex-shrink-0" />
                        <span>{featured.likes_count} {t('featured.recommendations')}</span>
                      </div>
                    )}
                  </div>

                  {/* Supplements */}
                  {featured.supplements && featured.supplements.length > 0 && (
                    <div className="space-y-1.5 border-l-2 border-[#D4AF37]/20 pl-3">
                      {featured.supplements.map((sup, sIdx) => {
                        const supName = locale === 'ca' ? sup.name_ca : locale === 'en' ? sup.name_en : locale === 'fr' ? sup.name_fr : sup.name
                        return (
                          <div key={sIdx} className="flex justify-between items-center text-sm text-[#D4AF37]/90 italic font-serif">
                            <span>- {supName || sup.name}</span>
                            <span className="font-bold ml-4 tabular-nums">+{sup.price.toFixed(2)}€</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── CTA: Ask the waiter ── */}
                <div className="bg-gradient-to-r from-[#D4AF37]/15 to-[#D4AF37]/5 border border-[#D4AF37]/25 rounded-2xl px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
                    <ChefHat size={18} className="text-[#D4AF37]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm sm:text-base leading-snug">
                      {t('featured.ask_waiter')}
                    </p>
                    <p className="text-white/40 text-[11px] sm:text-xs mt-0.5 leading-tight">
                      {t('featured.ask_waiter_sub')}
                    </p>
                  </div>
                </div>

                {/* ── Marketing Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  <Link 
                    href="/reservar"
                    className="bg-black/40 border border-[#D4AF37]/20 rounded-2xl px-4 py-3 flex items-center gap-3 hover:bg-[#D4AF37]/5 hover:border-[#D4AF37]/40 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <CalendarCheck size={14} className="text-[#D4AF37]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[#D4AF37] font-bold text-[11px] sm:text-xs leading-tight">
                        {t('featured.promo_reserve_title')}
                      </p>
                      <p className="text-white/40 text-[9px] sm:text-[10px] mt-0.5 leading-tight line-clamp-2">
                        {t('featured.promo_reserve_desc')}
                      </p>
                    </div>
                  </Link>

                  <a 
                    href={brand.instagram}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-black/40 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 hover:bg-white/5 hover:border-pink-500/30 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Instagram size={14} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-bold text-[11px] sm:text-xs leading-tight">
                        {t('featured.promo_social_title')}
                      </p>
                      <p className="text-white/40 text-[9px] sm:text-[10px] mt-0.5 leading-tight line-clamp-2">
                        {t('featured.promo_social_desc')}
                      </p>
                    </div>
                  </a>
                </div>

                {/* Close / dismiss */}
                <button
                  onClick={close}
                  className="w-full py-3 bg-white/5 border border-white/10 text-white/50 font-bold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 hover:text-white/80 active:scale-95 transition-all"
                >
                  {t('featured.close_modal')}
                </button>

                {/* In-Modal Language Switcher */}
                <div className="flex items-center justify-center gap-6 pt-1 pb-1">
                  {(['es', 'ca', 'en', 'fr'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={(e) => {
                        e.stopPropagation()
                        setLocale(lang)
                      }}
                      className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] transition-all hover:scale-110 active:scale-90 ${
                        locale === lang ? 'text-[#D4AF37]' : 'text-white/30 hover:text-white/80'
                      }`}
                      aria-label={`Traducir a ${lang}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </motion.article>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
