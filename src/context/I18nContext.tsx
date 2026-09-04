'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import esTranslations from '@/locales/es/common.json'

type Locale = 'es' | 'ca' | 'en' | 'fr'

type I18nContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  translations: Record<string, unknown>
}

const I18nContext = createContext<I18nContextType>({
  locale: 'es',
  setLocale: () => {},
  t: (key) => key,
  translations: {}
})

export function I18nProvider({ 
  children, 
  initialLocale = 'es',
  initialTranslations
}: { 
  children: React.ReactNode, 
  initialLocale?: Locale,
  initialTranslations?: Record<string, any>
}) {
  const [mounted, setMounted] = useState(false)
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [translations, setTranslations] = useState<Record<string, unknown>>(
    initialTranslations || esTranslations
  )

  // Sincronizar traducciones iniciales si el idioma de inicio cambia (vía props)
  useEffect(() => {
    if (initialTranslations) {
      setTranslations(initialTranslations)
    }
    
    // Forzamos un pequeño retraso para asegurar que la hidratación de React se ha completado
    // antes de activar el contenido o cambiar el idioma.
    const timer = setTimeout(() => {
      setMounted(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [initialTranslations])

  useEffect(() => {
    if (!mounted) return

    // Solo después de montar y del breve delay, comprobamos si hay una preferencia guardada
    const saved = localStorage.getItem('locale') as Locale
    if (saved && ['es', 'ca', 'en', 'fr'].includes(saved) && saved !== locale) {
      setLocaleState(saved)
    }
  }, [mounted])

  useEffect(() => {
    import(`@/locales/${locale}/common.json`)
      .then((mod) => setTranslations(mod.default))
      .catch(() => {})
  }, [locale])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  const t = (key: string): string => {
    // Usar esTranslations como fallback absoluto si aún no han cargado las otras
    const keys = key.split('.')
    let value: unknown = translations
    
    for (const k of keys) {
      if (typeof value === 'object' && value !== null && k in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[k]
      } else {
        // Safe fallback si la clave no existe en el idioma actual, buscar en ES
        let fallbackValue: unknown = esTranslations
        for (const fk of keys) {
           if (typeof fallbackValue === 'object' && fallbackValue !== null && fk in (fallbackValue as Record<string, unknown>)) {
             fallbackValue = (fallbackValue as Record<string, unknown>)[fk]
           } else {
             value = key
             break
           }
        }
        value = typeof fallbackValue === 'string' ? fallbackValue : key
        break
      }
    }

    let finalValue = typeof value === 'string' ? value : key

    // Auto-replace for demo mode consistency across all translation keys
    const { getBrand, BRAND_CONFIG } = require('@/lib/brand-config')
    if (BRAND_CONFIG.isDemoMode) {
      const brand = getBrand()
      finalValue = finalValue
        .replace(/El Balconet/g, brand.name)
        .replace(/Premià de Dalt/g, brand.aboutLocation)
    }

    return finalValue
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, translations }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
