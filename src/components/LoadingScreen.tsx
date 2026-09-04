'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getBrand } from '@/lib/brand-config'
import { Utensils } from 'lucide-react'

export default function LoadingScreen() {
  const [isVisible, setIsVisible] = useState<boolean | null>(null)
  const brand = getBrand()

  useEffect(() => {
    setIsVisible(true)
    const minDisplayTime = 400;
    const startTime = Date.now();

    const handleLoad = () => {
      const timeElapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - timeElapsed);
      
      setTimeout(() => {
        setIsVisible(false);
      }, remainingTime);
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      const timeout = setTimeout(handleLoad, 2500)
      return () => {
        window.removeEventListener('load', handleLoad)
        clearTimeout(timeout)
      }
    }
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.8, ease: "easeInOut" }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#FAFAFA]"
        >
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            animate={{ 
              opacity: 1,
              scale: [1, 1.02, 1],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative w-48 h-48 flex items-center justify-center"
          >
            {brand.logo ? (
              <Image
                src={brand.logo}
                alt={`${brand.name} Logo`}
                fill
                sizes="192px"
                className="object-contain"
                loading="eager"
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Utensils size={64} className="text-[#D4AF37]" strokeWidth={1} />
                <span className="text-[#111111] font-serif text-2xl tracking-[0.2em] uppercase">{brand.name}</span>
              </div>
            )}
          </motion.div>
          
          {/* Subtle loading line */}
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, ease: "linear" }}
            className="absolute bottom-0 left-0 right-0 h-1 bg-[#D4AF37] origin-left"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
