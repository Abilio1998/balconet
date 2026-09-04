'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/context/I18nContext'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, Instagram, Facebook, Utensils } from 'lucide-react'
import { getBrand, BRAND_CONFIG } from '@/lib/brand-config'

const LANGUAGES = [
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'ca', label: 'CA', name: 'Català' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'fr', label: 'FR', name: 'Français' },
]

export default function Navbar() {
  const { t, locale, setLocale } = useI18n()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  const pathname = usePathname()
  const brand = getBrand()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Intercept only if it's a hash link and we are actively on the homepage
    if (href.startsWith('/#') && pathname === '/') {
      e.preventDefault()
      const targetId = href.replace('/#', '')
      const elem = document.getElementById(targetId)

      if (elem) {
        // 80px static offset to prevent the fixed Navbar from covering the section header
        const navHeight = 80
        const elemPosition = elem.getBoundingClientRect().top + window.scrollY
        window.scrollTo({
          top: elemPosition - navHeight,
          behavior: 'smooth'
        })
        // Manually update hash and dispatch event so listeners can react
        window.history.pushState(null, '', href)
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      } else {
        // Fallback
        window.location.hash = targetId
      }
    }
    // Always close mobile menu on navigation
    setMobileOpen(false)
  }

  const navLinks = [
    { href: '/#about', label: t('nav.about'), aria: `Conoce la historia de ${brand.name}` },
    { href: '/#menu', label: t('nav.menu'), aria: `Descubre nuestro menú del día en ${brand.name}` },
    { href: '/#carta', label: t('nav.carta'), aria: 'Ver nuestra carta de tapas y comida mediterránea' },
    { href: '/#contact', label: t('nav.contact'), aria: 'Información de contacto, horario y reservas' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[110] transition-all duration-500 ${mobileOpen ? 'bg-white' : 'bg-white/95 backdrop-blur-md border-b border-black/5'
        } ${isScrolled && !mobileOpen ? 'py-2 shadow-sm' : 'py-4'
        }`}
    >
      <nav className={`max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-500 ${mobileOpen ? 'py-2' : ''}`}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className={`relative transition-all duration-500 flex items-center justify-center ${isScrolled ? 'w-32 h-12' : 'w-40 h-16'}`}>
            {brand.logo ? (
              <Image
                src={brand.logo}
                alt={`Logo ${brand.fullName}`}
                fill
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                priority
                loading="eager"
                fetchPriority="high"
                sizes="(max-width: 160px) 100vw, 160px"
              />
            ) : (
              <div className="flex flex-col items-center justify-center -space-y-1">
                <Utensils className="text-[#B8860B] w-5 h-5 mb-1" />
                <span className="text-[#1A1A1A] font-serif text-lg font-bold tracking-tight uppercase">{brand.name.split(' ')[0]}</span>
                <span className="text-[#B8860B] text-[10px] font-bold tracking-[0.3em] uppercase">{brand.name.split(' ')[1] || 'Experience'}</span>
              </div>
            )}
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {/* ... existing links ... */}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => handleScrollTo(e, link.href)}
              className="nav-link text-sm uppercase tracking-widest transition-colors font-medium text-[#1A1A1A]/80 hover:text-[#B8860B]"
              aria-label={link.aria}
              title={link.aria}
              suppressHydrationWarning
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Language Switcher + Reservation + Mobile Toggle */}
        <div className="flex items-center gap-4">
          {/* Reservar Button (Desktop) */}
          <Link
            href="/reservar"
            className="hidden md:block btn-premium btn-gold px-6 py-2.5 text-[11px] font-bold shadow-xl"
            suppressHydrationWarning
          >
            {t('nav.reserve') || 'Reservar'}
          </Link>

          {/* ... Language Switcher content ... */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 hover:text-[#B8860B] transition-colors text-sm tracking-widest uppercase font-medium text-[#1A1A1A]/80"
              aria-label="Select language"
              suppressHydrationWarning
            >
              {locale.toUpperCase()}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-black/5 min-w-[140px] shadow-2xl z-[10000] rounded-sm overflow-hidden">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLocale(lang.code as 'es' | 'ca' | 'en' | 'fr')
                      setLangOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors duration-200 flex items-center gap-2 ${locale === lang.code
                      ? 'text-[#B8860B] bg-black/5'
                      : 'text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-black/5'
                      }`}
                  >
                    <span className="text-xs tracking-widest font-bold">{lang.label}</span>
                    <span className="text-[#1A1A1A]/50">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Social Icons (Desktop) using Brand Config */}
          <div className="hidden lg:flex items-center gap-3 border-l border-black/5 pl-4 ml-2">
            <a
              href={brand.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1A1A1A]/40 hover:text-[#D4AF37] transition-colors p-1"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>
            <a
              href={brand.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1A1A1A]/40 hover:text-[#D4AF37] transition-colors p-1"
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden hover:text-[#B8860B] transition-colors text-[#1A1A1A]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-transparent animate-in fade-in slide-in-from-top duration-300">
          <div className="px-6 py-6 flex flex-col gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="nav-link text-base text-[#1A1A1A] hover:text-[#B8860B]"
                aria-label={link.aria}
                title={link.aria}
                suppressHydrationWarning
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/reservar"
              onClick={() => setMobileOpen(false)}
              className="mt-2 btn-gold py-4 text-center font-bold uppercase tracking-widest rounded-sm shadow-lg active:scale-95"
            >
              {t('nav.reserve') || 'Reservar Mesa'}
            </Link>

            {/* Mobile Socials */}
            <div className="flex items-center justify-center gap-8 pt-6 border-t border-black/5 mt-4">
              <a
                href={brand.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1A1A1A]/60 hover:text-[#D4AF37] transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={24} />
              </a>
              <a
                href={brand.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1A1A1A]/60 hover:text-[#D4AF37] transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={24} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Close lang dropdown on outside click */}
      {langOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setLangOpen(false)}
        />
      )}
    </header>
  )
}
