'use client'

import { useI18n } from '@/context/I18nContext'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Star, Leaf, Heart } from 'lucide-react'

import { getBrand } from '@/lib/brand-config'

const values = [
  { key: 'quality', icon: Star },
  { key: 'tradition', icon: Leaf },
  { key: 'hospitality', icon: Heart },
]

export default function AboutSection() {
  const { t } = useI18n()
  const brand = getBrand()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="about" className="py-24 md:py-36 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            {/* Eyebrow */}
            <p className="text-[#D4AF37] tracking-[0.4em] uppercase text-xs font-medium mb-4">
              Nuestra Esencia
            </p>

            <h2 className="section-title text-left mb-6">{t('about.title')}</h2>
            <div className="w-16 h-[2px] bg-[#D4AF37] mb-8" />

            <p className="text-[#111111]/70 leading-relaxed text-lg mb-8 font-medium">
              {brand.aboutDescription}
            </p>

            <div className="flex items-center gap-6 text-sm text-[#111111]/50 font-bold">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-serif text-[#D4AF37]">{brand.aboutYear}</span>
                <span className="tracking-widest uppercase text-xs mt-1">Fundado</span>
              </div>
              <div className="w-px h-12 bg-black/10" />
              <div className="flex flex-col items-center">
                <span className="text-3xl font-serif text-[#D4AF37]">100%</span>
                <span className="tracking-widest uppercase text-xs mt-1">Fresco</span>
              </div>
              <div className="w-px h-12 bg-black/10" />
              <div className="flex flex-col items-center">
                <span className="text-3xl font-serif text-[#D4AF37]">♥</span>
                <span className="tracking-widest uppercase text-xs mt-1">{brand.aboutLocation}</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Values cards */}
          <div className="space-y-4">
            {values.map((item, idx) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: 40 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + idx * 0.15 }}
                  className="glass-card p-6 flex items-start gap-5 group hover:border-[#D4AF37]/30 transition-all duration-300"
                >
                  <div className="shrink-0 w-10 h-10 border border-[#D4AF37]/40 flex items-center justify-center group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37]/10 transition-all duration-300">
                    <Icon size={18} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-[#111111] mb-1 font-bold">
                      {t(`about.values.${item.key}`)}
                    </h3>
                    <p className="text-[#111111]/60 text-sm leading-relaxed font-medium">
                      {t(`about.values.${item.key}_desc`)}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
