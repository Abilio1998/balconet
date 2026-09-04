'use client'

import { useI18n } from '@/context/I18nContext'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, X, Phone, Heart, Clock, Sparkles, Calendar, Zap, ArrowRight, Eye, Star } from 'lucide-react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

type Supplement = {
  name: string
  name_ca?: string | null
  name_en?: string | null
  name_fr?: string | null
  price: number
}

type Product = {
  id: string
  name: string
  name_ca?: string | null
  name_en?: string | null
  name_fr?: string | null
  description: string
  description_ca?: string | null
  description_en?: string | null
  description_fr?: string | null
  price?: number | null
  price_exterior?: number | null
  allergens: string[]
  likes_count?: number
  is_featured?: boolean
  is_web_featured?: boolean
  show_in_lunch?: boolean
  show_in_dinner?: boolean
  show_in_breakfast?: boolean
  available_days?: string[]
  image_url?: string | null
  image_alt?: string | null
  supplements?: Supplement[]
  promo_schedules?: {
    start: string
    end: string
    days: string[]
  }[]
}

type Category = {
  id: string
  name: string
  name_ca?: string | null
  name_en?: string | null
  name_fr?: string | null
  is_visible?: boolean
  hide_in_full?: boolean
  products: Product[]
}

type Session = 'lunch' | 'dinner' | 'breakfast' | 'normal'

interface CartaSectionProps {
  session?: Session
  selectedAllergens: string[]
  settings?: any
  compact?: boolean
}

type CartaImage = {
  id: string
  url: string
  alt: string
  order: number
}

const ALLERGENS = [
  { id: 'gluten', icon: '🌾', label: 'Gluten' },
  { id: 'crustaceans', icon: '🦐', label: 'Crustáceos' },
  { id: 'eggs', icon: '🥚', label: 'Huevos' },
  { id: 'fish', icon: '🐟', label: 'Pescado' },
  { id: 'peanuts', icon: '🥜', label: 'Cacahuetes' },
  { id: 'soybeans', icon: '🌿', label: 'Soja' },
  { id: 'dairy', icon: '🥛', label: 'Lácteos' },
  { id: 'nuts', icon: '🌰', label: 'Frutos de cáscara' },
  { id: 'celery', icon: '🥬', label: 'Apio' },
  { id: 'mustard', icon: '🟡', label: 'Mostaza' },
  { id: 'sesame', icon: '🌱', label: 'Sésamo' },
  { id: 'sulphites', icon: '🍷', label: 'Sulfitos' },
  { id: 'lupin', icon: '🌼', label: 'Altramuces' },
  { id: 'molluscs', icon: '🐙', label: 'Moluscos' }
]

function decodeEntities(text?: string | null): string | undefined {
  if (!text) return text ?? undefined
  let decoded = text
  let prev: string
  do {
    prev = decoded
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#x2F;/g, '/')
  } while (decoded !== prev)
  return decoded
}

export default function CartaSection({ session = 'normal', selectedAllergens, settings, compact = false }: CartaSectionProps) {
  const { t, locale } = useI18n()
  const pathname = usePathname()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const [images, setImages] = useState<CartaImage[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [previewSession, setPreviewSession] = useState<Session | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
  const [isBannerSticky, setIsBannerSticky] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)

  const activeSession = previewSession || session

  // Update time remaining for session
  useEffect(() => {
    if (!settings || session === 'normal') {
      setTimeRemaining(null)
      return
    }

    const updateTimer = () => {
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }))
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes()

      let endStr = ''
      if (session === 'breakfast') endStr = settings.breakfast_end
      else if (session === 'lunch') endStr = settings.lunch_end
      else if (session === 'dinner') endStr = settings.dinner_end

      if (!endStr) return

      const [h, m] = endStr.split(':').map(Number)
      const endTotalMinutes = h * 60 + m

      let diff = endTotalMinutes - currentTotalMinutes
      if (diff < 0) {
        // If diff is negative but we are in the session, it means the end time is past midnight
        diff += 24 * 60
      }

      if (diff > 0 && diff <= 12 * 60) { // Safety check: don't show countdowns larger than 12 hours
        const hours = Math.floor(diff / 60)
        const mins = diff % 60
        setTimeRemaining(hours > 0 ? `${hours}h ${mins}min` : `${mins}min`)
      } else {
        setTimeRemaining(null)
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 60000)
    return () => clearInterval(timer)
  }, [session, settings])

  // Scroll detection for sticky banner
  useEffect(() => {
    const handleScroll = () => {
      if (!bannerRef.current) return
      const rect = bannerRef.current.getBoundingClientRect()
      // Detect when it's about to hit the bottom of the navbar
      setIsBannerSticky(rect.top < 110)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  const [mounted, setMounted] = useState(false)

  const [current, setCurrent] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [likedProducts, setLikedProducts] = useState<string[]>([])
  const [selectedProductImage, setSelectedProductImage] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('el-balconet-likes')
      if (saved) {
        setLikedProducts(JSON.parse(saved))
      }
    } catch (e) {
      console.warn('Could not parse saved likes', e)
    }
  }, [])

  const handleLike = async (productId: string) => {
    const isLiked = likedProducts.includes(productId)
    const action = isLiked ? 'unlike' : 'like'

    // Optimistic Update
    const newLikedProducts = isLiked
      ? likedProducts.filter(id => id !== productId)
      : [...likedProducts, productId]

    setLikedProducts(newLikedProducts)
    localStorage.setItem('el-balconet-likes', JSON.stringify(newLikedProducts))

    setCategories(prev => prev.map(cat => ({
      ...cat,
      products: cat.products.map(p =>
        p.id === productId
          ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) + (isLiked ? -1 : 1)) }
          : p
      )
    })))

    try {
      const response = await fetch('/api/public/like-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, action })
      })
      if (!response.ok) throw new Error('Failed to sync like')
    } catch (err) {
      console.error('Error liking product:', err)
      // Rollback on error (optional, but good for robustness)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetch('/api/carta')
      .then((r) => r.json())
      .then((data) => {
        if (data.images && data.images.length > 0) setImages(data.images)
      })
      .catch((err) => console.error('Error fetching images:', err))

    fetch(`/api/public/carta-dynamic`)
      .then((r) => r.json())
      .then((data) => {
        if (data.carta && Array.isArray(data.carta)) {
          setCategories(data.carta)
        }
      })
      .catch((err) => console.error('Error fetching carta dynamic:', err))
      .finally(() => setLoading(false))
  }, [])


  const [activeCategory, setActiveCategory] = useState<string>('')
  const navScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragScrollLeft = useRef(0)

  // Scroll tracking for active category
  useEffect(() => {
    if (categories.length === 0) return

    const observers = new Map()
    const options = {
      rootMargin: '-160px 0px -70% 0px',
      threshold: 0
    }

    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const catId = entry.target.id.replace('cat-', '')
          setActiveCategory(catId)
        }
      })
    }

    const observer = new IntersectionObserver(callback, options)
    categories.forEach(cat => {
      const el = document.getElementById(`cat-${cat.id}`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [categories, mounted])

  // Derived state: filtered categories and products (must be before scroll state that depends on it)
  const filteredCategories = categories
    .filter(cat => cat.is_visible !== false)
    .filter(cat => !(activeSession === 'normal' && cat.hide_in_full))
    .map(cat => ({
      ...cat,
      products: cat.products.filter(prod => {
        // Day of the week filter (Europe/Madrid)
        const getSpainDay = () => {
          const date = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
          return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
        }

        const currentDayId = getSpainDay();
        const productDays = prod.available_days || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        if (!productDays.includes(currentDayId)) return false;

        // Session filter: in 'normal' mode show everything.
        // In 'lunch'/'dinner' mode, ONLY show dishes explicitly marked as true for that session.
        // null/undefined = not configured = excluded from time-based views.
        if (activeSession === 'breakfast' && prod.show_in_breakfast !== true) return false
        if (activeSession === 'lunch' && prod.show_in_lunch !== true) return false
        if (activeSession === 'dinner' && prod.show_in_dinner !== true) return false

        // Multi-Allergen exclusion filter
        if (selectedAllergens.length > 0 && prod.allergens) {
          const hasExcluded = selectedAllergens.some(a => prod.allergens?.includes(a))
          if (hasExcluded) return false
        }

        return true
      })
    })).filter(cat => cat.products.length > 0)

  const recommendations = categories.flatMap(cat => cat.products).filter(prod => {
    // Recommendations logic: Featured + current session
    if (!prod.is_featured) return false
    if (activeSession === 'breakfast' && prod.show_in_breakfast !== true) return false
    if (activeSession === 'lunch' && prod.show_in_lunch !== true) return false
    if (activeSession === 'dinner' && prod.show_in_dinner !== true) return false

    // Allergen filter for recommendations too
    if (selectedAllergens.length > 0 && prod.allergens) {
      if (selectedAllergens.some(a => prod.allergens?.includes(a))) return false
    }
    return true
  }).slice(0, 4)



  const isWithinTime = (current: number, start: string | undefined | null, end: string | undefined | null) => {
    if (!start || !end || typeof start !== 'string' || typeof end !== 'string') return false
    const [sH, sM] = start.split(':').map(Number)
    const [eH, eM] = end.split(':').map(Number)
    const s = sH * 60 + (sM || 0)
    const e = eH * 60 + (eM || 0)
    if (e < s) return current >= s || current <= e
    return current >= s && current <= e
  }

  const nowInSpain = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
  const currentTime = nowInSpain.getHours() * 60 + nowInSpain.getMinutes()

  const isRealSession = settings ? (
    (session === 'breakfast' && isWithinTime(currentTime, settings.breakfast_start, settings.breakfast_end)) ||
    (session === 'lunch' && isWithinTime(currentTime, settings.lunch_start, settings.lunch_end)) ||
    (session === 'dinner' && isWithinTime(currentTime, settings.dinner_start, settings.dinner_end))
  ) : true;

  const getNextSessionLabel = () => {
    if (!settings) return t('sessions.breakfast')

    const parseTime = (t: string) => {
      if (!t) return 0
      const [h, m] = t.split(':').map(Number)
      return h * 60 + (m || 0)
    }

    const bStart = parseTime(settings.breakfast_start)
    const lStart = parseTime(settings.lunch_start)
    const dStart = parseTime(settings.dinner_start)
    const dEnd = parseTime(settings.dinner_end)

    if (currentTime >= dEnd) return t('sessions.tomorrow_breakfast')
    if (currentTime < bStart) return t('sessions.breakfast')
    if (currentTime < lStart) return t('sessions.lunch')
    if (currentTime < dStart) return t('sessions.dinner')
    return t('sessions.tomorrow_breakfast')
  }

  const updateScrollButtons = useCallback(() => {
    const el = navScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  const scrollNav = useCallback((dir: 'left' | 'right') => {
    const el = navScrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const el = navScrollRef.current
    if (!el) return
    updateScrollButtons()
    el.addEventListener('scroll', updateScrollButtons)
    const ro = new ResizeObserver(updateScrollButtons)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', updateScrollButtons); ro.disconnect() }
  }, [filteredCategories, updateScrollButtons])

  // Auto-scroll active category button into view
  useEffect(() => {
    if (!activeCategory || !navScrollRef.current) return
    const container = navScrollRef.current
    const activeBtn = container.querySelector(`[data-cat-id="${activeCategory}"]`) as HTMLElement | null
    if (activeBtn) {
      const scrollLeft = activeBtn.offsetLeft - container.offsetWidth / 2 + activeBtn.offsetWidth / 2
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  }, [activeCategory])

  const next = useCallback(() => {
    if (images.length === 0) return
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))
  }, [images.length])

  const prevSlide = useCallback(() => {
    if (images.length === 0) return
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))
  }, [images.length])

  return (
    <>
      <div className="py-0 bg-[#FAFAFA] relative" ref={ref} suppressHydrationWarning>
        <div className="max-w-5xl mx-auto px-4 md:px-6 mb-6 md:mb-10" suppressHydrationWarning>
          {!mounted || loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-black/5 rounded-sm" />
              ))}
            </div>
          ) : filteredCategories.length > 0 ? (
            <>
              {/* 1. Dynamic Status Messages & 5. Preview Controls */}
              {session !== 'normal' && (
                <div className={`${compact ? 'flex flex-col items-center mb-4 md:mb-10 gap-3 md:gap-4' : 'mb-8 flex flex-col md:flex-row items-stretch md:items-center gap-4 animate-in slide-in-from-top duration-700'}`}>
                  {/* Status Indicator */}
                  <div className={compact ? 'w-full max-w-md' : 'flex-1'}>
                    <div className={`${compact ? 'bg-black/[0.03] border border-black/10 p-2 md:p-4 rounded-sm' : 'bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-sm p-4'} flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-4 text-center sm:text-left overflow-hidden relative group`}>
                      {!compact && (
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Zap className="text-[#D4AF37]" size={40} />
                        </div>
                      )}
                      <div className="flex flex-row sm:flex-row items-center gap-3 md:gap-4">
                        <div className={`${compact ? 'w-8 h-8 md:w-10 md:h-10' : 'w-12 h-12'} rounded-full ${isRealSession ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : previewSession ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'} flex items-center justify-center shadow-lg flex-shrink-0`}>
                          {previewSession ? <Eye size={compact ? 16 : 24} /> : !isRealSession ? <Zap size={compact ? 16 : 24} /> : <Clock size={compact ? 16 : 24} className={timeRemaining ? "animate-pulse" : ""} />}
                        </div>
                        <div className="flex flex-col items-start sm:items-start text-left">
                          <p className={`text-[8px] md:text-[9px] uppercase tracking-[0.3em] font-bold mb-0 ${isRealSession ? 'text-[#D4AF37]' : previewSession ? 'text-blue-400' : 'text-red-400'}`}>
                            {previewSession ? t('sessions.preview_mode') : !isRealSession ? t('sessions.closed') : (session === 'breakfast' ? t('sessions.status_breakfast') : session === 'lunch' ? t('sessions.status_lunch') : t('sessions.status_dinner'))}
                          </p>
                          <p className="text-[#111111] text-sm md:text-lg font-serif leading-tight font-bold">
                            {previewSession ? (
                              <>{t('sessions.viewing_selection')} <span className="text-[#D4AF37]">{previewSession === 'lunch' ? t('sessions.lunch') : previewSession === 'dinner' ? t('sessions.dinner') : t('sessions.breakfast')}</span></>
                            ) : !isRealSession ? (
                              <>{t('sessions.next')}: <span className="text-[#D4AF37]">{getNextSessionLabel()}</span></>
                            ) : timeRemaining ? (
                              <>{(session === 'breakfast' ? t('sessions.closing_breakfast') : session === 'lunch' ? t('sessions.closing_lunch') : t('sessions.closing_dinner'))} <span className="text-[#D4AF37] tabular-nums">{timeRemaining}</span></>
                            ) : (
                              t('sessions.active')
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Session Navigator: Always visible even in compact mode */}
                  <div className="flex justify-center">
                    <div className={`flex bg-black/5 border border-black/10 rounded-sm p-1 gap-1 no-print ${compact ? 'scale-90 md:scale-100' : ''}`}>
                      {[
                        { id: 'breakfast', icon: <Clock size={16} />, label: t('sessions.breakfast') },
                        { id: 'lunch', icon: <Zap size={16} />, label: t('sessions.lunch') },
                        { id: 'dinner', icon: <Sparkles size={16} />, label: t('sessions.dinner') }
                      ].map((s) => {
                        const isSelected = activeSession === s.id
                        const isReal = session === s.id

                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              const nextSession = isReal ? null : s.id as Session
                              setPreviewSession(nextSession)

                              // Track session switch
                              fetch('/api/public/track-event', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  eventType: 'session_switch',
                                  eventValue: s.id,
                                  metadata: { mode: nextSession ? 'preview' : 'real', path: window.location.pathname }
                                })
                              }).catch(() => { })
                            }}
                            className={`flex flex-col items-center justify-center px-3 md:px-4 py-1.5 md:py-2 rounded-sm transition-all duration-500 min-w-[75px] md:min-w-[90px] border ${isSelected
                              ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                              : 'bg-black/5 border-transparent text-[#111111]/50 hover:text-[#111111] hover:bg-black/10'
                              }`}
                          >
                            <div className={`mb-0.5 md:mb-1 ${isSelected ? 'animate-pulse' : ''}`}>{s.icon}</div>
                            <span className="text-[8px] md:text-[9px] uppercase font-bold tracking-tighter">{s.label}</span>
                            {isReal && !previewSession && <div className="w-1 h-1 bg-black rounded-full mt-1" />}
                            {isReal && previewSession && <div className="w-1 h-1 bg-[#D4AF37] rounded-full mt-1" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Main content wrapper with dynamic tracking label */}
              <div
                data-engagement-label={`Carta: ${activeSession === 'breakfast' ? t('sessions.breakfast') : activeSession === 'lunch' ? t('sessions.lunch') : t('sessions.dinner')}`}
                className="animate-in fade-in duration-1000"
              >

                {/* 3. Smart Recommendations */}
                {recommendations.length > 0 && !compact && (
                  <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex items-center gap-2">
                        <Sparkles className="text-[#D4AF37]" size={18} />
                        <h3 className="text-[#111111] font-serif text-2xl tracking-wide font-bold">{t('featured.recommendations')}</h3>
                      </div>
                      <div className="h-px bg-gradient-to-r from-black/20 via-black/5 to-transparent flex-grow" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {recommendations.map(prod => (
                        <div key={`rec-${prod.id}`} className="bg-white shadow-sm border border-black/10 rounded-sm p-6 hover:border-[#D4AF37]/50 transition-all group relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-[#D4AF37] font-serif text-xl group-hover:text-[#111111] font-bold transition-colors">{decodeEntities(locale !== 'es' ? (prod[`name_${locale}` as keyof Product] as string) || prod.name : prod.name)}</h4>
                            <span className="text-[#D4AF37] font-bold text-sm bg-[#D4AF37]/10 px-2 py-1 rounded-sm border border-[#D4AF37]/20">{prod.price}€</span>
                          </div>
                          <p className="text-[#111111]/60 text-[11px] font-medium leading-relaxed line-clamp-2 mb-4 italic">
                            {decodeEntities(locale !== 'es' ? (prod[`description_${locale}` as keyof Product] as string) || prod.description : prod.description)}
                          </p>
                          <div className="flex items-center justify-between pt-4 border-t border-black/5">
                            <div className="flex gap-1.5">
                              {prod.allergens?.slice(0, 4).map(a => (
                                <span key={a} className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-[12px] grayscale hover:grayscale-0 transition-all border border-black/5 shadow-sm" title={ALLERGENS.find(al => al.id === a)?.label}>
                                  {ALLERGENS.find(al => al.id === a)?.icon}
                                </span>
                              ))}
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.75 }}
                              onClick={() => handleLike(prod.id)}
                              className={`flex items-center gap-1.5 transition-all duration-300 px-3 py-1.5 rounded-full border text-[10px] font-bold no-print ${likedProducts.includes(prod.id)
                                  ? 'text-red-500 bg-red-500/15 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                                  : 'text-black/40 bg-black/5 border-black/10 hover:text-red-500/70 hover:border-red-500/20'
                                }`}
                            >
                              <Heart
                                size={13}
                                className={`transition-all duration-300 ${likedProducts.includes(prod.id) ? 'fill-current' : ''}`}
                              />
                              <span>{likedProducts.includes(prod.id) ? t('product.liked') : t('product.like')}</span>
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Category Quick Navigation */}
                {filteredCategories.length > 0 && (
                  <div className={`sticky ${compact ? 'top-[70px] md:top-[85px]' : 'top-[64px] md:top-[80px]'} z-[105] bg-[#FAFAFA]/95 backdrop-blur-xl shadow-sm border-b border-black/5 transition-all duration-300`}>
                    <div className="relative flex items-center">

                      {/* Flecha izquierda */}
                      <button
                        onClick={() => scrollNav('left')}
                        aria-label="Ver categorías anteriores"
                        className={`absolute left-0 z-10 h-full px-2 flex items-center transition-all duration-200 ${canScrollLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                          }`}
                      >
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white border border-black/10 text-black hover:text-[#D4AF37] hover:border-[#D4AF37] shadow-sm transition-colors">
                          <ChevronLeft size={14} />
                        </span>
                      </button>

                      {/* Gradiente izquierdo */}
                      <div className={`absolute left-8 top-0 bottom-0 w-10 z-[1] pointer-events-none bg-gradient-to-r from-[#FAFAFA]/95 to-transparent transition-opacity duration-200 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />

                      {/* Scroll container */}
                      <div
                        ref={navScrollRef}
                        className="flex overflow-x-auto no-scrollbar gap-2 py-2 md:py-3 px-10 w-full justify-start md:justify-center"
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                        onMouseDown={(e) => {
                          setIsDragging(true)
                          dragStartX.current = e.pageX - (navScrollRef.current?.offsetLeft ?? 0)
                          dragScrollLeft.current = navScrollRef.current?.scrollLeft ?? 0
                        }}
                        onMouseLeave={() => setIsDragging(false)}
                        onMouseUp={() => setIsDragging(false)}
                        onMouseMove={(e) => {
                          if (!isDragging || !navScrollRef.current) return
                          e.preventDefault()
                          const x = e.pageX - navScrollRef.current.offsetLeft
                          const walk = (x - dragStartX.current) * 1.5
                          navScrollRef.current.scrollLeft = dragScrollLeft.current - walk
                        }}
                      >
                        {filteredCategories.map((category) => {
                          const categoryName = decodeEntities(locale !== 'es' ? (category[`name_${locale}` as keyof Category] as string) || category.name : category.name)
                          const isActive = activeCategory === category.id

                          return (
                            <button
                              key={`nav-${category.id}`}
                              data-cat-id={category.id}
                              onClick={() => {
                                const elem = document.getElementById(`cat-${category.id}`)
                                if (elem) {
                                  window.scrollTo({
                                    top: elem.getBoundingClientRect().top + window.scrollY - 250,
                                    behavior: 'smooth'
                                  })
                                  setActiveCategory(category.id)
                                }
                              }}
                              className={`whitespace-nowrap flex-shrink-0 px-5 py-2 rounded-full border text-[10px] uppercase font-bold tracking-widest transition-all duration-300 select-none ${isActive
                                ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                                : 'border-black/10 bg-black/5 text-[#111111]/50 hover:text-black hover:border-black/20'
                                }`}
                            >
                              {categoryName}
                            </button>
                          )
                        })}
                      </div>

                      {/* Gradiente derecho */}
                      <div className={`absolute right-8 top-0 bottom-0 w-10 z-[1] pointer-events-none bg-gradient-to-l from-[#FAFAFA]/95 to-transparent transition-opacity duration-200 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`} />

                      {/* Flecha derecha */}
                      <button
                        onClick={() => scrollNav('right')}
                        aria-label="Ver más categorías"
                        className={`absolute right-0 z-10 h-full px-2 flex items-center transition-all duration-200 ${canScrollRight ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                          }`}
                      >
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white border border-black/10 text-black shadow-sm hover:text-[#D4AF37] hover:border-[#D4AF37] transition-colors">
                          <ChevronRight size={14} />
                        </span>
                      </button>

                    </div>
                  </div>
                )}

                {/* Compact (mini) mode: ≤4 categories → elegant single-column list */}
                {filteredCategories.length <= 4 ? (
                  <div className="mt-4 md:mt-16 max-w-3xl mx-auto">
                    <div className="text-center mb-6 md:mb-12">
                      <h3 className="font-serif text-3xl text-[#D4AF37] mb-2 tracking-wide">
                        {activeSession === 'breakfast' ? t('sessions.status_breakfast') :
                          activeSession === 'lunch' ? t('sessions.status_lunch') :
                            activeSession === 'dinner' ? t('sessions.status_dinner') :
                              t('carta.title')}
                      </h3>
                      <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent w-48 mx-auto" />
                    </div>

                    <div className="space-y-6 md:space-y-12">
                      {filteredCategories.map((category) => {
                        const categoryName = decodeEntities(locale !== 'es' ? (category[`name_${locale}` as keyof Category] as string) || category.name : category.name)
                        return (
                          <div
                            key={category.id}
                            id={`cat-${category.id}`}
                            data-engagement-label={`cat-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className="space-y-2"
                          >
                            {/* Section Header - Only if it's not the only category or for visual clarity */}
                            <div className="flex items-center gap-4 mb-6">
                              <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-bold whitespace-nowrap">{categoryName}</span>
                              <div className="h-px bg-gradient-to-r from-[#D4AF37]/20 to-transparent flex-grow" />
                            </div>

                            <div className="grid grid-cols-1 gap-1">
                              {category.products.map((product) => {
                                const prodName = decodeEntities(locale !== 'es' ? (product[`name_${locale}` as keyof Product] as string) || product.name : product.name)
                                const prodDesc = decodeEntities(locale !== 'es' ? (product[`description_${locale}` as keyof Product] as string) || product.description : product.description)

                                let isCurrentlyWebFeatured = product.is_web_featured
                                if (product.promo_schedules && product.promo_schedules.length > 0) {
                                  const d = new Date()
                                  const cTime = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
                                  const cDay = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', weekday: 'short' }).format(d).toLowerCase()
                                  isCurrentlyWebFeatured = product.promo_schedules.some(s => s.days.includes(cDay) && cTime >= s.start && cTime <= s.end)
                                }

                                return (
                                  <div key={product.id} className="group flex flex-col sm:flex-row items-start justify-between gap-4 py-4 border-b border-black/5 last:border-0 hover:bg-black/[0.02] transition-all px-4 rounded-sm break-inside-avoid">
                                    <div className="flex-1 text-left w-full">
                                      <div className="flex justify-between items-baseline gap-4">
                                        <span className="text-[#111111] group-hover:text-[#D4AF37] transition-colors font-bold tracking-wide text-lg">{prodName}
                                          {isCurrentlyWebFeatured && (
                                            <span className="inline-flex items-center gap-1 text-[9px] bg-gradient-to-r from-[#D4AF37] to-[#E8C84A] text-black px-2 py-0.5 rounded-sm uppercase font-bold tracking-widest shadow-lg shadow-[#D4AF37]/20 border border-[#D4AF37]/30">
                                              <Star size={10} fill="currentColor" />
                                              {t('featured.our_star') || 'TOP'}
                                            </span>
                                          )}
                                          {product.is_featured && !isCurrentlyWebFeatured && (
                                            <span className="inline-flex items-center gap-1 text-[9px] bg-white/10 backdrop-blur-md text-[#D4AF37] px-2 py-0.5 rounded-sm uppercase font-bold tracking-widest border border-[#D4AF37]/30 shadow-inner">
                                              <Sparkles size={10} />
                                              {t('common.featured') || 'RECOMENDADO'}
                                            </span>
                                          )}
                                        </span>
                                        <div className="text-right shrink-0">
                                          <span className="text-[#D4AF37] font-serif text-xl tabular-nums font-bold">{product.price ? `${product.price.toFixed(2)}€` : '—'}</span>
                                          {product.price_exterior && (
                                            <p className="text-[10px] text-[#111111]/40 uppercase tracking-tighter mt-[-4px] font-bold">{t('product.terrace')}: {product.price_exterior.toFixed(2)}€</p>
                                          )}
                                        </div>
                                      </div>

                                      {prodDesc && <p className="text-[#111111]/60 font-medium text-sm mt-1 leading-relaxed pr-8 line-clamp-2 group-hover:line-clamp-none transition-all">{prodDesc}</p>}

                                      <div className="flex items-center gap-4 mt-3">
                                        {/* Allergens */}
                                        {product.allergens && product.allergens.length > 0 && (
                                          <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                            {product.allergens.map(allergenId => {
                                              const allergen = ALLERGENS.find(a => a.id === allergenId)
                                              return allergen ? (
                                                <span key={allergen.id} title={allergen.label} className="text-xs grayscale hover:grayscale-0 transition-all">{allergen.icon}</span>
                                              ) : null
                                            })}
                                          </div>
                                        )}

                                        {/* Like Button - compact mode */}
                                        <motion.button
                                          whileTap={{ scale: 0.72 }}
                                          onClick={() => handleLike(product.id)}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-300 border no-print ${likedProducts.includes(product.id)
                                              ? 'text-red-500 bg-red-500/15 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                                              : 'text-[#111111]/40 bg-black/5 border-black/10 hover:text-red-500/70 hover:border-red-500/20 hover:bg-red-500/5'
                                            }`}
                                        >
                                          <Heart
                                            size={12}
                                            className={`transition-all duration-300 ${likedProducts.includes(product.id) ? 'fill-current' : ''}`}
                                          />
                                          <span>{likedProducts.includes(product.id) ? t('product.liked') : t('product.like')}</span>
                                        </motion.button>
                                      </div>

                                      {/* Supplements */}
                                      {product.supplements && product.supplements.length > 0 && (
                                        <div className="mt-3 space-y-1.5 border-l-2 border-[#D4AF37]/20 pl-3">
                                          {product.supplements.map((sup, sIdx) => {
                                            const supName = locale === 'ca' ? sup.name_ca : locale === 'en' ? sup.name_en : locale === 'fr' ? sup.name_fr : sup.name
                                            return (
                                              <div key={sIdx} className="flex justify-between items-center text-[11px] text-[#D4AF37]/90 italic font-serif">
                                                <span>- {decodeEntities(supName || sup.name)}</span>
                                                <span className="font-bold ml-4 tabular-nums">+{sup.price.toFixed(2)}€</span>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Dinner Promotion Card (Compact Mode) */}
                    {activeSession !== 'dinner' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 p-8 bg-gradient-to-br from-[#D4AF37]/10 to-black border border-[#D4AF37]/20 rounded-sm relative overflow-hidden group/promo no-print"
                      >
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover/promo:bg-[#D4AF37]/10 transition-all duration-700" />
                        <div className="relative z-10 text-center">
                          <span className="text-[9px] uppercase tracking-[0.4em] text-[#D4AF37] font-bold mb-3 block">{t('promo.suggestion')}</span>
                          <h3 className="font-serif text-2xl text-[#111111] mb-3 font-bold">{t('promo.dinner_title')}</h3>
                          <p className="text-[#111111]/60 font-medium text-xs mb-6 max-w-sm mx-auto leading-relaxed">
                            {t('promo.dinner_desc')}
                          </p>
                          <button
                            onClick={() => setPreviewSession('dinner')}
                            className="inline-flex items-center gap-2 text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest hover:gap-3 transition-all"
                          >
                            {t('promo.dinner_cta')} <ArrowRight size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="columns-1 md:columns-2 gap-16 space-y-8 md:space-y-0 mt-6 md:mt-16">
                    {filteredCategories.map((category, catIdx) => {
                      const categoryName = decodeEntities(locale !== 'es' ? (category[`name_${locale}` as keyof Category] as string) || category.name : category.name)
                      return (
                        <motion.div
                          key={category.id}
                          id={`cat-${category.id}`}
                          data-engagement-label={`cat-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={isInView ? { opacity: 1, y: 0 } : {}}
                          transition={{ duration: 0.6, delay: 0.2 + catIdx * 0.1 }}
                          className="break-inside-avoid mb-8 md:mb-16 space-y-8 scroll-mt-64"
                        >
                          <div className={`flex items-center gap-4 pt-4 lg:pt-0 ${compact ? 'mb-4' : 'mb-8'}`}>
                            <h3 className={`font-serif text-[#D4AF37] uppercase tracking-[0.3em] whitespace-nowrap ${compact ? 'text-sm' : 'text-lg'}`}>{categoryName}</h3>
                            <div className="h-px bg-[#D4AF37]/20 w-full" />
                          </div>

                          <div className="space-y-10">
                            {category.products.map((product, productIdx) => {
                              const prodName = decodeEntities(locale !== 'es' ? (product[`name_${locale}` as keyof Product] as string) || product.name : product.name)
                              const prodDesc = decodeEntities(locale !== 'es' ? (product[`description_${locale}` as keyof Product] as string) || product.description : product.description)

                              return (
                                <div key={product.id} className="group flex flex-row gap-4 sm:gap-6 items-start break-inside-avoid">
                                  {product.image_url && (
                                    <div
                                      onClick={() => {
                                        setSelectedProductImage(product.image_url!)
                                        fetch('/api/public/track-event', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            eventType: 'product_image_view',
                                            eventValue: product.name,
                                            metadata: { path: window.location.pathname }
                                          })
                                        }).catch(() => { })
                                      }}
                                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-sm overflow-hidden flex-shrink-0 relative group/img cursor-zoom-in border border-black/5 order-2"
                                    >
                                      <Image
                                        src={product.image_url}
                                        alt={product.image_alt || prodName || 'Plato'}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover/img:scale-110"
                                        sizes="(max-width: 640px) 100vw, 128px"
                                        priority={catIdx === 0 && productIdx < 4}
                                      />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                        <ZoomIn size={20} className="text-white shadow-lg" />                                  </div>
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0 order-1">
                                    <div className="flex justify-between items-baseline gap-2 sm:gap-4 mb-2">
                                      <h4 className="text-[#111111] group-hover:text-[#D4AF37] transition-colors font-bold tracking-wide text-[15px] leading-tight flex flex-wrap items-center gap-1.5">
                                        {prodName}
                                        {(() => {
                                          let isCurrentlyWebFeatured = product.is_web_featured
                                          if (product.promo_schedules && product.promo_schedules.length > 0) {
                                            const d = new Date()
                                            const cTime = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
                                            const cDay = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', weekday: 'short' }).format(d).toLowerCase()
                                            isCurrentlyWebFeatured = product.promo_schedules.some(s => s.days.includes(cDay) && cTime >= s.start && cTime <= s.end)
                                          }
                                          return isCurrentlyWebFeatured ? (
                                            <span className="inline-flex items-center gap-1 text-[8px] bg-gradient-to-r from-[#D4AF37] to-[#E8C84A] text-black px-1.5 py-0.5 rounded-sm uppercase font-bold tracking-widest align-middle">
                                              <Star size={8} fill="currentColor" />
                                              TOP
                                            </span>
                                          ) : product.is_featured ? (
                                            <span className="inline-flex items-center gap-1 text-[8px] bg-white/10 text-[#D4AF37] px-1.5 py-0.5 rounded-sm uppercase font-bold tracking-widest align-middle border border-[#D4AF37]/30">
                                              <Sparkles size={8} />
                                              REC
                                            </span>
                                          ) : null
                                        })()}
                                      </h4>
                                      <div className="hidden sm:block flex-grow border-b border-black/10 border-dotted mx-2 translate-y-[-4px]" />
                                      <div className="text-right shrink-0">
                                        <span className="text-[#D4AF37] font-serif text-lg font-bold">{product.price?.toFixed(2)}€</span>
                                        {product.price_exterior && (
                                          <p className="text-[10px] text-[#111111]/40 font-bold uppercase tracking-tighter mt-[-4px]">{t('product.terrace')}: {product.price_exterior.toFixed(2)}€</p>
                                        )}
                                      </div>
                                    </div>

                                    {prodDesc && (
                                      <p className="text-[#111111]/60 font-medium text-xs sm:text-sm leading-relaxed mb-3 pr-2 break-words">{prodDesc}</p>
                                    )}

                                    {/* Supplements in normal mode */}
                                    {product.supplements && product.supplements.length > 0 && (
                                      <div className="mt-3 mb-4 space-y-2 bg-black/[0.03] p-3 rounded-sm border border-black/5 border-l-[#D4AF37] border-l-2">
                                        <p className="text-[9px] uppercase tracking-widest text-[#111111]/50 font-bold mb-1">Extras / Suplementos:</p>
                                        {product.supplements.map((sup, sIdx) => {
                                          const supName = locale === 'ca' ? sup.name_ca : locale === 'en' ? sup.name_en : locale === 'fr' ? sup.name_fr : sup.name
                                          return (
                                            <div key={sIdx} className="flex justify-between items-center text-xs text-[#D4AF37]">
                                              <span className="italic font-serif">- {decodeEntities(supName || sup.name)}</span>
                                              <span className="font-bold tabular-nums">+{sup.price.toFixed(2)}€</span>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between mt-3">
                                      {product.allergens && product.allergens.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                                          {product.allergens.map(allergenId => {
                                            const allergen = ALLERGENS.find(a => a.id === allergenId)
                                            return allergen ? (
                                              <div key={allergen.id} className="relative group/allergen" title={allergen.label}>
                                                <span className="text-xs grayscale group-hover/allergen:grayscale-0 transition-all">{allergen.icon}</span>
                                              </div>
                                            ) : null
                                          })}
                                        </div>
                                      ) : <div />}

                                      {/* Like button - columns mode */}
                                      <motion.button
                                        whileTap={{ scale: 0.75 }}
                                        whileHover={{ scale: 1.05 }}
                                        onClick={() => handleLike(product.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 border no-print ${likedProducts.includes(product.id)
                                            ? 'text-red-400 bg-red-500/15 border-red-500/30 shadow-[0_0_16px_rgba(239,68,68,0.2)]'
                                            : 'text-white/25 bg-white/5 border-white/10 hover:text-red-400/70 hover:bg-red-500/5 hover:border-red-500/20'
                                          }`}
                                      >
                                        <Heart
                                          size={15}
                                          className={`transition-all duration-300 ${likedProducts.includes(product.id) ? 'fill-current' : ''}`}
                                        />
                                        <span className="text-[11px] font-bold tracking-wide">
                                          {likedProducts.includes(product.id) ? t('product.liked') : t('product.like')}
                                        </span>
                                        {(product.likes_count || 0) > 0 && (
                                          <span className={`text-[10px] tabular-nums font-bold ${likedProducts.includes(product.id) ? 'text-red-500/70' : 'text-[#111111]/30'
                                            }`}>
                                            · {product.likes_count}
                                          </span>
                                        )}
                                      </motion.button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )
                    })}

                    {/* Dinner Promotion Card */}
                    {activeSession !== 'dinner' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="break-inside-avoid mb-16 p-8 bg-gradient-to-br from-[#D4AF37]/20 to-black border border-[#D4AF37]/30 rounded-sm relative overflow-hidden group/promo no-print"
                      >
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl group-hover/promo:bg-[#D4AF37]/20 transition-all duration-700" />
                        <div className="relative z-10">
                          <span className="text-[10px] uppercase tracking-[0.4em] text-[#D4AF37] font-bold mb-4 block">{t('promo.suggestion')}</span>
                          <h3 className="font-serif text-2xl text-[#111111] mb-4 leading-tight font-bold">{t('promo.full_experience')}</h3>
                          <p className="text-[#111111]/60 font-medium text-sm mb-6 leading-relaxed">
                            {t('promo.full_experience_desc')}
                          </p>
                          <button
                            onClick={() => setPreviewSession('dinner')}
                            className="flex items-center gap-2 text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest hover:gap-4 transition-all"
                          >
                            {t('promo.view_dinner_menu')} <ArrowRight size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-black/30 italic">{t('carta.subtitle')}...</p>
            </div>
          )}
        </div>

        <div className="mt-20 no-print">
          <div className="max-w-5xl mx-auto px-6 mb-8 flex justify-between items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#111111]/40 font-bold mb-2">{t('visual.story')}</p>
              <h3 className="text-[#111111] font-serif text-3xl tracking-wide font-bold">{t('visual.our_kitchen')}</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={prevSlide} className="p-3 border border-black/10 text-black/40 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all" aria-label="Ver imagen anterior de nuestra cocina">
                <ChevronLeft size={20} />
              </button>
              <button onClick={next} className="p-3 border border-black/10 text-black/40 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all" aria-label="Ver siguiente imagen de nuestra cocina">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="relative h-[60vh] md:h-[80vh] overflow-hidden group/slider">
            {images.map((img, idx) => (
              <motion.div
                key={img.id}
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: idx === current ? 1 : 0, scale: idx === current ? 1 : 1.05 }}
                transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
              >
                <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="100vw" priority={idx === 0} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              </motion.div>
            ))}

            <button
              onClick={() => setZoomed(true)}
              className="absolute bottom-10 right-10 bg-black/40 backdrop-blur-md border border-white/10 p-4 text-white hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all opacity-0 group-hover/slider:opacity-100 duration-500"
              aria-label="Ampliar imagen"
            >
              <ZoomIn size={20} />
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-24"
        >
          <p className="text-[#111111]/40 font-bold text-xs mb-6 tracking-widest uppercase">¿Deseas reservar una mesa?</p>
          <a href="tel:+34937537510" className="btn-gold flex items-center justify-center gap-3 mx-auto max-w-[280px] py-4" aria-label="Llamar para reservar mesa">
            <Phone size={18} />
            {t('menu.reserve')}
          </a>
        </motion.div>

        {zoomed && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setZoomed(false)}
          >
            <button className="absolute top-6 right-6 text-white/70 hover:text-[#D4AF37] transition-colors"><X size={32} /></button>
            <div className="relative w-full max-w-5xl h-[85vh]">
              <Image src={images[current].url} alt={images[current].alt} fill className="object-contain" sizes="100vw" />
            </div>
          </motion.div>
        )}

        {selectedProductImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/98 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-md"
            onClick={() => setSelectedProductImage(null)}
          >
            <button className="absolute top-6 right-6 text-white/70 hover:text-[#D4AF37] transition-colors z-[120]">
              <X size={32} />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-4xl h-[80vh] shadow-2xl"
            >
              <Image
                src={selectedProductImage}
                alt="Plato El Balconet"
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </div>

    </>
  )
}
