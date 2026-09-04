'use client'

import { useState, useEffect } from 'react'
import { Calendar, Users, Clock, Phone, User, MessageCircle, CheckCircle2, Loader2, AlertCircle, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBrand } from '@/lib/brand-config'
import { useI18n } from '@/context/I18nContext'

export default function ReservationForm() {
  const brand = getBrand()
  const { t } = useI18n()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    guests: 2,
    time: '',
    name: '',
    email: '',
    phone: '',
    notes: '',
    zone: 'inside' as 'inside' | 'terrace'
  })

  const [availableSlots, setAvailableSlots] = useState<{ time: string, available: boolean }[]>([])
  const [isClosed, setIsClosed] = useState(false)
  const [disableWebReservations, setDisableWebReservations] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('34600000000')

  // Cargar disponibilidad al cambiar fecha o comensales
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!formData.date) return
      setLoading(true)
      setError(null) // Clear previous errors
      try {
        const res = await fetch(`/api/public/reservations?date=${formData.date}&guests=${formData.guests}&zone=${formData.zone}`)
        const data = await res.json()
        setAvailableSlots(data.slots || [])
        setWhatsappNumber(data.whatsapp_number || '')
        setDisableWebReservations(!!data.disable_web_reservations)

        if (data.manual_block) {
          setError(formData.zone === 'terrace' ? 'La terraza está completa para el día seleccionado.' : 'El salón interior está completo para el día seleccionado.')
        } else if (data.closed) {
          setError('El restaurante permanece cerrado el día seleccionado.')
        } else if (!data.slots || data.slots.length === 0) {
          setError('No hay disponibilidad para el número de personas seleccionado.')
        }
      } catch (err) {
        console.error('Error fetching availability', err)
        setError('Error al cargar la disponibilidad. Por favor, inténtalo de nuevo.')
      } finally {
        setLoading(false)
      }
    }
    fetchAvailability()
  }, [formData.date, formData.guests, formData.zone])

  const handlePhoneValidation = (value: string) => {
    const clean = value.replace(/\s+/g, '')
    setFormData({ ...formData, phone: clean })
  }

  const handleProceedToStep3 = (e: React.FormEvent) => {
    e.preventDefault()

    // Validación de móvil española
    const phoneRegex = /^[67]\d{8}$/
    if (!phoneRegex.test(formData.phone)) {
      setError('Por favor, introduce un número de móvil válido (9 dígitos, empezando por 6 o 7)')
      return
    }

    setError(null)
    setStep(3)
  }

  const confirmAndOpenWhatsApp = async () => {
    // 1. Open WhatsApp immediately to avoid popup blockers
    openWhatsApp()
    
    // 2. Submit the reservation to the backend
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/public/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setStep(4)
      } else {
        throw new Error(data.error || 'Error al procesar la reserva')
      }
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
      setStep(2) // return to form to show error
    } finally {
      setLoading(false)
    }
  }

  const openWhatsApp = () => {
    let cleanPhone = whatsappNumber.replace(/\D/g, '')
    if (cleanPhone.length === 9 && (cleanPhone.startsWith('6') || cleanPhone.startsWith('7'))) {
      cleanPhone = '34' + cleanPhone
    }

    const message = encodeURIComponent(
      `Hola ${brand.name}, acabo de realizar una reserva a nombre de ${formData.name}.\n` +
      `Fecha: ${formData.date}\n` +
      `Hora: ${formData.time}\n` +
      `Comensales: ${formData.guests}\n` +
      `¡Nos vemos pronto!`
    )
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
  }

  return (
    <div className="max-w-xl mx-auto bg-white border border-black/10 p-8 rounded-sm shadow-2xl">
      <AnimatePresence mode="wait">
        {disableWebReservations ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key="disabled"
            className="text-center py-12 space-y-8"
          >
            <div className="w-24 h-24 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#D4AF37]/20">
              <Phone size={40} className="text-[#D4AF37] animate-pulse" />
            </div>
            
            <div className="space-y-4">
              <h3 className="font-serif text-3xl text-[#111111] uppercase tracking-[0.2em] font-bold">
                {t('reservations.web_disabled_title')}
              </h3>
              <p className="text-[#111111]/70 text-base leading-relaxed max-w-sm mx-auto font-sans italic">
                "{t('reservations.web_disabled_message')}"
              </p>
            </div>

            <div className="pt-6">
              <a
                href={`tel:${brand.phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-4 bg-[#D4AF37] text-black font-bold py-5 px-10 rounded-sm hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#D4AF37]/20 uppercase tracking-[0.2em] text-sm"
              >
                <Phone size={20} />
                {t('reservations.call_now')}
              </a>
            </div>

            <div className="pt-8 border-t border-black/5">
              <p className="text-[10px] text-[#111111]/40 uppercase tracking-[0.3em] font-medium font-bold">
                {brand.name} · {brand.aboutLocation}
              </p>
            </div>
          </motion.div>
        ) : step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            key="step1"
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="font-serif text-2xl text-[#D4AF37] mb-2 uppercase tracking-widest font-bold">{t('reservations.title')}</h3>
              <p className="text-[#111111]/50 text-sm italic font-medium">{t('reservations.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[#111111]/60 font-bold flex items-center gap-2">
                  <Calendar size={12} /> Fecha
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value, time: '' })}
                  className="w-full bg-black/5 border border-black/10 p-3 text-[#111111] focus:border-[#D4AF37] outline-none transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[#111111]/60 font-bold flex items-center gap-2">
                  <Users size={12} /> Comensales
                </label>
                <div className="relative group/select">
                  <select
                    value={formData.guests}
                    onChange={e => setFormData({ ...formData, guests: parseInt(e.target.value), time: '' })}
                    className="w-full bg-black/5 border border-black/10 p-4 text-sm text-[#111111] font-medium focus:border-[#D4AF37] outline-none transition-all appearance-none cursor-pointer group-hover/select:border-black/20"
                    aria-label="Número de personas"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map(n => (
                      <option key={n} value={n} className="bg-white">{n} {n === 1 ? 'Persona' : 'Personas'}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#111111]/50 group-hover/select:text-[#D4AF37] transition-colors">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-widest text-[#111111]/60 font-bold flex items-center gap-2">
                Ubicación
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, zone: 'inside', time: '' })}
                  className={`py-3 text-xs border transition-all flex flex-col items-center gap-1 ${formData.zone === 'inside'
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]'
                      : 'border-black/10 text-[#111111]/50 hover:border-black/20 hover:text-[#111111]'
                    }`}
                >
                  <span className="font-bold uppercase tracking-widest">Interior</span>
                  <span className="text-[9px] opacity-60 font-medium">Salón principal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, zone: 'terrace', time: '' })}
                  className={`py-3 text-xs border transition-all flex flex-col items-center gap-1 ${formData.zone === 'terrace'
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]'
                      : 'border-black/10 text-[#111111]/50 hover:border-black/20 hover:text-[#111111]'
                    }`}
                >
                  <span className="font-bold uppercase tracking-widest">Terraza</span>
                  <span className="text-[9px] opacity-60 font-medium">Al aire libre</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest text-[#111111]/60 font-bold flex items-center gap-2">
                <Clock size={12} /> Selecciona horario
              </label>

              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#D4AF37]" /></div>
              ) : isClosed ? (
                <div className="p-8 text-center border border-red-500/20 bg-red-500/5 text-red-400 text-sm">
                  Lo sentimos, estamos cerrados este día.
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {availableSlots.map(slot => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setFormData({ ...formData, time: slot.time })}
                      className={`py-3.5 text-[13px] border transition-all duration-300 rounded-sm font-bold ${formData.time === slot.time
                          ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                          : 'border-black/10 text-[#111111]/50 hover:border-[#D4AF37]/50 hover:text-[#111111]'
                        }`}
                      aria-label={`Reservar a las ${slot.time}`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border border-black/10 bg-black/5 text-[#111111]/50 font-medium text-sm italic">
                  No hay disponibilidad para el número de personas seleccionado.
                </div>
              )}
            </div>

            <button
              disabled={!formData.time}
              onClick={() => setStep(2)}
              className="w-full bg-[#D4AF37] text-black font-bold uppercase tracking-[0.2em] py-4 hover:bg-[#B8962D] transition-all disabled:opacity-20 disabled:cursor-not-allowed mt-4 shadow-lg shadow-[#D4AF37]/10"
            >
              Continuar
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            key="step2"
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h3 className="font-serif text-2xl text-[#D4AF37] mb-2 uppercase tracking-widest font-bold">Tus Datos</h3>
              <p className="text-[#111111]/50 font-medium text-sm italic">Casi hemos terminado</p>
            </div>

            <form onSubmit={handleProceedToStep3} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[#111111]/60 font-bold flex items-center gap-2">
                  <User size={12} /> Tu nombre
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-black/5 border border-black/10 p-4 text-[#111111] font-medium focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[#111111]/60 font-bold flex items-center gap-2">
                  <User size={12} /> Correo Electrónico
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ej. juan@correo.com"
                  className="w-full bg-black/5 border border-black/10 p-4 text-[#111111] font-medium focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[#111111]/60 font-bold flex items-center gap-2">
                  <Phone size={12} /> Teléfono Móvil (WhatsApp)
                </label>
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={e => handlePhoneValidation(e.target.value)}
                  placeholder="Ej. 600123456"
                  className="w-full bg-black/5 border border-black/10 p-4 text-[#111111] font-medium focus:border-[#D4AF37] outline-none"
                />
                <p className="text-[9px] text-[#111111]/40 font-medium italic">Usaremos este número para enviarte la confirmación por WhatsApp.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[#111111]/60 font-bold">Notas (Opcional)</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Alérgenos, trona, celebración..."
                  className="w-full bg-black/5 border border-black/10 p-4 text-[#111111] font-medium focus:border-[#D4AF37] outline-none resize-none"
                />
              </div>

              <div className="flex items-start gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="whatsapp_confirm" 
                  required 
                  className="mt-0.5 shrink-0 w-3.5 h-3.5 accent-[#D4AF37] cursor-pointer"
                />
                <label htmlFor="whatsapp_confirm" className="text-[10px] text-[#111111]/60 font-medium leading-relaxed cursor-pointer">
                  Entiendo que es <strong className="text-[#D4AF37]">obligatorio</strong> enviar el mensaje de WhatsApp en el siguiente paso para que mi reserva sea validada por el restaurante.
                </label>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="privacy" 
                  required 
                  className="mt-0.5 shrink-0 w-3.5 h-3.5 accent-[#D4AF37] cursor-pointer"
                />
                <label htmlFor="privacy" className="text-[10px] text-[#111111]/60 font-medium leading-relaxed cursor-pointer">
                  He leído y acepto la <a href="/politica-privacidad" target="_blank" className="text-[#D4AF37] hover:underline">Política de Privacidad</a> y acepto el tratamiento de mis datos para la gestión de esta reserva.
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-black/10 text-[#111111]/50 uppercase font-bold tracking-widest text-xs py-4 hover:text-[#111111] transition-all"
                >
                  Volver
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="bg-[#D4AF37] text-black font-bold uppercase tracking-[0.2em] py-4 hover:bg-[#B8962D] transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Siguiente Paso'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key="success"
            className="text-center py-8 space-y-6"
          >
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <AlertCircle size={48} className="text-amber-500 animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif text-3xl text-[#D4AF37] mb-2 uppercase tracking-widest font-bold">¡CASI LISTO!</h3>
              <p className="text-[#111111]/80 font-medium text-sm max-w-sm mx-auto">
                Tu mesa para el **{formData.date}** a las **{formData.time}** está pre-reservada.
              </p>
            </div>

            <div className="bg-white border border-[#D4AF37]/30 p-8 rounded-sm space-y-6 shadow-xl">
              <p className="text-xs text-[#D4AF37] leading-relaxed uppercase tracking-widest font-bold">
                Paso Final Obligatorio:
              </p>
              <p className="text-sm text-[#111111]/80 font-medium">
                Tu reserva <strong className="text-[#111111]">NO</strong> se guardará hasta que envíes el mensaje de WhatsApp.
              </p>
              <button
                onClick={confirmAndOpenWhatsApp}
                disabled={loading}
                className="w-full bg-[#25D366] text-white font-bold py-5 rounded-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-green-500/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><MessageCircle size={22} /> ENVIAR WHATSAPP Y CONFIRMAR</>}
              </button>
            </div>

            <button
              onClick={() => setStep(2)}
              className="text-[#111111]/50 text-xs font-bold uppercase tracking-widest hover:underline"
            >
              Volver atrás
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key="final"
            className="text-center py-8 space-y-6"
          >
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-serif text-3xl text-[#111111] font-bold mb-2 uppercase tracking-widest">¡RESERVA COMPLETADA!</h3>
              <p className="text-[#111111]/70 font-medium text-sm max-w-sm mx-auto">
                Tu reserva ha sido guardada y el mensaje de confirmación se ha abierto. ¡Te esperamos!
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest hover:underline mt-8"
            >
              Realizar otra reserva
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
