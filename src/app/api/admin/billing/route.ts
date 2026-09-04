import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface ScheduledEmployee {
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

interface WeeklyScheduleObject {
  employees?: ScheduledEmployee[]
  rateFull?: number
  rateExtra?: number
  rateFullMorning?: number
  rateExtraMorning?: number
  rateFullEvening?: number
  rateExtraEvening?: number
  shiftHours?: Record<string, { morning: { start: string; end: string }; evening: { start: string; end: string } }>
}


// Helper: Get current date parts in Europe/Madrid timezone
function getMadridToday() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  // en-CA format is YYYY-MM-DD
  const parts = formatter.formatToParts(now)
  const year = parseInt(parts.find(p => p.type === 'year')!.value)
  const month = parseInt(parts.find(p => p.type === 'month')!.value)
  const day = parseInt(parts.find(p => p.type === 'day')!.value)
  return { year, month, day }
}

const toDateStr = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper: Get Monday of a given week offset (0 = current, -1 = last week, etc.)
function getWeekRange(weekOffset: number = 0) {
  const { year, month, day } = getMadridToday()
  const today = new Date(year, month - 1, day)
  
  const dayOfWeek = today.getDay()
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  
  const monday = new Date(today)
  monday.setDate(today.getDate() - diffToMonday + (weekOffset * 7))
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  
  return {
    mondayStr: toDateStr(monday),
    sundayStr: toDateStr(sunday),
    monday,
    sunday
  }
}

// Helper: Get month range
function getMonthRange(monthOffset: number = 0) {
  const { year, month } = getMadridToday()
  
  const firstDay = new Date(year, month - 1 + monthOffset, 1)
  const lastDay = new Date(year, month - 1 + monthOffset + 1, 0)
  
  return {
    firstStr: toDateStr(firstDay),
    lastStr: toDateStr(lastDay),
    firstDay,
    lastDay
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const weekOffset = parseInt(searchParams.get('weekOffset') || '0')
    const supabaseAdmin = createAdminClient()
    
    // Get week range
    const { mondayStr, sundayStr } = getWeekRange(weekOffset)
    
    // Get last week range
    const mondayDate = new Date(mondayStr + 'T12:00:00')
    const lastMonday = new Date(mondayDate)
    lastMonday.setDate(lastMonday.getDate() - 7)
    const lastSunday = new Date(lastMonday)
    lastSunday.setDate(lastMonday.getDate() + 6)
    const lastMondayStr = toDateStr(lastMonday)
    const lastSundayStr = toDateStr(lastSunday)
    
    // Get current month range (based on the monday of the selected week)
    const monthOffset = (mondayDate.getFullYear() - new Date().getFullYear()) * 12 
      + (mondayDate.getMonth() - new Date().getMonth())
    const { firstStr: monthFirstStr, lastStr: monthLastStr } = getMonthRange(monthOffset)

    // Get last month range
    const lastMonthDate = new Date(mondayDate.getFullYear(), mondayDate.getMonth() - 1, 1)
    const lastMonthEnd = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), 0)
    const lastMonthFirstStr = toDateStr(lastMonthDate)
    const lastMonthLastStr = toDateStr(lastMonthEnd)

    // Get annual range
    const yearStr = String(mondayDate.getFullYear())
    const yearFirstStr = `${yearStr}-01-01`
    const yearLastStr = `${yearStr}-12-31`
    
    // Fetch weekly billing data
    const { data: weeklyData, error: weekError } = await supabaseAdmin
      .from('daily_billing')
      .select('*')
      .gte('date', mondayStr)
      .lte('date', sundayStr)
      .order('date', { ascending: true })
    
    if (weekError) throw weekError

    // Fetch last weekly billing data
    const { data: lastWeeklyData } = await supabaseAdmin
      .from('daily_billing')
      .select('*')
      .gte('date', lastMondayStr)
      .lte('date', lastSundayStr)
    
    // Fetch monthly billing data
    const { data: monthlyData, error: monthError } = await supabaseAdmin
      .from('daily_billing')
      .select('date, shift, amount')
      .gte('date', monthFirstStr)
      .lte('date', monthLastStr)
      .order('date', { ascending: true })
    
    if (monthError) throw monthError

    // Fetch last monthly billing data
    const { data: lastMonthlyData } = await supabaseAdmin
      .from('daily_billing')
      .select('amount')
      .gte('date', lastMonthFirstStr)
      .lte('date', lastMonthLastStr)

    // Fetch annual billing data
    const { data: annualBillingData } = await supabaseAdmin
      .from('daily_billing')
      .select('amount')
      .gte('date', yearFirstStr)
      .lte('date', yearLastStr)
    
    const monthYearStr = mondayStr.substring(0, 7) // 'YYYY-MM'
    
    // Fetch settings for the specific month
    const { data: fetchedSettings, error: settingsError } = await supabaseAdmin
      .from('billing_settings')
      .select('*')
      .eq('month_year', monthYearStr)
      .maybeSingle()
    
    if (settingsError) throw settingsError
    
    let settings = fetchedSettings
    
    // Fallback to global settings if specific month not found
    if (!settings) {
      const { data: defaultSettings, error: defaultError } = await supabaseAdmin
        .from('billing_settings')
        .select('*')
        .is('month_year', null)
        .maybeSingle()
        
      if (defaultError) throw defaultError
      settings = defaultSettings
    }

    // Fetch settings for last month
    const lastMonthYearStr = lastMonthFirstStr.substring(0, 7)
    let { data: lastMonthSettings } = await supabaseAdmin
      .from('billing_settings')
      .select('*')
      .eq('month_year', lastMonthYearStr)
      .maybeSingle()
    
    if (!lastMonthSettings) {
      lastMonthSettings = settings
    }

    // Fetch settings for all months of the current year (to calculate annual goal)
    const { data: yearSettings } = await supabaseAdmin
      .from('billing_settings')
      .select('*')
      .like('month_year', `${yearStr}-%`)
    
    // Load weekly schedules (current and last week)
    let schedule: WeeklyScheduleObject | null = null
    let lastWeekScheduleData = []
    let hasCurrentSchedule = false
    
    try {
      const { data: currentSched } = await supabaseAdmin
        .from('billing_weekly_schedules')
        .select('schedule_data')
        .eq('week_monday', mondayStr)
        .maybeSingle()
      if (currentSched?.schedule_data) {
        schedule = currentSched.schedule_data as WeeklyScheduleObject
        hasCurrentSchedule = true
      }
    } catch (err) {
      console.warn('billing_weekly_schedules table might not exist yet:', err)
    }

    if (!hasCurrentSchedule) {
      try {
        const { data: recentSched } = await supabaseAdmin
          .from('billing_weekly_schedules')
          .select('schedule_data')
          .lt('week_monday', mondayStr)
          .order('week_monday', { ascending: false })
          .limit(1)
          .maybeSingle()
        
        if (recentSched?.schedule_data) {
          const recentData = recentSched.schedule_data as WeeklyScheduleObject
          // Pre-populate with recent employees but clear their shifts
          const prePopulatedEmployees = (recentData.employees || []).map(emp => ({
            id: emp.id,
            name: emp.name,
            type: emp.type,
            shifts: {}
          }))
          
          schedule = {
            ...recentData,
            employees: prePopulatedEmployees
          }
        }
      } catch (err) {
        console.warn('Error fetching recent schedule fallback:', err)
      }
    }
    
    try {
      const { data: lastWeekSched } = await supabaseAdmin
        .from('billing_weekly_schedules')
        .select('schedule_data')
        .eq('week_monday', lastMondayStr)
        .maybeSingle()
      if (lastWeekSched?.schedule_data) {
        lastWeekScheduleData = lastWeekSched.schedule_data
      }
    } catch (err) {
      console.warn('billing_weekly_schedules table might not exist yet:', err)
    }

    let currentEmployeesList: ScheduledEmployee[] = []
    let rateFull = 360
    let extraRate = 180 // avoid naming conflicts
    let rateFullMorning = 360
    let rateExtraMorning = 180
    let rateFullEvening = 360
    let rateExtraEvening = 180
    let shiftHours: Record<string, { morning: { start: string; end: string }; evening: { start: string; end: string } }> = {}

    const parseRate = (val: unknown, fallback: unknown, def: number) => {
      if (val !== undefined && val !== null && !isNaN(Number(val))) return Number(val)
      if (fallback !== undefined && fallback !== null && !isNaN(Number(fallback))) return Number(fallback)
      return def
    }

    if (schedule && !Array.isArray(schedule) && typeof schedule === 'object') {
      const scheduleObj = schedule as WeeklyScheduleObject
      currentEmployeesList = scheduleObj.employees || []
      rateFull = Number(scheduleObj.rateFull) || 360
      extraRate = Number(scheduleObj.rateExtra) || 180
      rateFullMorning = parseRate(scheduleObj.rateFullMorning, scheduleObj.rateFull, 360)
      rateExtraMorning = parseRate(scheduleObj.rateExtraMorning, scheduleObj.rateExtra, 180)
      rateFullEvening = parseRate(scheduleObj.rateFullEvening, scheduleObj.rateFull, 360)
      rateExtraEvening = parseRate(scheduleObj.rateExtraEvening, scheduleObj.rateExtra, 180)
      shiftHours = scheduleObj.shiftHours || {}
    } else if (Array.isArray(schedule)) {
      currentEmployeesList = schedule as ScheduledEmployee[]
    }

    let lastEmployeesList: ScheduledEmployee[] = []
    let lastRateFullMorning = 360
    let lastRateExtraMorning = 180
    let lastRateFullEvening = 360
    let lastRateExtraEvening = 180
    let lastShiftHours: Record<string, { morning: { start: string; end: string }; evening: { start: string; end: string } }> = {}
    if (lastWeekScheduleData && !Array.isArray(lastWeekScheduleData) && typeof lastWeekScheduleData === 'object') {
      const lastSchedObj = lastWeekScheduleData as WeeklyScheduleObject
      lastEmployeesList = lastSchedObj.employees || []
      lastRateFullMorning = parseRate(lastSchedObj.rateFullMorning, lastSchedObj.rateFull, 360)
      lastRateExtraMorning = parseRate(lastSchedObj.rateExtraMorning, lastSchedObj.rateExtra, 180)
      lastRateFullEvening = parseRate(lastSchedObj.rateFullEvening, lastSchedObj.rateFull, 360)
      lastRateExtraEvening = parseRate(lastSchedObj.rateExtraEvening, lastSchedObj.rateExtra, 180)
      lastShiftHours = lastSchedObj.shiftHours || {}
    } else if (Array.isArray(lastWeekScheduleData)) {
      lastEmployeesList = lastWeekScheduleData as ScheduledEmployee[]
    }

    const calculateScheduleSplit = (
      employeesList: ScheduledEmployee[],
      rfMorning: number,
      reMorning: number,
      rfEvening: number,
      reEvening: number,
      sHours: Record<string, { morning: { start: string; end: string }; evening: { start: string; end: string } }>
    ) => {
      let morningTotal = 0
      let eveningTotal = 0

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

      employeesList.forEach(emp => {
        const rMorning = emp.type === 'full' ? rfMorning : reMorning
        const rEvening = emp.type === 'full' ? rfEvening : reEvening
        
        if (emp.shifts && typeof emp.shifts === 'object') {
          Object.entries(emp.shifts).forEach(([dateStr, s]) => {
            if (!s || typeof s !== 'object') return

            const defaultDayHours = {
              morning: { start: '08:00', end: '16:00' },
              evening: { start: '16:00', end: '00:00' }
            }
            const dayHours = sHours[dateStr] || defaultDayHours

            if (s.morning) morningTotal += rMorning
            if (s.evening) eveningTotal += rEvening

            const customShift = s
            if (customShift.custom && customShift.customStart && customShift.customEnd) {
              const start = customShift.customStart
              const end = customShift.customEnd
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
          })
        }
      })

      return { morning: morningTotal, evening: eveningTotal }
    }

    const calculateScheduleTarget = (
      employeesList: ScheduledEmployee[],
      rfMorning: number,
      reMorning: number,
      rfEvening: number,
      reEvening: number,
      sHours: Record<string, { morning: { start: string; end: string }; evening: { start: string; end: string } }>
    ) => {
      const split = calculateScheduleSplit(employeesList, rfMorning, reMorning, rfEvening, reEvening, sHours)
      return split.morning + split.evening
    }
    
    // Calculate current week schedule targets (split by shift)
    const currentWeekSplit = calculateScheduleSplit(currentEmployeesList, rateFullMorning, rateExtraMorning, rateFullEvening, rateExtraEvening, shiftHours)

    // Calculate monthly total
    const monthlyTotal = (monthlyData || []).reduce((sum, entry) => sum + Number(entry.amount), 0)
    const monthlyMorning = (monthlyData || []).filter(e => e.shift === 'morning').reduce((sum, e) => sum + Number(e.amount), 0)
    const monthlyEvening = (monthlyData || []).filter(e => e.shift === 'evening').reduce((sum, e) => sum + Number(e.amount), 0)
    
    // Build day-by-day data for the week
    const daysArr = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    const weekDays = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayStr)
      date.setDate(date.getDate() + i)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      
      const morningEntry = (weeklyData || []).find(e => e.date === dateStr && e.shift === 'morning')
      const eveningEntry = (weeklyData || []).find(e => e.date === dateStr && e.shift === 'evening')
      
      weekDays.push({
        date: dateStr,
        dayName: daysArr[i],
        morning: morningEntry ? Number(morningEntry.amount) : 0,
        evening: eveningEntry ? Number(eveningEntry.amount) : 0,
        total: (morningEntry ? Number(morningEntry.amount) : 0) + (eveningEntry ? Number(eveningEntry.amount) : 0)
      })
    }
    
    const weeklyTotal = weekDays.reduce((sum, d) => sum + d.total, 0)
    const weeklyMorning = weekDays.reduce((sum, d) => sum + d.morning, 0)
    const weeklyEvening = weekDays.reduce((sum, d) => sum + d.evening, 0)
    
    // Determine how many days have passed in the week
    const { year: currentYear, month: currentMonth, day: currentDay } = getMadridToday()
    const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`
    
    const daysWithData = weekDays.filter(d => d.total > 0).length
    const daysRemaining = weekDays.filter(d => d.date > todayStr).length
    
    const wGoalMorning = settings?.weekly_goal_morning ?? 6000
    const wGoalEvening = settings?.weekly_goal_evening ?? 6000
    const wGoalTotal = wGoalMorning + wGoalEvening
    
    const mGoalMorning = settings?.monthly_goal_morning ?? 25000
    const mGoalEvening = settings?.monthly_goal_evening ?? 25000
    const mGoalTotal = mGoalMorning + mGoalEvening

    // Calculate historicals
    const lastWeekTotal = (lastWeeklyData || []).reduce((sum, e) => sum + Number(e.amount), 0)
    const lastWeekGoal = calculateScheduleTarget(lastEmployeesList, lastRateFullMorning, lastRateExtraMorning, lastRateFullEvening, lastRateExtraEvening, lastShiftHours) || wGoalTotal

    const lastMonthTotal = (lastMonthlyData || []).reduce((sum, e) => sum + Number(e.amount), 0)
    const lmGoalTotal = (lastMonthSettings?.monthly_goal_morning ?? 25000) + (lastMonthSettings?.monthly_goal_evening ?? 25000)
    const lastMonthGoal = lmGoalTotal

    const annualTotal = (annualBillingData || []).reduce((sum, e) => sum + Number(e.amount), 0)
    
    const defaultMonthlyGoal = (settings?.monthly_goal_morning ?? 25000) + (settings?.monthly_goal_evening ?? 25000)
    let annualGoal = 0
    for (let m = 1; m <= 12; m++) {
      const mStr = `${yearStr}-${String(m).padStart(2, '0')}`
      const specificSetting = (yearSettings || []).find(s => s.month_year === mStr)
      if (specificSetting) {
        annualGoal += (specificSetting.monthly_goal_morning ?? 25000) + (specificSetting.monthly_goal_evening ?? 25000)
      } else {
        annualGoal += defaultMonthlyGoal
      }
    }

    return NextResponse.json({
      weekRange: { monday: mondayStr, sunday: sundayStr },
      monthRange: { first: monthFirstStr, last: monthLastStr },
      weekDays,
      schedule: currentEmployeesList,
      rateFull,
      rateExtra: extraRate,
      rateFullMorning,
      rateExtraMorning,
      rateFullEvening,
      rateExtraEvening,
      shiftHours,
      scheduleTargetMorning: currentWeekSplit.morning,
      scheduleTargetEvening: currentWeekSplit.evening,
      lastWeekSchedule: lastEmployeesList,
      history: {
        lastWeek: {
          total: lastWeekTotal,
          goal: lastWeekGoal,
          percentage: lastWeekGoal ? Math.round((lastWeekTotal / lastWeekGoal) * 1000) / 10 : 0
        },
        lastMonth: {
          total: lastMonthTotal,
          goal: lastMonthGoal,
          percentage: lastMonthGoal ? Math.round((lastMonthTotal / lastMonthGoal) * 1000) / 10 : 0
        },
        annual: {
          total: annualTotal,
          goal: annualGoal,
          percentage: annualGoal ? Math.round((annualTotal / annualGoal) * 1000) / 10 : 0
        }
      },
      weekly: {
        total: weeklyTotal,
        morning: weeklyMorning,
        evening: weeklyEvening,
        goal: wGoalTotal,
        goalMorning: wGoalMorning,
        goalEvening: wGoalEvening,
        percentage: wGoalTotal ? Math.round((weeklyTotal / wGoalTotal) * 1000) / 10 : 0,
        remaining: Math.max(0, wGoalTotal - weeklyTotal),
        exceeded: weeklyTotal > wGoalTotal,
        daysWithData,
        daysRemaining,
        dailyAvgNeeded: daysRemaining > 0 ? Math.max(0, (wGoalTotal - weeklyTotal) / daysRemaining) : 0,
        dailyAvgNeededMorning: daysRemaining > 0 ? Math.max(0, (wGoalMorning - weeklyMorning) / daysRemaining) : 0,
        dailyAvgNeededEvening: daysRemaining > 0 ? Math.max(0, (wGoalEvening - weeklyEvening) / daysRemaining) : 0
      },
      monthly: {
        total: monthlyTotal,
        morning: monthlyMorning,
        evening: monthlyEvening,
        goal: mGoalTotal,
        goalMorning: mGoalMorning,
        goalEvening: mGoalEvening,
        percentage: mGoalTotal ? Math.round((monthlyTotal / mGoalTotal) * 1000) / 10 : 0,
        remaining: Math.max(0, mGoalTotal - monthlyTotal)
      },
      settings: {
        monthYear: settings?.month_year || null,
        weeklyGoalMorning: wGoalMorning,
        weeklyGoalEvening: wGoalEvening,
        monthlyGoalMorning: mGoalMorning,
        monthlyGoalEvening: mGoalEvening
      }
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Billing GET error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST: Upsert a billing entry (date + shift + amount) OR a weekly schedule (weekMonday + scheduleData)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { date, shift, amount, weekMonday, scheduleData } = body
    const supabaseAdmin = createAdminClient()
    
    // Handle weekly schedule
    if (weekMonday !== undefined && scheduleData !== undefined) {
      if (!weekMonday) {
        return NextResponse.json({ error: 'Missing weekMonday' }, { status: 400 })
      }
      
      const { data, error } = await supabaseAdmin
        .from('billing_weekly_schedules')
        .upsert(
          { 
            week_monday: weekMonday, 
            schedule_data: scheduleData, 
            updated_at: new Date().toISOString() 
          },
          { onConflict: 'week_monday' }
        )
        .select()
        .single()
      
      if (error) throw error
      return NextResponse.json({ success: true, schedule: data })
    }

    // Handle standard daily billing amount
    if (!date || !shift || amount === undefined) {
      return NextResponse.json({ error: 'Missing date, shift, or amount' }, { status: 400 })
    }
    
    if (!['morning', 'evening'].includes(shift)) {
      return NextResponse.json({ error: 'shift must be morning or evening' }, { status: 400 })
    }
    
    const { data, error } = await supabaseAdmin
      .from('daily_billing')
      .upsert(
        { date, shift, amount: Number(amount), updated_at: new Date().toISOString() },
        { onConflict: 'date,shift' }
      )
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, entry: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Billing POST error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH: Update billing settings (goals)
export async function PATCH(req: Request) {
  try {
    const { monthYear, weeklyGoalMorning, weeklyGoalEvening, monthlyGoalMorning, monthlyGoalEvening } = await req.json()
    const supabaseAdmin = createAdminClient()
    
    const targetMonth = monthYear || null
    const updateData: Record<string, string | number | null> = { updated_at: new Date().toISOString() }
    
    if (targetMonth) updateData.month_year = targetMonth
    if (weeklyGoalMorning !== undefined) updateData.weekly_goal_morning = Number(weeklyGoalMorning)
    if (weeklyGoalEvening !== undefined) updateData.weekly_goal_evening = Number(weeklyGoalEvening)
    if (monthlyGoalMorning !== undefined) updateData.monthly_goal_morning = Number(monthlyGoalMorning)
    if (monthlyGoalEvening !== undefined) updateData.monthly_goal_evening = Number(monthlyGoalEvening)
    
    if (targetMonth) {
      const { data: existing } = await supabaseAdmin
        .from('billing_settings')
        .select('id')
        .eq('month_year', targetMonth)
        .maybeSingle()
        
      if (existing) {
        const { error } = await supabaseAdmin.from('billing_settings').update(updateData).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabaseAdmin.from('billing_settings').insert({
          month_year: targetMonth,
          weekly_goal_morning: weeklyGoalMorning || 6000,
          weekly_goal_evening: weeklyGoalEvening || 6000,
          monthly_goal_morning: monthlyGoalMorning || 25000,
          monthly_goal_evening: monthlyGoalEvening || 25000
        })
        if (error) throw error
      }
    } else {
      const { data: existing } = await supabaseAdmin
        .from('billing_settings')
        .select('id')
        .is('month_year', null)
        .maybeSingle()
        
      if (existing) {
        const { error } = await supabaseAdmin.from('billing_settings').update(updateData).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabaseAdmin.from('billing_settings').insert({
          weekly_goal_morning: weeklyGoalMorning || 6000,
          weekly_goal_evening: weeklyGoalEvening || 6000,
          monthly_goal_morning: monthlyGoalMorning || 25000,
          monthly_goal_evening: monthlyGoalEvening || 25000
        })
        if (error) throw error
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Billing PATCH error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
