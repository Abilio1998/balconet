'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2Icon, ShieldAlert, FileOutput, Trash2, CheckCircle2, UserCircle, Calendar, Gift, AlertTriangle, AlertCircle, ArrowLeft, X } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

type Reservation = {
  id: string
  client_name: string
  client_phone: string
  guests: number
  reservation_date: string
  reservation_time: string
  status: string
  notes?: string
}

type LoyaltyClient = {
  id: string
  name: string
  phone: string
  total_points: number
  last_activity?: string
}

type ProfileParams = {
  name: string
  phone: string
  reservations: Reservation[]
  loyalty: LoyaltyClient | null
}

export default function RgpdManager() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [profiles, setProfiles] = useState<ProfileParams[]>([])
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number | null>(null)
  const data = selectedProfileIndex !== null ? profiles[selectedProfileIndex] : null
  const [errorMsg, setErrorMsg] = useState('')

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (query.length < 3) {
      setErrorMsg('Introduce al menos 3 caracteres')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    setProfiles([])
    setSelectedProfileIndex(null)

    try {
      const res = await fetch('/api/admin/rgpd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query })
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Error en la búsqueda')
      
      setProfiles(result.profiles)
      
      if (result.profiles.length === 0) {
        setErrorMsg('No se han encontrado registros vinculados a este identificador.')
      } else if (result.profiles.length === 1) {
        // Auto-seleccionar si solo hay 1
        setSelectedProfileIndex(0)
      } else {
        // Obligamos al usuario a elegir un perfil
        setSelectedProfileIndex(null)
      }
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchAll = async () => {
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    setProfiles([])
    setSelectedProfileIndex(null)
    setQuery('') // Indicamos que es una búsqueda global

    try {
      const res = await fetch('/api/admin/rgpd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search_all' })
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Error en la búsqueda del directorio')
      
      setProfiles(result.profiles)
      
      if (result.profiles.length === 0) {
        setErrorMsg('La base de datos está vacía.')
      } else {
        setSelectedProfileIndex(null) // Para que muestre la lista grid completa
      }
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnonymize = async () => {
    if (!data) return
    setDeleting(true)
    setErrorMsg('')

    try {
      // Recopilar teléfonos únicos de las reservas para anonimizar
      const phoneSet = new Set<string>()
      data.reservations.forEach(r => phoneSet.add(r.client_phone))
      if (data.loyalty?.phone) phoneSet.add(data.loyalty.phone)

      const clientPhones = Array.from(phoneSet)
      const loyaltyId = data.loyalty?.id

      const res = await fetch('/api/admin/rgpd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'anonymize', clientPhones, loyaltyId })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      setSuccessMsg(`Proceso legal completado. ${result.stats.reservationsAffected} reservas anonimizadas de por vida. ${result.stats.loyaltyDeleted ? 'Perfil de fidelidad destruido.' : ''}`)
      setSelectedProfileIndex(null)
      setProfiles([])
      setQuery('')
      setConfirmDelete(false)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleBack = () => {
    if (profiles.length > 1) {
      setSelectedProfileIndex(null) // Vuelve a la cuadrícula
    } else {
      // Limpia todo
      setProfiles([])
      setSelectedProfileIndex(null)
      setQuery('')
    }
  }

  const handleClear = () => {
    setProfiles([])
    setSelectedProfileIndex(null)
    setQuery('')
    setErrorMsg('')
    setSuccessMsg('')
  }

  const downloadPdf = () => {
    if (!data) return

    const doc = new jsPDF()
    
    // Header
    doc.setFillColor(17, 17, 17)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(212, 175, 55) // Gold
    doc.setFontSize(22)
    doc.text('EL BALCONET', 105, 18, { align: 'center' })
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text('INFORME DE CUMPLIMIENTO RGPD (Derecho de Acceso)', 105, 26, { align: 'center' })
    doc.text(`Identificador de consulta: ${query}`, 105, 32, { align: 'center' })

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}`, 14, 50)
    
    // Loyalty Section
    if (data.loyalty) {
      doc.setFontSize(14)
      doc.setTextColor(212, 175, 55)
      doc.text('Perfil de Cliente y Fidelización', 14, 65)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      doc.text(`Nombre: ${data.loyalty.name}`, 14, 73)
      doc.text(`Teléfono: ${data.loyalty.phone}`, 14, 79)
      doc.text(`Puntos / Saldo Virtual: ${data.loyalty.total_points}`, 14, 85)
      doc.text(`Última Actividad: ${data.loyalty.last_activity ? new Date(data.loyalty.last_activity).toLocaleDateString('es-ES') : 'N/A'}`, 14, 91)
    } else {
      doc.setFontSize(10)
      doc.text('Este usuario no está inscrito en el programa de fidelización digital.', 14, 65)
    }

    // Reservations Section
    const startY = data.loyalty ? 105 : 85
    doc.setFontSize(14)
    doc.setTextColor(212, 175, 55)
    doc.text('Historial de Reservas', 14, startY)

    if (data.reservations.length > 0) {
      autoTable(doc, {
        startY: startY + 5,
        head: [['Fecha', 'Hora', 'Nombre de Reserva', 'Teléfono', 'Comensales', 'Estado']],
        body: data.reservations.map(r => [
          new Date(r.reservation_date).toLocaleDateString('es-ES'),
          r.reservation_time,
          r.client_name,
          r.client_phone,
          r.guests.toString(),
          r.status.toUpperCase()
        ]),
        headStyles: { fillColor: [40, 40, 40] },
        styles: { font: 'helvetica', fontSize: 9 }
      })
    } else {
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      doc.text('No hay registros de reservas asociadas.', 14, startY + 10)
    }

    doc.save(`RGPD_Acceso_${query}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-[#111111] border border-white/10 p-6 rounded-sm">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por Teléfono, Nombre o Email del cliente..."
              className="w-full bg-black/50 border border-white/10 rounded-sm py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button 
              type="submit"
              disabled={loading}
              className="btn-gold flex items-center justify-center gap-2 px-6 py-3 whitespace-nowrap"
            >
              {loading && query ? <Loader2Icon size={18} className="animate-spin" /> : <Search size={18} />}
              Buscar
            </button>
            <button 
              type="button"
              onClick={handleSearchAll}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 whitespace-nowrap bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors rounded-sm text-sm font-medium"
            >
              {loading && !query ? <Loader2Icon size={18} className="animate-spin" /> : <UserCircle size={18} />}
              Directorio
            </button>
            {(profiles.length > 0 || query.length > 0 || errorMsg) && (
              <button 
                type="button"
                onClick={handleClear}
                className="flex items-center justify-center gap-2 px-4 py-3 whitespace-nowrap bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors rounded-sm text-sm"
                title="Limpiar búsqueda"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </form>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-sm border border-red-400/20 text-sm">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 text-green-400 bg-green-400/10 p-4 rounded-sm border border-green-400/20">
            <CheckCircle2 size={20} />
            <p className="font-medium text-sm">{successMsg}</p>
          </div>
        )}
      </div>

      {/* Selección de Perfiles (Conflictos o Directorio Completo) */}
      {profiles.length > 1 && selectedProfileIndex === null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-[#111111] border border-white/10 p-6 rounded-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`font-serif text-xl flex items-center gap-2 ${query ? 'text-orange-400' : 'text-white'}`}>
                  {query ? <AlertTriangle size={20} /> : <UserCircle size={20} className="text-[#D4AF37]" />} 
                  {query ? 'Múltiples Identidades Detectadas' : 'Directorio Global de Clientes'}
                </h3>
                <p className="text-white/50 text-sm mt-1">
                  {query 
                    ? `Tu búsqueda de "${query}" arroja registros para diferentes personas (con números de teléfono distintos). Por privacidad, selecciona el perfil exacto sobre el que quieres operar.`
                    : 'Listado completo iterativo de los clientes recogidos en el histórico de reservas y fidelidad.'}
                </p>
              </div>
              <div className="bg-black/50 border border-white/10 px-4 py-2 rounded-sm text-center">
                <p className="text-[#D4AF37] font-bold text-xl">{profiles.length}</p>
                <p className="text-[9px] uppercase tracking-widest text-white/40">Perfiles</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[550px] overflow-y-auto custom-scrollbar p-1">
              {profiles.map((p, idx) => (
                <button
                  key={p.phone}
                  onClick={() => setSelectedProfileIndex(idx)}
                  className="flex flex-col text-left p-4 bg-black/40 border border-white/10 rounded-sm hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all group"
                >
                  <p className="text-white font-medium mb-1 group-hover:text-[#D4AF37]">{p.name || 'Sin Nombre'}</p>
                  <p className="text-[11px] text-white/50 tracking-widest font-mono">{p.phone}</p>
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-4">
                    <span className="text-[10px] text-white/30 uppercase flex items-center gap-1"><Calendar size={10}/> {p.reservations.length} rsvs</span>
                    {p.loyalty && <span className="text-[10px] text-purple-400 uppercase flex items-center gap-1"><Gift size={10}/> Cliente VIP</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Results View */}
      {data && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-6"
        >
          {/* Main header block for profile */}
          <div className="bg-[#111111] border border-[#D4AF37]/30 p-8 rounded-sm shadow-[0_0_30px_rgba(212,175,55,0.05)]">
            
            {/* Top Bar with Go Back */}
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/5">
               <button 
                 onClick={handleBack}
                 className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors uppercase tracking-widest font-bold"
               >
                 <ArrowLeft size={16} /> Volver
               </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
              <div>
                <h3 className="text-[#D4AF37] text-sm uppercase tracking-widest font-bold font-sans mb-2 flex items-center gap-2">
                  <ShieldAlert size={16} /> Identidad Confirmada
                </h3>
                <p className="text-white font-serif text-2xl">{data.name}</p>
                <p className="text-white/40 font-mono tracking-widest text-sm mt-1">{data.phone}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button 
                  onClick={downloadPdf}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black hover:bg-white/80 transition-colors rounded-sm text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] whitespace-nowrap"
                >
                  <FileOutput size={16} /> Extraer en PDF (Acceso)
                </button>
                <button 
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-colors rounded-sm text-sm font-bold whitespace-nowrap"
                >
                  <Trash2 size={16} /> Derecho al Olvido
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Resumen de Reservas */}
              <div className="bg-black/30 p-6 rounded-sm border border-white/5 flex items-start gap-4">
                <div className="p-3 bg-[#D4AF37]/10 rounded-full border border-[#D4AF37]/20 shrink-0">
                  <Calendar size={24} className="text-[#D4AF37]" />
                </div>
                <div>
                  <h4 className="text-white font-medium text-lg mb-1">Impacto en Sala</h4>
                  <p className="text-white/40 text-sm mb-3">Histórico de reservas y visitas gestionadas</p>
                  
                  <div className="space-y-1">
                    <p className="text-3xl font-serif text-[#D4AF37] leading-none mb-2">{data.reservations.length}</p>
                    <p className="text-xs uppercase tracking-widest text-white/30">Reservas Registradas</p>
                  </div>
                </div>
              </div>

              {/* Resumen Fidelidad */}
              <div className="bg-black/30 p-6 rounded-sm border border-white/5 flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 rounded-full border border-purple-500/20 shrink-0">
                  <Gift size={24} className="text-purple-400" />
                </div>
                <div className="w-full">
                  <h4 className="text-white font-medium text-lg mb-1">Plataforma de Fidelidad</h4>
                  {data.loyalty ? (
                    <>
                      <p className="text-white/40 text-sm mb-3">Cliente afiliado al programa VIP</p>
                      <div className="flex items-end justify-between border-b border-white/5 pb-2 mb-2">
                         <p className="text-white/60 text-sm font-medium">{data.loyalty.name}</p>
                         <p className="text-purple-400 font-bold">{data.loyalty.total_points} Pts</p>
                      </div>
                      <p className="text-[10px] text-white/30 uppercase">Última act: {data.loyalty.last_activity ? new Date(data.loyalty.last_activity).toLocaleDateString('es-ES') : 'N/A'}</p>
                    </>
                  ) : (
                    <p className="text-white/30 text-sm italic mt-2">No se han encontrado registros en la base de datos de fidelización para este usuario.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* Confirm Delete Modal */}
      <AnonymizeModal 
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleAnonymize}
        loading={deleting}
        reservationsCount={data?.reservations.length || 0}
        hasLoyalty={!!data?.loyalty}
      />
    </div>
  )
}

function AnonymizeModal({ isOpen, onClose, onConfirm, loading, reservationsCount, hasLoyalty }: any) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-[#0d0d0d] border border-red-500/30 p-8 rounded-sm max-w-lg w-full shadow-2xl"
      >
        <div className="flex items-center gap-4 mb-6 text-red-500">
          <AlertTriangle size={32} />
          <h2 className="text-2xl font-serif text-white">Extrema Precaución</h2>
        </div>
        
        <p className="text-white/70 mb-4 leading-relaxed text-sm">
          Estás a punto de invocar el <strong>Derecho al Olvido (RGPD)</strong>. Esta acción destruirá la huella digital del cliente para siempre.
        </p>

        <ul className="space-y-3 mb-8 text-sm">
           <li className="flex items-start gap-2 text-white/50">
             <div className="mt-1 shrink-0"><CheckCircle2 size={14} className="text-red-400" /></div>
             <span>Se <strong>anonimizarán de por vida</strong> los datos personales (Nombre, Email, Teléfono, Alergias) de <strong className="text-white">{reservationsCount} reserva(s)</strong>. Los contadores pasados de comensales y dinero facturado se mantendrán íntegros.</span>
           </li>
           {hasLoyalty && (
             <li className="flex items-start gap-2 text-white/50">
               <div className="mt-1 shrink-0"><CheckCircle2 size={14} className="text-red-400" /></div>
               <span>Se <strong>destruirá su perfil de Fidelización</strong>. Su cuenta de cliente y todo su saldo de puntos acumulado quedarán invalidados y borrados inmediatamente.</span>
             </li>
           )}
        </ul>

        <div className="flex justify-end gap-4">
          <button 
            disabled={loading}
            onClick={onClose}
            className="px-6 py-2 border border-white/10 text-white/60 hover:text-white rounded-sm text-sm transition-colors"
          >
            Cancelar
          </button>
          <button 
            disabled={loading}
            onClick={onConfirm}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-sm text-sm font-bold shadow-lg transition-colors min-w-[200px]"
          >
            {loading ? <Loader2Icon size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Ejecutar Derecho al Olvido
          </button>
        </div>
      </motion.div>
    </div>
  )
}
