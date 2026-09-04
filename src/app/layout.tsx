import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/context/I18nContext'
import { SessionProvider } from 'next-auth/react'
import { headers } from 'next/headers'
import { Suspense } from 'react'
import ClientOnlyComponents from '@/components/ClientOnlyComponents'

// Locales para SSR
import esLocale from '@/locales/es/common.json'
import caLocale from '@/locales/ca/common.json'
import enLocale from '@/locales/en/common.json'
import frLocale from '@/locales/fr/common.json'

const localeMap = {
  es: esLocale,
  ca: caLocale,
  en: enLocale,
  fr: frLocale
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
}

import { BRAND_CONFIG } from '@/lib/brand-config'

// Generate base metadata dynamically from brand config
const brand = BRAND_CONFIG.isDemoMode ? BRAND_CONFIG.demo : BRAND_CONFIG.real

export const metadata: Metadata = {
  title: brand.metaTitle,
  description: brand.metaDescription,
  keywords: [
    'restaurante Premià de Dalt', 'restaurante Maresme', 'El Balconet Premià de Dalt',
    'menú del día Premià de Dalt', 'cocina mediterránea Maresme', 'terraza Premià de Dalt',
    'platos para compartir Maresme', 'El Balconet', 'restaurante familiar Maresme',
    'gastronomía local Barcelona', 'producto de proximidad Maresme',
    'celebraciones Premià de Dalt', 'vistas al mar restaurante Maresme',
    'restaurante con terraza Barcelona', 'dónde comer Premià de Dalt'
  ],
  metadataBase: new URL('https://elbalconet.es'),
  alternates: {
    canonical: '/',
    languages: {
      'es': '/',
      'ca': '/?lang=ca',
      'en': '/?lang=en',
      'fr': '/?lang=fr',
    }
  },
  openGraph: {
    title: brand.metaTitle,
    description: brand.metaDescription,
    type: 'website',
    locale: 'es_ES',
    siteName: brand.fullName,
    url: 'https://elbalconet.es',
    images: [
      {
        url: 'https://elbalconet.es/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'El Balconet Restaurant — Premià de Dalt, Maresme',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: brand.metaTitle,
    description: brand.metaDescription,
    images: ['https://elbalconet.es/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  }
}



export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const serverLocale = (headersList.get('x-locale') || 'es') as keyof typeof localeMap
  const initialTranslations = localeMap[serverLocale] || esLocale
  const brand = BRAND_CONFIG.isDemoMode ? BRAND_CONFIG.demo : BRAND_CONFIG.real

  return (
    <html lang={serverLocale} className={`${inter.variable} ${playfair.variable} bg-[#FAFAFA]`} style={{ backgroundColor: '#FAFAFA' }} suppressHydrationWarning>
      <head>
        {/* Preconnect to Supabase storage for faster hero images */}
        <link rel="preconnect" href="https://supabase.co" />
        <link rel="dns-prefetch" href="https://supabase.co" />
      </head>
      <body className="bg-[#FAFAFA] text-[#111111] antialiased min-h-screen relative" suppressHydrationWarning>
        <SessionProvider>
          <I18nProvider initialLocale={serverLocale} initialTranslations={initialTranslations}>
            <ClientOnlyComponents />
            <Suspense fallback={<div className="fixed inset-0 bg-[#FAFAFA]" />}>
              {children}
            </Suspense>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Restaurant",
                  "name": brand.fullName,
                  "image": [
                    "https://elbalconet.es/og-image.jpg",
                    "https://elbalconet.es/logo.png"
                  ],
                  "description": brand.metaDescription,
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Torrent Mateu Mas, 31",
                    "addressLocality": "Premià de Dalt",
                    "addressRegion": "Barcelona",
                    "postalCode": "08338",
                    "addressCountry": "ES"
                  },
                  "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": 41.52,
                    "longitude": 2.37
                  },
                  "telephone": "+34679121045",
                  "url": "https://elbalconet.es",
                  "menu": "https://elbalconet.es/menu",
                  "hasMap": brand.googleMapsLink,
                  "servesCuisine": ["Mediterránea", "Española", "Catalana", "De Mercado"],
                  "priceRange": "€€",
                  "openingHoursSpecification": [
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                      "opens": "08:30",
                      "closes": "23:30"
                    },
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Saturday", "Sunday"],
                      "opens": "08:00",
                      "closes": "23:30"
                    }
                  ],
                  "sameAs": [
                    brand.instagram,
                    "https://www.google.com/maps/place/El+Balconet+Premià+de+Dalt"
                  ],
                  "potentialAction": {
                    "@type": "ReserveAction",
                    "target": "https://elbalconet.es/reservar",
                    "name": "Reservar mesa"
                  }
                })
              }}
            />
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
