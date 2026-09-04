'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MenuSection from '@/components/MenuSection'
import CartaSection from '@/components/CartaSection'
import FloatingSessionStatus from '@/components/FloatingSessionStatus'
import FeaturedDishModal from '@/components/FeaturedDishModal'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/context/I18nContext'
import { UtensilsCrossed, BookOpen, ChevronDown, ChevronUp, X, Info, ArrowUp } from 'lucide-react'

const ALLERGENS = [
  { id: 'gluten', icon: '🌾' },
  { id: 'crustaceans', icon: '🦐' },
  { id: 'eggs', icon: '🥚' },
  { id: 'fish', icon: '🐟' },
  { id: 'peanuts', icon: '🥜' },
  { id: 'soybeans', icon: '🌿' },
  { id: 'dairy', icon: '🥛' },
  { id: 'nuts', icon: '🌰' },
  { id: 'celery', icon: '🥬' },
  { id: 'mustard', icon: '🟡' },
  { id: 'sesame', icon: '🌱' },
  { id: 'sulphites', icon: '🍷' },
  { id: 'lupin', icon: '🌼' },
  { id: 'molluscs', icon: '🐙' }
]

export default function MenuPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'menu' | 'carta'>('menu')
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])
  const [showAllAllergens, setShowAllAllergens] = useState(false)
  const [session, setSession] = useState<'lunch' | 'dinner' | 'breakfast' | 'normal'>('normal')

  const [settings, setSettings] = useState<any>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTabs = () => {
    const elem = document.getElementById('menu-tab-selector')
    if (elem) {
      const navHeight = 100
      const pos = elem.getBoundingClientRect().top + window.scrollY - navHeight
      window.scrollTo({ top: pos, behavior: 'smooth' })
    }
  }

  // Fetch settings ONCE
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/public/settings`) // Removed ?t= cache buster
        const data = await res.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      } catch (err) {
        console.error('Error fetching session settings:', err)
      }
    }
    fetchSettings()
  }, [])

  // Recalculate session locally every minute based on fetched settings
  useEffect(() => {
    if (!settings) return

    const checkSession = () => {
      const nowInSpain = new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/Madrid"}));
      const currentTime = nowInSpain.getHours() * 60 + nowInSpain.getMinutes()
      
      const parseTime = (t: string) => {
        if (!t) return 0
        const [h, m] = t.split(':').map(Number)
        return h * 60 + (m || 0)
      }
      
      const breakfastStart = parseTime(settings.breakfast_start)
      const breakfastEnd = parseTime(settings.breakfast_end)
      const lunchStart = parseTime(settings.lunch_start)
      const lunchEnd = parseTime(settings.lunch_end)
      const dinnerStart = parseTime(settings.dinner_start)
      const dinnerEnd = parseTime(settings.dinner_end)
      
      const isWithinTime = (current: number, start: number, end: number) => {
        if (end < start) {
          // Session wraps around midnight (e.g. 20:00 to 01:00)
          return current >= start || current <= end
        }
        return current >= start && current <= end
      }
      
      if (isWithinTime(currentTime, breakfastStart, breakfastEnd) && settings.breakfast_menu_active) {
        setSession('breakfast')
      } else if (isWithinTime(currentTime, lunchStart, lunchEnd) && settings.lunch_menu_active) {
        setSession('lunch')
      } else if (isWithinTime(currentTime, dinnerStart, dinnerEnd) && settings.dinner_menu_active) {
        setSession('dinner')
      } else {
        // FALLBACK: Outside all sessions, show Breakfast menu
        setSession('breakfast')
      }
    }

    checkSession()
    const interval = setInterval(checkSession, 60000)
    return () => clearInterval(interval)
  }, [settings])

  const toggleAllergen = (id: string) => {
    setSelectedAllergens(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
    
    // Track analytics (optional, since TrafficTracker handles the visit)
    fetch('/api/public/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'allergen_filter',
        eventValue: id,
        metadata: { path: '/menu' }
      })
    }).catch(() => {})
  }


  return (
    <main className="min-h-screen bg-[#FAFAFA] flex flex-col pt-20 md:pt-24">
      <FeaturedDishModal />
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-6 md:py-12">
        <header className="text-center mb-4 md:mb-12 px-2">
          <h1 className="font-serif text-2xl md:text-4xl mb-2 md:mb-4 text-[#D4AF37] tracking-tight">{t('nav.gastronomy')}</h1>
          <p className="text-black/50 text-[10px] md:text-sm max-w-lg mx-auto leading-relaxed md:block hidden font-bold">
            {t('carta.subtitle')}
          </p>
        </header>

        {/* Premium Tab Selector */}
        <div id="menu-tab-selector" className="flex justify-center mb-4 md:mb-8 px-2">
          <div className="inline-flex p-1 bg-black/[0.03] backdrop-blur-md rounded-full border border-black/5 shadow-sm relative">
            <button
              onClick={() => setActiveTab('menu')}
              className={`relative z-10 flex items-center gap-2 px-8 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-500 ${
                activeTab === 'menu' ? 'text-black' : 'text-black/40 hover:text-black'
              }`}
            >
              <UtensilsCrossed size={14} className={activeTab === 'menu' ? 'text-black' : 'text-[#D4AF37]'} />
              {t('gastronomy.daily_menu')}
            </button>
            <button
              onClick={() => setActiveTab('carta')}
              className={`relative z-10 flex items-center gap-2 px-8 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-500 ${
                activeTab === 'carta' ? 'text-black' : 'text-black/40 hover:text-black'
              }`}
            >
              <BookOpen size={14} className={activeTab === 'carta' ? 'text-black' : 'text-[#D4AF37]'} />
              {t('gastronomy.full_menu')}
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-4 md:mb-12"
        >
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 md:gap-6 overflow-x-auto no-scrollbar max-w-full pb-4 px-2 scroll-smooth">
              {(showAllAllergens ? ALLERGENS : ALLERGENS.slice(0, 8)).map(all => {
                const isActive = selectedAllergens.includes(all.id)
                return (
                  <button
                    key={all.id}
                    onClick={() => toggleAllergen(all.id)}
                    className="flex-shrink-0 group flex flex-col items-center gap-1.5 transition-all duration-300"
                  >
                    <div className={`w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center border transition-all duration-500 ${
                      isActive 
                        ? 'bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                        : 'bg-black/5 border-black/10 group-hover:border-black/30'
                    }`}>
                      <span className={`text-base md:text-xl transition-all duration-500 ${isActive ? 'grayscale-0 scale-110' : 'grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0'}`}>
                        {all.icon}
                      </span>
                    </div>
                    <span className={`text-[8px] md:text-[9px] uppercase tracking-tighter font-bold transition-colors hidden md:block ${isActive ? 'text-red-500' : 'text-black/30 group-hover:text-black/70'}`}>
                      {t(`allergens.${all.id}`)}
                    </span>
                  </button>
                )
              })}
              
              <button
                onClick={() => setShowAllAllergens(!showAllAllergens)}
                className="group flex flex-col items-center gap-2 transition-all"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center border border-dashed border-black/20 bg-black/5 group-hover:border-black/40 group-hover:bg-black/10 transition-all">
                  {showAllAllergens ? <ChevronUp size={16} className="text-black/40" /> : <ChevronDown size={16} className="text-black/40" />}
                </div>
                <span className="text-[9px] uppercase tracking-tighter font-bold text-black/30 group-hover:text-black/70">
                  {showAllAllergens ? t('common.show_less') : t('common.filters') || 'Filtros'}
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
                  onClick={() => setSelectedAllergens([])}
                  className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-red-500/80 hover:text-red-500 transition-colors flex items-center gap-2 bg-red-500/5 px-4 md:px-6 py-1.5 md:py-2 rounded-full border border-red-500/20"
                >
                  <X size={10} /> {t('common.clear')} ({selectedAllergens.length})
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Content Area */}
        <div 
          id={activeTab} 
          data-engagement-label={activeTab === 'menu' ? 'Menú del Día' : 'La Carta'}
          className="relative min-h-[600px] animate-in fade-in duration-700"
        >
          {activeTab === 'menu' ? (
            <MenuSection selectedAllergens={selectedAllergens} settings={settings} compact={true} />
          ) : (
            <CartaSection session={session} selectedAllergens={selectedAllergens} settings={settings} compact={true} />
          )}
        </div>
      </div>
      
      <Footer />
      
      <FloatingSessionStatus settings={settings} />

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTabs}
            className="fixed bottom-[5.5rem] left-4 md:bottom-24 md:left-6 z-[119] w-10 h-10 md:w-11 md:h-11 bg-[#D4AF37] text-black rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            aria-label="Volver arriba"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  )
}
