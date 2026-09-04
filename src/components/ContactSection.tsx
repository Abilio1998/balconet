'use client'

import { useI18n } from '@/context/I18nContext'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { MapPin, Phone, Clock, Wifi, Coffee, Umbrella, Car, TreePine } from 'lucide-react'

const SERVICES = [
  { icon: Umbrella, translationKey: 'Terraza' },
  { icon: Coffee, translationKey: 'Cócteles' },
  { icon: Wifi, translationKey: 'Wi-Fi' },
  { icon: Car, translationKey: 'contact.service_parking' },
  { icon: TreePine, translationKey: 'contact.service_park' },
]

import { getBrand } from '@/lib/brand-config'

export default function ContactSection() {
  const { t } = useI18n()
  const brand = getBrand()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  // Lazy-load the Google Maps iframe only when the section enters the viewport.
  // This prevents init_embed.js from registering non-passive touch listeners on page load.
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapVisible, setMapVisible] = useState(false)

  useEffect(() => {
    const el = mapRef.current
    if (!el || !brand.googleMapsEmbed) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMapVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' } // start loading 200px before it enters view
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [brand.googleMapsEmbed])

  return (
    <section id="contact" className="py-24 md:py-36 bg-[#FAFAFA]" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
// ... header content ...
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-[#D4AF37] tracking-[0.4em] uppercase text-xs font-medium mb-4">
            Dónde Estamos
          </p>
          <h2 className="section-title mb-4">{t('contact.title')}</h2>
          <div className="gold-divider" />
          <p className="text-[#111111]/60 text-sm mt-4 font-medium">{t('contact.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Info */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Restaurant Name */}
            <div className="mb-2">
              <h3 className="font-serif text-4xl md:text-5xl text-[#111111] mb-3 font-bold leading-tight">{brand.name}</h3>
              <p className="text-[#D4AF37] text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase font-bold leading-relaxed">{brand.tagline}</p>
            </div>

            <div className="space-y-6">
              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-[#D4AF37] text-xs tracking-widest uppercase mb-1 font-bold">{t('contact.address')}</p>
                  <p className="text-[#111111]/80 font-medium">{brand.address.split(',')[0]}</p>
                  <p className="text-[#111111]/80 font-medium">{brand.address.split(',').slice(1).join(', ')}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                  <Phone size={16} className="text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-[#D4AF37] text-xs tracking-widest uppercase mb-1 font-bold">{t('contact.phone')}</p>
                  <a
                    href={brand.phoneUrl}
                    className="text-[#111111]/80 hover:text-[#D4AF37] transition-colors text-lg font-bold"
                    aria-label={`Llamar a ${brand.name}`}
                  >
                    {brand.phone}
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                  <Clock size={16} className="text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-[#D4AF37] text-xs tracking-widest uppercase mb-1 font-bold">{t('contact.hours')}</p>
                  <p className="text-[#111111]/80 font-medium">{t('contact.hours_value')}</p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <p className="text-[#D4AF37] text-xs tracking-widest uppercase mb-4 font-bold">{t('contact.services')}</p>
              <div className="grid grid-cols-3 md:flex md:flex-wrap md:gap-4 gap-2">
                {SERVICES.map(({ icon: Icon, translationKey }, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-center p-2 border border-black/5 bg-black/5 rounded-sm md:flex-1 md:min-w-[80px] hover:border-[#D4AF37]/30 transition-colors">
                    <Icon size={18} className="text-[#D4AF37] mb-2" />
                    <span className="text-[#111111]/70 font-medium text-[9px] md:text-[10px] text-center uppercase tracking-widest">
                      {translationKey.includes('.') ? t(translationKey) : translationKey}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Directions CTA */}
            <a
              href={brand.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline inline-flex"
              aria-label="Ver ubicación en Google Maps"
            >
              <MapPin size={15} />
              {t('contact.get_directions')}
            </a>
          </motion.div>

          {/* Right: Map — lazy loaded via IntersectionObserver */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="h-[400px] md:h-[500px] border border-black/10 overflow-hidden relative"
            ref={mapRef}
          >
            {mapVisible && brand.googleMapsEmbed ? (
              <iframe
                src={brand.googleMapsEmbed}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${brand.fullName} – ${brand.address}`}
              />
            ) : (
              <div className="w-full h-full bg-white flex flex-col items-center justify-center p-8 text-center gap-4">
                <MapPin className="text-[#D4AF37] w-12 h-12" />
                <p className="text-[#111111]/60 font-serif italic text-xl">
                  {brand.address}
                </p>
                <div className="w-24 h-px bg-[#D4AF37]/30" />
                <p className="text-[#111111]/40 text-xs tracking-widest uppercase font-bold">
                  {brand.googleMapsEmbed ? 'Cargando mapa...' : 'Location Map Placeholder'}
                </p>
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none border border-[#D4AF37]/20" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
