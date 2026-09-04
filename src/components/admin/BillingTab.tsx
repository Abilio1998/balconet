'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sun, Moon, Target, TrendingUp, TrendingDown, AlertTriangle, Euro, Save, Loader2, X, Calendar, Globe, Info, Users } from 'lucide-react'

type WeekDay = {
  date: string
  dayName: string
  morning: number
  evening: number
  total: number
}

type ScheduledEmployee = {
  id: string
  name: string
  type: 'full' | 'extra'
  shifts: Record<
    string,
    {
      morning: boolean
      evening: boolean
      custom?: boolean
      customStart?: string
      customEnd?: string
    }
  >
}

type BillingData = {
  weekRange: { monday: string, sunday: string }
  monthRange: { first: string, last: string }
  weekDays: WeekDay[]
  schedule?: ScheduledEmployee[]
  scheduleTargetMorning?: number
  scheduleTargetEvening?: number
  rateFull?: number
  rateExtra?: number
  rateFullMorning?: number
  rateExtraMorning?: number
  rateFullEvening?: number
  rateExtraEvening?: number
  shiftHours?: Record<string, { morning: { start: string, end: string }, evening: { start: string, end: string } }>
  lastWeekSchedule?: ScheduledEmployee[]
  history?: {
    lastWeek: { total: number, goal: number, percentage: number }
    lastMonth: { total: number, goal: number, percentage: number }
    annual: { total: number, goal: number, percentage: number }
  }
  weekly: {
    total: number
    morning: number
    evening: number
    goal: number
    goalMorning: number
    goalEvening: number
    percentage: number
    remaining: number
    exceeded: boolean
    daysWithData: number
    daysRemaining: number
    dailyAvgNeeded: number
    dailyAvgNeededMorning: number
    dailyAvgNeededEvening: number
  }
  monthly: {
    total: number
    morning: number
    evening: number
    goal: number
    goalMorning: number
    goalEvening: number
    percentage: number
    remaining: number
  }
  settings: {
    monthYear: string | null
    weeklyGoalMorning: number
    weeklyGoalEvening: number
    monthlyGoalMorning: number
    monthlyGoalEvening: number
  }
}

type AnnualMonth = {
  monthIndex: number
  monthPrefix: string
  billed: number
  goal: number
  difference: number
  percentage: number
}

type AnnualData = {
  year: string
  months: AnnualMonth[]
  annual: {
    totalBilled: number
    totalGoal: number
    difference: number
    percentage: number
  }
}

const parseToMin = (t: string): number => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const getOverlapMin = (s1: number, e1: number, s2: number, e2: number): number => {
  return Math.max(0, Math.min(e1, e2) - Math.max(s1, s2))
}

const getFullOverlapMin = (s1: number, e1: number, s2: number, e2: number): number => {
  return (
    getOverlapMin(s1, e1, s2, e2) +
    getOverlapMin(s1, e1, s2 + 1440, e2 + 1440) +
    getOverlapMin(s1, e1, s2 - 1440, e2 - 1440)
  )
}

export default function BillingTab() {
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [savingCell, setSavingCell] = useState<string | null>(null)
  
  const [employees, setEmployees] = useState<ScheduledEmployee[]>([])
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [rateFullMorning, setRateFullMorning] = useState<number>(360)
  const [rateExtraMorning, setRateExtraMorning] = useState<number>(180)
  const [rateFullEvening, setRateFullEvening] = useState<number>(360)
  const [rateExtraEvening, setRateExtraEvening] = useState<number>(180)
  const [shiftHours, setShiftHours] = useState<Record<string, { morning: { start: string, end: string }, evening: { start: string, end: string } }>>({})
  const [quickName, setQuickName] = useState<string>('')
  const [quickType, setQuickType] = useState<'full' | 'extra'>('full')

  // Custom Shift Editor Popover State
  const [editingCustomShift, setEditingCustomShift] = useState<{
    employeeId: string
    date: string
    start: string
    end: string
  } | null>(null)

  // Shift Hours Global/Week Editor State
  const [editingShiftHoursDay, setEditingShiftHoursDay] = useState<string | null>(null)

  // Settings Modal State
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [savingGoals, setSavingGoals] = useState(false)
  const [configMode, setConfigMode] = useState<'global' | 'specific'>('global')
  const [configMonthYear, setConfigMonthYear] = useState<string>('')
  const [goalInputs, setGoalInputs] = useState({
    wMorning: 6000,
    wEvening: 6000,
    mMorning: 25000,
    mEvening: 25000
  })

  const [editValues, setEditValues] = useState<Record<string, string>>({})
  
  // Annual View State
  const [showAnnualModal, setShowAnnualModal] = useState(false)
  const [annualData, setAnnualData] = useState<AnnualData | null>(null)
  const [annualLoading, setAnnualLoading] = useState(false)
  const [annualYear, setAnnualYear] = useState<string>(new Date().getFullYear().toString())

  const fetchBilling = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/billing?weekOffset=${weekOffset}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setEmployees(json.schedule || [])
      setRateFullMorning(json.rateFullMorning ?? json.rateFull ?? 360)
      setRateExtraMorning(json.rateExtraMorning ?? json.rateExtra ?? 180)
      setRateFullEvening(json.rateFullEvening ?? json.rateFull ?? 360)
      setRateExtraEvening(json.rateExtraEvening ?? json.rateExtra ?? 180)
      setShiftHours(json.shiftHours || {})
    } catch (err) {
      console.error('Error fetching billing:', err)
    } finally {
      setLoading(false)
    }
  }, [weekOffset])

  const generateId = () => {
    if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID()
    }
    return Math.random().toString(36).substring(2, 9)
  }

  const calculateDurationHours = (start: string, end: string): number => {
    try {
      const [shStr, smStr] = start.split(':')
      const [ehStr, emStr] = end.split(':')
      const sh = parseInt(shStr, 10)
      const sm = parseInt(smStr, 10)
      const eh = parseInt(ehStr, 10)
      const em = parseInt(emStr, 10)
      
      if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0
      
      const startMin = sh * 60 + sm
      let endMin = eh * 60 + em
      
      if (endMin < startMin) {
        endMin += 24 * 60
      }
      
      return (endMin - startMin) / 60
    } catch {
      return 0
    }
  }

  const calculateScheduleSplit = useCallback(() => {
    let morningTotal = 0
    let eveningTotal = 0

    employees.forEach(emp => {
      const rMorning = emp.type === 'full' ? rateFullMorning : rateExtraMorning
      const rEvening = emp.type === 'full' ? rateFullEvening : rateExtraEvening
      
      data?.weekDays.forEach(day => {
        const s = emp.shifts[day.date]
        if (!s) return

        const defaultDayHours = {
          morning: { start: '08:00', end: '16:00' },
          evening: { start: '16:00', end: '00:00' }
        }
        const dayHours = shiftHours[day.date] || defaultDayHours

        if (s.custom && s.customStart && s.customEnd) {
          const start = s.customStart
          const end = s.customEnd
          if (start === '20:00' && (end === '00:00' || end === '24:00')) {
            eveningTotal += 180
          } else if (start === '12:00' && end === '20:00') {
            morningTotal += 90
            eveningTotal += 90
          } else {
            const s1 = parseToMin(start)
            let e1 = parseToMin(end)
            if (e1 < s1) e1 += 1440

            const sm = parseToMin(dayHours.morning.start)
            let em = parseToMin(dayHours.morning.end)
            if (em < sm) em += 1440

            const se = parseToMin(dayHours.evening.start)
            let ee = parseToMin(dayHours.evening.end)
            if (ee < se) ee += 1440

            const morningOverlapHours = getFullOverlapMin(s1, e1, sm, em) / 60
            const eveningOverlapHours = getFullOverlapMin(s1, e1, se, ee) / 60

            morningTotal += (morningOverlapHours / 8) * rMorning
            eveningTotal += (eveningOverlapHours / 8) * rEvening
          }
        }
        
        if (s.morning) morningTotal += rMorning
        if (s.evening) eveningTotal += rEvening
      })
    })

    return { morning: morningTotal, evening: eveningTotal }
  }, [employees, rateFullMorning, rateExtraMorning, rateFullEvening, rateExtraEvening, shiftHours, data?.weekDays])

  const calculateTarget = useCallback(() => {
    const split = calculateScheduleSplit()
    return split.morning + split.evening
  }, [calculateScheduleSplit])

  const handleSaveSchedule = async (
    updatedList: ScheduledEmployee[],
    rfm?: number,
    rem?: number,
    rfe?: number,
    ree?: number,
    sHours?: Record<string, { morning: { start: string, end: string }, evening: { start: string, end: string } }>
  ) => {
    if (!data) return
    setSavingSchedule(true)
    const targetRfm = rfm ?? rateFullMorning
    const targetRem = rem ?? rateExtraMorning
    const targetRfe = rfe ?? rateFullEvening
    const targetRee = ree ?? rateExtraEvening
    const targetShiftHours = sHours ?? shiftHours
    try {
      await fetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekMonday: data.weekRange.monday,
          scheduleData: {
            employees: updatedList,
            rateFullMorning: targetRfm,
            rateExtraMorning: targetRem,
            rateFullEvening: targetRfe,
            rateExtraEvening: targetRee,
            shiftHours: targetShiftHours
          }
        })
      })
      const res = await fetch(`/api/admin/billing?weekOffset=${weekOffset}`)
      const json = await res.json()
      if (!json.error) setData(json)
    } catch (err) {
      console.error('Error saving schedule:', err)
    } finally {
      setSavingSchedule(false)
    }
  }

  const updateSchedule = (
    updatedList: ScheduledEmployee[],
    rfm?: number,
    rem?: number,
    rfe?: number,
    ree?: number,
    sHours?: Record<string, { morning: { start: string, end: string }, evening: { start: string, end: string } }>
  ) => {
    setEmployees(updatedList)
    handleSaveSchedule(updatedList, rfm, rem, rfe, ree, sHours)
  }

  const handleUpdateShiftHours = (dateStr: string, shift: 'morning' | 'evening', field: 'start' | 'end', value: string) => {
    const defaultDayHours = {
      morning: { start: '08:00', end: '16:00' },
      evening: { start: '16:00', end: '00:00' }
    }
    const dayHours = shiftHours[dateStr] || defaultDayHours
    const updatedDayHours = {
      ...dayHours,
      [shift]: {
        ...dayHours[shift],
        [field]: value
      }
    }
    const updatedShiftHours = {
      ...shiftHours,
      [dateStr]: updatedDayHours
    }
    setShiftHours(updatedShiftHours)
    updateSchedule(employees, rateFullMorning, rateExtraMorning, rateFullEvening, rateExtraEvening, updatedShiftHours)
  }

  const handleSaveCustomShift = (employeeId: string, dateStr: string, start: string, end: string) => {
    const list = employees.map(emp => {
      if (emp.id !== employeeId) return emp
      const currentDayShifts = emp.shifts[dateStr] || { morning: false, evening: false }
      return {
        ...emp,
        shifts: {
          ...emp.shifts,
          [dateStr]: {
            ...currentDayShifts,
            custom: true,
            customStart: start,
            customEnd: end
          }
        }
      }
    })
    updateSchedule(list)
  }

  const handleClearCustomShift = (employeeId: string, dateStr: string) => {
    const list = employees.map(emp => {
      if (emp.id !== employeeId) return emp
      const current = emp.shifts[dateStr] || { morning: false, evening: false }
      return {
        ...emp,
        shifts: {
          ...emp.shifts,
          [dateStr]: {
            ...current,
            custom: false,
            customStart: undefined,
            customEnd: undefined
          }
        }
      }
    })
    updateSchedule(list)
  }

  const handleSetDiaEntero = (employeeId: string, dateStr: string) => {
    const list = employees.map(emp => {
      if (emp.id !== employeeId) return emp
      const currentDayShifts = emp.shifts[dateStr] || { morning: false, evening: false }
      return {
        ...emp,
        shifts: {
          ...emp.shifts,
          [dateStr]: {
            ...currentDayShifts,
            morning: true,
            evening: true,
            custom: false
          }
        }
      }
    })
    updateSchedule(list)
  }


  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickName.trim()) return
    const newEmp: ScheduledEmployee = {
      id: generateId(),
      name: quickName.trim(),
      type: quickType,
      shifts: {}
    }
    const updated = [...employees, newEmp]
    updateSchedule(updated)
    setQuickName('')
    setTimeout(() => {
      const input = document.getElementById('quick-add-name-input')
      if (input) input.focus()
    }, 50)
  }

  const handleUpdateRates = (rfm: number, rem: number, rfe: number, ree: number) => {
    setRateFullMorning(rfm)
    setRateExtraMorning(rem)
    setRateFullEvening(rfe)
    setRateExtraEvening(ree)
    updateSchedule(employees, rfm, rem, rfe, ree)
  }

  const handleUpdateEmployee = (id: string, name: string, type: 'full' | 'extra') => {
    const list = employees.map(emp => emp.id === id ? { ...emp, name, type } : emp)
    updateSchedule(list)
  }

  const handleToggleShift = (id: string, dateStr: string, shift: 'morning' | 'evening') => {
    const list = employees.map(emp => {
      if (emp.id !== id) return emp
      const currentDayShifts = emp.shifts[dateStr] || { morning: false, evening: false }
      return {
        ...emp,
        shifts: {
          ...emp.shifts,
          [dateStr]: {
            ...currentDayShifts,
            [shift]: !currentDayShifts[shift]
          }
        }
      }
    })
    updateSchedule(list)
  }

  const handleDeleteEmployee = (id: string) => {
    const list = employees.filter(emp => emp.id !== id)
    updateSchedule(list)
  }

  const handleCopyFromPreviousWeek = () => {
    if (!data?.lastWeekSchedule) return
    const thisWeekDates = data.weekDays.map(d => d.date)
    const lastWeekDates = thisWeekDates.map(dateStr => {
      const d = new Date(dateStr + 'T12:00:00')
      d.setDate(d.getDate() - 7)
      return d.toISOString().split('T')[0]
    })

    const cloned: ScheduledEmployee[] = data.lastWeekSchedule.map(emp => {
      const newShifts: Record<string, { morning: boolean, evening: boolean }> = {}
      thisWeekDates.forEach((thisDate, idx) => {
        const lastDate = lastWeekDates[idx]
        const lastShifts = emp.shifts[lastDate] || { morning: false, evening: false }
        newShifts[thisDate] = { ...lastShifts }
      })

      return {
        id: generateId(),
        name: emp.name,
        type: emp.type,
        shifts: newShifts
      }
    })

    updateSchedule(cloned)
  }

  useEffect(() => { fetchBilling() }, [fetchBilling])

  const fetchAnnualData = useCallback(async (yearToFetch: string) => {
    setAnnualLoading(true)
    try {
      const res = await fetch(`/api/admin/billing/annual?year=${yearToFetch}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setAnnualData(json)
    } catch (err) {
      console.error('Error fetching annual data:', err)
    } finally {
      setAnnualLoading(false)
    }
  }, [])

  useEffect(() => {
    if (showAnnualModal) {
      fetchAnnualData(annualYear)
    }
  }, [annualYear, showAnnualModal, fetchAnnualData])

  const handleOpenAnnual = () => {
    setShowAnnualModal(true)
  }

  const handleOpenConfig = () => {
    if (!data) return
    const now = new Date()
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    setConfigMode(data.settings.monthYear ? 'specific' : 'global')
    setConfigMonthYear(data.settings.monthYear || currentMonthStr)
    setGoalInputs({
      wMorning: data.settings.weeklyGoalMorning,
      wEvening: data.settings.weeklyGoalEvening,
      mMorning: data.settings.monthlyGoalMorning,
      mEvening: data.settings.monthlyGoalEvening
    })
    setShowConfigModal(true)
  }

  const handleSaveAmount = async (date: string, shift: 'morning' | 'evening', amount: number) => {
    const key = `${date}-${shift}`
    setSavingCell(key)
    try {
      await fetch('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, shift, amount })
      })
      await fetchBilling()
    } catch (err) {
      console.error('Error saving billing:', err)
    } finally {
      setSavingCell(null)
    }
  }

  const handleSaveGoals = async () => {
    setSavingGoals(true)
    try {
      await fetch('/api/admin/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthYear: configMode === 'specific' ? configMonthYear : null,
          weeklyGoalMorning: goalInputs.wMorning,
          weeklyGoalEvening: goalInputs.wEvening,
          monthlyGoalMorning: goalInputs.mMorning,
          monthlyGoalEvening: goalInputs.mEvening
        })
      })
      setShowConfigModal(false)
      await fetchBilling()
    } catch (err) {
      console.error('Error saving goals:', err)
    } finally {
      setSavingGoals(false)
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    }).format(val)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  const getMadridTodayStr = () => {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    const parts = formatter.formatToParts(now)
    const year = parts.find(p => p.type === 'year')!.value
    const month = parts.find(p => p.type === 'month')!.value
    const day = parts.find(p => p.type === 'day')!.value
    return `${year}-${month}-${day}`
  }

  const isToday = (dateStr: string) => dateStr === getMadridTodayStr()
  const isPast = (dateStr: string) => dateStr <= getMadridTodayStr()

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white/5 border border-white/10 rounded-sm animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white/5 border border-white/10 rounded-sm animate-pulse" />
      </div>
    )
  }

  const weeklyPct = data.weekly.percentage
  const monthlyPct = data.monthly.percentage

  const weekLabel = `${formatDate(data.weekRange.monday)} — ${formatDate(data.weekRange.sunday)}`
  const monthLabel = new Date(data.weekRange.monday + 'T12:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  return (
    <motion.div
      key="billing-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* Week Navigator + Goals Header */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        {/* Week Navigator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="p-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/5 rounded-sm transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center min-w-[220px]">
            <p className="text-white font-serif text-lg capitalize">{weekLabel}</p>
            <p className="text-white/30 text-[10px] uppercase tracking-widest capitalize">{monthLabel}</p>
          </div>
          <button
            onClick={() => setWeekOffset(prev => Math.min(prev + 1, 0))}
            disabled={weekOffset >= 0}
            className="p-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/5 rounded-sm transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold hover:text-[#E8C84A] transition-colors ml-2"
            >
              Hoy ↵
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleOpenAnnual}
            className="flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-6 py-2.5 rounded-sm border border-blue-500/20 text-[10px] uppercase tracking-[0.2em] font-bold transition-all"
          >
            <Calendar size={14} />
            Resumen Anual
          </button>
          
          <button
            onClick={handleOpenConfig}
            className="flex items-center justify-center gap-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] px-6 py-2.5 rounded-sm border border-[#D4AF37]/20 text-[10px] uppercase tracking-[0.2em] font-bold transition-all"
          >
            <Target size={14} />
            Configurar Presupuestos
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-white/10 p-5 rounded-sm relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-3 bg-[#D4AF37]/5 rounded-bl-3xl group-hover:bg-[#D4AF37]/10 transition-colors">
            <Euro size={14} className="text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-white/30 text-[10px] tracking-widest uppercase mb-2">Total Semana</p>
            <h3 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">{formatCurrency(data.weekly.total)}</h3>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5">
            <span className="inline-block bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-1 rounded-sm text-[10px] uppercase tracking-widest font-bold border border-[#D4AF37]/20">
              Objetivo: {formatCurrency(data.weekly.goal)}
            </span>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-5 rounded-sm relative overflow-hidden group flex flex-col justify-between">
          <div className={`absolute top-0 right-0 p-3 rounded-bl-3xl transition-colors ${data.weekly.exceeded ? 'bg-green-500/5 group-hover:bg-green-500/10' : 'bg-orange-500/5 group-hover:bg-orange-500/10'}`}>
            {data.weekly.exceeded ? <TrendingUp size={14} className="text-green-400" /> : <Target size={14} className="text-orange-400" />}
          </div>
          <div>
            <p className="text-white/30 text-[10px] tracking-widest uppercase mb-2">Progreso Semanal</p>
            <h3 className={`text-3xl sm:text-4xl font-serif tracking-tight ${data.weekly.exceeded ? 'text-green-400' : weeklyPct >= 70 ? 'text-[#D4AF37]' : 'text-white'}`}>
              {weeklyPct}%
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5">
            <span className={`inline-block px-2 py-1 rounded-sm text-[10px] uppercase tracking-widest font-bold border ${data.weekly.exceeded ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-white/60 border-white/10'}`}>
              {data.weekly.exceeded
                ? `Superado: +${formatCurrency(data.weekly.total - data.weekly.goal)}`
                : `Faltan: ${formatCurrency(data.weekly.remaining)}`
              }
            </span>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-5 rounded-sm relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-3 bg-blue-500/5 rounded-bl-3xl group-hover:bg-blue-500/10 transition-colors">
            <TrendingUp size={14} className="text-blue-400" />
          </div>
          <div>
            <p className="text-white/30 text-[10px] tracking-widest uppercase mb-2">Total Mes</p>
            <h3 className="text-3xl sm:text-4xl font-serif text-white tracking-tight">{formatCurrency(data.monthly.total)}</h3>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
            <span className="inline-block bg-blue-500/10 text-blue-400 px-2 py-1 rounded-sm text-[10px] uppercase tracking-widest font-bold border border-blue-500/20">
              {monthlyPct}% 
            </span>
            <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold">
              de {formatCurrency(data.monthly.goal)}
            </span>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 p-5 rounded-sm relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-3 bg-purple-500/5 rounded-bl-3xl group-hover:bg-purple-500/10 transition-colors">
            <AlertTriangle size={14} className="text-purple-400" />
          </div>
          <div>
            <p className="text-white/30 text-[10px] tracking-widest uppercase mb-2">
              {data.weekly.daysRemaining > 0 ? 'Media Diaria Necesaria' : 'Resultado Semana'}
            </p>
            {data.weekly.daysRemaining > 0 ? (
              <h3 className="text-3xl sm:text-4xl tracking-tight font-serif text-white">{formatCurrency(data.weekly.dailyAvgNeeded)}</h3>
            ) : (
              <h3 className={`text-3xl sm:text-4xl tracking-tight font-serif ${data.weekly.exceeded ? 'text-green-400' : 'text-red-400'}`}>
                {data.weekly.exceeded ? '✓ Superado' : '✗ Fallido'}
              </h3>
            )}
          </div>
          
          {data.weekly.daysRemaining > 0 ? (
            <div className="flex flex-col gap-1.5 mt-4 pt-3 border-t border-white/5">
              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold bg-orange-500/5 text-orange-400 px-2.5 py-1.5 rounded-sm border border-orange-500/10">
                <span className="flex items-center gap-1.5"><Sun size={10} /> Mañana</span>
                <span className="text-orange-300 font-serif text-sm tracking-normal">{formatCurrency(data.weekly.dailyAvgNeededMorning)}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold bg-blue-500/5 text-blue-400 px-2.5 py-1.5 rounded-sm border border-blue-500/10">
                <span className="flex items-center gap-1.5"><Moon size={10} /> Noche</span>
                <span className="text-blue-300 font-serif text-sm tracking-normal">{formatCurrency(data.weekly.dailyAvgNeededEvening)}</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-3 border-t border-white/5">
              <span className={`inline-block px-2 py-1 rounded-sm text-[10px] uppercase tracking-widest font-bold border ${data.weekly.exceeded ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {data.weekly.exceeded
                  ? `+${((weeklyPct - 100)).toFixed(1)}% sobre objetivo`
                  : `${(100 - weeklyPct).toFixed(1)}% por debajo`
                }
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Progress Bar - Shift Specific */}
      <div className="bg-[#111111] border border-white/10 p-6 rounded-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5">
          <h3 className="text-xs font-serif uppercase tracking-widest text-white/40 flex items-center gap-2">
            <Target size={14} className="text-[#D4AF37]" /> Progreso Semanal
          </h3>
          <div className="flex items-center gap-3">
            <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-sm flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/60">
              <Sun size={12} className="text-orange-400" />
              <span>{formatCurrency(data.weekly.morning)}</span>
              <span className="text-white/20">/</span>
              <span className="text-orange-400/80">{formatCurrency(data.weekly.goalMorning)}</span>
            </div>
            <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-sm flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/60">
              <Moon size={12} className="text-blue-400" />
              <span>{formatCurrency(data.weekly.evening)}</span>
              <span className="text-white/20">/</span>
              <span className="text-blue-400/80">{formatCurrency(data.weekly.goalEvening)}</span>
            </div>
          </div>
        </div>
        
        {/* Total Progress Bar */}
        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(weeklyPct, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full relative ${
              data.weekly.exceeded
                ? 'bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                : weeklyPct >= 70
                  ? 'bg-gradient-to-r from-[#D4AF37]/60 to-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                  : 'bg-gradient-to-r from-orange-600/60 to-orange-400'
            }`}
          />
          <div className="absolute top-0 bottom-0 w-0.5 bg-white/40" style={{ left: '100%', transform: 'translateX(-1px)' }} />
        </div>
        
        {/* Mini split progress bars */}
        <div className="grid grid-cols-2 gap-6 mt-2 pt-4 border-t border-white/5">
          <div>
            <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-bold text-orange-400 mb-2">
              <span className="flex items-center gap-1.5"><Sun size={10}/> Mañana</span>
              <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-sm border border-orange-500/20">{Math.round((data.weekly.morning / data.weekly.goalMorning) * 100) || 0}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((data.weekly.morning / data.weekly.goalMorning) * 100 || 0, 100)}%` }}
                className="h-full bg-gradient-to-r from-orange-600/80 to-orange-400"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-bold text-blue-400 mb-2">
              <span className="flex items-center gap-1.5"><Moon size={10}/> Noche</span>
              <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-sm border border-blue-500/20">{Math.round((data.weekly.evening / data.weekly.goalEvening) * 100) || 0}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((data.weekly.evening / data.weekly.goalEvening) * 100 || 0, 100)}%` }}
                className="h-full bg-gradient-to-r from-blue-600/80 to-blue-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="bg-[#111111] border border-white/10 p-6 rounded-sm overflow-hidden">
        <h3 className="text-xs font-serif uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
          <Euro size={14} className="text-[#D4AF37]" /> Facturación Diaria
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {data.weekDays.map((day) => {
            const isTodayDay = isToday(day.date)
            const isPastDay = isPast(day.date)
            const dayPct = data.weekly.goal > 0 ? (day.total / (data.weekly.goal / 7)) * 100 : 0
            
            return (
              <div
                key={day.date}
                className={`rounded-sm border p-4 transition-all relative ${
                  isTodayDay
                    ? 'border-[#D4AF37]/40 bg-[#D4AF37]/5 shadow-[0_0_20px_rgba(212,175,55,0.05)]'
                    : isPastDay && day.total > 0
                      ? 'border-white/10 bg-white/[0.02]'
                      : 'border-white/5 bg-black/20'
                }`}
              >
                {isTodayDay && (
                  <div className="absolute top-1 right-1.5">
                    <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse" />
                  </div>
                )}
                
                {/* Day Header */}
                <div className="text-center mb-4 pb-3 border-b border-white/5">
                  <p className={`text-[10px] uppercase tracking-widest font-bold ${isTodayDay ? 'text-[#D4AF37]' : 'text-white/40'}`}>
                    {day.dayName.slice(0, 3)}
                  </p>
                  <p className="text-[9px] text-white/20 mt-0.5">{formatDate(day.date)}</p>
                </div>

                {/* Morning Input */}
                <div className="mb-3">
                  <label className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-orange-400/60 font-bold mb-1.5">
                    <Sun size={10} /> Mañana
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={editValues[`${day.date}-morning`] ?? (day.morning || '')}
                      onChange={e => setEditValues(prev => ({ ...prev, [`${day.date}-morning`]: e.target.value }))}
                      onBlur={e => {
                        const val = Number(e.target.value) || 0
                        if (val !== day.morning) handleSaveAmount(day.date, 'morning', val)
                        setEditValues(prev => {
                          const next = { ...prev }; delete next[`${day.date}-morning`]; return next
                        })
                      }}
                      onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                      placeholder="0"
                      className="w-full bg-black/40 border border-white/10 rounded-sm px-2 py-2 text-white text-sm text-right focus:border-orange-400/50 focus:bg-black/60 outline-none transition-all placeholder:text-white/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    {savingCell === `${day.date}-morning` && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Loader2 size={12} className="animate-spin text-orange-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Evening Input */}
                <div className="mb-4">
                  <label className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-blue-400/60 font-bold mb-1.5">
                    <Moon size={10} /> Noche
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={editValues[`${day.date}-evening`] ?? (day.evening || '')}
                      onChange={e => setEditValues(prev => ({ ...prev, [`${day.date}-evening`]: e.target.value }))}
                      onBlur={e => {
                        const val = Number(e.target.value) || 0
                        if (val !== day.evening) handleSaveAmount(day.date, 'evening', val)
                        setEditValues(prev => {
                          const next = { ...prev }; delete next[`${day.date}-evening`]; return next
                        })
                      }}
                      onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                      placeholder="0"
                      className="w-full bg-black/40 border border-white/10 rounded-sm px-2 py-2 text-white text-sm text-right focus:border-blue-400/50 focus:bg-black/60 outline-none transition-all placeholder:text-white/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    {savingCell === `${day.date}-evening` && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Loader2 size={12} className="animate-spin text-blue-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Day Total */}
                <div className="pt-3 border-t border-white/5 text-center bg-white/[0.01] -mx-4 -mb-4 px-4 pb-4 rounded-b-sm">
                  <p className={`text-sm font-serif font-bold ${day.total > 0 ? 'text-white' : 'text-white/10'}`}>
                    {day.total > 0 ? formatCurrency(day.total) : '—'}
                  </p>
                  {day.total > 0 && (
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2 max-w-[80%] mx-auto">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(dayPct, 100)}%` }}
                        className={`h-full rounded-full ${dayPct >= 100 ? 'bg-green-400' : dayPct >= 70 ? 'bg-[#D4AF37]' : 'bg-orange-400/60'}`}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Historical Performance Cards */}
      {data.history && (
        <div className="bg-[#111111] border border-white/10 p-6 rounded-sm">
          <h3 className="text-xs font-serif uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-400" /> Histórico de Rendimiento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Semana Pasada',
                total: data.history.lastWeek.total,
                goal: data.history.lastWeek.goal,
                percentage: data.history.lastWeek.percentage,
                color: 'from-blue-600/60 to-blue-400',
                text: 'Objetivo de personal'
              },
              {
                title: 'Mes Pasado',
                total: data.history.lastMonth.total,
                goal: data.history.lastMonth.goal,
                percentage: data.history.lastMonth.percentage,
                color: 'from-[#D4AF37]/60 to-[#D4AF37]',
                text: 'Objetivo mensual'
              },
              {
                title: 'Todo el Año',
                total: data.history.annual.total,
                goal: data.history.annual.goal,
                percentage: data.history.annual.percentage,
                color: 'from-green-600 to-green-400',
                text: 'Objetivo anual'
              }
            ].map((item, idx) => {
              const exceeded = item.total >= item.goal
              const diff = item.total - item.goal
              const formattedTotal = formatCurrency(item.total)
              const formattedGoal = formatCurrency(item.goal)
              
              return (
                <div key={idx} className="bg-black/40 border border-white/5 p-5 rounded-sm relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">{item.title}</p>
                      <h4 className="text-xl sm:text-2xl font-serif text-white mt-1">{formattedTotal}</h4>
                      <p className="text-[9px] text-white/30 mt-0.5">{item.text}: {formattedGoal}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-sm border ${
                        exceeded 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>

                  <p className={`text-[10px] font-bold uppercase tracking-widest ${exceeded ? 'text-green-400' : 'text-orange-400'}`}>
                    {exceeded 
                      ? `✓ Superado por: +${formatCurrency(diff)}` 
                      : `✗ Faltan: ${formatCurrency(Math.abs(diff))}`
                    }
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Planificación y Rendimiento de Personal */}
      {(() => {
        const scheduleTarget = calculateTarget()
        const scheduleReal = data.weekly.total
        const scheduleExceeded = scheduleReal >= scheduleTarget
        const scheduleDiff = scheduleReal - scheduleTarget
        const schedulePct = scheduleTarget > 0 ? Math.round((scheduleReal / scheduleTarget) * 1000) / 10 : 0

        return (
          <div className="bg-[#111111] border border-white/10 p-6 rounded-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-xs font-serif uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Users size={14} className="text-[#D4AF37]" /> Planificación y Rendimiento de Personal
                </h3>
                <p className="text-[10px] text-white/20 uppercase mt-0.5">Control automático de facturación por cuadrante de personal</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCopyFromPreviousWeek}
                  disabled={!data?.lastWeekSchedule || data.lastWeekSchedule.length === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-sm border border-blue-500/20 text-[9px] uppercase tracking-widest font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Copiar de Semana Anterior
                </button>
                <button
                  onClick={() => updateSchedule([])}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-sm border border-red-500/20 text-[9px] uppercase tracking-widest font-bold transition-all"
                >
                  Reiniciar Cuadrante
                </button>
              </div>
            </div>

            {/* Tarifas Editables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-sm">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-orange-400 font-bold">
                  <Sun size={12} /> Tarifas Turno Mañana
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Completo (8h):</span>
                    <div className="flex items-center bg-black/40 border border-white/10 px-2.5 py-1 rounded-sm w-20">
                      <input
                        type="number"
                        value={rateFullMorning}
                        onChange={e => setRateFullMorning(Number(e.target.value) || 0)}
                        onBlur={() => handleUpdateRates(rateFullMorning, rateExtraMorning, rateFullEvening, rateExtraEvening)}
                        onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        className="w-full bg-transparent border-none text-right text-xs text-white font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-white/20 text-xs ml-1 font-serif">€</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Extra:</span>
                    <div className="flex items-center bg-black/40 border border-white/10 px-2.5 py-1 rounded-sm w-20">
                      <input
                        type="number"
                        value={rateExtraMorning}
                        onChange={e => setRateExtraMorning(Number(e.target.value) || 0)}
                        onBlur={() => handleUpdateRates(rateFullMorning, rateExtraMorning, rateFullEvening, rateExtraEvening)}
                        onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        className="w-full bg-transparent border-none text-right text-xs text-white font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-white/20 text-xs ml-1 font-serif">€</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:border-l md:border-white/5 md:pl-4">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-blue-400 font-bold">
                  <Moon size={12} /> Tarifas Turno Noche
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Completo (8h):</span>
                    <div className="flex items-center bg-black/40 border border-white/10 px-2.5 py-1 rounded-sm w-20">
                      <input
                        type="number"
                        value={rateFullEvening}
                        onChange={e => setRateFullEvening(Number(e.target.value) || 0)}
                        onBlur={() => handleUpdateRates(rateFullMorning, rateExtraMorning, rateFullEvening, rateExtraEvening)}
                        onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        className="w-full bg-transparent border-none text-right text-xs text-white font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-white/20 text-xs ml-1 font-serif">€</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Extra:</span>
                    <div className="flex items-center bg-black/40 border border-white/10 px-2.5 py-1 rounded-sm w-20">
                      <input
                        type="number"
                        value={rateExtraEvening}
                        onChange={e => setRateExtraEvening(Number(e.target.value) || 0)}
                        onBlur={() => handleUpdateRates(rateFullMorning, rateExtraMorning, rateFullEvening, rateExtraEvening)}
                        onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        className="w-full bg-transparent border-none text-right text-xs text-white font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-white/20 text-xs ml-1 font-serif">€</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Horarios de Turnos de la Semana */}
            <div className="bg-white/[0.01] border border-white/5 p-3 rounded-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Configuración de Horarios de Turno por Día:</span>
                <button
                  onClick={() => setEditingShiftHoursDay(editingShiftHoursDay ? null : 'all')}
                  className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold hover:text-[#E8C84A] transition-colors"
                >
                  {editingShiftHoursDay === 'all' ? 'Ocultar Configuración ✕' : 'Editar Horarios de Turno ⚙️'}
                </button>
              </div>

              <AnimatePresence>
                {editingShiftHoursDay === 'all' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-3 border-t border-white/5">
                      {data.weekDays.map(day => {
                        const defaultDayHours = {
                          morning: { start: '08:00', end: '16:00' },
                          evening: { start: '16:00', end: '00:00' }
                        }
                        const dayHours = shiftHours[day.date] || defaultDayHours
                        return (
                          <div key={day.date} className="bg-black/30 border border-white/5 p-3 rounded-sm space-y-3">
                            <div className="text-[9px] uppercase tracking-widest font-bold text-[#D4AF37] border-b border-white/5 pb-1">
                              {day.dayName}
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[8px] uppercase tracking-widest text-orange-400 font-bold flex items-center gap-1">
                                ☀️ Mañana
                              </label>
                              <div className="flex gap-1 items-center">
                                <input
                                  type="time"
                                  value={dayHours.morning.start}
                                  onChange={e => handleUpdateShiftHours(day.date, 'morning', 'start', e.target.value)}
                                  className="bg-black/60 border border-white/10 rounded-sm text-[10px] text-white p-1 focus:border-orange-400 outline-none w-full font-mono"
                                />
                                <span className="text-white/20 text-[9px]">-</span>
                                <input
                                  type="time"
                                  value={dayHours.morning.end}
                                  onChange={e => handleUpdateShiftHours(day.date, 'morning', 'end', e.target.value)}
                                  className="bg-black/60 border border-white/10 rounded-sm text-[10px] text-white p-1 focus:border-orange-400 outline-none w-full font-mono"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8px] uppercase tracking-widest text-blue-400 font-bold flex items-center gap-1">
                                🌙 Noche
                              </label>
                              <div className="flex gap-1 items-center">
                                <input
                                  type="time"
                                  value={dayHours.evening.start}
                                  onChange={e => handleUpdateShiftHours(day.date, 'evening', 'start', e.target.value)}
                                  className="bg-black/60 border border-white/10 rounded-sm text-[10px] text-white p-1 focus:border-blue-400 outline-none w-full font-mono"
                                />
                                <span className="text-white/20 text-[9px]">-</span>
                                <input
                                  type="time"
                                  value={dayHours.evening.end}
                                  onChange={e => handleUpdateShiftHours(day.date, 'evening', 'end', e.target.value)}
                                  className="bg-black/60 border border-white/10 rounded-sm text-[10px] text-white p-1 focus:border-blue-400 outline-none w-full font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Planificación summary cards */}
            {(() => {
              const split = calculateScheduleSplit()
              const morningTargetVal = split.morning
              const eveningTargetVal = split.evening
              const morningRealVal = data.weekly.morning
              const eveningRealVal = data.weekly.evening
              
              const morningDiffVal = morningRealVal - morningTargetVal
              const eveningDiffVal = eveningRealVal - eveningTargetVal
              
              const morningExceeded = morningRealVal >= morningTargetVal
              const eveningExceeded = eveningRealVal >= eveningTargetVal

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-black/20 border border-white/5 p-4 rounded-sm flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Objetivo Personal (Debe facturar)</p>
                      <p className="text-xl font-serif text-white">{formatCurrency(scheduleTarget)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-[10px]">
                      <div className="text-orange-400 font-medium">☀️ M: <span className="text-white font-mono">{formatCurrency(morningTargetVal)}</span></div>
                      <div className="text-blue-400 font-medium">🌙 N: <span className="text-white font-mono">{formatCurrency(eveningTargetVal)}</span></div>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 border border-white/5 p-4 rounded-sm flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Facturado Real Semana</p>
                      <p className="text-xl font-serif text-white">{formatCurrency(scheduleReal)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-[10px]">
                      <div className="text-orange-400 font-medium">☀️ M: <span className="text-white font-mono">{formatCurrency(morningRealVal)}</span></div>
                      <div className="text-blue-400 font-medium">🌙 N: <span className="text-white font-mono">{formatCurrency(eveningRealVal)}</span></div>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 border border-white/5 p-4 rounded-sm flex flex-col justify-between space-y-2">
                    <div>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">
                        {scheduleExceeded ? 'Superado por' : 'Restante para objetivo'}
                      </p>
                      <p className={`text-xl font-serif ${scheduleExceeded ? 'text-green-400' : 'text-orange-400'}`}>
                        {scheduleExceeded 
                          ? `+${formatCurrency(scheduleDiff)}` 
                          : formatCurrency(Math.abs(scheduleDiff))
                        }
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-[9px] font-bold">
                      <div className={morningExceeded ? 'text-green-400' : 'text-orange-400'}>
                        ☀️ M: {morningExceeded ? `+${formatCurrency(morningDiffVal)}` : formatCurrency(morningDiffVal)}
                      </div>
                      <div className={eveningExceeded ? 'text-green-400' : 'text-orange-400'}>
                        🌙 N: {eveningExceeded ? `+${formatCurrency(eveningDiffVal)}` : formatCurrency(eveningDiffVal)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 border border-white/5 p-4 rounded-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center text-[9px] text-white/30 uppercase tracking-widest mb-1.5">
                      <span>Progreso</span>
                      <span className={`font-bold ${scheduleExceeded ? 'text-green-400' : 'text-[#D4AF37]'}`}>{schedulePct}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded-full ${scheduleExceeded ? 'bg-green-400' : 'bg-[#D4AF37]'}`}
                        style={{ width: `${Math.min(schedulePct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Cuadrante Table */}
            <div className="overflow-x-auto border border-white/5 rounded-sm bg-black/10">
              <table className="w-full border-collapse text-left text-xs text-white/80">
                <thead>
                  <tr className="bg-white/[0.02] text-white/40 uppercase tracking-widest text-[9px] border-b border-white/5">
                    <th className="p-3 font-bold">Empleado</th>
                    <th className="p-3 font-bold">Contrato</th>
                    {data.weekDays.map(day => {
                      const defaultDayHours = {
                        morning: { start: '08:00', end: '16:00' },
                        evening: { start: '16:00', end: '00:00' }
                      }
                      const dayHours = shiftHours[day.date] || defaultDayHours
                      return (
                        <th key={day.date} className="p-3 font-bold text-center min-w-[100px]">
                          <div>{day.dayName.slice(0, 3)}</div>
                          <div className="text-[7px] text-white/20 mt-0.5 tracking-normal lowercase">
                            ☀️{dayHours.morning.start.split(':')[0]}-{dayHours.morning.end.split(':')[0]}
                            {' | '}
                            🌙{dayHours.evening.start.split(':')[0]}-{dayHours.evening.end.split(':')[0]}
                          </div>
                        </th>
                      )
                    })}
                    <th className="p-3 font-bold text-center">Turnos</th>
                    <th className="p-3 font-bold text-right">Objetivo</th>
                    <th className="p-3 font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length > 0 ? (
                    employees.map((emp) => {
                      let shiftCount = 0
                      let targetCost = 0
                      const rMorning = emp.type === 'full' ? rateFullMorning : rateExtraMorning
                      const rEvening = emp.type === 'full' ? rateFullEvening : rateExtraEvening
                      
                      Object.entries(emp.shifts).forEach(([dateStr, s]) => {
                        const defaultDayHours = {
                          morning: { start: '08:00', end: '16:00' },
                          evening: { start: '16:00', end: '00:00' }
                        }
                        const dayHours = shiftHours[dateStr] || defaultDayHours

                        if (s.custom && s.customStart && s.customEnd) {
                          const start = s.customStart
                          const end = s.customEnd
                          const hours = calculateDurationHours(start, end)
                          const proportion = hours / 8
                          shiftCount += proportion

                          if (start === '20:00' && (end === '00:00' || end === '24:00')) {
                            targetCost += 180
                          } else if (start === '12:00' && end === '20:00') {
                            targetCost += 180
                          } else {
                            const s1 = parseToMin(start)
                            let e1 = parseToMin(end)
                            if (e1 < s1) e1 += 1440

                            const sm = parseToMin(dayHours.morning.start)
                            let em = parseToMin(dayHours.morning.end)
                            if (em < sm) em += 1440

                            const se = parseToMin(dayHours.evening.start)
                            let ee = parseToMin(dayHours.evening.end)
                            if (ee < se) ee += 1440

                            const morningOverlapHours = getFullOverlapMin(s1, e1, sm, em) / 60
                            const eveningOverlapHours = getFullOverlapMin(s1, e1, se, ee) / 60

                            targetCost += (morningOverlapHours / 8) * rMorning + (eveningOverlapHours / 8) * rEvening
                          }
                        }
                        
                        let dayCount = 0
                        if (s.morning) {
                          dayCount++
                          targetCost += rMorning
                        }
                        if (s.evening) {
                          dayCount++
                          targetCost += rEvening
                        }
                        shiftCount += dayCount
                      })

                      return (
                        <tr key={emp.id} className="hover:bg-white/[0.01] transition-colors border-b border-white/5">
                          <td className="p-3">
                            <input
                              type="text"
                              value={emp.name}
                              onChange={e => handleUpdateEmployee(emp.id, e.target.value, emp.type)}
                              placeholder="Nombre..."
                              className="bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-white text-xs focus:border-[#D4AF37] outline-none transition-all w-24 sm:w-32"
                            />
                          </td>
                          <td className="p-3">
                            <select
                              value={emp.type}
                              onChange={e => handleUpdateEmployee(emp.id, emp.name, e.target.value as 'full' | 'extra')}
                              className="bg-black/40 border border-white/10 rounded-sm px-2 py-1.5 text-white text-xs focus:border-[#D4AF37] outline-none transition-all"
                            >
                              <option value="full">Completo (8h)</option>
                              <option value="extra">Extra</option>
                            </select>
                          </td>
                          {data.weekDays.map(day => {
                            const dayShift = emp.shifts[day.date] || { morning: false, evening: false, custom: false, customStart: '12:00', customEnd: '20:00' }
                            const isCellEditing = editingCustomShift?.employeeId === emp.id && editingCustomShift?.date === day.date

                            return (
                              <td key={day.date} className="p-3 text-center relative">
                                <div className="flex flex-col justify-center items-center gap-1">
                                  <div className="flex gap-1 items-center">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleShift(emp.id, day.date, 'morning')}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] transition-all ${
                                        dayShift.morning 
                                          ? 'bg-orange-500/20 border-orange-500/40 text-orange-400 font-bold shadow-[0_0_8px_rgba(249,115,22,0.15)]' 
                                          : 'bg-white/5 border-white/10 text-white/25 hover:border-white/20 hover:text-white/50'
                                      }`}
                                      title="Turno Mañana (☀️)"
                                    >
                                      ☀️
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleShift(emp.id, day.date, 'evening')}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] transition-all ${
                                        dayShift.evening 
                                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 font-bold shadow-[0_0_8px_rgba(59,130,246,0.15)]' 
                                          : 'bg-white/5 border-white/10 text-white/25 hover:border-white/20 hover:text-white/50'
                                      }`}
                                      title="Turno Noche (🌙)"
                                    >
                                      🌙
                                    </button>
                                    {!dayShift.custom && (
                                      <button
                                        type="button"
                                        onClick={() => setEditingCustomShift({
                                          employeeId: emp.id,
                                          date: day.date,
                                          start: dayShift.customStart || '12:00',
                                          end: dayShift.customEnd || '20:00'
                                        })}
                                        className="w-5 h-5 rounded-sm flex items-center justify-center bg-white/5 border border-white/10 text-white/30 hover:text-white/80 hover:bg-white/10 transition-all text-[9px]"
                                        title="Establecer horario extra"
                                      >
                                        ➕
                                      </button>
                                    )}
                                  </div>
                                  
                                  {dayShift.custom && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingCustomShift({
                                        employeeId: emp.id,
                                        date: day.date,
                                        start: dayShift.customStart || '12:00',
                                        end: dayShift.customEnd || '20:00'
                                      })}
                                      className="px-1.5 py-0.5 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[9px] font-mono rounded-sm font-bold shadow-md hover:bg-[#D4AF37]/25 transition-all flex items-center gap-1"
                                      title="Click para editar horario extra"
                                    >
                                      🕒 {dayShift.customStart}-{dayShift.customEnd}
                                    </button>
                                  )}
                                </div>

                                {/* Custom Shift Popover */}
                                <AnimatePresence>
                                  {isCellEditing && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                      className="absolute left-1/2 -translate-x-1/2 mt-2 top-full w-52 bg-[#151515] border border-[#D4AF37]/30 rounded-sm shadow-2xl p-3 z-50 text-left space-y-3"
                                    >
                                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                        <span className="text-[9px] uppercase tracking-widest font-bold text-white/60">Horario Personal</span>
                                        <button 
                                          type="button"
                                          onClick={() => setEditingCustomShift(null)} 
                                          className="text-[9px] text-white/40 hover:text-white"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div>
                                          <label className="text-[8px] uppercase tracking-widest text-white/40 font-bold block mb-1">Entrada</label>
                                          <input
                                            type="time"
                                            value={editingCustomShift.start}
                                            onChange={e => setEditingCustomShift(prev => prev ? { ...prev, start: e.target.value } : null)}
                                            className="w-full bg-black/40 border border-white/10 rounded-sm text-xs text-white p-1.5 focus:border-[#D4AF37] outline-none"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[8px] uppercase tracking-widest text-white/40 font-bold block mb-1">Salida</label>
                                          <input
                                            type="time"
                                            value={editingCustomShift.end}
                                            onChange={e => setEditingCustomShift(prev => prev ? { ...prev, end: e.target.value } : null)}
                                            className="w-full bg-black/40 border border-white/10 rounded-sm text-xs text-white p-1.5 focus:border-[#D4AF37] outline-none"
                                          />
                                        </div>
                                      </div>

                                      {/* Preset Shortcuts */}
                                      <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                                        <label className="text-[8px] uppercase tracking-widest text-white/40 font-bold block">Accesos Rápidos</label>
                                        <div className="flex flex-col gap-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleSetDiaEntero(emp.id, day.date)
                                              setEditingCustomShift(null)
                                            }}
                                            className="w-full bg-white/5 hover:bg-white/10 text-white text-[9px] py-1 px-1.5 rounded-sm transition-all text-left flex justify-between items-center"
                                          >
                                            <span>☀️ + 🌙 Día Entero</span>
                                            <span className="text-white/30 text-[8px] font-mono">16h</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingCustomShift(prev => prev ? { ...prev, start: '12:00', end: '20:00' } : null)
                                            }}
                                            className="w-full bg-white/5 hover:bg-white/10 text-white text-[9px] py-1 px-1.5 rounded-sm transition-all text-left flex justify-between items-center"
                                          >
                                            <span>🕒 12:00 - 20:00</span>
                                            <span className="text-white/30 text-[8px] font-mono">€180</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingCustomShift(prev => prev ? { ...prev, start: '20:00', end: '00:00' } : null)
                                            }}
                                            className="w-full bg-white/5 hover:bg-white/10 text-white text-[9px] py-1 px-1.5 rounded-sm transition-all text-left flex justify-between items-center"
                                          >
                                            <span>🕒 20:00 - 00:00</span>
                                            <span className="text-white/30 text-[8px] font-mono">€180</span>
                                          </button>
                                        </div>
                                      </div>

                                      <div className="flex gap-1.5 pt-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleSaveCustomShift(emp.id, day.date, editingCustomShift.start, editingCustomShift.end)
                                            setEditingCustomShift(null)
                                          }}
                                          className="flex-1 bg-[#D4AF37] hover:bg-[#E8C84A] text-black text-[9px] uppercase font-bold py-1.5 rounded-sm transition-all text-center"
                                        >
                                          Aplicar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleClearCustomShift(emp.id, day.date)
                                            setEditingCustomShift(null)
                                          }}
                                          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-[9px] uppercase font-bold px-2 py-1.5 rounded-sm transition-all text-center"
                                          title="Volver a turnos estándar"
                                        >
                                          Quitar
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </td>
                            )
                          })}
                          <td className="p-3 text-center font-bold">{Math.round(shiftCount * 10) / 10}</td>
                          <td className="p-3 text-right font-serif font-bold">{formatCurrency(targetCost)}</td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteEmployee(emp.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-sm transition-all"
                              title="Eliminar"
                            >
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-white/20 uppercase tracking-[0.2em]">
                        No hay empleados planificados para esta semana
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Entrada Rápida de Empleado */}
            <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-white/5">
              <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  id="quick-add-name-input"
                  type="text"
                  value={quickName}
                  onChange={e => setQuickName(e.target.value)}
                  placeholder="Añadir rápido: escribe el nombre del empleado..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-sm px-4 py-2.5 text-white text-xs focus:border-[#D4AF37] outline-none transition-all"
                />
                <select
                  value={quickType}
                  onChange={e => setQuickType(e.target.value as 'full' | 'extra')}
                  className="bg-black/40 border border-white/10 rounded-sm px-3 py-2.5 text-white text-xs focus:border-[#D4AF37] outline-none transition-all sm:w-48"
                >
                  <option value="full">Completo (8h)</option>
                  <option value="extra">Extra</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-[#D4AF37] hover:bg-[#E8C84A] text-black px-6 py-2.5 rounded-sm text-[10px] uppercase font-bold tracking-[0.2em] transition-all whitespace-nowrap shadow-lg shadow-[#D4AF37]/5"
              >
                + Añadir (Enter)
              </button>
              {savingSchedule && (
                <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-bold animate-pulse pl-2">
                  <Loader2 size={12} className="animate-spin" /> Guardando...
                </div>
              )}
            </form>
          </div>
        )
      })()}

      {/* Monthly Overview */}
      <div className="bg-[#111111] border border-white/10 p-6 rounded-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-serif uppercase tracking-widest text-white/40 flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-400" /> Resumen Mensual — <span className="capitalize text-white/60">{monthLabel}</span>
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-black/20 border border-white/5 p-4 rounded-sm">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Total Facturado</p>
            <p className="text-xl font-serif text-white">{formatCurrency(data.monthly.total)}</p>
          </div>
          <div className="bg-black/20 border border-white/5 p-4 rounded-sm">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Objetivo Mensual</p>
            <p className="text-xl font-serif text-white">{formatCurrency(data.monthly.goal)}</p>
          </div>
          <div className="bg-black/20 border border-white/5 p-4 rounded-sm">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
              {data.monthly.total >= data.monthly.goal ? 'Superado por' : 'Restante'}
            </p>
            <p className={`text-xl font-serif ${data.monthly.total >= data.monthly.goal ? 'text-green-400' : 'text-orange-400'}`}>
              {data.monthly.total >= data.monthly.goal
                ? `+${formatCurrency(data.monthly.total - data.monthly.goal)}`
                : formatCurrency(data.monthly.remaining)
              }
            </p>
          </div>
        </div>

        {/* Monthly Progress Bar */}
        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(monthlyPct, 100)}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              monthlyPct >= 100
                ? 'bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                : 'bg-gradient-to-r from-blue-600/60 to-blue-400'
            }`}
          />
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111111] border border-[#D4AF37]/30 rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-[#D4AF37]/10"
            >
              <div className="sticky top-0 bg-[#111111]/95 backdrop-blur-md p-6 border-b border-white/5 flex justify-between items-center z-10">
                <h2 className="font-serif text-2xl text-white flex items-center gap-3">
                  <Target className="text-[#D4AF37]" size={24} />
                  Configurar Presupuestos
                </h2>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-sm transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Mode Selector */}
                <div className="flex bg-black/40 p-1 rounded-sm border border-white/5">
                  <button
                    onClick={() => setConfigMode('global')}
                    className={`flex-1 py-3 text-[10px] uppercase tracking-[0.2em] font-bold rounded-sm flex items-center justify-center gap-2 transition-all ${
                      configMode === 'global' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Globe size={14} /> Global (Por Defecto)
                  </button>
                  <button
                    onClick={() => setConfigMode('specific')}
                    className={`flex-1 py-3 text-[10px] uppercase tracking-[0.2em] font-bold rounded-sm flex items-center justify-center gap-2 transition-all ${
                      configMode === 'specific' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Calendar size={14} /> Mes Específico
                  </button>
                </div>

                {configMode === 'specific' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block">
                      Seleccionar Mes y Año
                    </label>
                    <input
                      type="month"
                      value={configMonthYear}
                      onChange={e => setConfigMonthYear(e.target.value)}
                      className="w-full bg-black/40 border border-blue-500/30 rounded-sm px-4 py-3 text-white text-sm focus:border-blue-400 outline-none transition-all"
                    />
                    <p className="text-[10px] text-blue-400/60 mt-1 flex items-center gap-1">
                      <Info size={12} /> Este presupuesto sobreescribirá al global durante el mes seleccionado.
                    </p>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Morning Column */}
                  <div className="space-y-6 bg-black/20 p-6 rounded-sm border border-orange-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 bg-orange-500/5 rounded-bl-full" />
                    <h3 className="text-orange-400 font-serif text-lg flex items-center gap-2 border-b border-orange-500/20 pb-3">
                      <Sun size={20} /> Turno de Mañana
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-2">
                          Objetivo Semanal (Mañana)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">€</span>
                          <input
                            type="number"
                            step="0.01"
                            value={goalInputs.wMorning}
                            onChange={e => setGoalInputs(prev => ({ ...prev, wMorning: Number(e.target.value) }))}
                            className="w-full bg-black/40 border border-white/10 rounded-sm pl-8 pr-4 py-3 text-white text-lg focus:border-orange-400/50 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-2">
                          Objetivo Mensual (Mañana)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">€</span>
                          <input
                            type="number"
                            step="0.01"
                            value={goalInputs.mMorning}
                            onChange={e => setGoalInputs(prev => ({ ...prev, mMorning: Number(e.target.value) }))}
                            className="w-full bg-black/40 border border-white/10 rounded-sm pl-8 pr-4 py-3 text-white text-lg focus:border-orange-400/50 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Evening Column */}
                  <div className="space-y-6 bg-black/20 p-6 rounded-sm border border-blue-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 bg-blue-500/5 rounded-bl-full" />
                    <h3 className="text-blue-400 font-serif text-lg flex items-center gap-2 border-b border-blue-500/20 pb-3">
                      <Moon size={20} /> Turno de Noche
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-2">
                          Objetivo Semanal (Noche)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">€</span>
                          <input
                            type="number"
                            step="0.01"
                            value={goalInputs.wEvening}
                            onChange={e => setGoalInputs(prev => ({ ...prev, wEvening: Number(e.target.value) }))}
                            className="w-full bg-black/40 border border-white/10 rounded-sm pl-8 pr-4 py-3 text-white text-lg focus:border-blue-400/50 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-2">
                          Objetivo Mensual (Noche)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20">€</span>
                          <input
                            type="number"
                            step="0.01"
                            value={goalInputs.mEvening}
                            onChange={e => setGoalInputs(prev => ({ ...prev, mEvening: Number(e.target.value) }))}
                            className="w-full bg-black/40 border border-white/10 rounded-sm pl-8 pr-4 py-3 text-white text-lg focus:border-blue-400/50 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-4 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Resumen de Objetivos Calculados</p>
                    <p className="text-white/60 text-xs mt-1">Este es el total que verás en las gráficas generales.</p>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total Semanal</p>
                      <p className="font-serif text-xl text-white">{formatCurrency(goalInputs.wMorning + goalInputs.wEvening)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total Mensual</p>
                      <p className="font-serif text-xl text-white">{formatCurrency(goalInputs.mMorning + goalInputs.mEvening)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end gap-4">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-white/60 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveGoals}
                  disabled={savingGoals || (configMode === 'specific' && !configMonthYear)}
                  className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E8C84A] text-black px-8 py-3 rounded-sm text-[10px] uppercase tracking-[0.2em] font-bold transition-all disabled:opacity-50"
                >
                  {savingGoals ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Guardar Presupuestos
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Annual Summary Modal */}
      <AnimatePresence>
        {showAnnualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111111] border border-blue-500/30 rounded-sm w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-blue-500/10"
            >
              <div className="sticky top-0 bg-[#111111]/95 backdrop-blur-md p-6 border-b border-white/5 flex justify-between items-center z-10">
                <div className="flex items-center gap-6">
                  <h2 className="font-serif text-2xl text-white flex items-center gap-3">
                    <Calendar className="text-blue-400" size={24} />
                    Balance Anual
                  </h2>
                  <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-sm px-2 py-1">
                    <button 
                      onClick={() => setAnnualYear(String(Number(annualYear) - 1))}
                      className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-sm transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-lg font-bold font-serif text-[#D4AF37]">{annualYear}</span>
                    <button 
                      onClick={() => setAnnualYear(String(Number(annualYear) + 1))}
                      className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-sm transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnnualModal(false)}
                  className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-sm transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                {annualLoading || !annualData ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 size={32} className="animate-spin text-blue-400" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Year Total Card */}
                    <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-1">Rendimiento Global del Año</p>
                        <h3 className="text-3xl font-serif text-white">{formatCurrency(annualData.annual.totalBilled)}</h3>
                        <p className="text-sm text-white/40 mt-1">de {formatCurrency(annualData.annual.totalGoal)} previsto</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center p-4 rounded-full ${annualData.annual.totalBilled >= annualData.annual.totalGoal ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                          {annualData.annual.totalBilled >= annualData.annual.totalGoal ? (
                            <TrendingUp size={24} className="text-green-400" />
                          ) : (
                            <TrendingDown size={24} className="text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className={`text-xl font-bold ${annualData.annual.totalBilled >= annualData.annual.totalGoal ? 'text-green-400' : 'text-red-400'}`}>
                            {annualData.annual.totalBilled >= annualData.annual.totalGoal ? '+' : ''}{annualData.annual.percentage.toFixed(1)}%
                          </p>
                          <p className="text-[10px] uppercase tracking-widest text-white/30">
                            {annualData.annual.totalBilled >= annualData.annual.totalGoal ? 'Superado' : 'Por debajo'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 12 Months Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {annualData.months.map((month) => {
                        const monthName = new Date(`${month.monthPrefix}-02T12:00:00`).toLocaleDateString('es-ES', { month: 'long' })
                        const isPositive = month.billed >= month.goal
                        const isZero = month.billed === 0 && month.goal > 0
                        
                        return (
                          <div key={month.monthPrefix} className="bg-black/40 border border-white/5 rounded-sm p-5 relative overflow-hidden group hover:bg-black/60 transition-colors">
                            <h4 className="text-sm font-serif uppercase tracking-widest text-white mb-4 flex justify-between items-center">
                              {monthName}
                              <span className={`text-[9px] px-2 py-0.5 rounded-sm border ${
                                isPositive 
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                  : isZero
                                    ? 'bg-white/5 text-white/40 border-white/10'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {isPositive && !isZero ? '+' : ''}{isZero ? '=' : ''}{month.percentage.toFixed(1)}%
                              </span>
                            </h4>
                            
                            <div className="space-y-3">
                              <div>
                                <p className="text-[9px] uppercase tracking-widest text-green-400/80 mb-1 flex items-center gap-1">
                                  <Target size={10} /> Previsto
                                </p>
                                <p className="text-white/60 font-serif">{formatCurrency(month.goal)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] uppercase tracking-widest text-[#D4AF37]/90 mb-1 flex items-center gap-1">
                                  <Euro size={10} /> Facturado
                                </p>
                                <p className="text-white font-serif text-lg">{formatCurrency(month.billed)}</p>
                              </div>
                            </div>
                            
                            {/* Progress bar inside month */}
                            <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(month.percentage, 100)}%` }}
                                className={`h-full ${isPositive ? 'bg-green-400' : 'bg-[#D4AF37]'}`}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
