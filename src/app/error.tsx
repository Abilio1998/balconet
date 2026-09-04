'use client'

import { useEffect } from 'react'
import { ServerCrash, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Registramos el error de manera silenciosa en la consola para depurar luego
    console.error('Next.js Client Error Boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black text-white px-6">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
        <ServerCrash size={56} className="text-red-500/50 mb-6" />
        
        <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">
          Error Crítico del Sistema
        </h1>
        
        <p className="text-white/50 max-w-md text-sm md:text-base leading-relaxed mb-10">
          Vaya, algo ha salido espectacularmente mal en nuestros servidores o en la conexión. Disculpa las molestias.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex justify-center items-center gap-2 px-8 py-3 border border-white/20 text-white font-semibold tracking-widest uppercase text-sm transition-all duration-300 hover:border-white hover:scale-105 bg-white/5"
          >
            <RotateCcw size={16} />
            Reintentar
          </button>

          <Link 
            href="/" 
            className="inline-flex justify-center items-center gap-2 px-8 py-3 bg-[#D4AF37] text-black font-semibold tracking-widest uppercase text-sm transition-all duration-300 hover:bg-[#E8C84A] hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.15)]"
          >
            <Home size={16} />
            Inicio Seguro
          </Link>
        </div>
      </div>
    </div>
  )
}
