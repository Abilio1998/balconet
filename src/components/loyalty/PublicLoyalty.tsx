'use client'

import { useState, useEffect } from 'react'
import { 
  Star, 
  Gift, 
  Calendar, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Trophy,
  Ticket,
  ArrowLeft,
  RefreshCw,
  Utensils,
  Camera
} from 'lucide-react'
import { motion } from 'framer-motion'
import { getBrand } from '@/lib/brand-config'

interface Client {
  id: string
  name: string
  total_points: number
  last_activity: string
  restaurant_name: string
}

interface Reward {
  id: string
  reward_name: string
  status: 'pending' | 'redeemed' | 'expired'
  created_at: string
  expires_at: string
}

type Suggestion = {
  name: string
  description?: string
  course?: string
}

export default function PublicLoyalty({ token }: { token: string | null }) {
  const brand = getBrand()
  const [client, setClient] = useState<Client | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [randomImg, setRandomImg] = useState<{url: string, alt: string} | null>(null)
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState(100)
  const [expirationMonths, setExpirationMonths] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError('Enlace no válido')
      return
    }

    const fetchPortal = async () => {
      try {
        const res = await fetch(`/api/loyalty/portal?token=${token}`)
        const data = await res.json()
        if (res.ok) {
          setClient(data.client)
          setRewards(data.rewards)
          setSuggestions(data.suggestions || [])
          setRandomImg(data.randomImg || null)
          if (data.settings?.points_threshold) setThreshold(data.settings.points_threshold)
          if (data.settings?.points_expiration_months) setExpirationMonths(data.settings.points_expiration_months)
        } else {
          setError(data.error)
        }
      } catch (err) {
        setError('Error al conectar con el servidor')
      } finally {
        setLoading(false)
      }
    }

    fetchPortal()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl">
             <AlertCircle size={60} className="text-red-500 mx-auto mb-4" />
             <h2 className="text-white font-serif text-2xl mb-2">¡Vaya!</h2>
             <p className="text-white/40 mb-6">{error || 'No hemos podido encontrar tus puntos.'}</p>
             <p className="text-[10px] uppercase tracking-widest text-white/20">Si has perdido tu enlace, pregunta al camarero en tu próxima visita.</p>
          </div>
          <a href="/" className="inline-block text-[#D4AF37] border-b border-[#D4AF37] pb-1 uppercase tracking-widest text-xs font-bold">Volver a la web principal</a>
        </div>
      </div>
    )
  }

  const progress = Math.min((client.total_points / threshold) * 100, 100)
  const pointsRemaining = Math.max(threshold - client.total_points, 0)
  
  // Calculate expiration date
  let expirationDate = null
  if (expirationMonths > 0) {
    expirationDate = new Date(client.last_activity)
    expirationDate.setMonth(expirationDate.getMonth() + expirationMonths)
  }

  // Mask name for privacy
  const maskedName = client.name.charAt(0) + '*'.repeat(client.name.length - 1)

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#D4AF37]/30">
      <div className="max-w-xl mx-auto px-6 py-12 space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-block bg-[#111111] p-4 rounded-3xl border border-[#D4AF37]/30 shadow-[0_0_40px_rgba(212,175,55,0.1)] mb-4"
          >
            <Star size={40} className="text-[#D4AF37] fill-[#D4AF37]/20" />
          </motion.div>
          <div className="space-y-1">
            <h1 className="font-serif text-3xl leading-tight">Hola, {maskedName}</h1>
            <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.4em] font-bold opacity-80">{brand.groupName} Rewards</p>
            {client.restaurant_name && (
              <p className="text-white/20 text-[8px] uppercase tracking-widest font-bold">Cliente preferente de {client.restaurant_name === 'El Balconet' && brand.name !== 'El Balconet' ? brand.name : client.restaurant_name}</p>
            )}
          </div>
        </div>

        {/* Main Scoreboard */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111111] border border-white/5 rounded-[40px] p-8 relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Trophy size={160} />
          </div>

          <div className="relative z-10 text-center space-y-8">
            <div>
              <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-bold mb-2">Tus Puntos Totales</p>
              <h2 className="text-7xl font-serif text-[#D4AF37] tabular-nums tracking-tighter">{client.total_points}</h2>
              {expirationDate && (
                <p className="text-[9px] text-[#D4AF37]/40 uppercase tracking-widest mt-2 font-bold">
                  Caducan si no nos visitas antes del {expirationDate.toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-4">
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E8C84A]"
                />
              </div>
              <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-white/40">
                <span>0</span>
                <span>Objetivo: {threshold} pts</span>
              </div>
            </div>

            {pointsRemaining > 0 ? (
              <div className="bg-white/5 p-4 rounded-2xl inline-flex items-center gap-3">
                 <CheckCircle2 size={16} className="text-[#D4AF37]/40" />
                 <p className="text-xs text-white/60">Te faltan <span className="text-white font-bold">{pointsRemaining} puntos</span> para tu próximo premio.</p>
              </div>
            ) : (
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl inline-flex items-center gap-3 animate-pulse">
                 <Gift size={16} className="text-green-400" />
                 <p className="text-xs text-green-400 font-bold">¡Tienes un premio listo para canjear!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Rewards Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-white/10" />
            <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/30">Mis Premios</h3>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          <div className="space-y-4">
            {rewards.length === 0 ? (
              <div className="text-center py-12 bg-white/20 rounded-3xl border border-dashed border-white/5">
                <Ticket size={24} className="mx-auto mb-3 opacity-20" />
                <p className="text-xs text-white/20 italic font-serif">Aún no tienes premios registrados.</p>
                <p className="text-[9px] text-white/10 uppercase tracking-widest mt-2">¡Sigue disfrutando de nuestra cocina!</p>
              </div>
            ) : (
              rewards.map(reward => (
                <div 
                  key={reward.id}
                  className={`p-6 rounded-3xl border flex items-center justify-between transition-all ${
                    reward.status === 'pending' 
                      ? 'bg-[#111111] border-white/10 shadow-xl' 
                      : 'bg-transparent border-white/5 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-2xl ${reward.status === 'pending' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-white/5 text-white/20'}`}>
                      <Gift size={24} />
                    </div>
                    <div>
                      <h4 className="font-serif text-lg leading-snug">{reward.reward_name}</h4>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1 flex items-center gap-2">
                        <Calendar size={12} /> Válido hasta: {new Date(reward.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {reward.status === 'pending' && (
                    <div className="bg-green-500/10 text-green-500 text-[8px] uppercase tracking-[0.2em] font-bold px-3 py-1 rounded-full border border-green-500/20">
                      Disponible
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-6 rounded-3xl space-y-2">
             <Clock size={20} className="text-[#D4AF37]/40" />
             <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/20">Caducidad</h4>
             <p className="text-xs text-white/60 leading-relaxed">Los premios tienen una validez de 2 semanas.</p>
          </div>
          <div className="bg-white/5 p-6 rounded-3xl space-y-2">
             <Ticket size={20} className="text-[#D4AF37]/40" />
             <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/20">Canjeo</h4>
             <p className="text-xs text-white/60 leading-relaxed">Muestra esta pantalla al camarero al pagar.</p>
          </div>
        </div>

        {/* Dynamic Suggestions - Marketing de Consumo */}
        {(suggestions.length > 0) && (
          <div className="mt-12 pt-12 border-t border-white/5 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-serif text-white tracking-tight">Date un capricho</h3>
                <p className="text-[#D4AF37] text-[10px] uppercase tracking-widest font-bold">Y alcanza tu próximo premio hoy mismo</p>
              </div>
              <div className="p-3 bg-[#D4AF37]/10 rounded-2xl text-[#D4AF37]">
                <Utensils size={24} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {suggestions.map((dish: any, i) => {
                const points = Math.floor(dish.price || 0)
                const hasImage = !!dish.image_url
                const isFullMenu = dish.type === 'full_menu'
                
                return (
                  <div key={i} className={`bg-[#111111] border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-[#D4AF37]/30 transition-all shadow-xl flex flex-col sm:flex-row h-full min-h-[160px] ${isFullMenu ? 'ring-2 ring-[#D4AF37]/20 border-[#D4AF37]/30' : ''}`}>
                      {/* Image Area */}
                      {hasImage && (
                        <div className={`w-full sm:w-2/5 aspect-video sm:aspect-auto relative flex-shrink-0`}>
                          <img 
                            src={dish.image_url} 
                            alt={dish.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
                          
                          {/* Points Badge Overlay */}
                          <div className="absolute top-4 left-4 bg-[#D4AF37] text-black px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-lg animate-pulse">
                             +{points} PTS
                          </div>
                        </div>
                      )}

                      {/* Content Area */}
                      <div className={`p-8 flex-1 flex flex-col justify-between ${!hasImage ? 'bg-gradient-to-br from-[#1A1A1A] to-[#111111]' : ''}`}>
                        <div className="relative">
                          {!hasImage && (
                            <div className="inline-block bg-[#D4AF37] text-black px-3 py-1 rounded-full font-bold text-[8px] uppercase tracking-widest mb-4">
                               +{points} PTS
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between mb-3">
                            <p className="text-[#D4AF37] text-[9px] uppercase tracking-[0.3em] font-bold opacity-60">
                               {isFullMenu ? 'Recomendación Estrella' : (dish.type === 'menu' ? 'Especial Menú Diario' : 'Imperdible de la Carta')}
                            </p>
                            {isFullMenu && (
                              <div className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${dish.isWeekend ? 'bg-white/5 text-white/40' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                {dish.isWeekend ? 'Fin de Semana' : 'Lunes a Viernes'}
                              </div>
                            )}
                          </div>
                          
                          <h4 className="text-white font-serif text-2xl mb-2 group-hover:text-[#D4AF37] transition-colors line-clamp-2">{dish.name}</h4>
                          <p className="text-white/40 text-sm leading-relaxed mb-6 line-clamp-2">{dish.description}</p>

                          {isFullMenu && dish.includes && (
                            <div className="grid grid-cols-2 gap-3 mb-8">
                               {dish.includes.map((item: string, idx: number) => (
                                 <div key={idx} className="flex items-center gap-2 text-[10px] text-white/60 font-medium">
                                    <CheckCircle2 size={12} className="text-[#D4AF37]" />
                                    {item}
                                 </div>
                               ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                           <div className="flex items-baseline gap-2">
                             <span className="text-4xl font-serif text-white">{dish.price}€</span>
                             {isFullMenu && <span className="text-[10px] text-white/20 uppercase tracking-widest">Todo Incluido</span>}
                           </div>
                           <div className="text-[10px] text-white/30 uppercase tracking-widest flex items-center gap-2">
                              {isFullMenu ? 'Pide hoy mismo' : 'Acelera tu premio'} <ArrowRight size={12} className="text-[#D4AF37]" />
                           </div>
                        </div>
                      </div>
                  </div>
                )
              })}
            </div>

            {/* Final Marketing Hook */}
            <div className="bg-gradient-to-br from-[#D4AF37]/10 to-transparent p-8 rounded-[2.5rem] border border-[#D4AF37]/20 text-center relative overflow-hidden">
               <div className="absolute -right-8 -top-8 opacity-5">
                  <Trophy size={120} />
               </div>
               <p className="text-white font-serif italic text-lg mb-2">"A veces, el mayor premio es el plato que tienes delante"</p>
               <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Pide una sugerencia y suma puntos de oro</p>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-16 text-center space-y-4 border-t border-white/5 pt-8">
           <p className="text-white/20 text-[9px] uppercase tracking-[0.3em] font-medium leading-relaxed">
             {brand.name}<br/>
             Gràcies por la teva fidelitad
           </p>
        </div>

      </div>
    </div>
  )
}
