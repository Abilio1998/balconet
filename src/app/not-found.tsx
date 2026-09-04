import Link from 'next/link'
import { AlertTriangle, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black text-white px-6">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Subtle decorative top line */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#D4AF37]" />
          <div className="w-1 h-1 bg-[#D4AF37] rotate-45" />
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#D4AF37]" />
        </div>

        <AlertTriangle size={48} className="text-[#D4AF37]/50 mb-6" />
        
        <h1 className="font-serif text-8xl md:text-9xl text-transparent bg-clip-text bg-gradient-to-b from-[#D4AF37] to-[#B8960C] mb-4">
          404
        </h1>
        
        <h2 className="font-serif text-2xl md:text-3xl tracking-wide mb-4">
          Página no encontrada
        </h2>
        
        <p className="text-white/50 max-w-md text-sm md:text-base leading-relaxed mb-10">
          Lo sentimos, la página que buscas no existe o ha sido movida. Puedes volver al inicio para seguir explorando nuestra carta y reservas.
        </p>

        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-8 py-3 bg-[#D4AF37] text-black font-semibold tracking-widest uppercase text-sm transition-all duration-300 hover:bg-[#E8C84A] hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]"
        >
          <Home size={16} />
          Volver al Inicio
        </Link>
      </div>
    </div>
  )
}
