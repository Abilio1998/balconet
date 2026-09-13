'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  CalendarX,
  Plus,
  Trash2,
  Lock,
} from 'lucide-react'

type TableStat = {
  name: string
  count: number
  limit: number
}

type DbStats = {
  tables: TableStat[]
  totalRows: number
  freeTierLimit: number
  percentUsed: number
  todayRequests: number
}

type ClosedDateOverride = {
  id: string
  reservation_date: string
  is_closed: boolean
}

function getStatusColor(percent: number) {
  if (percent < 40) return { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/20', label: 'En buen estado', icon: CheckCircle }
  if (percent < 70) return { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500/20', label: 'Uso moderado', icon: AlertTriangle }
  return { text: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500/20', label: 'Próximo al límite', icon: XCircle }
}

function getRowStatusColor(percent: number) {
  if (percent < 40) return 'bg-emerald-500'
  if (percent < 70) return 'bg-amber-500'
  if (percent < 90) return 'bg-orange-500'
  return 'bg-red-500'
}

export default function AdminSettingsPage() {
  const [dbStats, setDbStats] = useState<DbStats | null>(null)
  const [loadingDb, setLoadingDb] = useState(true)

  // Estado para fechas cerradas
  const [closedDates, setClosedDates] = useState<ClosedDateOverride[]>([])
  const [loadingDates, setLoadingDates] = useState(true)
  const [newClosedDate, setNewClosedDate] = useState('')
  const [savingDate, setSavingDate] = useState(false)
  const [dateMsg, setDateMsg] = useState<{ type: 'ok' | 'err', text: string } | null>(null)

  useEffect(() => {
    fetchDbStats()
    fetchClosedDates()
  }, [])

  const fetchDbStats = async () => {
    setLoadingDb(true)
    try {
      const res = await fetch('/api/admin/db-stats')
      const data = await res.json()
      setDbStats(data)
    } catch (err) {
      console.error('Error fetching DB stats:', err)
    } finally {
      setLoadingDb(false)
    }
  }

  const fetchClosedDates = async () => {
    setLoadingDates(true)
    try {
      const res = await fetch('/api/admin/reservations/override')
      const data = await res.json()
      // Filtrar solo los que tienen is_closed = true
      const closed = (data.overrides || []).filter((o: any) => o.is_closed === true)
      setClosedDates(closed)
    } catch (err) {
      console.error('Error fetching closed dates:', err)
    } finally {
      setLoadingDates(false)
    }
  }

  const addClosedDate = async () => {
    if (!newClosedDate) return
    setSavingDate(true)
    setDateMsg(null)
    try {
      const res = await fetch('/api/admin/reservations/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_date: newClosedDate, is_closed: true })
      })
      if (!res.ok) throw new Error('Error al guardar')
      setDateMsg({ type: 'ok', text: `Fecha ${newClosedDate} bloqueada correctamente.` })
      setNewClosedDate('')
      await fetchClosedDates()
    } catch {
      setDateMsg({ type: 'err', text: 'No se pudo bloquear la fecha. Inténtalo de nuevo.' })
    } finally {
      setSavingDate(false)
    }
  }

  const removeClosedDate = async (date: string) => {
    try {
      await fetch(`/api/admin/reservations/override?date=${date}`, { method: 'DELETE' })
      setClosedDates(prev => prev.filter(d => d.reservation_date !== date))
    } catch {
      alert('Error al eliminar la fecha bloqueada.')
    }
  }

  const globalStatus = dbStats ? getStatusColor(dbStats.percentUsed) : getStatusColor(0)
  const GlobalIcon = globalStatus.icon

  // Ordenar fechas bloqueadas de más próxima a más lejana
  const sortedClosedDates = [...closedDates].sort((a, b) =>
    a.reservation_date.localeCompare(b.reservation_date)
  )

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-10 px-4">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-[#D4AF37]/10 p-3 rounded-sm border border-[#D4AF37]/20">
            <Settings size={22} className="text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="font-serif text-3xl text-white">Ajustes de Sistema</h1>
            <p className="text-white/40 text-sm mt-0.5">Configuración avanzada y monitorización del sistema.</p>
          </div>
        </div>
      </div>

      {/* ─── SECCIÓN: FECHAS CERRADAS ─── */}
      <section className="bg-[#111111] border border-white/10 rounded-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <CalendarX size={18} className="text-red-400" />
          <div>
            <h2 className="font-serif text-xl text-white">Días Cerrados por Fecha</h2>
            <p className="text-white/30 text-xs mt-0.5">
              Bloquea fechas específicas en las que el restaurante no abrirá (festivos, vacaciones, eventos privados…).
              Los clientes verán el mensaje de &quot;restaurante cerrado&quot; al seleccionar ese día.
            </p>
          </div>
        </div>

        {/* Añadir fecha */}
        <div className="flex items-center gap-3 mb-6">
          <input
            type="date"
            value={newClosedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setNewClosedDate(e.target.value)}
            className="bg-white/5 border border-white/10 p-3 text-white text-sm focus:border-red-400 outline-none transition-all rounded-sm flex-1 max-w-[200px]"
          />
          <button
            onClick={addClosedDate}
            disabled={!newClosedDate || savingDate}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 px-4 py-3 rounded-sm text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {savingDate ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
            Bloquear fecha
          </button>
        </div>

        {dateMsg && (
          <div className={`mb-4 p-3 rounded-sm text-sm flex items-center gap-2 ${
            dateMsg.type === 'ok'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {dateMsg.type === 'ok' ? <CheckCircle size={14} /> : <XCircle size={14} />}
            {dateMsg.text}
          </div>
        )}

        {/* Lista de fechas bloqueadas */}
        {loadingDates ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-12 bg-white/5 rounded-sm animate-pulse" />)}
          </div>
        ) : sortedClosedDates.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-sm">
            <CalendarX size={28} className="text-white/20 mx-auto mb-2" />
            <p className="text-white/30 text-sm">No hay fechas bloqueadas.</p>
            <p className="text-white/20 text-xs mt-1">El restaurante está abierto todos los días.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedClosedDates.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-red-500/5 border border-red-500/20 rounded-sm px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Lock size={14} className="text-red-400" />
                  <div>
                    <span className="text-white font-medium text-sm">{formatDate(item.reservation_date)}</span>
                    <span className="text-red-400/60 text-xs ml-3">Cerrado • Sin reservas online</span>
                  </div>
                </div>
                <button
                  onClick={() => removeClosedDate(item.reservation_date)}
                  className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-sm transition-all"
                  title="Desbloquear fecha"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── SECCIÓN: MONITOR DE BASE DE DATOS ─── */}
      <section className="bg-[#111111] border border-white/10 rounded-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Database size={18} className="text-[#D4AF37]" />
            <div>
              <h2 className="font-serif text-xl text-white">Monitor de Base de Datos</h2>
              <p className="text-white/30 text-xs mt-0.5">Uso en tiempo real de Supabase (Plan Gratuito)</p>
            </div>
          </div>
          <button
            onClick={fetchDbStats}
            disabled={loadingDb}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-sm border border-white/10 text-[#D4AF37] transition-all disabled:opacity-50"
            title="Recargar estadísticas"
          >
            <RefreshCw size={14} className={loadingDb ? 'animate-spin' : ''} />
          </button>
        </div>

        {loadingDb ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-white/5 rounded-sm animate-pulse" />
            ))}
          </div>
        ) : dbStats ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Global Usage Card */}
              <div className={`p-6 rounded-sm border ${globalStatus.border} bg-gradient-to-br from-white/[0.02] to-transparent flex flex-col justify-between`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <GlobalIcon size={22} className={globalStatus.text} />
                    <div>
                      <p className={`font-bold text-lg ${globalStatus.text}`}>{globalStatus.label}</p>
                      <p className="text-white/40 text-xs">
                        {dbStats.totalRows.toLocaleString('es-ES')} filas en total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-3xl font-serif font-bold ${globalStatus.text}`}>
                      {dbStats.percentUsed.toFixed(1)}%
                    </span>
                    <p className="text-white/30 text-[9px] uppercase tracking-widest">Capacidad</p>
                  </div>
                </div>
                <div>
                  <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dbStats.percentUsed}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className={`h-full rounded-full ${globalStatus.bg}`}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-white/20 text-[10px]">0%</span>
                    <span className="text-amber-400/60 text-[10px]">⚠ 70%</span>
                    <span className="text-red-400/60 text-[10px]">🔴 100%</span>
                  </div>
                </div>
              </div>

              {/* Traffic / Saturation Card */}
              <div className="p-6 rounded-sm border border-blue-500/20 bg-gradient-to-br from-white/[0.02] to-transparent flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <RefreshCw size={22} className="text-blue-400" />
                    <div>
                      <p className="font-bold text-lg text-blue-400">Tráfico de Analíticas</p>
                      <p className="text-white/40 text-xs">
                        Peticiones de escritura hoy
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-serif font-bold text-blue-400">
                      {dbStats.todayRequests.toLocaleString('es-ES')}
                    </span>
                    <p className="text-white/30 text-[9px] uppercase tracking-widest">Peticiones Hoy</p>
                  </div>
                </div>
                <div className="text-white/40 text-xs">
                  <p>
                    Muestra la saturación de hoy generada por los clientes interactuando con la carta (visitas y clics en platos).
                    Si este número es muy alto (&gt;1000), puede causar problemas de recursos en Supabase.
                  </p>
                </div>
              </div>
            </div>

            {/* Per-table breakdown */}
            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-4">Desglose por tabla</p>
              <div className="space-y-3">
                {dbStats.tables.map((table) => {
                  const pct = Math.min((table.count / table.limit) * 100, 100)
                  const barColor = getRowStatusColor(pct)
                  return (
                    <div key={table.name} className="bg-black/20 border border-white/5 rounded-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/70 text-sm font-medium">{table.name}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-white/40">
                            {table.count.toLocaleString('es-ES')} / {table.limit.toLocaleString('es-ES')}
                          </span>
                          <span className={`font-bold ${pct > 70 ? 'text-red-400' : pct > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
                          className={`h-full rounded-full ${barColor}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Info note */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm flex items-start gap-3">
              <AlertTriangle size={14} className="text-amber-400/60 mt-0.5 shrink-0" />
              <p className="text-white/30 text-xs leading-relaxed">
                Los límites son estimaciones para el plan gratuito de Supabase (500MB, ~500K filas aprox.). Si el porcentaje global supera el 70%, considera limpiar los datos históricos más antiguos o contactar con soporte para actualizar el plan.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-white/40 text-sm">No se pudieron cargar las estadísticas de la base de datos.</p>
        )}
      </section>
    </div>
  )
}
