'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Verificar si el usuario ya ha respondido al banner
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      setShow(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setShow(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[300] p-4 sm:p-6 animate-in slide-in-from-bottom duration-500 font-sans pointer-events-none">
      <div className="max-w-5xl mx-auto bg-[#1A1A1A] border border-[#D4AF37]/30 shadow-2xl rounded-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative pointer-events-auto overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 blur-3xl rounded-full" />
        
        <div className="flex-1 relative z-10">
          <h3 className="text-[#D4AF37] font-serif text-xl mb-2">Aviso de Cookies</h3>
          <p className="text-white/70 text-sm leading-relaxed">
            Utilizamos cookies propias para garantizar el correcto funcionamiento del portal (login, sesiones de sala) y cookies de análisis opcionales para entender cómo interactúas con nuestra web y mejorar nuestros servicios gastronómicos.{' '}
            <Link href="/politica-cookies" className="text-[#D4AF37] hover:underline whitespace-nowrap">
              Más información
            </Link>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
          <button
            onClick={handleDecline}
            className="px-6 py-3 border border-white/20 text-white/70 hover:bg-white/5 hover:text-white transition-all rounded-sm text-xs uppercase tracking-widest font-bold w-full sm:w-auto"
          >
            Rechazar
          </button>
          <button
            onClick={handleAccept}
            className="px-6 py-3 bg-[#D4AF37] text-black hover:bg-white transition-all rounded-sm text-xs uppercase tracking-widest font-bold w-full sm:w-auto shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
