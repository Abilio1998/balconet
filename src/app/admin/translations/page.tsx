'use client'

import { useState, useEffect } from 'react'
import { Save, Globe, Loader2, CheckCircle2, AlertCircle, Wand2, Search, ChevronRight, Menu, ImageIcon } from 'lucide-react'

type TranslationStatus = {
  total: number
  pending: number
}

type Stats = {
  dishes: TranslationStatus
  products: TranslationStatus
  categories: TranslationStatus
}

type GlobalItem = {
  id: string
  type: 'dish' | 'product' | 'category'
  name: string
  description?: string
  name_ca: string
  name_en: string
  name_fr: string
  description_ca?: string
  description_en?: string
  description_fr?: string
}

export default function AdminTranslationsPage() {
  const [activeTab, setActiveTab] = useState<'status' | 'editor'>('status')
  const [stats, setStats] = useState<Stats | null>(null)
  const [data, setData] = useState<{ dishes: any[]; products: any[]; categories: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/translations')
      const json = await res.json()
      if (json.success) {
        setStats(json.stats)
        setData(json.data)
      }
    } catch (err) {
      console.error('Error fetching translations status:', err)
    } finally {
      setLoading(false)
    }
  }

  const [cleaning, setCleaning] = useState(false)

  const handleCleanup = async () => {
    setCleaning(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/cleanup-entities', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setMessage({ type: 'success', text: `✓ Limpieza completada. Se corrigieron ${json.fixed} registros con entidades HTML.` })
        fetchStatus()
      } else {
        throw new Error(json.error)
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error durante la limpieza' })
    } finally {
      setCleaning(false)
    }
  }

  const handleGlobalSync = async () => {
    if (!data) return
    setSyncing(true)
    setMessage(null)
    
    try {
      // Collect all pending items
      const pendingDishes = data.dishes.filter(d => !d.name_ca || !d.name_en || !d.name_fr).map(d => ({ ...d, type: 'dish' }))
      const pendingProducts = data.products.filter(p => !p.name_ca || !p.name_en || !p.name_fr).map(p => ({ ...p, type: 'product' }))
      const pendingCategories = data.categories.filter(c => !c.name_ca || !c.name_en || !c.name_fr).map(c => ({ ...c, type: 'category' }))
      
      const allPending = [...pendingDishes, ...pendingProducts, ...pendingCategories]
      
      if (allPending.length === 0) {
        setMessage({ type: 'success', text: '¡Todo está al día! No hay traducciones pendientes.' })
        setSyncing(false)
        return
      }

      setSyncProgress({ current: 0, total: allPending.length })

      // Process in small batches of 5 to show progress and avoid timeouts
      for (let i = 0; i < allPending.length; i += 5) {
        const batch = allPending.slice(i, i + 5)
        const type = batch[0].type
        
        const res = await fetch('/api/admin/translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, items: batch })
        })
        
        if (!res.ok) throw new Error('Error en el proceso de traducción masiva')
        
        setSyncProgress(prev => prev ? { ...prev, current: Math.min(prev.current + batch.length, prev.total) } : null)
      }

      setMessage({ type: 'success', text: `✓ Se han completado ${allPending.length} traducciones con éxito.` })
      fetchStatus()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error en la sincronización global' })
    } finally {
      setSyncing(false)
      setSyncProgress(null)
    }
  }

  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<Partial<GlobalItem>>({})

  const handleEditItem = (item: GlobalItem) => {
    setEditingItem(item.id)
    setEditedValues({
      name_ca: item.name_ca,
      name_en: item.name_en,
      name_fr: item.name_fr,
      description_ca: item.description_ca,
      description_en: item.description_en,
      description_fr: item.description_fr
    })
  }

  const handleSaveItem = async (item: GlobalItem) => {
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: item.type, 
          items: [{ ...item, ...editedValues }] 
        })
      })
      if (res.ok) {
        setMessage({ type: 'success', text: `✓ Traducciones de "${item.name}" actualizadas.` })
        setEditingItem(null)
        fetchStatus()
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al guardar los cambios manuales.' })
    } finally {
      setSyncing(false)
    }
  }

  const allItems: GlobalItem[] = data ? [
    ...data.dishes.map(d => ({ ...d, type: 'dish' as const })),
    ...data.products.map(p => ({ ...p, type: 'product' as const })),
    ...data.categories.map(c => ({ ...c, type: 'category' as const }))
  ] : []

  const filteredItems = allItems.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    (item.description?.toLowerCase().includes(search.toLowerCase()))
  )

  const pendingCount = (stats?.dishes.pending || 0) + (stats?.products.pending || 0) + (stats?.categories.pending || 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-white mb-2 flex items-center gap-3">
            <Globe className="text-[#D4AF37]" />
            Centro de Traducciones
          </h1>
          <p className="text-white/40 text-sm">Gestiona el contenido multi-idioma de toda la web desde un solo lugar.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white/5 p-1 rounded-sm border border-white/10">
          <button 
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 text-xs uppercase tracking-[0.2em] transition-all ${activeTab === 'status' ? 'bg-[#D4AF37] text-black font-bold' : 'text-white/40 hover:text-white'}`}
          >
            Estado Global
          </button>
          <button 
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 text-xs uppercase tracking-[0.2em] transition-all ${activeTab === 'editor' ? 'bg-[#D4AF37] text-black font-bold' : 'text-white/40 hover:text-white'}`}
          >
            Editor Manual
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-sm flex items-center gap-3 animate-in slide-in-from-top duration-300 ${
          message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/20">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-sm uppercase tracking-widest">Analizando contenido...</p>
        </div>
      ) : activeTab === 'status' ? (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Menú del Día" 
              icon={<Menu size={18} />} 
              total={stats?.dishes.total || 0} 
              pending={stats?.dishes.pending || 0} 
            />
            <StatCard 
              title="Carta (Productos)" 
              icon={<ImageIcon size={18} />} 
              total={stats?.products.total || 0} 
              pending={stats?.products.pending || 0} 
            />
            <StatCard 
              title="Carta (Secciones)" 
              icon={<Globe size={18} />} 
              total={stats?.categories.total || 0} 
              pending={stats?.categories.pending || 0} 
            />
          </div>

          {/* Master Sync Section */}
          <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-sm p-8 flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37] opacity-50" />
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] mb-2">
              <Wand2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-serif text-white mb-2">Sincronización Inteligente por IA</h3>
              <p className="text-white/40 text-sm max-w-lg">
                Detectamos automáticamente cualquier contenido en Castellano que no tenga su traducción correspondiente en Catalán, Inglés o Francés.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[300px]">
              <button
                onClick={handleGlobalSync}
                disabled={syncing || cleaning}
                className="btn-gold px-10 py-4 flex items-center gap-3 shadow-xl shadow-[#D4AF37]/10 disabled:opacity-50 justify-center w-full"
              >
                {syncing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Sincronizando... {syncProgress && `(${syncProgress.current}/${syncProgress.total})`}
                  </>
                ) : (
                  <>
                    <Globe size={20} />
                    Traducir {pendingCount} elemento(s) pendiente(s)
                  </>
                )}
              </button>

              <button
                onClick={handleCleanup}
                disabled={syncing || cleaning}
                className="px-10 py-3 border border-white/10 hover:border-white/20 text-white/40 hover:text-white text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                title="Corrige caracteres extraños como &#x27; en toda la base de datos"
              >
                {cleaning ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    Limpiando...
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} />
                    Limpiar Entidades HTML (Solucionar &#x27;)
                  </>
                )}
              </button>
            </div>
            
            {pendingCount === 0 && !syncing && (
              <p className="text-green-500/60 text-xs flex items-center gap-1">
                <CheckCircle2 size={12} /> Todo el contenido está perfectamente traducido.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Editor Header */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o descripción..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="admin-input pl-12 py-3 bg-white/5 border-white/10 w-full"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#111111] border border-white/5 rounded-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-white/5 text-white/40 uppercase text-[10px] tracking-widest border-b border-white/10">
                    <th className="px-6 py-4 font-semibold">Elemento (Castellano)</th>
                    <th className="px-6 py-4 font-semibold text-center">CA</th>
                    <th className="px-6 py-4 font-semibold text-center">EN</th>
                    <th className="px-6 py-4 font-semibold text-center">FR</th>
                    <th className="px-6 py-4 font-semibold text-right">Origen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredItems.map((item) => {
                    const isEditing = editingItem === item.id
                    return (
                      <tr key={item.id} className={`group transition-colors ${isEditing ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]'}`}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{item.name}</div>
                          {item.description && <div className="text-white/20 text-xs mt-1 truncate max-w-xs">{item.description}</div>}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input 
                              className="admin-input-small" 
                              value={editedValues.name_ca} 
                              onChange={e => setEditedValues(p => ({ ...p, name_ca: e.target.value }))}
                            />
                          ) : (
                            <div className="flex justify-center"><StatusIndicator exists={!!item.name_ca} /></div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isEditing ? (
                            <input 
                              className="admin-input-small" 
                              value={editedValues.name_en} 
                              onChange={e => setEditedValues(p => ({ ...p, name_en: e.target.value }))}
                            />
                          ) : (
                            <div className="flex justify-center"><StatusIndicator exists={!!item.name_en} /></div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isEditing ? (
                            <input 
                              className="admin-input-small" 
                              value={editedValues.name_fr} 
                              onChange={e => setEditedValues(p => ({ ...p, name_fr: e.target.value }))}
                            />
                          ) : (
                            <div className="flex justify-center"><StatusIndicator exists={!!item.name_fr} /></div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleSaveItem(item)}
                                className="p-2 text-green-500 hover:bg-green-500/10 rounded-full transition-all"
                                title="Guardar cambios"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button 
                                onClick={() => setEditingItem(null)}
                                className="p-2 text-white/20 hover:text-white rounded-full transition-all"
                                title="Cancelar"
                              >
                                <AlertCircle size={18} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleEditItem(item)}
                              className="p-2 text-white/10 group-hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-full transition-all"
                            >
                              <ChevronRight size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-white/20 text-xs text-center">
            💡 Para editar manualmente una traducción específica, ve a la sección correspondiente (Menú o Carta).
          </p>
        </div>
      )}

      {/* Sync Overlay */}
      {syncing && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white animate-in fade-in duration-300">
          <div className="flex flex-col items-center animate-pulse">
            <img src="/logo.png" alt="El Balconet" className="w-48 md:w-64 h-auto mb-8 opacity-90" />
            <h2 className="text-[#D4AF37] font-serif text-2xl md:text-3xl mb-4 text-center">Sincronizando traducciones globales...</h2>
            <div className="flex flex-col items-center gap-3 text-[#333333]">
              <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
              <span className="text-sm font-medium tracking-widest uppercase text-center mt-2">
                {syncProgress ? `Procesando ${syncProgress.current} de ${syncProgress.total}` : 'Un momento por favor'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, icon, total, pending }: { title: string, icon: React.ReactNode, total: number, pending: number }) {
  const isComplete = pending === 0 && total > 0
  return (
    <div className="bg-[#111111] border border-white/5 p-6 rounded-sm relative overflow-hidden">
      {isComplete && <div className="absolute top-0 right-0 w-12 h-12 bg-green-500/10 flex items-center justify-center text-green-500 -mr-4 -mt-4 rotate-45" />}
      <div className="flex items-center gap-3 text-white/40 mb-4">
        {icon}
        <span className="text-[10px] uppercase tracking-widest">{title}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-serif text-white mb-1">{total}</div>
          <div className="text-[10px] text-white/20 uppercase tracking-widest">Elementos totales</div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-serif mb-1 ${pending > 0 ? 'text-[#D4AF37]' : 'text-green-500'}`}>
            {pending}
          </div>
          <div className="text-[10px] text-white/20 uppercase tracking-widest">Pendientes</div>
        </div>
      </div>
      <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${pending === 0 ? 'bg-green-500' : 'bg-[#D4AF37]'}`}
          style={{ width: `${total > 0 ? ((total - pending) / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  )
}

function StatusIndicator({ exists }: { exists: boolean }) {
  return exists ? (
    <div className="flex justify-center">
      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
    </div>
  ) : (
    <div className="flex justify-center">
      <div className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/40" />
    </div>
  )
}
