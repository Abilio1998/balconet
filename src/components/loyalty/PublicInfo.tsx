'use client'

import { useState } from 'react'
import { 
  Star, 
  MapPin, 
  Gift, 
  Search, 
  Phone, 
  ArrowRight,
  Loader2,
  CheckCircle2,
  MessageCircle,
  HelpCircle,
  Ticket
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getBrand } from '@/lib/brand-config'

export default function PublicInfo() {
  const brand = getBrand()
  const RESTAURANTS = brand.groupRestaurants
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{waLink?: string, error?: string, message?: string} | null>(null)

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/loyalty/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ error: 'Error al conectar' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#D4AF37]/30">
      {/* Background Decorative */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-[#D4AF37]/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-white/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16 space-y-16">
        
        {/* Header - Hook Marketing Agresivo */}
        <header className="text-center space-y-8">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-block bg-[#D4AF37]/10 px-4 py-2 rounded-full border border-[#D4AF37]/20"
          >
            <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.4em] font-bold">Club de Fidelidad Exclusivo</p>
          </motion.div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-serif text-white tracking-tight leading-tight">
              Come hoy, <br/>
              <span className="text-[#D4AF37] italic">invita la casa mañana</span>
            </h1>
            <p className="text-white/40 text-lg max-w-sm mx-auto leading-relaxed">
              Únete a nuestro club premium y convierte cada cena en platos gratis y experiencias únicas.
            </p>
          </div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="pt-4"
          >
            <button 
              onClick={() => document.getElementById('steps')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-black px-10 py-5 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-[#D4AF37] transition-all shadow-2xl shadow-white/5"
            >
              ¡Quiero unirme ahora!
            </button>
          </motion.div>
        </header>

        {/* El Sistema en 3 Pasos - Claridad Total */}
        <section id="steps" className="space-y-10 pt-10">
           <div className="text-center">
             <h2 className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-bold">¿Cómo funciona?</h2>
           </div>

           <div className="grid grid-cols-1 gap-6">
              <div className="bg-[#111111] border border-white/5 p-8 rounded-[2.5rem] flex items-start gap-6 relative overflow-hidden group">
                 <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Star size={80} />
                 </div>
                 <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-[#D4AF37]/20">
                    <span className="text-2xl font-serif text-[#D4AF37]">1</span>
                 </div>
                 <div>
                    <h3 className="text-xl font-serif mb-2">Pide tu Alta</h3>
                    <p className="text-white/40 text-sm leading-relaxed">Habla con tu camarero o el encargado. Te darán de alta en segundos con tu número de móvil.</p>
                 </div>
              </div>

              <div className="bg-[#111111] border border-white/5 p-8 rounded-[2.5rem] flex items-start gap-6 relative overflow-hidden group">
                 <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Ticket size={80} />
                 </div>
                 <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-[#D4AF37]/20">
                    <span className="text-2xl font-serif text-[#D4AF37]">2</span>
                 </div>
                 <div>
                    <h3 className="text-xl font-serif mb-2">Suma Puntos</h3>
                    <p className="text-white/40 text-sm leading-relaxed">Presenta tu ticket de compra al pagar. Cada <span className="text-white font-bold">1€ de consumo es 1 punto</span> para tu cuenta.</p>
                 </div>
              </div>

              <div className="bg-[#111111] border border-[#D4AF37]/30 p-8 rounded-[2.5rem] flex items-start gap-6 relative overflow-hidden group shadow-[0_0_50px_rgba(212,175,55,0.05)]">
                 <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity text-[#D4AF37]">
                    <Gift size={80} />
                 </div>
                 <div className="w-14 h-14 bg-[#D4AF37] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Star size={24} className="text-black" />
                 </div>
                 <div>
                    <h3 className="text-xl font-serif mb-2">Disfruta Premios</h3>
                    <p className="text-white/60 text-sm leading-relaxed font-medium">¡Consigue cenas gratis, botellas de vino y sorpresas exclusivas directas a tu móvil!</p>
                 </div>
              </div>
           </div>
        </section>

        {/* Call to Action Final */}
        <div className="bg-gradient-to-r from-[#D4AF37]/20 to-transparent p-10 rounded-[3rem] border border-[#D4AF37]/20 text-center space-y-4">
           <h3 className="text-xl font-serif italic text-white">¿Estás en el restaurante?</h3>
           <p className="text-white/40 text-sm mb-6">No esperes más para empezar a sumar. Llama al personal y pide tu alta.</p>
           <button 
             onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
             className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-[0.3em] flex items-center justify-center gap-2 mx-auto hover:gap-4 transition-all"
           >
             ¿Ya eres miembro? Recuperar enlace <ArrowRight size={14} />
           </button>
        </div>

        {/* Restaurants Section */}
        <section className="space-y-8">
           <div className="flex items-center gap-4">
             <div className="h-[1px] flex-1 bg-white/10" />
             <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/20">VÁLIDO EN NUESTRAS SEDES</h3>
             <div className="h-[1px] flex-1 bg-white/10" />
           </div>

           <div className="grid grid-cols-1 gap-4">
             {RESTAURANTS.map((res, i) => (
                <div key={i} className="flex items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:bg-white/[0.05] transition-all">
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#D4AF37]">
                     <MapPin size={24} />
                   </div>
                   <div>
                     <h4 className="font-serif text-lg">{res.name}</h4>
                     <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold mb-1">{res.city}</p>
                     <p className="text-white/30 text-xs">{res.desc}</p>
                   </div>
                </div>
             ))}
           </div>
        </section>

        {/* Recovery Section (Self Service) - Moved to bottom */}
        <section className="bg-gradient-to-br from-[#111111] to-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
           <div className="relative z-10 space-y-8">
              <div className="text-center">
                 <h3 className="text-2xl font-serif mb-2 italic">Zona VIP Miembros</h3>
                 <p className="text-white/40 text-[10px] uppercase tracking-widest">Consulta tu saldo de puntos</p>
              </div>

              <form onSubmit={handleRecover} className="space-y-4">
                <div className="relative">
                  <input 
                    type="tel"
                    placeholder="Tu teléfono móvil"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-14 pr-4 text-white focus:outline-none focus:border-[#D4AF37] transition-all text-lg"
                  />
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                </div>
                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full py-5 bg-white/5 text-white/60 font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-white hover:text-black transition-all shadow-xl disabled:opacity-50 border border-white/10"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Ver mis Puntos'}
                </button>
              </form>

              <AnimatePresence>
                {result && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-2xl text-center border ${result.error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}
                  >
                    <p className="text-sm mb-4 font-medium">{result.error || result.message}</p>
                    {result.waLink && (
                      <a 
                        href={result.waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-3 bg-[#25D366] text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all"
                      >
                        <MessageCircle size={20} /> Recibir por WhatsApp
                      </a>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-white/5">
           <p className="text-white/20 text-[10px] uppercase tracking-[0.4em] font-medium font-serif leading-relaxed">
             {brand.groupName}<br/>
             Gràcies por la teva fidelitat
           </p>
        </footer>

      </div>
    </div>
  )
}
