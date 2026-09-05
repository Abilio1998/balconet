'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Users, Clock, Phone, MessageCircle, CheckCircle2, XCircle, UserCheck, Loader2, Settings, List, ChevronLeft, ChevronRight, AlertTriangle, Trash2, FileText, Download, LogOut, Plus, Trophy, RotateCw, TrendingUp, Sun, Moon, Info } from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '@/lib/supabase'

type Reservation = {
  id: string
  client_name: string
  client_phone: string
  guests: number
  reservation_date: string
  reservation_time: string
  status: 'confirmed' | 'seated' | 'cancelled' | 'noshow' | 'completed'
  notes: string
  zone: 'inside' | 'terrace'
  table_name?: string
  seated_at?: string
  created_at: string
}

type SettingsData = {
  max_capacity_per_slot: number
  max_capacity_inside: number
  max_capacity_terrace: number
  slot_interval_minutes: number
  lunch_start: string
  lunch_end: string
  dinner_start: string
  dinner_end: string
  breakfast_start: string
  breakfast_end: string
  breakfast_menu_active: boolean
  lunch_menu_active: boolean
  dinner_menu_active: boolean
  closed_days: number[]
  large_group_threshold: number
  whatsapp_number: string
  stay_duration_minutes: number
  is_accepting_inside: boolean
  is_accepting_terrace: boolean
  disable_web_reservations: boolean
}

interface ReservationsManagerProps {
  role: 'admin' | 'sala'
}

type DailyOverride = {
  id: string
  reservation_date: string
  is_accepting_inside: boolean
  is_accepting_terrace: boolean
}

export default function ReservationsManager({ role }: ReservationsManagerProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [shiftFilter, setShiftFilter] = useState<'all' | 'lunch' | 'dinner'>('all')
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [dailyOverride, setDailyOverride] = useState<DailyOverride | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [upcomingDays, setUpcomingDays] = useState<{ date: string; count: number; pax: number }[]>([])
  const [showUpcoming, setShowUpcoming] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('reservations-theme')
    if (saved === 'light') setTheme('light')
  }, [])

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [newRes, setNewRes] = useState({
    client_name: '',
    client_phone: '',
    guests: 2,
    reservation_date: selectedDate,
    reservation_time: '13:30',
    zone: 'inside' as 'inside' | 'terrace',
    notes: ''
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRes, setEditingRes] = useState<Reservation | null>(null)
  // Sugerencia de turno cuando el slot está lleno
  const [capacitySuggestion, setCapacitySuggestion] = useState<{
    requested_time: string
    suggested_time: string | null
    reason: 'zone' | 'kitchen'
  } | null>(null)

  // Auto-cerrar el mensaje después de 5 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = async (isInitial = false) => {
    // Solo mostramos el cargador principal en la carga inicial o cambio de fecha manual
    if (isInitial) setLoading(true)

    try {
      // Usamos cache: 'no-store' y un timestamp para evitar que el navegador devuelva datos antiguos
      const res = await fetch(`/api/admin/reservations?date=${selectedDate}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      })
      const data = await res.json()

      // Actualizamos las reservas de forma silenciosa para evitar parpadeos
      if (data.reservations) {
        setReservations(data.reservations)
      }

      // Los ajustes y bloqueos solo se actualizan si es la carga inicial o si han cambiado
      if (isInitial || !settings) {
        setSettings(data.settings)
      }
      setDailyOverride(data.daily_override || null)
    } catch (err) {
      console.error('Error al obtener reservas:', err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  const fetchUpcoming = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const currentMonth = today.substring(0, 7)
      // Also fetch next month in case we're near the end
      const nextMonthDate = new Date()
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1)
      const nextMonth = nextMonthDate.toISOString().split('T')[0].substring(0, 7)

      const [res1, res2] = await Promise.all([
        fetch(`/api/admin/reservations?month=${currentMonth}&t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
        fetch(`/api/admin/reservations?month=${nextMonth}&t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
      ])
      const [data1, data2] = await Promise.all([res1.json(), res2.json()])
      const allReservations: Reservation[] = [
        ...(data1.reservations || []),
        ...(data2.reservations || [])
      ]

      // Group by date, only future dates (excluding today), next 21 days
      const maxDate = new Date()
      maxDate.setDate(maxDate.getDate() + 21)
      const maxStr = maxDate.toISOString().split('T')[0]

      const byDate: Record<string, { count: number; pax: number }> = {}
      allReservations.forEach(r => {
        if (r.reservation_date <= today) return
        if (r.reservation_date > maxStr) return
        if (r.status === 'cancelled') return
        if (!byDate[r.reservation_date]) byDate[r.reservation_date] = { count: 0, pax: 0 }
        byDate[r.reservation_date].count++
        byDate[r.reservation_date].pax += r.guests
      })

      const sorted = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({ date, ...stats }))

      setUpcomingDays(sorted)
    } catch (err) {
      console.error('Error al obtener próximas reservas:', err)
    }
  }

  useEffect(() => {
    // Carga inicial al montar o cambiar de fecha
    fetchData(true)
    fetchUpcoming()

    // 1. SUSCRIPCIÓN TIEMPO REAL (Instantánea)
    const channel = supabase
      .channel(`reservations-${selectedDate}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reservations'
      }, (payload) => {
        console.log('Realtime Event:', payload.eventType, payload)

        // Manejo ultra-rápido de cambios en la lista
        if (payload.eventType === 'INSERT') {
          const newRow = payload.new as Reservation
          // Solo si es para el día que estamos viendo
          if (newRow.reservation_date === selectedDate) {
            setReservations(prev => {
              if (prev.find(r => r.id === newRow.id)) return prev
              const updated = [...prev, newRow]
              return updated.sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))
            })
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedRow = payload.new as Reservation
          setReservations(prev => prev.map(r => r.id === updatedRow.id ? updatedRow : r))
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as any).id
          setReservations(prev => prev.filter(r => r.id !== deletedId))
        }
      })
      .subscribe((status) => {
        console.log('Status de Tiempo Real:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedDate])

  const handleCreateManual = async (e: React.FormEvent, forceOverride = false) => {
    e.preventDefault()
    setCapacitySuggestion(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRes, force_override: forceOverride })
      })
      if (res.ok) {
        const today = new Date().toISOString().split('T')[0]
        const wasForFutureDate = newRes.reservation_date !== today
        setShowAddModal(false)
        setNewRes({
          client_name: '',
          client_phone: '',
          guests: 2,
          reservation_date: today,
          reservation_time: '13:30',
          zone: 'inside',
          notes: ''
        })
        // Si la reserva era para otra fecha, volvemos al día actual automáticamente
        if (wasForFutureDate) {
          setSelectedDate(today)
        } else {
          fetchData()
        }
        setMessage({ type: 'success', text: wasForFutureDate ? `✅ Reserva creada para el ${newRes.reservation_date} — volviendo al día actual` : 'Reserva manual creada' })
      } else {
        const data = await res.json()
        // Si es un conflicto de aforo/caudal, mostramos la sugerencia dentro del modal
        if (res.status === 409 && data.capacity_full) {
          setCapacitySuggestion({
            requested_time: data.requested_time,
            suggested_time: data.suggested_time,
            reason: data.reason
          })
        } else {
          setMessage({ type: 'error', text: data.error || 'Error al crear reserva' })
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al crear reserva' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteIndividual = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta reserva permanentemente?')) return
    try {
      const res = await fetch(`/api/admin/reservations?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setReservations(prev => prev.filter(r => r.id !== id))
        setMessage({ type: 'success', text: 'Reserva eliminada' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al eliminar reserva' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al eliminar reserva' })
    }
  }

  const handleDeleteAllByDate = async () => {
    if (!confirm(`⚠️ ALERTA: ¿Seguro que quieres eliminar TODAS las reservas del día ${selectedDate}? Esta acción no se puede deshacer.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reservations?date=${selectedDate}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setReservations([])
        setMessage({ type: 'success', text: `Día ${selectedDate} vaciado correctamente` })
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al vaciar el día' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al vaciar el día' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    const isSittingNow = status === 'seated'
    const seated_at = isSittingNow ? new Date().toISOString() : null

    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isSittingNow ? { id, status, seated_at } : { id, status })
      })
      if (res.ok) {
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: status as any, seated_at: isSittingNow ? seated_at! : r.seated_at } : r))
        setMessage({ type: 'success', text: 'Estado actualizado' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al actualizar estado' })
    }
  }

  const handleUpdateTable = async (id: string, table_name: string) => {
    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, table_name })
      })
      if (!res.ok) {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Error al cambiar mesa' })
        fetchData() // Fuerza recarga y revierte el input al valor validado del servidor
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de red al cambiar mesa' })
      fetchData()
    }
  }

  const handleUpdateReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRes) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRes)
      })
      if (res.ok) {
        setShowEditModal(false)
        fetchData()
        setMessage({ type: 'success', text: 'Reserva actualizada correctamente' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Error al actualizar reserva' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al actualizar reserva' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleZone = async (zone: 'inside' | 'terrace') => {
    if (!settings) return

    const field = zone === 'inside' ? 'is_accepting_inside' : 'is_accepting_terrace'

    // Si estamos en la pestaña Agenda (list), el bloqueo es SOLO PARA ESE DÍA seleccionado
    if (activeTab === 'list') {
      const currentInside = dailyOverride ? dailyOverride.is_accepting_inside : settings.is_accepting_inside
      const currentTerrace = dailyOverride ? dailyOverride.is_accepting_terrace : settings.is_accepting_terrace

      const newInside = zone === 'inside' ? !currentInside : currentInside
      const newTerrace = zone === 'terrace' ? !currentTerrace : currentTerrace

      // Update local state optimistic
      setDailyOverride(prev => ({
        id: prev?.id || '',
        reservation_date: selectedDate,
        is_accepting_inside: newInside,
        is_accepting_terrace: newTerrace
      }))

      try {
        const res = await fetch('/api/admin/reservations/override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservation_date: selectedDate,
            is_accepting_inside: newInside,
            is_accepting_terrace: newTerrace
          })
        })
        if (!res.ok) fetchData()
      } catch (err) {
        fetchData()
      }
      return
    }

    // Comportamiento GLOBAL (Settings Tab)
    const newValue = !settings[field as keyof SettingsData]
    setSettings({ ...settings, [field]: newValue })

    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, [field]: newValue })
      })
      if (!res.ok) fetchData()
    } catch (err) {
      fetchData()
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    setLoading(true)

    // Clean whatsapp_number before saving
    let cleanedNumber = settings.whatsapp_number.replace(/\D/g, '')

    // Auto-prefix with 34 (Spain) if it's a 9-digit mobile number
    if (cleanedNumber.length === 9 && (cleanedNumber.startsWith('6') || cleanedNumber.startsWith('7'))) {
      cleanedNumber = '34' + cleanedNumber
    }

    const updatedSettings = { ...settings, whatsapp_number: cleanedNumber }

    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Configuración guardada' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Error al guardar configuración' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al guardar configuración' })
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async (data: Reservation[], fileName: string, titleSuffix: string, options: { includeDate?: boolean, isYearly?: boolean } = {}) => {
    const { includeDate = false, isYearly = false } = options
    const doc = new jsPDF()
    const now = new Date().toLocaleString('es-ES')

    // Configuración inicial
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(212, 175, 55) // Gold
    doc.text('EL BALCONET', 14, 22)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Informe de Reservas - ${titleSuffix}`, 14, 30)
    doc.text(`Generado el: ${now}`, 14, 35)

    // Lógica de Contabilización por Turnos (Comida: 12-16h, Cena: 16-23h)
    const calculateStats = (resList: Reservation[]) => {
      let lunchPax = 0, lunchRes = 0
      let dinnerPax = 0, dinnerRes = 0

      resList.forEach(r => {
        if (r.status === 'cancelled') return
        const hour = parseInt(r.reservation_time.split(':')[0])
        if (hour >= 12 && hour < 16) {
          lunchRes++
          lunchPax += r.guests
        } else if (hour >= 16 && hour <= 23) {
          dinnerRes++
          dinnerPax += r.guests
        }
      })
      return { lunchPax, lunchRes, dinnerPax, dinnerRes, totalPax: lunchPax + dinnerPax, totalRes: lunchRes + dinnerRes }
    }

    const stats = calculateStats(data)

    // Resumen Estadístico en el PDF
    autoTable(doc, {
      startY: 45,
      head: [['RESUMEN', 'RESERVAS', 'COMENSALES (PAX)']],
      body: [
        ['COMIDA (12h - 16h)', stats.lunchRes, stats.lunchPax],
        ['CENA (16h - 23h)', stats.dinnerRes, stats.dinnerPax],
        ['TOTAL ACUMULADO', stats.totalRes, stats.totalPax]
      ],
      theme: 'grid',
      headStyles: { fillColor: [20, 20, 20], textColor: [212, 175, 55] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245] } }
    })

    let currentY = (doc as any).lastAutoTable.finalY + 15

    // Si es anual, agrupamos por meses
    if (isYearly) {
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      const dataByMonth: { [key: string]: Reservation[] } = {}

      data.forEach(r => {
        const m = parseInt(r.reservation_date.split('-')[1]) - 1
        const monthName = months[m]
        if (!dataByMonth[monthName]) dataByMonth[monthName] = []
        dataByMonth[monthName].push(r)
      })

      Object.entries(dataByMonth).forEach(([monthName, monthData]) => {
        if (currentY > 250) { doc.addPage(); currentY = 20 }

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.setTextColor(212, 175, 55)
        doc.text(`${monthName.toUpperCase()}`, 14, currentY)

        const mStats = calculateStats(monthData)
        doc.setFontSize(8)
        doc.setTextColor(100)
        doc.text(`Comida: ${mStats.lunchRes} res. / ${mStats.lunchPax} pax  |  Cena: ${mStats.dinnerRes} res. / ${mStats.dinnerPax} pax`, 14, currentY + 5)

        const tableData = monthData.sort((a, b) => a.reservation_date.localeCompare(b.reservation_date) || a.reservation_time.localeCompare(b.reservation_time)).map(r => [
          r.reservation_date,
          r.reservation_time.substring(0, 5),
          r.zone === 'terrace' ? 'Terraza' : 'Interior',
          r.client_name,
          r.guests,
          r.status === 'confirmed' ? 'Pendiente' : r.status === 'seated' ? 'Sentados' : r.status === 'cancelled' ? 'Cancelado' : 'No Show'
        ])

        autoTable(doc, {
          startY: currentY + 8,
          head: [['Fecha', 'Hora', 'Zona', 'Cliente', 'Pax', 'Estado']],
          body: tableData,
          headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
          styles: { fontSize: 7 },
          margin: { bottom: 20 }
        })

        currentY = (doc as any).lastAutoTable.finalY + 15
      })
    } else {
      // Listado simple para Día/Mes
      const tableData = data.map(r => {
        const baseData = [
          r.reservation_time.substring(0, 5),
          r.zone === 'terrace' ? 'Terraza' : 'Interior',
          r.client_name,
          r.guests,
          r.client_phone,
          r.status === 'confirmed' ? 'Pendiente' : r.status === 'seated' ? 'Sentados' : r.status === 'cancelled' ? 'Cancelado' : 'No Show',
          r.notes || '-'
        ]
        return includeDate ? [r.reservation_date, ...baseData] : baseData
      })

      autoTable(doc, {
        startY: currentY,
        head: [includeDate ? ['Fecha', 'Hora', 'Zona', 'Cliente', 'Pax', 'Tel.', 'Estado', 'Notas'] : ['Hora', 'Zona', 'Cliente', 'Pax', 'Tel.', 'Estado', 'Notas']],
        body: tableData,
        headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0] },
        styles: { fontSize: 8 }
      })
    }

    doc.save(`${fileName}.pdf`)
  }

  const handleExportMonth = async () => {
    setLoading(true)
    try {
      const month = selectedDate.substring(0, 7) // YYYY-MM
      const res = await fetch(`/api/admin/reservations?month=${month}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      })
      const data = await res.json()
      if (res.ok && data.reservations && data.reservations.length > 0) {
        generatePDF(data.reservations, `reservas_${month}`, `Mes ${month}`, { includeDate: true })
      } else {
        setMessage({ type: 'error', text: 'No hay reservas registradas en este mes.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al exportar el mes' })
    } finally {
      setLoading(false)
    }
  }

  const handleExportYear = async () => {
    setLoading(true)
    try {
      const year = selectedDate.substring(0, 4) // YYYY
      const res = await fetch(`/api/admin/reservations?year=${year}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      })
      const data = await res.json()
      if (res.ok && data.reservations && data.reservations.length > 0) {
        generatePDF(data.reservations, `reservas_${year}`, `Año ${year}`, { includeDate: true, isYearly: true })
      } else {
        setMessage({ type: 'error', text: 'No hay reservas registradas en este año.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al exportar el año' })
    } finally {
      setLoading(false)
    }
  }

  const openWhatsApp = (res: Reservation) => {
    const time = res.reservation_time.substring(0, 5)
    const text = encodeURIComponent(
      `Hola ${res.client_name}, te confirmo tu reserva en El Balconet para el día ${res.reservation_date} a las ${time}. ¡Te esperamos!\n\n` +
      `Para tu próxima reserva, puedes hacerla directamente aquí: https://elbalconet.es`
    )

    // Clean phone number (remove non-digits)
    let phone = res.client_phone.replace(/\D/g, '')

    // Auto-prefix with 34 (Spain) if it's a 9-digit mobile number
    if (phone.length === 9 && (phone.startsWith('6') || phone.startsWith('7'))) {
      phone = '34' + phone
    }

    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  const getSemaphoreUI = (res: Reservation) => {
    if (res.status !== 'seated' || !currentTime) return null;

    let resDateStart: Date
    if (res.seated_at) {
      resDateStart = new Date(res.seated_at)
    } else {
      // Fallback matemático antiguo si alguien no refrescó página
      const [hours, minutes] = res.reservation_time.split(':').map(Number)
      resDateStart = new Date(res.reservation_date)
      resDateStart.setHours(hours, minutes, 0, 0)
    }

    const elapsed = Math.floor((currentTime.getTime() - resDateStart.getTime()) / 60000)
    const maxDuration = settings?.stay_duration_minutes || 90
    if (elapsed < 0) return null;

    const percentage = Math.max(0, Math.min(100, (elapsed / maxDuration) * 100))
    const isRed = percentage >= 85
    const isAmber = percentage >= 50 && percentage < 85

    const timeLabel = isRed ? 'TIEMPO AGOTADO' : isAmber ? 'AVANZADO' : 'RECIÉN LLEGADOS'

    return (
      <div className="flex flex-col w-full gap-1 mt-2 mb-2 bg-[#0A0A0A]/60 p-2.5 rounded-sm border border-white/5">
        <div className="flex justify-between items-center text-[8.5px] uppercase tracking-[0.1em] font-bold">
          <span className="text-white/60 flex items-center gap-1.5">
            <Clock size={11} className={isRed ? 'text-red-500 animate-pulse' : 'text-[#D4AF37]/50'} /> {timeLabel}
          </span>
          <span className={`${isRed ? 'text-red-500 animate-pulse text-[11px] font-black' : isAmber ? 'text-amber-500 font-bold' : 'text-green-500 font-bold'}`}>
            {elapsed}<span className="text-white/30 text-[8px] ml-0.5 tracking-tighter">/ {maxDuration}m</span>
          </span>
        </div>
        <div className="w-full bg-[#1A1A1A] h-[6px] rounded-full overflow-hidden border border-white/5 shadow-inner mt-1">
          <div className={`h-full ${isRed ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : isAmber ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    )
  }

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      if (shiftFilter === 'all') return true
      const hour = parseInt(res.reservation_time.split(':')[0])
      if (shiftFilter === 'lunch') return hour >= 9 && hour < 16
      if (shiftFilter === 'dinner') return hour >= 16
      return true
    })
  }, [reservations, shiftFilter])

  const totalGuests = filteredReservations.filter(r => r.status !== 'cancelled' && r.status !== 'completed').reduce((sum, r) => sum + r.guests, 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0 font-sans">
      {/* Title and Top Actions (Static) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
        <div className="flex items-center gap-4">
          <div className="bg-[#111111] p-2 rounded-sm border border-[#D4AF37]/20">
            <Calendar className="text-[#D4AF37]" size={28} />
          </div>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl text-white mb-0.5 tracking-tight">
              {role === 'admin' ? 'Administración' : 'Panel de Sala'}
            </h1>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">
              El Balconet
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-sm border border-white/10 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 sm:flex-none px-6 py-2.5 text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded-sm ${activeTab === 'list' ? 'bg-[#D4AF37] text-black font-bold shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              <List size={14} /> Agenda
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 sm:flex-none px-6 py-2.5 text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded-sm ${activeTab === 'settings' ? 'bg-[#D4AF37] text-black font-bold shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              <Settings size={14} /> Ajustes
            </button>
          </div>

          {role === 'sala' && (
            <Link
              href="/sala/loyalty"
              className="flex bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-6 py-2.5 text-[10px] uppercase tracking-widest transition-all items-center justify-center gap-2 rounded-sm border border-amber-500/20 font-bold"
            >
              <Trophy size={14} /> Fidelización
            </Link>
          )}

          <button
            onClick={() => signOut()}
            className="w-full sm:w-auto p-3 px-5 bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all rounded-sm border border-white/5 flex items-center justify-center gap-2 group"
            title="Cerrar Sesión"
          >
            <span className="text-[10px] uppercase tracking-widest font-bold">Cerrar Sesión</span>
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {message && (
        <div className={`fixed bottom-6 left-4 right-4 sm:bottom-auto sm:top-24 sm:left-auto sm:right-8 sm:w-[400px] p-5 rounded-md text-sm flex items-start gap-4 shadow-2xl z-[150] animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 backdrop-blur-md ${message.type === 'success' ? 'bg-[#0A1A0F]/90 text-green-400 border-2 border-green-500/50' : 'bg-[#2A0A0A]/90 text-red-400 border-2 border-red-500/50'}`}>
          <div className="flex-1 font-bold tracking-wide leading-tight mt-0.5">{message.text}</div>
          <button onClick={() => setMessage(null)} className="shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors bg-white/5">
            <XCircle size={20} />
          </button>
        </div>
      )}

      {activeTab === 'list' ? (
        <div className={`space-y-6 ${theme === 'light' ? 'reservations-light-mode' : ''}`}>
          {/* Sticky Action Bar */}
          <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/10 px-4 py-4 mb-8 -mx-4 md:-mx-8 shadow-2xl">
            <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-6 xl:items-center justify-between">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 w-full xl:w-auto">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 bg-white/5 rounded-sm p-1 border border-white/5 shadow-inner w-full sm:w-auto justify-between">
                    <button
                      onClick={() => {
                        const d = new Date(selectedDate + 'T12:00:00')
                        d.setDate(d.getDate() - 1)
                        setSelectedDate(d.toISOString().split('T')[0])
                      }}
                      className="p-2 hover:bg-[#D4AF37]/10 text-[#D4AF37] transition-all rounded-sm"
                      title="Día anterior"
                    ><ChevronLeft size={22} /></button>
                    <div className="flex flex-col items-center px-2 min-w-[120px]">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent text-white font-serif text-lg focus:outline-none cursor-pointer w-full text-center font-bold tracking-tight"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const d = new Date(selectedDate + 'T12:00:00')
                        d.setDate(d.getDate() + 1)
                        setSelectedDate(d.toISOString().split('T')[0])
                      }}
                      className="p-2 hover:bg-[#D4AF37]/10 text-[#D4AF37] transition-all rounded-sm"
                      title="Día siguiente"
                    ><ChevronRight size={22} /></button>
                  </div>

                  {/* Filtro de Turnos */}
                  <div className="flex bg-[#111] rounded-sm p-1 border border-white/10 shadow-inner overflow-hidden text-[10px] uppercase tracking-widest font-bold w-full sm:w-auto">
                    <button onClick={() => setShiftFilter('all')} className={`flex-1 sm:flex-none px-4 py-2 rounded-sm transition-all text-center ${shiftFilter === 'all' ? 'bg-white/10 text-white shadow-md' : 'text-white/40 hover:text-white/80'}`}>Total</button>
                    <button onClick={() => setShiftFilter('lunch')} className={`flex-1 sm:flex-none px-4 py-2 rounded-sm transition-all flex items-center justify-center gap-1.5 ${shiftFilter === 'lunch' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-white/40 hover:text-white/80'}`}><Sun size={12} /> <span className="hidden sm:inline">Día</span></button>
                    <button onClick={() => setShiftFilter('dinner')} className={`flex-1 sm:flex-none px-4 py-2 rounded-sm transition-all flex items-center justify-center gap-1.5 ${shiftFilter === 'dinner' ? 'bg-blue-500 text-white shadow-md' : 'text-white/40 hover:text-white/80'}`}><Moon size={12} /> <span className="hidden sm:inline">Noche</span></button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 w-full lg:w-72">
                  <StatItem title="Pax" value={totalGuests} icon={<Users size={12} />} />
                  <StatItem title="Pend." value={filteredReservations.filter(r => r.status === 'confirmed').length} icon={<Clock size={12} />} color="text-[#D4AF37]" />
                  <StatItem title="Ok" value={filteredReservations.filter(r => r.status === 'seated').length} icon={<UserCheck size={12} />} color="text-green-500" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fetchData(true)}
                  disabled={loading}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/5 text-white/60 text-[10px] uppercase tracking-[0.15em] px-5 py-3 font-bold hover:bg-white/10 transition-all rounded-sm border border-white/10 disabled:opacity-50"
                  title="Refrescar Datos"
                >
                  <RotateCw size={16} className={loading ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Refrescar</span>
                </button>
                <button
                  onClick={() => {
                    const insideOpen = dailyOverride ? dailyOverride.is_accepting_inside : (settings?.is_accepting_inside ?? true)
                    const terraceOpen = dailyOverride ? dailyOverride.is_accepting_terrace : (settings?.is_accepting_terrace ?? true)
                    // Pre-select an available zone: prefer inside, fallback to terrace
                    const defaultZone: 'inside' | 'terrace' = insideOpen ? 'inside' : terraceOpen ? 'terrace' : 'inside'
                    setNewRes(prev => ({ ...prev, reservation_date: selectedDate, zone: defaultZone }))
                    setShowAddModal(true)
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#D4AF37] text-black text-[10px] uppercase tracking-[0.15em] px-5 py-3 font-bold hover:bg-[#E8C84A] transition-all rounded-sm shadow-xl active:scale-95"
                >
                  <Plus size={16} /> Nueva
                </button>
                {role === 'admin' && (
                  <>
                    <button
                      onClick={() => generatePDF(reservations, `reservas_${selectedDate}`, `Día ${selectedDate}`)}
                      disabled={reservations.length === 0 || loading}
                      className="p-3 border border-white/10 text-white/60 text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all disabled:opacity-20 rounded-sm flex items-center gap-2"
                      title="PDF Día"
                    >
                      <Download size={16} /> <span className="hidden sm:inline">Día</span>
                    </button>
                    <button
                      onClick={handleExportMonth}
                      disabled={loading}
                      className="p-3 border border-white/10 text-white/60 text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all disabled:opacity-20 rounded-sm flex items-center gap-2"
                      title="PDF Mes"
                    >
                      <FileText size={16} /> <span className="hidden sm:inline">Mes</span>
                    </button>
                    <button
                      onClick={handleExportYear}
                      disabled={loading}
                      className="p-3 border border-white/10 text-white/60 text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all disabled:opacity-20 rounded-sm flex items-center gap-2"
                      title="PDF Año"
                    >
                      <TrendingUp size={16} /> <span className="hidden sm:inline">Año</span>
                    </button>
                  </>
                )}
                <button
                  onClick={handleDeleteAllByDate}
                  disabled={reservations.length === 0 || loading}
                  className="p-3 border border-red-500/20 text-red-500/40 hover:text-red-500 hover:bg-red-500/5 transition-all disabled:opacity-20 rounded-sm"
                  title="Vaciar Día"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Quick Zone Controls */}
            <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4">
              {(() => {
                const isInsideOpen = dailyOverride ? dailyOverride.is_accepting_inside : settings?.is_accepting_inside
                const isTerraceOpen = dailyOverride ? dailyOverride.is_accepting_terrace : settings?.is_accepting_terrace

                return (
                  <>
                    <button
                      onClick={() => handleToggleZone('inside')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-3 rounded-sm border transition-all ${isInsideOpen ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${isInsideOpen ? 'bg-blue-400' : 'bg-red-500 animate-pulse'}`} />
                      <span className="text-[10px] uppercase tracking-widest font-bold">Salón {isInsideOpen ? 'Abierto' : 'BLOQUEADO'}</span>
                    </button>
                    <button
                      onClick={() => handleToggleZone('terrace')}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-3 rounded-sm border transition-all ${isTerraceOpen ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${isTerraceOpen ? 'bg-orange-400' : 'bg-red-500 animate-pulse'}`} />
                      <span className="text-[10px] uppercase tracking-widest font-bold">Terraza {isTerraceOpen ? 'Abierta' : 'BLOQUEADA'}</span>
                    </button>
                  </>
                )
              })()}
              <div className="flex-1 hidden md:block" />
              <div className="text-[10px] text-white/20 uppercase tracking-[0.2em] flex flex-col items-end">
                <span className="flex items-center gap-2">
                  <AlertTriangle size={12} className="text-[#D4AF37]/40" />
                  Estado para el {selectedDate}
                </span>
                <span className="text-[8px] opacity-50 lowercase tracking-normal font-normal">Cambia según el día seleccionado</span>
              </div>
            </div>
          </div>

          {/* ── PANEL PRÓXIMAS RESERVAS ── */}
          {upcomingDays.length > 0 && (
            <div className="mx-0 mb-6">
              <button
                onClick={() => setShowUpcoming(v => !v)}
                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-[#D4AF37] transition-colors mb-3 font-bold"
              >
                <ChevronRight size={14} className={`transition-transform duration-200 ${showUpcoming ? 'rotate-90' : ''}`} />
                Próximas reservas
                <span className="ml-1 bg-[#D4AF37]/20 text-[#D4AF37] text-[9px] px-2 py-0.5 rounded-full font-bold">
                  {upcomingDays.length} días
                </span>
              </button>

              {showUpcoming && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {upcomingDays.map(({ date, count, pax }) => {
                    const d = new Date(date + 'T12:00:00')
                    const isSelected = date === selectedDate
                    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
                    const dayName = dayNames[d.getDay()]
                    const dayNum = d.getDate()
                    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
                    const monthName = monthNames[d.getMonth()]
                    // Urgency: if within 2 days highlight more
                    const daysAway = Math.ceil((d.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000)
                    const isUrgent = daysAway <= 2
                    const isSoon = daysAway <= 5

                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`flex-none flex flex-col items-center gap-1 px-4 py-3 rounded-sm border transition-all min-w-[80px] group ${isSelected
                            ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                            : isUrgent
                              ? 'bg-red-500/10 border-red-500/30 text-white hover:bg-red-500/20 hover:border-red-500/60'
                              : isSoon
                                ? 'bg-amber-500/10 border-amber-500/20 text-white hover:bg-amber-500/20'
                                : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                          }`}
                      >
                        <span className={`text-[9px] uppercase tracking-widest font-bold ${isSelected ? 'text-black/60' : isUrgent ? 'text-red-400' : isSoon ? 'text-amber-400' : 'text-white/40'
                          }`}>{dayName}</span>
                        <span className={`text-xl font-serif leading-none font-bold ${isSelected ? 'text-black' : 'text-white'
                          }`}>{dayNum}</span>
                        <span className={`text-[9px] uppercase tracking-widest ${isSelected ? 'text-black/60' : 'text-white/40'
                          }`}>{monthName}</span>
                        <div className={`mt-1 pt-1 border-t w-full flex flex-col items-center gap-0.5 ${isSelected ? 'border-black/20' : 'border-white/10'
                          }`}>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-black' : isUrgent ? 'text-red-400' : 'text-[#D4AF37]'
                            }`}>{count} res.</span>
                          <span className={`text-[9px] ${isSelected ? 'text-black/60' : 'text-white/30'
                            }`}>{pax} pax</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Table (Desktop) / Cards (Mobile) */}
          <div className="space-y-4">
            {/* Desktop Table (Only for screens > 1100px) */}
            <div className="hidden min-[1101px]:block bg-[#111111] border border-white/5 rounded-sm overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-white/5 text-white/40 uppercase text-[10px] tracking-widest border-b border-white/10 font-sans">
                      <th className="px-6 py-4 font-semibold">Cliente</th>
                      <th className="px-6 py-4 font-semibold text-center w-24">Hora</th>
                      <th className="px-6 py-4 font-semibold text-center w-24">Lugar</th>
                      <th className="px-6 py-4 font-semibold text-center w-20">Pax</th>
                      <th className="px-6 py-4 font-semibold w-32">Estado</th>
                      <th className="px-6 py-4 font-semibold text-right w-24">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-20 text-white/20 uppercase tracking-[0.2em]"><Loader2 className="animate-spin mx-auto mb-2" /></td></tr>
                    ) : filteredReservations.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-20 text-white/20 italic font-serif">No hay reservas para este turno.</td></tr>
                    ) : (
                      filteredReservations.map(res => {
                        const isGroup = res.guests >= (settings?.large_group_threshold || 8)
                        return (
                          <tr
                            key={res.id}
                            className={`group transition-colors ${res.status === 'cancelled' ? 'opacity-30' : ''} ${isGroup ? 'bg-[#D4AF37]/5' : 'hover:bg-white/[0.02]'}`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="bg-white/5 w-10 h-10 rounded-full flex items-center justify-center text-[#D4AF37] font-serif border border-white/5 shadow-inner">
                                  {res.client_name.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <div className="font-medium text-white flex items-center gap-2 font-serif text-base tracking-wide">
                                    {res.client_name}
                                    {isGroup && <span className="bg-[#D4AF37] text-black text-[8px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 animate-pulse"><AlertTriangle size={8} /> GRUPO</span>}
                                  </div>
                                  <div className="text-white/30 text-xs flex flex-wrap items-center gap-y-1 gap-x-3 mt-1 font-sans">
                                    <span className="flex items-center gap-1"><Phone size={10} className="text-[#D4AF37]/40" /> {res.client_phone}</span>
                                    {res.notes && (
                                      <span className="text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border border-[#D4AF37]/20">
                                        <AlertTriangle size={10} /> {res.notes}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-white tracking-widest font-serif text-lg">
                              {res.reservation_time.substring(0, 5)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col gap-2 items-center">
                                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-sm border ${res.zone === 'terrace'
                                    ? 'text-orange-400 border-orange-400/20 bg-orange-400/5'
                                    : 'text-blue-400 border-blue-400/20 bg-blue-400/5'
                                  }`}>
                                  {res.zone === 'terrace' ? 'Terraza' : 'Interior'}
                                </span>
                                <input
                                  type="text"
                                  placeholder="+ MESA"
                                  value={res.table_name || ''}
                                  onChange={(e) => setReservations(prev => prev.map(r => r.id === res.id ? { ...r, table_name: e.target.value } : r))}
                                  onBlur={(e) => handleUpdateTable(res.id, e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                  className={`w-20 text-center text-[10px] font-bold uppercase tracking-widest px-1 py-1.5 rounded-sm border focus:outline-none focus:ring-[#D4AF37] transition-all ${res.table_name ? 'text-[#D4AF37] border-[#D4AF37]/50 bg-[#D4AF37]/10' : 'text-white/40 border-white/10 bg-[#0A0A0A] hover:bg-white/5 shadow-inner'}`}
                                  title="Asignar Mesa"
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`text-xl font-serif ${isGroup ? 'text-[#D4AF37] font-bold' : 'text-white/60'}`}>
                                {res.guests}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col items-start gap-2">
                                <button
                                  onClick={() => handleUpdateStatus(res.id, res.status === 'seated' ? 'confirmed' : 'seated')}
                                  title={res.status === 'seated' ? 'Marcar como pendiente' : 'Marcar como llegado'}
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-[10px] font-bold uppercase tracking-widest transition-all ${res.status === 'seated'
                                      ? 'bg-green-500/15 border-green-500/40 text-green-400 hover:bg-green-500/25'
                                      : res.status === 'cancelled'
                                        ? 'bg-red-500/10 border-red-500/20 text-red-400 cursor-default'
                                        : 'bg-white/5 border-white/10 text-white/30 hover:border-green-500/40 hover:text-green-400'
                                    }`}
                                  disabled={res.status === 'cancelled'}
                                >
                                  <CheckCircle2 size={14} className={res.status === 'seated' ? 'text-green-400' : 'text-white/20'} />
                                  {res.status === 'seated' ? 'Llegó' : res.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                                </button>
                                {getSemaphoreUI(res)}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 translate-x-2 group-hover:translate-x-0 transition-transform">
                                <button
                                  onClick={() => { setEditingRes(res); setShowEditModal(true); }}
                                  className="p-2.5 hover:bg-white/10 text-white/40 hover:text-white transition-colors rounded-full"
                                  title="Editar Reserva"
                                >
                                  <FileText size={18} />
                                </button>
                                <button
                                  onClick={() => openWhatsApp(res)}
                                  className="p-2.5 hover:bg-[#25D366]/10 text-[#25D366] transition-colors rounded-full"
                                  title="Enviar WhatsApp"
                                >
                                  <MessageCircle size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteIndividual(res.id)}
                                  className="p-2.5 hover:bg-red-500/10 text-red-500/40 hover:text-red-500 transition-colors rounded-full"
                                  title="Eliminar Reserva"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Clean List View (Mobile, tablets and small laptops <= 1100px) */}
            <div className="min-[1101px]:hidden flex flex-col gap-0 bg-[#111111] border border-white/5 rounded-sm overflow-hidden">
              {loading ? (
                <div className="text-center py-20 text-white/20 uppercase tracking-[0.2em] font-sans">
                  <Loader2 className="animate-spin mx-auto mb-4" size={32} />
                  Cargando...
                </div>
              ) : filteredReservations.length === 0 ? (
                <div className="text-center py-16 text-white/20 italic font-serif">
                  No hay reservas para este turno.
                </div>
              ) : (
                filteredReservations.map((res, idx) => {
                  const isGroup = res.guests >= (settings?.large_group_threshold || 8)
                  const isSeated = res.status === 'seated'
                  const isCancelled = res.status === 'cancelled'
                  return (
                    <div
                      key={res.id}
                      className={`relative flex items-center gap-0 transition-colors ${idx !== 0 ? 'border-t border-white/5' : ''
                        } ${isCancelled ? 'opacity-35' :
                          isSeated ? 'bg-green-500/[0.04]' :
                            isGroup ? 'bg-[#D4AF37]/[0.04]' : ''
                        }`}
                    >
                      {/* Left accent bar */}
                      <div className={`self-stretch w-[3px] shrink-0 ${isSeated ? 'bg-green-500' :
                          isCancelled ? 'bg-red-500/40' :
                            isGroup ? 'bg-[#D4AF37]' :
                              'bg-[#D4AF37]/30'
                        }`} />

                      {/* Check / Arrival button */}
                      <button
                        onClick={() => !isCancelled && handleUpdateStatus(res.id, isSeated ? 'confirmed' : 'seated')}
                        disabled={isCancelled}
                        title={isSeated ? 'Desmarcar llegada' : 'Marcar como llegado'}
                        className={`shrink-0 mx-3 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all active:scale-90 ${isSeated
                            ? 'bg-green-500 border-green-500 text-black shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                            : isCancelled
                              ? 'border-white/10 text-white/10 cursor-not-allowed'
                              : 'border-white/20 text-white/20 hover:border-green-500/60 hover:text-green-500/60'
                          }`}
                      >
                        <CheckCircle2 size={20} strokeWidth={isSeated ? 2.5 : 1.5} />
                      </button>

                      {/* Main content */}
                      <div className="flex-1 min-w-0 py-3 pr-3">
                        {/* Row 1: Time + Zone + Pax */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-serif font-bold text-base leading-none tracking-tight ${isSeated ? 'text-green-400' : 'text-[#D4AF37]'
                            }`}>
                            {res.reservation_time.substring(0, 5)}
                          </span>
                          <span className={`text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm border ${res.zone === 'terrace'
                              ? 'text-orange-400 border-orange-400/25 bg-orange-400/10'
                              : 'text-blue-400 border-blue-400/25 bg-blue-400/10'
                            }`}>
                            {res.zone === 'terrace' ? 'Terraza' : 'Interior'}
                          </span>
                          <span className={`ml-auto font-serif font-bold text-base leading-none ${isGroup ? 'text-[#D4AF37]' : 'text-white/50'
                            }`}>
                            {res.guests}<span className="text-[9px] font-sans font-normal opacity-50 ml-0.5 tracking-widest">pax</span>
                          </span>
                          {isGroup && <span className="bg-[#D4AF37] text-black text-[7px] font-bold px-1 py-0.5 rounded-sm animate-pulse">GRUPO</span>}
                        </div>

                        {/* Row 2: Name */}
                        <div className="flex items-center gap-2">
                          <span className={`font-serif text-base leading-tight truncate ${isSeated ? 'text-white' : isCancelled ? 'line-through text-white/30' : 'text-white'
                            }`}>
                            {res.client_name}
                          </span>
                        </div>

                        {/* Row 3: Phone + Mesa + actions */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <a
                            href={`tel:${res.client_phone}`}
                            className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors text-[11px] font-mono tracking-wide min-w-0 truncate"
                          >
                            <Phone size={9} className="text-[#D4AF37]/40 shrink-0" />
                            {res.client_phone}
                          </a>

                          {/* Mesa inline */}
                          <input
                            type="text"
                            placeholder="Mesa"
                            value={res.table_name || ''}
                            onChange={(e) => setReservations(prev => prev.map(r => r.id === res.id ? { ...r, table_name: e.target.value } : r))}
                            onBlur={(e) => handleUpdateTable(res.id, e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                            className={`ml-auto w-16 text-center text-[10px] font-bold uppercase tracking-widest px-1.5 py-1 rounded-sm border focus:outline-none transition-all ${res.table_name
                                ? 'text-[#D4AF37] border-[#D4AF37]/40 bg-[#D4AF37]/10'
                                : 'text-white/20 border-white/10 bg-transparent'
                              }`}
                            title="Mesa"
                          />

                          {/* Actions */}
                          <button
                            onClick={() => { setEditingRes(res); setShowEditModal(true); }}
                            className="p-1.5 text-white/25 hover:text-white/70 transition-colors rounded"
                            title="Editar"
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            onClick={() => openWhatsApp(res)}
                            className="p-1.5 text-[#25D366]/50 hover:text-[#25D366] transition-colors rounded"
                            title="WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteIndividual(res.id)}
                            className="p-1.5 text-red-500/25 hover:text-red-500 transition-colors rounded"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {/* Notes */}
                        {res.notes && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <AlertTriangle size={9} className="text-[#D4AF37]/60 shrink-0" />
                            <span className="text-[#D4AF37]/70 text-[9px] uppercase tracking-wider truncate">{res.notes}</span>
                          </div>
                        )}

                        {/* Semaphore when seated */}
                        {isSeated && getSemaphoreUI(res)}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="bg-[#111111] border border-white/5 rounded-sm p-6 md:p-8 max-w-2xl space-y-8 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-bold mb-4 border-b border-[#D4AF37]/20 pb-2">Capacidad y Tiempos</h3>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2">
                  WhatsApp del Restaurante
                  {role !== 'admin' && <Settings size={10} className="text-[#D4AF37]/40" />}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="34600112233"
                    value={settings?.whatsapp_number || ''}
                    readOnly={role !== 'admin'}
                    onChange={e => role === 'admin' && setSettings(s => s ? ({ ...s, whatsapp_number: e.target.value }) : null)}
                    className={`admin-input-small w-full ${role !== 'admin' ? 'opacity-50 cursor-not-allowed bg-white/5 border-white/5' : ''}`}
                  />
                  {role !== 'admin' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Settings size={14} className="text-white/20" />
                    </div>
                  )}
                </div>
                {role === 'admin' ? (
                  <p className="text-[9px] text-white/20 italic mt-1">Este es el número donde los clientes enviarán sus confirmaciones de reserva.</p>
                ) : (
                  <p className="text-[9px] text-[#D4AF37]/40 italic mt-1 font-medium flex items-center gap-1">Solo el administrador puede modificar este número.</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2 text-blue-400">Aforo Interior (SALA)</label>
                <input
                  type="number"
                  value={settings?.max_capacity_inside || 0}
                  onChange={e => setSettings(s => s ? ({ ...s, max_capacity_inside: parseInt(e.target.value) || 0 }) : null)}
                  className="admin-input-small w-full border-blue-400/20 focus:border-blue-400"
                />
                <p className="text-[9px] text-white/20 italic mt-1">Suma total de clientes permitidos sentados al mismo tiempo en el interior.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2 text-orange-400">Aforo Terraza</label>
                <input
                  type="number"
                  value={settings?.max_capacity_terrace || 0}
                  onChange={e => setSettings(s => s ? ({ ...s, max_capacity_terrace: parseInt(e.target.value) || 0 }) : null)}
                  className="admin-input-small w-full border-orange-400/20 focus:border-orange-400"
                />
                <p className="text-[9px] text-white/20 italic mt-1">Suma total de clientes permitidos sentados al mismo tiempo en el exterior.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2">Intervalo (minutos)</label>
                <select
                  value={settings?.slot_interval_minutes || 30}
                  onChange={e => setSettings(s => s ? ({ ...s, slot_interval_minutes: parseInt(e.target.value) }) : null)}
                  className="admin-input-small w-full"
                >
                  <option value={10} className='text-black'>10 minutos</option>
                  <option value={15} className='text-black'>15 minutos</option>
                  <option value={30} className='text-black'>30 minutos</option>
                  <option value={60} className='text-black'>1 hora</option>
                </select>
                <p className="text-[9px] text-white/20 italic mt-1">Frecuencia en la que se muestran las horas al cliente (Ej: 14:00, 14:10, 14:20).</p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-bold mb-4 border-b border-[#D4AF37]/20 pb-2">Control Maestro</h3>

              {/* Theme Toggle */}
              <div className={`p-4 rounded-sm border transition-all duration-500 bg-white/5 border-white/10`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest mb-1 text-white">
                      MODO CLARO (MAÑANAS)
                    </h4>
                    <p className="text-[9px] text-white/40 leading-relaxed">
                      Activa esta opción si el sol no te permite ver bien la pantalla por la mañana. Cambia los colores de la agenda a tonos claros.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newTheme = theme === 'dark' ? 'light' : 'dark'
                      setTheme(newTheme)
                      localStorage.setItem('reservations-theme', newTheme)
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${theme === 'light' ? 'bg-[#D4AF37]' : 'bg-white/20'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'light' ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-sm border transition-all duration-500 ${settings?.disable_web_reservations ? 'bg-red-500/10 border-red-500/50' : 'bg-green-500/5 border-green-500/20'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${settings?.disable_web_reservations ? 'text-red-400' : 'text-green-400'}`}>
                      {settings?.disable_web_reservations ? 'RESERVAS WEB DESACTIVADAS' : 'RESERVAS WEB ACTIVAS'}
                    </h4>
                    <p className="text-[9px] text-white/40 leading-relaxed">
                      {settings?.disable_web_reservations
                        ? 'Los clientes no pueden reservar online. Verán un mensaje para llamar por teléfono.'
                        : 'Los clientes pueden realizar reservas normalmente desde la página web.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings(s => s ? ({ ...s, disable_web_reservations: !s.disable_web_reservations }) : null)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings?.disable_web_reservations ? 'bg-red-500' : 'bg-green-600'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings?.disable_web_reservations ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>

              <h3 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-bold mb-4 border-b border-[#D4AF37]/20 pb-2">Configuración Especial</h3>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2">Alerta de "Grupo Grande"</label>
                <input
                  type="number"
                  value={settings?.large_group_threshold || 8}
                  onChange={e => setSettings(s => s ? ({ ...s, large_group_threshold: parseInt(e.target.value) }) : null)}
                  className="admin-input-small w-full"
                />
                <p className="text-[9px] text-white/20 italic mt-1">Marca en rojo las comandas superiores a esta cifra para avisar a sala/cocina.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] flex items-center gap-2 font-bold">Límite de Cocina (Caudal/Tramo)</label>
                <input
                  type="number"
                  value={settings?.max_capacity_per_slot || 15}
                  onChange={e => setSettings(s => s ? ({ ...s, max_capacity_per_slot: parseInt(e.target.value) }) : null)}
                  className="admin-input-small w-full border-[#D4AF37]/50 bg-[#D4AF37]/10 text-white"
                />
                <p className="text-[9px] text-[#D4AF37]/70 italic mt-1 font-medium">Límite MÁXIMO de personas (sumando terraza+sala) que dejamos entrar a la MISMA HORA (Ej: 14:00) para no colapsar la cocina. Obliga a las siguientes personas a reservar a las 14:15.</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2">Permanencia (minutos)</label>
                <input
                  type="number"
                  value={settings?.stay_duration_minutes || 90}
                  onChange={e => setSettings(s => s ? ({ ...s, stay_duration_minutes: parseInt(e.target.value) }) : null)}
                  className="admin-input-small w-full"
                />
                <p className="text-[9px] text-white/20 italic mt-1">Tiempo estimado que calculará el motor para determinar cuándo una mesa vuelve a quedarse libre (Ej: 90 min).</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-bold mb-4 border-b border-[#D4AF37]/20 pb-2">Horarios de Servicio</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-sans">Desayuno (Inicio)</label>
                <input type="time" value={settings?.breakfast_start} onChange={e => setSettings(s => s ? ({ ...s, breakfast_start: e.target.value }) : null)} className="admin-input-small w-full" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-sans">Desayuno (Fin)</label>
                <input type="time" value={settings?.breakfast_end} onChange={e => setSettings(s => s ? ({ ...s, breakfast_end: e.target.value }) : null)} className="admin-input-small w-full" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-sans">Comida (Inicio)</label>
                <input type="time" value={settings?.lunch_start} onChange={e => setSettings(s => s ? ({ ...s, lunch_start: e.target.value }) : null)} className="admin-input-small w-full" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-sans">Comida (Fin)</label>
                <input type="time" value={settings?.lunch_end} onChange={e => setSettings(s => s ? ({ ...s, lunch_end: e.target.value }) : null)} className="admin-input-small w-full" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-sans">Cena (Inicio)</label>
                <input type="time" value={settings?.dinner_start} onChange={e => setSettings(s => s ? ({ ...s, dinner_start: e.target.value }) : null)} className="admin-input-small w-full" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-sans">Cena (Fin)</label>
                <input type="time" value={settings?.dinner_end} onChange={e => setSettings(s => s ? ({ ...s, dinner_end: e.target.value }) : null)} className="admin-input-small w-full" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={settings?.breakfast_menu_active} onChange={e => setSettings(s => s ? ({ ...s, breakfast_menu_active: e.target.checked }) : null)} className="w-4 h-4 rounded border-white/10 bg-white/5" />
                <span className="text-[9px] uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Desayuno Activo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={settings?.lunch_menu_active} onChange={e => setSettings(s => s ? ({ ...s, lunch_menu_active: e.target.checked }) : null)} className="w-4 h-4 rounded border-white/10 bg-white/5" />
                <span className="text-[9px] uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Comida Activa</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={settings?.dinner_menu_active} onChange={e => setSettings(s => s ? ({ ...s, dinner_menu_active: e.target.checked }) : null)} className="w-4 h-4 rounded border-white/10 bg-white/5" />
                <span className="text-[9px] uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Cena Activa</span>
              </label>
            </div>
          </div>

          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-5 rounded-sm shadow-inner mb-6">
            <h4 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.2em] font-bold mb-3 flex items-center gap-2">
              <Info size={14} /> Resumen en tiempo real de tu configuración
            </h4>
            <p className="text-white/60 text-xs leading-relaxed font-sans">
              La web permitirá un máximo de <strong className="text-blue-400">{settings?.max_capacity_inside || 0} personas en sala</strong> y <strong className="text-orange-400">{settings?.max_capacity_terrace || 0} en terraza</strong> sentadas al mismo tiempo.
              <br /><br />
              Sin embargo, para no colapsar a los cocineros, la web <strong>solo dejará entrar a <span className="text-[#D4AF37]">{settings?.max_capacity_per_slot || 0} personas a la misma hora exacta</span></strong>. Si intentan entrar más, les ofrecerá un hueco <strong className="text-white">{settings?.slot_interval_minutes || 0} minutos</strong> más tarde.
              <br /><br />
              Por último, el sistema está calculando que cada persona tarda <strong className="text-red-400">{settings?.stay_duration_minutes || 0} minutos</strong> en comer y levantarse. <span className="italic opacity-70">(Si este número es muy bajo, la web ofrecerá mesas que aún siguen comiendo).</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-4 tracking-widest text-xs uppercase font-bold"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Guardar Configuración'}
          </button>
        </form>
      )}

      {/* MODAL NUEVA RESERVA */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-[#111111] border-t sm:border border-[#D4AF37]/20 p-6 md:p-8 rounded-t-xl sm:rounded-sm max-w-md w-full animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-white flex items-center gap-3">
                <Users className="text-[#D4AF37]" />
                Nueva Reserva
              </h2>
              <button
                onClick={() => { setShowAddModal(false); setCapacitySuggestion(null) }}
                className="p-2 text-white/40 hover:text-white sm:hidden"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={(e) => handleCreateManual(e)} className="space-y-4 font-sans pb-6 sm:pb-0">

              {/* Banner de sugerencia de turno */}
              {capacitySuggestion && (
                <div className="bg-amber-500/10 border border-amber-500/40 rounded-sm p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-300 text-xs font-bold uppercase tracking-widest mb-1">
                        {capacitySuggestion.reason === 'kitchen' ? 'Límite de cocina alcanzado' : 'Aforo de zona alcanzado'}
                      </p>
                      <p className="text-white/60 text-[11px] leading-relaxed">
                        Las <strong className="text-white">{capacitySuggestion.requested_time}</strong> están al límite.
                        {capacitySuggestion.suggested_time
                          ? <> El siguiente hueco disponible es a las <strong className="text-amber-300">{capacitySuggestion.suggested_time}</strong>.</>
                          : <> No hay más huecos disponibles en este turno.</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {capacitySuggestion.suggested_time && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewRes(prev => ({ ...prev, reservation_time: capacitySuggestion.suggested_time! }))
                          setCapacitySuggestion(null)
                        }}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-sm transition-all"
                      >
                        Cambiar a {capacitySuggestion.suggested_time}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async (e: any) => {
                        setCapacitySuggestion(null)
                        setLoading(true)
                        try {
                          const res = await fetch('/api/admin/reservations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...newRes, force_override: true })
                          })
                          if (res.ok) {
                            const today = new Date().toISOString().split('T')[0]
                            const wasForFutureDate = newRes.reservation_date !== today
                            setShowAddModal(false)
                            setNewRes({ client_name: '', client_phone: '', guests: 2, reservation_date: today, reservation_time: '13:30', zone: 'inside', notes: '' })
                            if (wasForFutureDate) setSelectedDate(today)
                            else fetchData()
                            setMessage({ type: 'success', text: '✅ Reserva creada (forzada por admin)' })
                          } else {
                            const data = await res.json()
                            setMessage({ type: 'error', text: data.error || 'Error al crear reserva' })
                          }
                        } catch {
                          setMessage({ type: 'error', text: 'Error al crear reserva' })
                        } finally {
                          setLoading(false)
                        }
                      }}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-sm transition-all"
                    >
                      Mantener {capacitySuggestion.requested_time}
                    </button>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Nombre</label>
                <input
                  type="text"
                  required
                  value={newRes.client_name}
                  onChange={e => setNewRes({ ...newRes, client_name: e.target.value })}
                  className="admin-input-small w-full h-12"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Teléfono</label>
                <input
                  type="text"
                  required
                  value={newRes.client_phone}
                  onChange={e => setNewRes({ ...newRes, client_phone: e.target.value })}
                  className="admin-input-small w-full h-12"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Pax</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newRes.guests === 0 ? '' : newRes.guests}
                    onChange={e => {
                      const val = e.target.value
                      setNewRes({ ...newRes, guests: val === '' ? 0 : parseInt(val) })
                    }}
                    className="admin-input-small w-full h-12 text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Hora</label>
                  <input
                    type="time"
                    required
                    value={newRes.reservation_time}
                    onChange={e => setNewRes({ ...newRes, reservation_time: e.target.value })}
                    className="admin-input-small w-full h-12"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Ubicación</label>
                {(() => {
                  const insideOpen = dailyOverride ? dailyOverride.is_accepting_inside : (settings?.is_accepting_inside ?? true)
                  const terraceOpen = dailyOverride ? dailyOverride.is_accepting_terrace : (settings?.is_accepting_terrace ?? true)
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={!insideOpen}
                        onClick={() => insideOpen && setNewRes({ ...newRes, zone: 'inside' })}
                        className={`relative p-3 text-[10px] uppercase tracking-widest border transition-all ${!insideOpen
                            ? 'border-red-500/20 bg-red-500/5 text-red-500/40 cursor-not-allowed line-through'
                            : newRes.zone === 'inside'
                              ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-bold'
                              : 'border-white/10 text-white/40 hover:border-white/30'
                          }`}
                        title={!insideOpen ? 'Interior bloqueado para este día' : ''}
                      >
                        {!insideOpen && <span className="mr-1">🔒</span>}Interior
                      </button>
                      <button
                        type="button"
                        disabled={!terraceOpen}
                        onClick={() => terraceOpen && setNewRes({ ...newRes, zone: 'terrace' })}
                        className={`relative p-3 text-[10px] uppercase tracking-widest border transition-all ${!terraceOpen
                            ? 'border-red-500/20 bg-red-500/5 text-red-500/40 cursor-not-allowed line-through'
                            : newRes.zone === 'terrace'
                              ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-bold'
                              : 'border-white/10 text-white/40 hover:border-white/30'
                          }`}
                        title={!terraceOpen ? 'Terraza bloqueada para este día' : ''}
                      >
                        {!terraceOpen && <span className="mr-1">🔒</span>}Terraza
                      </button>
                    </div>
                  )
                })()}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Fecha</label>
                <input
                  type="date"
                  required
                  value={newRes.reservation_date}
                  onChange={e => setNewRes({ ...newRes, reservation_date: e.target.value })}
                  className="admin-input-small w-full h-12"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Notas</label>
                <textarea
                  rows={2}
                  value={newRes.notes}
                  onChange={e => setNewRes({ ...newRes, notes: e.target.value })}
                  placeholder="Alergenos, tronas..."
                  className="admin-input-small w-full resize-none p-4"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setCapacitySuggestion(null) }}
                  className="hidden sm:flex flex-1 px-4 py-4 text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors font-bold border border-white/5"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-gold py-4 text-[11px] uppercase tracking-widest font-bold shadow-2xl h-14 sm:h-auto"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Crear Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR RESERVA */}
      {showEditModal && editingRes && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-[#111111] border-t sm:border border-[#D4AF37]/20 p-6 md:p-8 rounded-t-xl sm:rounded-sm max-w-md w-full animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
            <h2 className="font-serif text-2xl text-white flex items-center gap-3 mb-6">
              <FileText className="text-[#D4AF37]" />
              Editar Reserva
            </h2>

            <form onSubmit={handleUpdateReservation} className="space-y-4 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Nombre</label>
                <input
                  type="text"
                  value={editingRes.client_name}
                  onChange={e => setEditingRes({ ...editingRes, client_name: e.target.value })}
                  className="admin-input-small w-full h-12"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Pax</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingRes.guests === 0 ? '' : editingRes.guests}
                    onChange={e => {
                      const val = e.target.value
                      setEditingRes({ ...editingRes, guests: val === '' ? 0 : parseInt(val) })
                    }}
                    className="admin-input-small w-full h-12"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Hora (HH:MM)</label>
                  <input
                    type="time"
                    value={editingRes.reservation_time.substring(0, 5)}
                    onChange={e => setEditingRes({ ...editingRes, reservation_time: e.target.value })}
                    className="admin-input-small w-full h-12"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Fecha</label>
                <input
                  type="date"
                  value={editingRes.reservation_date}
                  onChange={e => setEditingRes({ ...editingRes, reservation_date: e.target.value })}
                  className="admin-input-small w-full h-12"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Ubicación</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRes({ ...editingRes, zone: 'inside' })}
                    className={`p-3 text-[10px] uppercase tracking-widest border transition-all ${editingRes.zone === 'inside' ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-bold' : 'border-white/10 text-white/40'}`}
                  >Interior</button>
                  <button
                    type="button"
                    onClick={() => setEditingRes({ ...editingRes, zone: 'terrace' })}
                    className={`p-3 text-[10px] uppercase tracking-widest border transition-all ${editingRes.zone === 'terrace' ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-bold' : 'border-white/10 text-white/40'}`}
                  >Terraza</button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Phone size={11} /> Teléfono
                </label>
                <input
                  type="tel"
                  value={editingRes.client_phone}
                  onChange={e => setEditingRes({ ...editingRes, client_phone: e.target.value })}
                  placeholder="Ej: 609123456"
                  className="admin-input-small w-full h-12"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <MessageCircle size={11} /> Notas
                </label>
                <textarea
                  value={editingRes.notes || ''}
                  onChange={e => setEditingRes({ ...editingRes, notes: e.target.value })}
                  placeholder="Alergias, preferencias, ocasión especial..."
                  rows={3}
                  className="admin-input-small w-full resize-none py-3"
                />
              </div>


              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-4 text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors font-bold border border-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-gold py-4 text-[11px] uppercase tracking-widest font-bold"
                >
                  Guardar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StatItem({ title, value, icon, color = 'text-white' }: { title: string, value: any, icon: React.ReactNode, color?: string }) {
  return (
    <div className="bg-[#111111] border border-white/5 p-3 md:p-4 rounded-sm flex flex-col justify-center items-center text-center shadow-md">
      <div className="flex items-center gap-2 text-white/20 text-[9px] md:text-[10px] uppercase tracking-widest mb-1 font-sans">
        {icon} <span className="xs:inline">{title}</span>
      </div>
      <div className={`text-xl md:text-2xl font-serif leading-none ${color}`}>{value}</div>
    </div>
  )
}
