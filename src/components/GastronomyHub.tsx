'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/context/I18nContext'
import { useInView } from 'framer-motion'
import MenuSection from './MenuSection'
import CartaSection from './CartaSection'
import FloatingSessionStatus from './FloatingSessionStatus'
import { Utensils, BookOpen, ChevronDown, ChevronUp, X, Filter, ArrowUp } from 'lucide-react'

const ALL_ALLERGENS = [
  { id: 'gluten', icon: '🌾' },
  { id: 'dairy', icon: '🥛' },
  { id: 'eggs', icon: '🥚' },
  { id: 'nuts', icon: '🌰' },
  { id: 'fish', icon: '🐟' },
  { id: 'crustaceans', icon: '🦐' },
  { id: 'peanuts', icon: '🥜' },
  { id: 'soybeans', icon: '🌿' },
  { id: 'celery', icon: '🥬' },
  { id: 'mustard', icon: '🟡' },
  { id: 'sesame', icon: '🌱' },
  { id: 'sulphites', icon: '🍷' },
  { id: 'lupin', icon: '🌼' },
  { id: 'molluscs', icon: '🐙' }
]

export default function GastronomyHub() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'menu' | 'carta'>('menu')
  const [session, setSession] = useState<'lunch' | 'dinner' | 'breakfast' | 'normal'>('normal')
  const [hours, setHours] = useState<any>(null)
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])
  const [showFullFilters, setShowFullFilters] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  // Fetch settings ONCE
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/public/settings`) // Removed ?t= cache buster
        const data = await res.json()
        if (data.settings) {
          setHours(data.settings)
        }
      } catch (err) {
        console.error('Error fetching session settings:', err)
      }
    }
    fetchSettings()
  }, [])

  // Recalculate session locally every minute based on fetched settings
  useEffect(() => {
    if (!hours) return

    const checkSession = () => {
      // Force Spain Time for robustness
      const nowInSpain = new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/Madrid"}));
      const currentTime = nowInSpain.getHours() * 60 + nowInSpain.getMinutes()
      
      const parseTime = (t: string | undefined | null) => {
        if (!t) return 0
        const [h, m] = t.split(':').map(Number)
        return (h || 0) * 60 + (m || 0)
      }
      
      const breakfastStart = parseTime(hours.breakfast_start)
      const breakfastEnd = parseTime(hours.breakfast_end)
      const lunchStart = parseTime(hours.lunch_start)
      const lunchEnd = parseTime(hours.lunch_end)
      const dinnerStart = parseTime(hours.dinner_start)
      const dinnerEnd = parseTime(hours.dinner_end)
      
      const isWithinTime = (current: number, start: number, end: number) => {
        if (end < start) return current >= start || current <= end
        return current >= start && current <= end
      }
      
      if (isWithinTime(currentTime, breakfastStart, breakfastEnd) && hours.breakfast_menu_active) {
        setSession('breakfast')
      } else if (isWithinTime(currentTime, lunchStart, lunchEnd) && hours.lunch_menu_active) {
        setSession('lunch')
      } else if (isWithinTime(currentTime, dinnerStart, dinnerEnd) && hours.dinner_menu_active) {
        setSession('dinner')
      } else {
        // FALLBACK: Outside specific mini-menu hours
        setSession('breakfast')
      }
    }

    checkSession()
    const interval = setInterval(checkSession, 60000)
    return () => clearInterval(interval)
  }, [hours])

  // Intercept hash from URL for navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash === '#menu') setActiveTab('menu')
      if (hash === '#carta') setActiveTab('carta')
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const toggleAllergen = (id: string) => {
    setSelectedAllergens(prev => {
      const isSelected = prev.includes(id)
      const next = isSelected ? prev.filter(a => a !== id) : [...prev, id]
      
      // Track interaction (only on selection)
      if (!isSelected) {
        fetch('/api/public/track-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'allergen_filter',
            eventValue: id,
            metadata: { context: 'gastronomy_hub' }
          })
        }).catch(() => {})
      }
      
      return next
    })
  }

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTabs = () => {
    const selector = document.getElementById('gastronomy-tab-selector')
    if (selector) {
      const offset = 100
      const bodyRect = document.body.getBoundingClientRect().top
      const elementRect = selector.getBoundingClientRect().top
      const elementPosition = elementRect - bodyRect
      const offsetPosition = elementPosition - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const clearFilters = () => setSelectedAllergens([])

  return (
    <section 
      id="gastronomy" 
      data-engagement-label={activeTab === 'menu' ? 'Menú del Día' : 'La Carta (General)'}
      className="bg-[#FAFAFA] pt-4 md:pt-8 pb-8 md:pb-12 relative" 
      ref={ref} 
      suppressHydrationWarning
    >
      {/* Invisible anchor targets to ensure navigation works regardless of active tab */}
      <div id="menu" className="absolute -top-20" />
      <div id="carta" className="absolute -top-20" />
      <div className="max-w-5xl mx-auto px-6">
        {/* Unified Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-4 md:mb-10"
          suppressHydrationWarning
        >
          <div className="flex flex-col items-center gap-1 md:gap-2 mb-4 md:mb-6">
            <p className="text-[#D4AF37] tracking-[0.4em] uppercase text-[8px] md:text-[10px] font-bold">
              {t('nav.gastronomy') || 'Gastronomía'}
            </p>
            <h2 className="font-serif text-2xl md:text-5xl text-[#111111] tracking-tight">
              {activeTab === 'menu' ? t('menu.title') : t('carta.title')}
            </h2>
            <div className="h-0.5 md:h-1 w-8 md:w-12 bg-[#D4AF37] mt-1" />
          </div>
          
          <p className="text-black/50 text-[9px] md:text-xs uppercase tracking-[0.2em] max-w-2xl mx-auto leading-relaxed md:block hidden font-bold">
            {activeTab === 'menu' ? t('menu.subtitle') : t('carta.subtitle')}
          </p>
        </motion.div>

        {/* Premium Tab Selector */}
        <div id="gastronomy-tab-selector" className="flex justify-center mb-4 md:mb-8 px-2">
          <div className="inline-flex p-1 bg-black/[0.03] backdrop-blur-md rounded-full border border-black/5 shadow-sm relative">
            <button
              onClick={() => setActiveTab('menu')}
              className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-500 ${
                activeTab === 'menu' ? 'text-black' : 'text-black/40 hover:text-black'
              }`}
            >
              <Utensils size={12} className={activeTab === 'menu' ? 'text-black' : 'text-[#D4AF37]'} />
              {t('nav.menu') || 'Menú Diario'}
            </button>
            <button
              onClick={() => setActiveTab('carta')}
              className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-500 ${
                activeTab === 'carta' ? 'text-black' : 'text-black/40 hover:text-black'
              }`}
            >
              <BookOpen size={12} className={activeTab === 'carta' ? 'text-black' : 'text-[#D4AF37]'} />
              {t('nav.carta') || 'La Carta'}
            </button>
            
            {/* Animated Slider Background */}
            <motion.div
              className="absolute top-1 bottom-1 left-1 bg-[#D4AF37] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]"
              initial={false}
              animate={{
                x: activeTab === 'menu' ? '0%' : '100%',
                width: 'calc(50% - 2px)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            />
          </div>
        </div>

        {/* Unified Allergen Filter System */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-4 md:mb-8"
        >
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 md:gap-6 overflow-x-auto no-scrollbar max-w-full pb-4 px-2 scroll-smooth">
              {(showFullFilters ? ALL_ALLERGENS : ALL_ALLERGENS.slice(0, 8)).map(all => {
                const isActive = selectedAllergens.includes(all.id)
                return (
                  <button
                    key={all.id}
                    onClick={() => toggleAllergen(all.id)}
                    className="flex-shrink-0 group flex flex-col items-center gap-1.5 transition-all duration-300"
                  >
                    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center border transition-all duration-500 ${
                      isActive 
                        ? 'bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                        : 'bg-black/5 border-black/10 group-hover:border-black/30'
                    }`}>
                      <span className={`text-base md:text-lg transition-all duration-500 ${isActive ? 'grayscale-0 scale-110' : 'grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0'}`}>
                        {all.icon}
                      </span>
                    </div>
                    <span className={`text-[8px] uppercase tracking-tighter font-bold transition-colors hidden md:block ${isActive ? 'text-red-500' : 'text-black/30 group-hover:text-black/70'}`}>
                      {t(`allergens.${all.id}`)}
                    </span>
                  </button>
                )
              })}
              
              <button
                onClick={() => setShowFullFilters(!showFullFilters)}
                className="group flex flex-col items-center gap-2 transition-all"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center border border-dashed border-black/20 bg-black/5 group-hover:border-black/40 group-hover:bg-black/10 transition-all">
                  {showFullFilters ? <ChevronUp size={14} className="text-black/40" /> : <ChevronDown size={14} className="text-black/40" />}
                </div>
                <span className="text-[8px] uppercase tracking-tighter font-bold text-black/30 group-hover:text-black/70">
                  {showFullFilters ? t('common.show_less') : t('common.filters') || 'Filtros'}
                </span>
              </button>
            </div>

            {selectedAllergens.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6"
              >
                <button 
                  onClick={clearFilters}
                  className="text-[9px] uppercase tracking-[0.2em] text-red-500/80 hover:text-red-500 transition-colors flex items-center gap-2 bg-red-500/5 px-4 py-1.5 rounded-full border border-red-500/20"
                >
                  <X size={10} /> {t('common.clear')} ({selectedAllergens.length})
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>


        {/* Content Area */}
        <div className="relative min-h-[400px]">
          {activeTab === 'menu' ? (
            <MenuSection selectedAllergens={selectedAllergens} settings={hours} compact={true} />
          ) : (
            <CartaSection session={session} selectedAllergens={selectedAllergens} settings={hours} compact={true} />
          )}
        </div>
      </div>
      <FloatingSessionStatus settings={hours} />
      
      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTabs}
            className="fixed bottom-[8.5rem] right-4 md:bottom-[9rem] md:right-6 z-[119] w-10 h-10 md:w-11 md:h-11 bg-[#D4AF37] text-black rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            aria-label="Volver arriba"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </section>
  )
}
