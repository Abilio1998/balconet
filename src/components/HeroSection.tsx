'use client'

import { useI18n } from '@/context/I18nContext'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getBrand } from '@/lib/brand-config'

type HeroImage = {
  id: string
  url: string
  alt: string
}

export default function HeroSection() {
  const { t } = useI18n()
  const brand = getBrand()
  const [heroImages, setHeroImages] = useState<HeroImage[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/images?type=hero')
      .then((res) => res.json())
      .then((data) => {
        if (data.images && data.images.length > 0) {
          setHeroImages(data.images)
        }
      })
      .catch((err) => console.error('Failed to load hero images:', err))
      .finally(() => setLoading(false))
  }, [])

  const pathname = usePathname()

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#') && pathname === '/') {
      e.preventDefault()
      const targetId = href.replace('/#', '')
      const elem = document.getElementById(targetId)
      
      if (elem) {
        const navHeight = 80 
        const elemPosition = elem.getBoundingClientRect().top + window.scrollY
        window.scrollTo({
          top: elemPosition - navHeight,
          behavior: 'smooth'
        })
        window.history.pushState(null, '', href)
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      } else {
        window.location.hash = targetId
      }
    }
  }

  useEffect(() => {
    if (heroImages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length)
    }, 6000) // Change image every 6 seconds

    return () => clearInterval(interval)
  }, [heroImages.length])

  const currentImage = heroImages[currentIndex]

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background with fallback */}
      <div className="absolute inset-0 z-0 bg-[#FAFAFA]">
        <AnimatePresence mode="wait">
          {!loading && currentImage && (
            <motion.div
              key={currentImage.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <Image
                src={currentImage.url}
                alt={currentImage.alt || brand.fullName}
                fill
                className="object-cover opacity-60"
                sizes="100vw"
                priority
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gradient overlays to maintain text contrast */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(212,175,55,0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(212,175,55,0.1) 0%, transparent 50%),
              linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 60%, rgba(250,250,250,1) 100%)
            `,
          }}
        />
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.06) 0%, transparent 65%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Top ornament */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <div className="w-16 h-px bg-[#D4AF37]" />
          <div className="w-1.5 h-1.5 bg-[#D4AF37] rotate-45" />
          <div className="w-16 h-px bg-[#D4AF37]" />
        </motion.div>

        {/* Location */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-[#D4AF37] tracking-[0.4em] uppercase text-xs md:text-sm font-bold mb-6"
        >
          {brand.aboutLocation.toUpperCase()} · BARCELONA
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-tight mb-4 drop-shadow-2xl font-medium"
        >
          {brand.name}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="font-serif text-2xl md:text-3xl text-[#D4AF37] italic mb-6 drop-shadow-md"
        >
          {brand.fullName.includes('Restaurant') ? 'Cocina Mediterránea' : 'Premium Gastronomy'}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-white/90 tracking-[0.3em] uppercase text-xs md:text-sm mb-12 font-bold drop-shadow-md"
        >
          {brand.tagline}
        </motion.p>

        {/* Bottom ornament */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <div className="w-24 h-px bg-gradient-to-r from-transparent to-[#D4AF37]" />
          <div className="w-1.5 h-1.5 bg-[#D4AF37] rotate-45" />
          <div className="w-24 h-px bg-gradient-to-l from-transparent to-[#D4AF37]" />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/reservar" className="btn-premium group" aria-label={`Reservar una mesa en ${brand.name}`}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-14 py-5 font-bold shadow-gold-heavy border border-black/10 relative overflow-hidden bg-[#D4AF37] text-black"
            >
              <span className="relative z-10 uppercase tracking-[0.2em]">{t('hero.cta_reserve') || 'Reservar Mesa'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </motion.div>
          </Link>
          <div className="flex gap-4">
            <Link 
              href="/#menu" 
              onClick={(e) => handleScrollTo(e, '/#menu')}
              className="btn-outline border-white text-white hover:bg-white hover:text-black px-8 py-5" 
              aria-label="Ver el menú del día hoy en Premià de Dalt"
            >
              {t('hero.cta_menu')}
            </Link>
            <Link 
              href="/#carta" 
              onClick={(e) => handleScrollTo(e, '/#carta')}
              className="btn-outline border-white text-white hover:bg-white hover:text-black px-8 py-5" 
              aria-label="Ver nuestra carta completa de platos y tapas"
            >
              {t('hero.cta_carta')}
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-black/30 text-[10px] tracking-[0.3em] uppercase font-bold">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowDown size={16} className="text-[#D4AF37]" />
        </motion.div>
      </motion.div>
    </section>
  )
}
