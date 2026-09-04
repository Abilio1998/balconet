'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, ArrowRight, Utensils, Star } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/context/I18nContext'
import Image from 'next/image'
import { getBrand } from '@/lib/brand-config'

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
  price: number
  likes_count: number
  is_featured: boolean
  image_url?: string
  image_alt?: string | null
}

export default function FeaturedDish() {
  const { t, locale } = useI18n()
  const brand = getBrand()
  const [featured, setFeatured] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/public/carta-dynamic')
      .then(res => res.json())
      .then(data => {
        if (data.carta) {
          // Find the first featured product in any category
          for (const cat of data.carta) {
            const found = cat.products.find((p: any) => p.is_web_featured)
            if (found) {
              setFeatured(found)
              break
            }
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !featured) return null

  // Get translations for the dynamic content from the correct columns
  const displayName = (locale === 'es' ? featured.name : (featured as any)[`name_${locale}`]) || featured.name
  const displayDescription = (locale === 'es' ? featured.description : (featured as any)[`description_${locale}`]) || featured.description || t('featured.default_description')

  return (
    <section id="featured" className="relative py-12 md:py-24 bg-[#FAFAFA] overflow-hidden border-y border-black/5">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#D4AF37]/5 blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-1/4 h-2/3 bg-black/5 blur-[100px] -z-10" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          
          {/* Image Side */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative aspect-[16/10] md:aspect-square group max-w-xl mx-auto w-full"
          >
            <div className="absolute inset-0 border border-[#D4AF37]/20 translate-x-4 translate-y-4 -z-10 group-hover:translate-x-6 group-hover:translate-y-6 transition-transform duration-700" />
            
            <div className="w-full h-full relative overflow-hidden bg-white border border-black/5 shadow-sm">
              {featured.image_url ? (
                <Image 
                  src={featured.image_url} 
                  alt={featured.image_alt || displayName} 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  priority
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#111111]/20">
                  <Utensils size={120} strokeWidth={0.5} />
                  <p className="text-xs uppercase tracking-[0.3em] mt-4 font-bold">{brand.name} Experience</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] via-transparent to-transparent opacity-80" />
            </div>

            {/* Badge */}
            <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 bg-[#D4AF37] text-black w-24 h-24 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center rotate-12 shadow-2xl border-4 border-black group-hover:rotate-0 transition-transform duration-500">
               <span className="text-[10px] uppercase font-bold tracking-tighter">{t('featured.our_star').split(' ')[0]}</span>
               <span className="text-xl font-serif font-black leading-tight italic">{t('featured.our_star').split(' ')[1] || 'Estrella'}</span>
            </div>
          </motion.div>

          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-px bg-[#D4AF37]/50" />
               <span className="text-[#D4AF37] text-xs font-bold tracking-[0.4em] uppercase">{t('featured.chef_suggestion')}</span>
            </div>

            <h2 className="text-[#111111] font-serif text-3xl md:text-4xl lg:text-6xl mb-6 leading-tight font-bold">
              {displayName}
            </h2>

            <div className="flex items-center gap-6 mb-8 text-[#111111]/70 font-bold">
               <div className="flex items-center gap-2">
                  <Star size={16} className="text-[#D4AF37] fill-[#D4AF37]" />
                  <span className="text-sm font-medium">{t('featured.dish_of_month')}</span>
               </div>
               <div className="flex items-center gap-2 border-l border-black/10 pl-6">
                  <Heart size={16} className="text-[#D4AF37] fill-[#D4AF37]" />
                  <span className="text-sm font-medium">{featured.likes_count} {t('featured.recommendations')}</span>
               </div>
            </div>

            <p className="text-[#111111]/60 text-lg leading-relaxed mb-10 max-w-lg font-medium">
              {displayDescription}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
               <Link href="/reservar" className="btn-gold px-10 py-5 group shadow-glow" aria-label={`Reservar mesa para probar nuestro delicioso ${displayName}`}>
                  <span className="flex items-center gap-3">
                    {t('featured.reserve_table')} <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </span>
               </Link>
               
               <div className="text-[#111111]/90">
                  <span className="text-3xl font-serif font-bold">{featured.price?.toFixed(2)}€</span>
                  {featured.price && <span className="text-xs text-[#111111]/40 ml-2 uppercase tracking-widest font-bold">{t('featured.iva_included')}</span>}
               </div>
            </div>

            <div className="mt-8 md:mt-16 pt-8 border-t border-black/5 italic text-[#111111]/50 font-medium text-sm max-w-md">
              "{t('featured.quote')}"
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
