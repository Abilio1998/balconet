'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/context/I18nContext'
import { Phone, MapPin, Clock, Instagram, Facebook, Utensils } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getBrand } from '@/lib/brand-config'

export default function Footer() {
  const { t } = useI18n()
  const [year, setYear] = useState<number>(2026)
  const brand = getBrand()

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  return (
    <footer className="bg-white border-t border-black/5">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-40 h-16 shrink-0 flex items-center justify-center">
                {brand.logo ? (
                  <Image
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    fill
                    className="object-contain"
                    sizes="160px"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Utensils className="text-[#B8860B] w-6 h-6" />
                    <span className="text-[#1A1A1A] font-serif text-xl font-bold tracking-tight uppercase leading-none">{brand.name}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[#1A1A1A]/60 text-sm leading-relaxed mb-6">
              Cocina mediterránea auténtica. Ingredientes frescos, sabores de verdad.
            </p>
            <div className="flex items-center gap-4">
              <a
                href={brand.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border border-black/5 flex items-center justify-center text-[#1A1A1A]/70 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all rounded-full bg-black/5"
                aria-label={`Seguir a ${brand.name} en Instagram`}
              >
                <Instagram size={18} />
              </a>
              <a
                href={brand.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border border-black/5 flex items-center justify-center text-[#1A1A1A]/70 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all rounded-full bg-black/5"
                aria-label={`Seguir a ${brand.name} en Facebook`}
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold tracking-widest uppercase text-xs mb-6 text-[#1A1A1A]">
              {t('contact.title')}
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-[#1A1A1A]/70 text-sm">
                <MapPin size={14} className="mt-0.5 text-[#D4AF37] shrink-0" />
                <span>{brand.address}</span>
              </div>
              <div className="flex items-center gap-3 text-[#1A1A1A]/70 text-sm">
                <Phone size={14} className="text-[#D4AF37] shrink-0" />
                <a href={brand.phoneUrl} className="hover:text-[#D4AF37] transition-colors">
                  {brand.phone}
                </a>
              </div>
              <div className="flex items-start gap-3 text-[#1A1A1A]/70 text-sm">
                <Clock size={14} className="mt-0.5 text-[#D4AF37] shrink-0" />
                <span>Lun – Dom: 08:00 – 24:00</span>
              </div>
            </div>
          </div>

          {/* ... Navigation remains the same ... */}
          {/* Elevation logic doesn't change */}
          <div>
            <h4 className="font-semibold tracking-widest uppercase text-xs mb-6 text-[#1A1A1A]">
              Navegación
            </h4>
            <div className="space-y-3">
              {[
                { href: '/#about', label: t('nav.about') },
                { href: '/#menu', label: t('nav.menu') },
                { href: '/#carta', label: t('nav.carta') },
                { href: '/#contact', label: t('nav.contact') },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-[#1A1A1A]/60 hover:text-[#B8860B] transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold tracking-widest uppercase text-xs mb-6 text-[#1A1A1A]">
              Área Legal
            </h4>
            <div className="space-y-3">
              {[
                { href: '/aviso-legal', label: 'Aviso Legal' },
                { href: '/politica-privacidad', label: 'Política de Privacidad' },
                { href: '/politica-cookies', label: 'Política de Cookies' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-[#1A1A1A]/60 hover:text-[#B8860B] transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-black/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <p className="text-[#1A1A1A]/50 text-xs">
              © {year} {brand.fullName}. {t('footer.rights')}
            </p>
            <Link href="/admin" className="text-[#1A1A1A]/30 hover:text-[#B8860B] text-xs transition-colors">
              Admin
            </Link>
          </div>
          <p className="text-[#1A1A1A]/50 text-xs text-center md:text-right">
            {t('footer.made_with')}
            <a href="https://gastrova.es" target="_blank" rel="noopener noreferrer" className="hover:text-[#B8860B] transition-colors font-medium ml-1">
              gastrova.es
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
