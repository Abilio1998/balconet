'use client'

// ─────────────────────────────────────────────────────────────────────────────
// TODO: Replace this URL with the direct "Write a review" link from Google
//       Business Profile → Inicio → "Consigue más reseñas" → "Compartir enlace"
//       It will look like: https://g.page/r/XXXXXXXXXXXXXXXX/review
// ─────────────────────────────────────────────────────────────────────────────
const GOOGLE_WRITE_REVIEW_URL =
  'https://www.google.es/maps/place/El+Balconet+Bar-Restaurant/@41.5269302,2.363678,17z/data=!4m8!3m7!1s0x12a4b68dff9d5f69:0xbc9dc2254c33b8bc!8m2!3d41.5269302!4d2.3662529!9m1!1b1!16s%2Fg%2F1tt5p31v?entry=ttu'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { useI18n } from '@/context/I18nContext'
import { Star, ExternalLink, ThumbsUp } from 'lucide-react'


type Review = {
  id: string
  author_name: string
  gender: 'male' | 'female' | 'neutral'
  rating: number
  text: string
  relative_time_description: string
}

const GoogleIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)



const getInitials = (name: string) => {
  if (!name) return 'U'
  return name.charAt(0).toUpperCase()
}

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-[#DB4437] text-white',
    'bg-[#0F9D58] text-white',
    'bg-[#4285F4] text-white',
    'bg-[#F4B400] text-black',
    'bg-[#FF7043] text-white',
    'bg-[#8E24AA] text-white',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function ReviewsSection() {
  const { t } = useI18n()
  const ref = useRef(null)
  const ctaRef = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const ctaInView = useInView(ctaRef, { once: true, margin: '-80px' })
  const [reviews, setReviews] = useState<Review[]>([])
  const [visible, setVisible] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/public/reviews', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews)
        } else {
          setVisible(false)
        }
        setLoading(false)
      })
      .catch(() => {
        setVisible(false)
        setLoading(false)
      })
  }, [])

  if (!visible || (reviews.length === 0 && !loading)) return null

  return (
    <section className="bg-[#FAFAFA] relative overflow-hidden" id="reviews" ref={ref}>
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D4AF37]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#D4AF37]/4 rounded-full blur-[120px]" />
      </div>

      {/* ── Existing reviews grid ── */}
      <div className="py-24 max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="text-[#D4AF37] fill-[#D4AF37]" size={16} />
            <span className="text-[#D4AF37] text-sm tracking-widest uppercase">{t('reviews.badge')}</span>
            <Star className="text-[#D4AF37] fill-[#D4AF37]" size={16} />
          </div>
          <h2 className="text-4xl md:text-5xl font-serif text-[#111111] mb-6 font-bold">
            {t('reviews.title')}
          </h2>
          <p className="text-[#111111]/70 max-w-2xl mx-auto text-lg font-medium">
            {t('reviews.desc')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
              className="bg-white border border-black/5 p-8 rounded-sm hover:border-[#D4AF37]/30 transition-all duration-300 shadow-xl relative group"
            >
              {/* Google Icon Badge */}
              <div className="absolute top-6 right-6 opacity-60 group-hover:opacity-100 transition-opacity">
                <GoogleIcon size={22} />
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center font-semibold text-lg shadow-inner ${getAvatarColor(review.author_name)}`}>
                  {getInitials(review.author_name)}
                </div>
                <div>
                  <h4 className="text-[#111111] font-bold">{review.author_name}</h4>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        size={12}
                        className={j < review.rating ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-black/15'}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[#111111]/70 italic mb-4 leading-relaxed text-sm font-medium">
                "{review.text}"
              </p>
              <span className="text-[#111111]/40 text-xs font-bold uppercase tracking-wider">
                {review.relative_time_description}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── CTA: Valóranos en Google ── */}
      <div ref={ctaRef} className="relative z-10 border-t border-black/5">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="max-w-5xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-12"
        >
          {/* Left: Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full px-4 py-1.5 mb-6">
              <ThumbsUp size={13} className="text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-xs font-semibold tracking-widest uppercase">
                {t('reviews.cta_enjoyed')}
              </span>
            </div>
            <h3 className="text-3xl md:text-4xl font-serif text-[#111111] mb-4 leading-tight font-bold">
              {t('reviews.cta_title')}<br className="hidden md:block" />{' '}
              <span className="text-[#D4AF37]">{t('reviews.cta_title_highlight')}</span>
            </h3>
            <p className="text-[#111111]/60 text-base leading-relaxed max-w-md font-medium">
              {t('reviews.cta_desc')}
            </p>
          </div>

          {/* Right: Google Card */}
          <div className="flex-shrink-0 w-full max-w-sm">
            <motion.a
              href={GOOGLE_WRITE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="group relative block bg-white border border-black/10 rounded-2xl p-8 shadow-xl hover:border-[#D4AF37]/40 transition-colors duration-300 overflow-hidden"
              id="google-review-cta"
            >
              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

              {/* Google branding */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
                    <GoogleIcon size={22} />
                  </div>
                  <div>
                    <p className="text-[#111111] text-sm font-bold">Google</p>
                    <p className="text-[#111111]/50 text-xs font-medium">El Balconet Bar-Restaurant</p>
                  </div>
                </div>

                {/* 5 estrellas animadas */}
                <div className="flex items-center gap-1.5 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <motion.div
                      key={s}
                      initial={{ scale: 0, rotate: -30 }}
                      animate={ctaInView ? { scale: 1, rotate: 0 } : {}}
                      transition={{ delay: 0.4 + s * 0.08, type: 'spring', stiffness: 400 }}
                    >
                      <Star size={28} className="text-[#D4AF37] fill-[#D4AF37] drop-shadow-sm" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-[#111111]/40 text-xs mb-6 font-medium">{t('reviews.cta_tap_star')}</p>

                {/* CTA Button */}
                <div className="flex items-center justify-between">
                  <span className="text-[#111111] font-bold text-sm group-hover:text-[#D4AF37] transition-colors">
                    {t('reviews.cta_write')}
                  </span>
                  <div className="w-9 h-9 bg-[#D4AF37] rounded-full flex items-center justify-center group-hover:bg-[#E8C84A] transition-colors shadow-lg shadow-[#D4AF37]/20">
                    <ExternalLink size={15} className="text-black" />
                  </div>
                </div>
              </div>
            </motion.a>

            {/* Nota inferior */}
            <p className="text-center text-[#111111]/40 text-xs mt-3 flex items-center justify-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-full bg-[#34A853] inline-block" />
              {t('reviews.cta_verified')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

