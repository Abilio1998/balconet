'use client'

import { useI18n } from '@/context/I18nContext'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { Phone, UtensilsCrossed, Clock, Zap, Calendar, ArrowRight, Heart } from 'lucide-react'
import { getBrand } from '@/lib/brand-config'

type Dish = {
  id: string
  name: string
  name_ca?: string | null
  name_en?: string | null
  name_fr?: string | null
  description: string
  description_ca?: string | null
  description_en?: string | null
  description_fr?: string | null
  course: 'first' | 'second' | 'dessert'
  supplement?: number
  allergens?: string[]
  likes_count?: number
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

type DailyMenu = {
  id: string
  date: string
  price: number
  price_exterior?: number
  is_holiday?: boolean
  dishes: Dish[]
  published: boolean
}

interface MenuSectionProps {
  selectedAllergens: string[]
  settings?: any
  compact?: boolean
}

export default function MenuSection({ selectedAllergens, settings, compact = false }: MenuSectionProps) {
  const { t, locale } = useI18n()
  const brand = getBrand()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [menu, setMenu] = useState<DailyMenu | null>(null)
  const [tomorrowMenu, setTomorrowMenu] = useState<DailyMenu | null>(null)
  const [loading, setLoading] = useState(true)
  const [formattedDate, setFormattedDate] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const [likedDishes, setLikedDishes] = useState<string[]>([])
  
  const [menuStatus, setMenuStatus] = useState<'active' | 'upcoming' | 'tomorrow' | 'none'>('none')
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
  const [previewTomorrow, setPreviewTomorrow] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('el-balconet-dish-likes')
    if (saved) setLikedDishes(JSON.parse(saved))
    
    fetch(`/api/menu/today`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setMenu(data.menu ?? null)
        setTomorrowMenu(data.tomorrowMenu ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLikeDish = async (dishId: string) => {
    const isLiked = likedDishes.includes(dishId)
    const action = isLiked ? 'unlike' : 'like'

    // Optimistic update
    const newLikedDishes = isLiked
      ? likedDishes.filter(id => id !== dishId)
      : [...likedDishes, dishId]
    setLikedDishes(newLikedDishes)
    localStorage.setItem('el-balconet-dish-likes', JSON.stringify(newLikedDishes))

    // Update local count optimistically
    const updateMenuLikes = (m: DailyMenu | null) =>
      m ? { ...m, dishes: m.dishes.map(d => d.id === dishId ? { ...d, likes_count: Math.max(0, (d.likes_count || 0) + (isLiked ? -1 : 1)) } : d) } : m
    setMenu(prev => updateMenuLikes(prev))
    setTomorrowMenu(prev => updateMenuLikes(prev))

    try {
      await fetch('/api/public/like-dish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishId, action })
      })
    } catch (err) {
      console.error('Error liking dish:', err)
    }
  }

  // Timer and Status Logic
  useEffect(() => {
    if (loading || !mounted) return

    const updateTimer = () => {
      const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/Madrid"}))
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes()
      
      const dayOfWeek = now.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || (menu?.is_holiday ?? false)
      
      const lunchStartStr = settings?.lunch_start || '13:00'
      const lunchEndStr = isWeekend ? (settings?.lunch_end_weekend || settings?.lunch_end || '16:30') : (settings?.lunch_end || '16:00')
      
      const [sh, sm] = lunchStartStr.split(':').map(Number)
      const [eh, em] = lunchEndStr.split(':').map(Number)
      const startTotalMinutes = sh * 60 + sm
      const endTotalMinutes = eh * 60 + em

      if (currentTotalMinutes < startTotalMinutes) {
        setMenuStatus('upcoming')
        const diff = startTotalMinutes - currentTotalMinutes
        const hours = Math.floor(diff / 60)
        const mins = diff % 60
        setTimeRemaining(hours > 0 ? `${hours}h ${mins}min` : `${mins}min`)
        setFormattedDate(new Date().toLocaleDateString(locale === 'ca' ? 'ca-ES' : locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
      } else if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes) {
        setMenuStatus('active')
        const diff = endTotalMinutes - currentTotalMinutes
        const hours = Math.floor(diff / 60)
        const mins = diff % 60
        setTimeRemaining(hours > 0 ? `${hours}h ${mins}min` : `${mins}min`)
        setFormattedDate(new Date().toLocaleDateString(locale === 'ca' ? 'ca-ES' : locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
      } else {
        setMenuStatus('tomorrow')
        setTimeRemaining(null)
        // Set date to tomorrow
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        setFormattedDate(tomorrow.toLocaleDateString(locale === 'ca' ? 'ca-ES' : locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 60000)
    return () => clearInterval(timer)
  }, [loading, mounted, settings, locale])

  const isTomorrowView = menuStatus === 'tomorrow' || previewTomorrow
  const activeMenu = isTomorrowView ? tomorrowMenu : menu

  // Determine if the currently displayed menu is for a weekend
  const isWeekendMenu = activeMenu ? (() => {
    if (activeMenu.is_holiday) return true
    if (!activeMenu.date) return false
    const d = new Date(activeMenu.date)
    const day = d.getDay()
    return day === 0 || day === 6 // 0 = Sunday, 6 = Saturday
  })() : false

  const courses: Array<{ key: DailyMenu['dishes'][number]['course']; label: string }> = [
    { key: 'first', label: t('menu.first_course') },
    { key: 'second', label: t('menu.second_course') },
    { key: 'dessert', label: t('menu.dessert') },
  ]

  return (
    <div className="py-0" ref={ref} suppressHydrationWarning>
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        {compact && (
          <div className="flex flex-col items-center mb-8 gap-2">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#D4AF37] tracking-[0.3em] uppercase text-[9px] font-bold"
              suppressHydrationWarning
            >
              {formattedDate}
            </motion.p>
            {mounted && !loading && menuStatus !== 'active' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border ${
                  menuStatus === 'tomorrow' || previewTomorrow
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]'
                    : 'bg-black/5 border-black/10 text-black/50 font-bold'
                }`}
              >
                {menuStatus === 'tomorrow' || previewTomorrow ? (
                  <span className="flex items-center gap-1.5"><Calendar size={10} /> {t('sessions.viewing_tomorrow')}</span>
                ) : menuStatus === 'upcoming' ? (
                  <span className="flex items-center gap-1.5"><Clock size={10} /> {t('sessions.available_in')} {timeRemaining}</span>
                ) : (
                  <span className="flex items-center gap-1.5"><Clock size={10} /> {t('sessions.closed')}</span>
                )}
              </motion.div>
            )}
          </div>
        )}
        {!compact && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
            suppressHydrationWarning
          >
            <p className="text-[#D4AF37] tracking-[0.4em] uppercase text-xs font-medium mb-4 min-h-[1em]" suppressHydrationWarning>
              {formattedDate}
            </p>
            <h2 className="section-title mb-4" suppressHydrationWarning>{t('menu.title')}</h2>
            <div className="gold-divider" />
            <p className="text-[#111111]/60 text-sm tracking-wide mt-4 font-medium" suppressHydrationWarning>{t('menu.subtitle')}</p>
            <div className="mt-6 flex flex-col items-center gap-1" suppressHydrationWarning>
              <p className="text-[#D4AF37] text-xs font-medium tracking-widest uppercase bg-[#D4AF37]/10 px-3 py-1 rounded-sm border border-[#D4AF37]/20">
                L A V: 13:00H - 16:00H
              </p>
              <p className="text-[#111111]/80 text-xs font-bold tracking-widest uppercase mt-1">
                SÁB, DOM Y FESTIVOS: 13:00H - 16:30H
              </p>
            </div>
          </motion.div>
        )}

        {/* Dynamic Status Banner */}
        {mounted && !loading && !compact && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 flex justify-center no-print"
          >
            <div className={`max-w-2xl w-full border rounded-sm p-4 flex items-center justify-between overflow-hidden relative group ${
              menuStatus === 'active' 
                ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30' 
                : menuStatus === 'upcoming' 
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-black/5 border-black/10 shadow-sm'
            }`}>
               <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                 {isTomorrowView ? <Calendar size={40} className="text-white" /> : <Zap size={40} className={menuStatus === 'active' ? 'text-[#D4AF37]' : 'text-blue-400'} />}
               </div>
               <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                   menuStatus === 'active' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 
                   menuStatus === 'upcoming' ? 'bg-blue-500/20 text-blue-500' :
                   'bg-black/10 text-[#111111]/70'
                 }`}>
                   <Clock size={24} className={menuStatus === 'active' || menuStatus === 'upcoming' ? "animate-pulse" : ""} />
                 </div>
                 <div>
                   <p className={`text-[10px] uppercase tracking-[0.3em] font-bold mb-0.5 ${
                     menuStatus === 'active' ? 'text-[#D4AF37]' : 
                     menuStatus === 'upcoming' ? 'text-blue-500' :
                     'text-[#111111]/60'
                   }`}>
                     {menuStatus === 'active' ? t('sessions.status_lunch') : 
                      menuStatus === 'upcoming' ? t('sessions.next') : t('sessions.closed')}
                   </p>
                   <p className="text-[#111111] text-lg font-serif font-bold">
                     {isTomorrowView ? (
                       <span className="text-[#111111]/80">{t('sessions.viewing_tomorrow')}</span>
                     ) : menuStatus === 'active' ? (
                       <>{t('sessions.closing_lunch').split(' en')[0]} <span className="text-[#D4AF37] tabular-nums">{timeRemaining}</span></>
                     ) : menuStatus === 'upcoming' ? (
                       <>{t('sessions.available_in')} <span className="text-blue-500 tabular-nums">{timeRemaining}</span></>
                     ) : (
                       <span className="text-[#111111]/60">{t('sessions.opening_tomorrow')}</span>
                     )}
                   </p>
                 </div>
               </div>
               
               {/* Preview Button */}
               {menuStatus !== 'tomorrow' && (
                 <button 
                   onClick={() => setPreviewTomorrow(!previewTomorrow)}
                   className={`hidden sm:flex relative z-10 items-center gap-2 px-4 py-2 rounded-sm border transition-all duration-300 ${
                     previewTomorrow 
                     ? 'bg-blue-500/20 border-blue-500/50 text-[#111111]' 
                     : 'bg-black/5 border-black/10 text-[#111111]/70 hover:text-[#111111] hover:border-black/30'
                   }`}
                 >
                   {previewTomorrow ? <Calendar size={16} /> : <ArrowRight size={16} />}
                   <span className="text-[10px] uppercase tracking-widest font-bold">
                     {previewTomorrow ? t('menu.back_to_today') : t('menu.view_tomorrow')}
                   </span>
                 </button>
               )}
            </div>
          </motion.div>
        )}

        {!mounted || loading ? (
          /* Skeleton */
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-black/5 rounded-sm" />
            ))}
          </div>
        ) : !activeMenu ? (
          /* No menu */
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center py-16"
          >
            <UtensilsCrossed size={48} className="text-[#D4AF37]/50 mx-auto mb-4" />
            <p className="text-[#111111]/80 font-bold text-lg mb-2">
              {isTomorrowView 
                ? t('menu.tomorrow_not_published') 
                : t('menu.no_menu')}
            </p>
            <p className="text-[#111111]/50 text-sm mb-8 font-medium">
              {isTomorrowView
                ? t('menu.tomorrow_preparing')
                : t('menu.preparing_today')}
            </p>
            <a href={brand.phoneUrl} className="btn-outline">
              <Phone size={16} />
              {t('menu.call_us')}
            </a>
          </motion.div>
        ) : (
          <div>
            {/* Price badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-12"
            >
              <div className="border border-[#D4AF37] px-10 py-6 text-center min-w-[280px]">
                <p className="text-[#D4AF37]/60 text-xs tracking-[0.3em] uppercase mb-4">{t('menu.price')}</p>
                <div className={`grid gap-4 ${activeMenu.price_exterior ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div>
                    <p className="font-serif text-4xl text-[#D4AF37] font-bold">{activeMenu.price}€</p>
                    {activeMenu.price_exterior && <p className="text-[#111111]/50 text-[10px] uppercase tracking-widest mt-1 font-bold">Sala</p>}
                  </div>
                  {activeMenu.price_exterior && (
                    <div className="border-l border-[#D4AF37]/20 pl-4">
                      <p className="font-serif text-4xl text-[#D4AF37] font-bold">{activeMenu.price_exterior}€</p>
                      <p className="text-[#111111]/50 text-[10px] uppercase tracking-widest mt-1 font-bold">Terraza</p>
                    </div>
                  )}
                </div>
                <p className="text-[#111111]/50 text-xs mt-4 tracking-wide pt-4 border-t border-[#D4AF37]/20 font-bold">
                  {isWeekendMenu ? t('menu.includes_weekend') : t('menu.includes')}
                </p>
              </div>
            </motion.div>

            {/* Courses */}
            {courses.map((course, courseIdx) => {
              const dishes = activeMenu.dishes.filter((d) => {
                const isCorrectCourse = d.course === course.key
                if (!isCorrectCourse) return false
                
                // Multi-Allergen exclusion filter
                if (selectedAllergens.length > 0 && d.allergens) {
                  const hasExcluded = selectedAllergens.some(a => d.allergens?.includes(a))
                  if (hasExcluded) return false
                }
                
                return true
              })

              if (dishes.length === 0) return null
              return (
                <motion.div
                  key={course.key}
                  id={`menu-${course.key}`}
                  data-engagement-label={`Menú: ${course.label}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 + courseIdx * 0.15 }}
                  className="mb-10 break-inside-avoid"
                >
                  <h3 className="font-serif text-xl text-[#D4AF37] mb-6 flex items-center justify-center gap-3 text-center">
                    <span className="text-[#D4AF37]/30 text-sm font-mono hidden md:inline">0{courseIdx + 1}</span>
                    {course.label}
                    <span className="text-[#D4AF37]/30 text-sm font-mono hidden md:inline">0{courseIdx + 1}</span>
                  </h3>
                  <div className="space-y-4 max-w-2xl mx-auto">
                    {dishes.map((dish, i) => {
                      const displayName = locale !== 'es' ? (dish[`name_${locale}` as keyof Dish] as string) || dish.name : dish.name
                      const displayDesc = locale !== 'es' ? (dish[`description_${locale}` as keyof Dish] as string) || dish.description : dish.description

                      return (
                        <div
                          key={dish.id}
                          className="flex flex-col items-center text-center pb-2 border-b border-black/5 last:border-0 group break-inside-avoid"
                        >
                          <p className="text-[#111111] group-hover:text-[#D4AF37] transition-colors font-bold flex items-center justify-center gap-3">
                            {displayName}
                            {dish.supplement && dish.supplement > 0 ? (
                              <span className="text-[#D4AF37] font-bold text-xs px-2.5 py-1 border border-[#D4AF37]/30 rounded bg-[#D4AF37]/10 shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                                + {dish.supplement.toFixed(2)}€
                              </span>
                            ) : null}
                            <motion.button
                              whileTap={{ scale: 0.7 }}
                              onClick={() => handleLikeDish(dish.id)}
                              title={likedDishes.includes(dish.id) ? t('product.liked') : t('product.like')}
                              className={`no-print flex-shrink-0 transition-all duration-300 ${
                                likedDishes.includes(dish.id)
                                  ? 'text-red-500 opacity-100'
                                  : 'text-black/20 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-red-500/70'
                              }`}
                            >
                              <Heart
                                size={13}
                                className={`transition-all duration-300 ${likedDishes.includes(dish.id) ? 'fill-current' : ''}`}
                              />
                            </motion.button>
                          </p>
                          
                          {displayDesc && (
                            <p className="text-[#111111]/60 font-medium text-sm mt-1 max-w-lg">{displayDesc}</p>
                          )}

                          {dish.allergens && dish.allergens.length > 0 && (
                            <div className="flex justify-center flex-wrap gap-1.5 mt-2 opacity-60 group-hover:opacity-100 transition-opacity w-full">
                              {dish.allergens.map(allergenId => {
                                const allergen = ALLERGENS.find(a => a.id === allergenId)
                                return allergen ? (
                                  <div 
                                    key={allergen.id} 
                                    className="group/allergen relative flex items-center justify-center gap-1.5 w-auto px-2 h-6 rounded-full bg-black/5 hover:bg-black/10 transition-colors cursor-help border border-black/5 shadow-sm"
                                  >
                                    <span className="text-[10px] grayscale opacity-70 group-hover/allergen:opacity-100 group-hover/allergen:grayscale-0 transition-all duration-300 pointer-events-none select-none">{allergen.icon}</span>
                                    
                                    {/* Visible label */}
                                    <span className="text-[9px] text-[#111111]/60 uppercase tracking-widest font-mono mt-[1px] font-bold">
                                      {allergen.label}
                                    </span>
                                  </div>
                                ) : null
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )
            })}

            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-16 no-print"
            >
            <a href={brand.phoneUrl} className="btn-gold w-full sm:w-auto" aria-label={`Llamar para reservar mesa en ${brand.name}`}>
              <Phone size={15} />
              {t('menu.reserve')}
            </a>
              <a href="/#carta" className="btn-outline w-full sm:w-auto" aria-label="Explorar nuestra carta completa de platos y sugerencias">
                <UtensilsCrossed size={15} />
                {t('carta.view_full')}
              </a>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
