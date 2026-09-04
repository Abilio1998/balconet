'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Star, 
  Users, 
  Settings, 
  PlusCircle, 
  Search, 
  Phone, 
  Receipt, 
  Euro, 
  CheckCircle2, 
  MessageCircle, 
  History, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Copy,
  ExternalLink,
  ChevronRight,
  Gift,
  ArrowLeft,
  RefreshCw,
  Utensils,
  Camera,
  MapPin,
  Clock,
  ArrowLeftRight,
  QrCode,
  X,
  Trash2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const RESTAURANTS = [
  'El Balconet',
  'El Nou Balconet',
  'Restaurant Sant Jaume'
]

type Client = {
  id: string
  name: string
  phone: string
  total_points: number
  magic_token: string
  restaurant_name: string
  last_activity: string
  created_at: string
}

type Reward = {
  id: string
  client_id: string
  reward_name: string
  status: 'pending' | 'redeemed' | 'expired'
  expires_at: string
  created_at: string
}

type SettingsData = {
  id: string
  points_per_euro: number
  points_threshold: number
  reward_message_template: string
  reward_validity_days: number
  reward_name: string
  points_expiration_months: number
}

export default function LoyaltyManager() {
  const [activeTab, setActiveTab] = useState<'quick' | 'clients' | 'settings'>('quick')
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [settings, setSettings] = useState<SettingsData | null>(null)
  
  // Multi-restaurant state
  const [currentRestaurant, setCurrentRestaurant] = useState<string>('')
  
  // Quick Add State
  const [phoneSearch, setPhoneSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [amount, setAmount] = useState('')
  const [invoiceId, setInvoiceId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [newReward, setNewReward] = useState<Reward | null>(null)
  const [clientRewards, setClientRewards] = useState<Reward[]>([])
  
  // Edit Client State
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [filterRestaurant, setFilterRestaurant] = useState<string>('all')

  // QR Modal State
  const [showQR, setShowQR] = useState(false)

  const pathname = usePathname()
  const isSalaRole = pathname?.startsWith('/sala')

  useEffect(() => {
    const saved = localStorage.getItem('loyalty_current_restaurant')
    if (saved && RESTAURANTS.includes(saved)) {
      setCurrentRestaurant(saved)
    } else {
      setCurrentRestaurant(RESTAURANTS[0])
    }
  }, [])

  const handleRestaurantChange = (res: string) => {
    setCurrentRestaurant(res)
    localStorage.setItem('loyalty_current_restaurant', res)
  }

  const fetchClientRewards = useCallback(async (clientId: string) => {
    const { data } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (data) setClientRewards(data)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: clientsData } = await supabase
        .from('loyalty_clients')
        .select('*')
        .order('name')
      
      const { data: settingsData } = await supabase
        .from('loyalty_settings')
        .select('*')
        .single()

      setClients(clientsData || [])
      setSettings(settingsData || null)
    } catch (err) {
      console.error('Error fetching loyalty data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Sync rewards when client changes
  useEffect(() => {
    if (selectedClient?.id) {
      fetchClientRewards(selectedClient.id)
    } else {
      setClientRewards([])
    }
  }, [selectedClient?.id, fetchClientRewards])

  const handleSearchClient = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const found = clients.find(c => c.phone === phoneSearch || c.name.toLowerCase().includes(phoneSearch.toLowerCase()))
    if (found) {
      setSelectedClient(found)
      fetchClientRewards(found.id)
      setStatusMessage(null)
    } else {
      setSelectedClient(null)
      setStatusMessage({ type: 'error', text: 'Cliente no encontrado' })
    }
  }

  const handleAddPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient || !amount || !invoiceId) return

    setIsSubmitting(true)
    setStatusMessage(null)
    setNewReward(null)

    try {
      const res = await fetch('/api/admin/loyalty/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient.id,
          invoice_id: invoiceId,
          amount: parseFloat(amount),
          restaurant_name: currentRestaurant
        })
      })

      const result = await res.json()

      if (res.ok) {
        setStatusMessage({ 
          type: 'success', 
          text: `¡Éxito! ${result.points_earned} puntos añadidos. Nuevo saldo: ${result.new_total}` 
        })
        if (result.reward) setNewReward(result.reward)
        if (result.was_reset) alert('Nota: Los puntos anteriores del cliente habían caducado por inactividad y se han reiniciado.')
        
        setSelectedClient(prev => prev ? { ...prev, total_points: result.new_total, last_activity: new Date().toISOString(), restaurant_name: currentRestaurant } : null)
        
        setAmount('')
        setInvoiceId('')
        fetchData()
        if (selectedClient) fetchClientRewards(selectedClient.id)
      } else {
        setStatusMessage({ type: 'error', text: result.error || 'Error al procesar' })
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMoveClient = async (clientId: string, newRestaurant: string) => {
    try {
      const res = await fetch('/api/admin/loyalty/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clientId, restaurant_name: newRestaurant })
      })
      if (res.ok) {
        const updated = await res.json()
        setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
        if (selectedClient?.id === updated.id) setSelectedClient(updated)
        setEditingClient(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteClient = async (client: Client) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${client.name}? Esta acción es permanente y borrará todos sus puntos y premios.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/loyalty/clients?id=${client.id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setClients(prev => prev.filter(c => c.id !== client.id))
        if (selectedClient?.id === client.id) {
          setSelectedClient(null)
          setPhoneSearch('')
        }
        alert('Cliente eliminado correctamente')
      } else {
        const data = await res.json()
        alert('Error al eliminar: ' + (data.error || 'Desconocido'))
      }
    } catch (err) {
      console.error('Error deleting client:', err)
      alert('Error de conexión al eliminar cliente')
    }
  }

  const handleRedeemReward = async (rewardId: string, clientId: string) => {
    if (!confirm('¿Marcar este premio como canjeado?')) return

    try {
      const res = await fetch('/api/admin/loyalty/rewards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reward_id: rewardId, 
          status: 'redeemed',
          client_id: clientId 
        })
      })
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Premio canjeado con éxito' })
        if (selectedClient) fetchClientRewards(selectedClient.id)
      } else {
        const error = await res.json()
        alert('Error: ' + error.error)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const openRewardWhatsApp = (client: Client, reward: Reward) => {
    if (!settings) return
    
    // Get all other pending rewards except the one just earned (if applicable)
    const otherRewards = clientRewards.filter(r => r.id !== reward.id)
    
    let message = settings.reward_message_template
      .replace('{name}', client.name)
      .replace('{reward}', reward.reward_name)
    
    if (otherRewards.length > 0) {
      message += `\n\n🎁 Otros premios que tienes listos:`
      otherRewards.forEach(r => {
        message += `\n• ${r.reward_name}`
      })
    }
    
    const portalUrl = `${window.location.origin}/puntos?token=${client.magic_token}`
    message += `\n\n📲 Ver todo aquí: ${portalUrl}`

    const phone = client.phone.replace(/\D/g, '')
    const finalPhone = phone.length === 9 ? `34${phone}` : phone
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const copyMagicLink = (client: Client) => {
    const url = `${window.location.origin}/puntos?token=${client.magic_token}`
    navigator.clipboard.writeText(url)
    alert('Enlace copiado al portapapeles')
  }

  const sendPortalLinkWhatsApp = (client: Client) => {
    const url = `${window.location.origin}/puntos?token=${client.magic_token}`
    const message = `Hola ${client.name}, este es tu enlace personal para ver tus puntos y premios en El Balconet: ${url}`
    
    const phone = client.phone.replace(/\D/g, '')
    const finalPhone = phone.length === 9 ? `34${phone}` : phone
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/fidelidad` : ''

  function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
      <button 
        onClick={onClick}
        className={`px-6 py-2.5 rounded-lg text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2 transition-all ${active ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-white/40 hover:text-white'}`}
      >
        {icon} {label}
      </button>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 md:pb-0 font-sans animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-[#111111] p-3 rounded-xl border border-[#D4AF37]/20 shadow-lg shadow-[#D4AF37]/5">
            <Star className="text-[#D4AF37] fill-[#D4AF37]/20" size={32} />
          </div>
          <div>
            <h1 className="font-serif text-3xl text-white tracking-tight">Fidelización</h1>
            <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-bold opacity-80">El Balconet Rewards</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setShowQR(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 px-4 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all"
          >
            <QrCode size={16} /> QR Registro
          </button>

          <div className="flex-1 md:flex-none flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-xl">
             <MapPin size={14} className="text-[#D4AF37] ml-2" />
             <select 
               value={currentRestaurant}
               onChange={(e) => handleRestaurantChange(e.target.value)}
               className="flex-1 md:flex-none bg-transparent text-white text-[10px] uppercase tracking-widest font-bold py-2 pr-8 outline-none appearance-none cursor-pointer"
             >
               {RESTAURANTS.map(res => (
                 <option key={res} value={res} className="bg-[#111111] text-white">{res}</option>
               ))}
             </select>
          </div>

          {isSalaRole && (
            <Link 
              href="/sala"
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-all bg-white/5 px-4 py-3 rounded-xl border border-white/5 shadow-sm"
            >
              <ArrowLeft size={14} /> Sala
            </Link>
          )}
        </div>
        
        <div className="hidden md:flex bg-white/5 p-1 rounded-lg border border-white/10">
          <TabButton active={activeTab === 'quick'} onClick={() => setActiveTab('quick')} icon={<PlusCircle size={16} />} label="Rápido" />
          <TabButton active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} icon={<Users size={16} />} label="Clientes" />
          <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={16} />} label="Ajustes" />
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'quick' && (
          <motion.div 
            key="quick"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col justify-center">
               <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                 <Smartphone size={300} className="text-white" />
               </div>

               {!selectedClient ? (
                 <div className="space-y-6">
                   <div className="max-w-md">
                     <h2 className="text-xl font-serif text-white mb-2">Buscar o Crear Cliente</h2>
                     <p className="text-white/40 text-sm mb-6">Introduce un teléfono para empezar en <span className="text-[#D4AF37]">{currentRestaurant}</span></p>
                     
                     <form onSubmit={handleSearchClient} className="flex gap-2">
                       <div className="relative flex-1">
                        <input 
                          type="tel"
                          placeholder="Ej: 600000000"
                          value={phoneSearch}
                          onChange={(e) => setPhoneSearch(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-lg focus:outline-none focus:border-[#D4AF37] transition-all placeholder:text-white/20"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                       </div>
                       <button type="submit" className="bg-[#D4AF37] text-black px-6 rounded-xl font-bold hover:bg-[#E8C84A] transition-all">Buscar</button>
                     </form>

                     {statusMessage?.type === 'error' && phoneSearch.length >= 9 && (
                       <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 p-6 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl"
                       >
                         <p className="text-white text-sm mb-4">¿Es un cliente nuevo? Regístralo ahora:</p>
                         <div className="space-y-3">
                           <input 
                             type="text" 
                             placeholder="Nombre del cliente (ej: Kike)"
                             className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#D4AF37]"
                             id="new-client-name"
                           />
                           <button 
                            onClick={async () => {
                              const nameInput = document.getElementById('new-client-name') as HTMLInputElement
                              if (!nameInput.value) return alert('Pon un nombre')
                              const res = await fetch('/api/admin/loyalty/clients', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: nameInput.value, phone: phoneSearch, restaurant_name: currentRestaurant })
                              })
                              if (res.ok) {
                                const data = await res.json()
                                setSelectedClient(data)
                                setStatusMessage(null)
                                fetchClientRewards(data.id)
                                fetchData()
                              }
                            }}
                            className="w-full py-3 bg-[#D4AF37] text-black rounded-lg font-bold uppercase tracking-widest text-[10px]"
                           >
                             Crear y Continuar
                           </button>
                         </div>
                       </motion.div>
                     )}
                   </div>
                 </div>
               ) : (
                 <div className="space-y-8">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-[#D4AF37] text-black rounded-full flex items-center justify-center font-serif text-2xl font-bold shadow-lg">
                         {selectedClient.name.charAt(0)}
                       </div>
                       <div>
                         <h3 className="text-2xl font-serif text-white">{selectedClient.name}</h3>
                         <div className="flex items-center gap-4 mt-1">
                           <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase font-bold tracking-widest">
                             <Phone size={12} />
                             <span>{selectedClient.phone}</span>
                           </div>
                           <div className="flex items-center gap-2 text-[#D4AF37]/60 text-[10px] uppercase font-bold tracking-widest">
                             <MapPin size={12} />
                             <span>{selectedClient.restaurant_name}</span>
                           </div>
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditingClient(selectedClient)}
                          className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-2 font-bold px-4 py-2 border border-white/10 rounded-lg"
                        >
                          <ArrowLeftRight size={12} /> Mover Sede
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedClient(null)
                            setNewReward(null)
                            setClientRewards([])
                          }}
                          className="text-[10px] uppercase tracking-widest text-[#D4AF37] hover:text-white transition-colors flex items-center gap-2 font-bold px-4 py-2 border border-[#D4AF37]/20 rounded-lg"
                        >
                          <RefreshCw size={12} /> Cambiar Cliente
                        </button>
                     </div>
                   </div>

                   {clientRewards.length > 0 && (
                     <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 shadow-inner">
                        <div className="flex items-center gap-2 mb-4">
                          <Gift size={18} className="text-[#D4AF37]" />
                          <h4 className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Premios pendientes</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {clientRewards.map(rew => (
                            <div key={rew.id} className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                               <div>
                                 <p className="text-white text-sm font-medium">{rew.reward_name}</p>
                                 <p className="text-white/30 text-[10px]">Expira: {new Date(rew.expires_at).toLocaleDateString()}</p>
                               </div>
                               <button 
                                 onClick={() => handleRedeemReward(rew.id, selectedClient!.id)}
                                 className="bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white px-4 py-2 rounded-lg text-[10px] uppercase font-bold transition-all"
                               >
                                 Canjear
                               </button>
                            </div>
                          ))}
                        </div>
                     </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-2xl p-8 text-center shadow-inner">
                        <p className="text-white/20 text-[10px] uppercase tracking-[0.3em] font-bold mb-3">Saldo Actual</p>
                        <div className="relative inline-block">
                          <motion.p 
                            key={selectedClient.total_points}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-7xl md:text-8xl font-serif text-[#D4AF37] tabular-nums font-bold"
                          >
                            {selectedClient.total_points}
                          </motion.p>
                          <div className="absolute -top-2 -right-4">
                            <Star size={20} className="text-[#D4AF37] animate-pulse" />
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-4">
                          <Clock size={12} className="text-white/20" />
                          <p className="text-white/10 text-[10px] uppercase tracking-widest font-medium">
                            Última actividad: {new Date(selectedClient.last_activity).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleAddPoints} className="space-y-5 bg-white/[0.02] p-6 rounded-2xl border border-white/5 shadow-xl">
                        <div className="relative">
                          <input 
                            type="number"
                            step="0.01"
                            placeholder="Importe Factura (€)"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37] transition-all text-xl"
                          />
                          <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={20} />
                        </div>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                             <Receipt size={20} className="text-white/20 group-focus-within:text-[#D4AF37] transition-colors" />
                             <span className="text-[#D4AF37] font-bold text-lg select-none opacity-40">FAC-</span>
                          </div>
                          <input 
                            type="text"
                            placeholder="Número Factura"
                            required
                            value={invoiceId}
                            onChange={(e) => setInvoiceId(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-24 pr-4 text-white focus:outline-none focus:border-[#D4AF37] transition-all text-lg font-mono uppercase"
                          />
                        </div>
                        <p className="text-[9px] text-white/20 uppercase text-center">Registrando en <span className="text-[#D4AF37] font-bold">{currentRestaurant}</span></p>
                        <button 
                          disabled={isSubmitting}
                          type="submit"
                          className="w-full py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest rounded-xl hover:bg-[#E8C84A] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                          {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Añadir Puntos'}
                        </button>
                      </form>
                   </div>
                 </div>
               )}
            </div>

            <AnimatePresence>
              {newReward && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-[0_0_50px_rgba(34,197,94,0.1)]"
                >
                  <div className="flex items-center gap-6">
                    <div className="bg-green-500 p-3 rounded-full text-black">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h4 className="text-green-400 font-bold uppercase tracking-[0.2em] text-xs mb-1">¡Objetivo Alcanzado!</h4>
                      <p className="text-white text-xl font-serif">Se ha generado un premio: {newReward.reward_name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => openRewardWhatsApp(selectedClient!, newReward)}
                    className="flex items-center gap-3 bg-[#25D366] text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-xl"
                  >
                    <MessageCircle size={20} /> Enviar WhatsApp
                  </button>
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-green-500" />
                </motion.div>
              )}
            </AnimatePresence>

            {statusMessage && !newReward && (
              <div className={`p-4 rounded-xl text-center font-medium ${statusMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {statusMessage.text}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab Clientes */}
        {activeTab === 'clients' && (
          <motion.div 
            key="clients"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                <Search className="text-white/20" size={20} />
                <input 
                  type="text" 
                  placeholder="Filtrar clientes..." 
                  className="bg-transparent border-none outline-none text-white w-full text-sm"
                  onChange={(e) => setPhoneSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-xl">
                 <select 
                   value={filterRestaurant}
                   onChange={(e) => setFilterRestaurant(e.target.value)}
                   className="bg-transparent text-white text-[10px] uppercase tracking-widest font-bold py-3 px-4 outline-none appearance-none cursor-pointer"
                 >
                   <option value="all" className="bg-[#111111]">Todas las sedes</option>
                   {RESTAURANTS.map(res => (
                     <option key={res} value={res} className="bg-[#111111]">{res}</option>
                   ))}
                 </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {clients
                .filter(c => {
                  const matchesSearch = c.name.toLowerCase().includes(phoneSearch.toLowerCase()) || c.phone.includes(phoneSearch)
                  const matchesRestaurant = filterRestaurant === 'all' || c.restaurant_name === filterRestaurant
                  return matchesSearch && matchesRestaurant
                })
                .map(client => (
                <div key={client.id} className="bg-[#111111] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between group hover:border-[#D4AF37]/30 transition-all gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-all shrink-0 font-serif text-xl border border-white/5">
                      {client.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-white font-medium truncate">{client.name}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <p className="text-white/40 text-[11px] font-mono">{client.phone}</p>
                        <span className="text-[9px] uppercase tracking-widest text-[#D4AF37]/40 font-bold px-2 py-0.5 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-full">{client.restaurant_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none border-white/5 pt-4 md:pt-0">
                     <div className="text-left md:text-right">
                       <p className="text-[10px] uppercase tracking-widest text-white/20 font-bold mb-0.5">Saldo</p>
                       <p className="text-xl md:text-lg font-serif text-[#D4AF37] tabular-nums font-bold">{client.total_points} PTS</p>
                     </div>
                     <div className="flex gap-1.5">
                        <button onClick={() => sendPortalLinkWhatsApp(client)} className="p-3 bg-green-500/10 rounded-xl text-green-500 hover:bg-green-500 hover:text-white transition-all border border-green-500/20" title="Enviar enlace Acceso"><MessageCircle size={18} /></button>
                        <button onClick={() => copyMagicLink(client)} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-[#D4AF37] transition-all border border-white/10" title="Copiar Enlace"><Copy size={18} /></button>
                        <button onClick={() => { 
                          setSelectedClient(client); 
                          fetchClientRewards(client.id); // Immediate fetch
                          setActiveTab('quick'); 
                        }} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all border border-white/10" title="Ver / Añadir Puntos"><ChevronRight size={18} /></button>
                        <button onClick={() => handleDeleteClient(client)} className="p-3 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20" title="Eliminar Cliente"><Trash2 size={18} /></button>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tab Ajustes */}
        {activeTab === 'settings' && settings && (
          <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#111111] border border-white/10 rounded-2xl p-8 space-y-8">
            <h3 className="text-xl font-serif text-white mb-6">Configuración del Grupo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">1€ = X puntos</label>
                  <input type="number" value={settings.points_per_euro} onChange={(e) => setSettings({...settings, points_per_euro: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#D4AF37] outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Umbral Premio (PTS)</label>
                  <input type="number" value={settings.points_threshold} onChange={(e) => setSettings({...settings, points_threshold: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#D4AF37] outline-none" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Caducidad Inactividad</label>
                  <select value={settings.points_expiration_months} onChange={(e) => setSettings({...settings, points_expiration_months: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#D4AF37] outline-none appearance-none cursor-pointer">
                    <option value={0}>Nunca caduca</option>
                    <option value={1}>1 Mes</option>
                    <option value={2}>2 Meses</option>
                    <option value={3}>3 Meses</option>
                    <option value={6}>6 Meses</option>
                    <option value={12}>1 Año</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Validez Premio (Días)</label>
                  <input type="number" value={settings.reward_validity_days} onChange={(e) => setSettings({...settings, reward_validity_days: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#D4AF37] outline-none" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Nombre del Premio</label>
              <input type="text" value={settings.reward_name} onChange={(e) => setSettings({...settings, reward_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#D4AF37] outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Mensaje WhatsApp</label>
              <textarea rows={4} value={settings.reward_message_template} onChange={(e) => setSettings({...settings, reward_message_template: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-[#D4AF37] outline-none resize-none" />
            </div>
            <button onClick={async () => {
              const res = await fetch('/api/admin/loyalty/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) })
              if (res.ok) alert('Guardado')
            }} className="w-full bg-white/10 border border-white/10 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-white/20 transition-all">Guardar Ajustes</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[110] flex items-center justify-center p-6">
            <motion.div 
               initial={{ scale: 0.8, opacity: 0, y: 30 }} 
               animate={{ scale: 1, opacity: 1, y: 0 }} 
               exit={{ scale: 0.8, opacity: 0, y: 30 }} 
               className="bg-gradient-to-b from-[#111] to-black border border-[#D4AF37]/30 rounded-[30px] p-[2px] max-w-sm w-full text-center relative shadow-[0_0_100px_rgba(212,175,55,0.15)] overflow-hidden"
            >
               {/* Decorative Glowing Orbs */}
               <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#D4AF37]/20 to-transparent pointer-events-none" />
               <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#D4AF37]/15 blur-[80px] rounded-full pointer-events-none" />
               <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#D4AF37]/10 blur-[80px] rounded-full pointer-events-none" />

               <div className="relative bg-[#0A0A0A] rounded-[28px] p-10 z-10">
                 <button 
                   onClick={() => setShowQR(false)} 
                   className="absolute top-5 right-5 text-white/30 hover:text-[#D4AF37] hover:scale-110 transition-all p-2 bg-white/5 backdrop-blur-md rounded-full"
                 >
                   <X size={18} />
                 </button>
                 
                 <div className="flex justify-center mb-6">
                   <div className="bg-gradient-to-br from-[#D4AF37] to-[#A08020] p-4 rounded-full text-black shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                     <Star size={36} className="drop-shadow-md fill-black" />
                   </div>
                 </div>

                 <h3 className="text-3xl font-serif text-[#D4AF37] mb-3 drop-shadow-sm tracking-tight leading-tight">Únete al <br />Club VIP</h3>
                 <p className="text-white/80 text-sm mb-10 leading-relaxed max-w-[250px] mx-auto">
                   Acumula saldo en cada visita, desbloquea recompensas y disfruta de regalos en <strong className="text-white">{currentRestaurant}</strong>.
                 </p>
                 
                 <div className="relative mx-auto w-56 h-56 bg-gradient-to-tr from-[#D4AF37] via-[#FFF3B0] to-[#D4AF37] p-2 rounded-2xl shadow-2xl hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(212,175,55,0.3)] transition-all duration-300">
                   <div className="w-full h-full bg-white rounded-xl p-3 flex items-center justify-center">
                     <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}&margin=0`} alt="QR VIP Registros" className="w-full h-full object-contain mix-blend-multiply" />
                   </div>
                 </div>

                 <div className="mt-8">
                   <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Escanea para ganar</p>
                   <p className="text-white/30 text-xs italic">Abre la cámara de tu móvil para acceder.</p>
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {editingClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-serif text-white mb-2">Mover Sede</h3>
              <p className="text-white/40 text-sm mb-6">Mover a **{editingClient.name}**.</p>
              <div className="grid grid-cols-1 gap-2">
                 {RESTAURANTS.map(res => (
                   <button key={res} onClick={() => handleMoveClient(editingClient.id, res)} className={`w-full py-4 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all ${editingClient.restaurant_name === res ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'}`}>{res}</button>
                 ))}
                 <button onClick={() => setEditingClient(null)} className="w-full py-4 text-white/40 hover:text-white text-[10px] uppercase font-bold tracking-widest mt-4">Cancelar</button>
              </div>
           </motion.div>
        </div>
      )}

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/10 p-4 flex justify-around items-center z-50">
         <MobTabButton active={activeTab === 'quick'} onClick={() => setActiveTab('quick')} icon={<History size={24} />} />
         <MobTabButton active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} icon={<Users size={24} />} />
         <MobTabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={24} />} />
      </div>
    </div>
  )
}

function MobTabButton({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`p-3 rounded-full transition-all ${active ? 'bg-[#D4AF37] text-black scale-110 shadow-lg' : 'text-white/20'}`}>{icon}</button>
  )
}
