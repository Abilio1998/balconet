import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Consultar disponibilidad para una fecha y número de personas
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const guests = parseInt(searchParams.get('guests') || '2')
  const zone = searchParams.get('zone') || 'inside'

  if (!date) return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })

  try {
    // 1. Obtener configuración
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('reservation_settings')
      .select('*')
      .single()

    if (settingsError) throw settingsError

    // 1.5 Obtener overrides para la fecha específica
    const { data: override } = await supabaseAdmin
      .from('reservation_overrides')
      .select('*')
      .eq('reservation_date', date)
      .single()

    // 2. Verificar si el día está cerrado o si el staff ha bloqueado la zona manualmente
    const dayOfWeek = new Date(date).getDay()
    if (settings.closed_days.includes(dayOfWeek)) {
      return NextResponse.json({ slots: [], closed: true })
    }

    // Prioridad: Override diario > Configuración global
    const isInsideAccepted = override ? override.is_accepting_inside : settings.is_accepting_inside
    const isTerraceAccepted = override ? override.is_accepting_terrace : settings.is_accepting_terrace

    const isZoneBlocked = zone === 'terrace' 
      ? isTerraceAccepted === false 
      : isInsideAccepted === false

    if (isZoneBlocked) {
      return NextResponse.json({ slots: [], closed: false, manual_block: true })
    }

    // 3. Generar slots basados en horarios
    const slots: string[] = []
    
    const addSlots = (start: string, end: string) => {
      let current = new Date(`${date}T${start}`)
      const limit = new Date(`${date}T${end}`)
      
      while (current < limit) {
        slots.push(current.toTimeString().substring(0, 5))
        current = new Date(current.getTime() + settings.slot_interval_minutes * 60000)
      }
    }

    if (settings.lunch_start && settings.lunch_end) addSlots(settings.lunch_start, settings.lunch_end)
    if (settings.dinner_start && settings.dinner_end) addSlots(settings.dinner_start, settings.dinner_end)

    // 4. Filtrar slots por capacidad de la zona seleccionada
    const { data: existingReservations, error: resError } = await supabaseAdmin
      .from('reservations')
      .select('reservation_date, reservation_time, guests, zone')
      .eq('reservation_date', date)
      .neq('status', 'cancelled')

    // Si la columna 'zone' no existe (error PGRST104 o similar), 
    // filtramos manualmente o fallamos con gracia.
    let globalReservations: any[] = existingReservations || []
    let filteredReservations: any[] = globalReservations

    if (resError) {
       console.error('Error fetching reservations:', resError)
       // Si hay error, intentamos al menos traer las de esa fecha sin filtrar por zona para mayor seguridad
       const { data: fallbackRes } = await supabaseAdmin
         .from('reservations')
         .select('reservation_date, reservation_time, guests')
         .eq('reservation_date', date)
         .neq('status', 'cancelled')
       globalReservations = fallbackRes || []
       filteredReservations = globalReservations
    } else {
       // Si la consulta funcionó, filtramos por la zona solicitada para el aforo de espacio
       filteredReservations = globalReservations.filter(r => (r.zone || 'inside') === zone)
    }

    const maxCapacity = zone === 'terrace' 
      ? (settings.max_capacity_terrace || 10) 
      : (settings.max_capacity_inside || settings.max_capacity_per_slot || 20)

    const stayDuration = settings.stay_duration_minutes || 90
    
    const timeToMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    }

    const maxCapacityPerSlot = settings.max_capacity_per_slot || 15

    const availability = slots.map(time => {
      const slotMinutes = timeToMinutes(time)
      
      // 1. Aforo FÍSICO (¿Hay sillas libres en la zona solicitada calculando superposición?)
      const occupiedInZone = filteredReservations
        ?.filter(r => {
          const resTime = r.reservation_time.substring(0, 5)
          const resMinutes = timeToMinutes(resTime)
          return resMinutes <= slotMinutes && (resMinutes + stayDuration) > slotMinutes
        })
        .reduce((sum, r) => sum + r.guests, 0) || 0
      
      // 2. Aforo de COCINA/PACING (¿Cuánta gente de todo el local llega a esta hora EXACTA?)
      const arrivingExactly = globalReservations
        ?.filter(r => r.reservation_time.substring(0, 5) === time)
        .reduce((sum, r) => sum + r.guests, 0) || 0
      
      const hasSpace = (occupiedInZone + guests) <= maxCapacity
      const hasKitchenCapacity = (arrivingExactly + guests) <= maxCapacityPerSlot

      return {
        time,
        available: hasSpace && hasKitchenCapacity
      }
    }).filter(s => s.available)

    // 5. Filtrar horarios pasados si es hoy (hora local España)
    const now = new Date()
    const spainDateStr = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now)

    let finalSlots = availability.filter(s => s.available)

    if (date < spainDateStr) {
      finalSlots = []
    } else if (date === spainDateStr) {
      const spainTimeParts = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }).format(now).split(':').map(Number)
      
      const currentMinutesInSpain = spainTimeParts[0] * 60 + spainTimeParts[1]
      const cutoffMinutes = currentMinutesInSpain + 15 // Margen mínimo de 15 mins

      finalSlots = finalSlots.filter(s => {
        const slotMinutes = timeToMinutes(s.time)
        return slotMinutes >= cutoffMinutes
      })
    }

    return NextResponse.json({ 
      slots: finalSlots, 
      closed: false,
      whatsapp_number: settings.whatsapp_number,
      disable_web_reservations: settings.disable_web_reservations
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, guests, date, time, notes, zone } = body

    if (!name || !email || !phone || !guests || !date || !time) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Validación de móvil (España: 9 dígitos, empieza por 6 o 7)
    const phoneRegex = /^[67]\d{8}$/
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
      return NextResponse.json({ error: 'Número de teléfono móvil no válido. Debe empezar por 6 o 7.' }, { status: 400 })
    }

    // 1. Verificar si ya existe una reserva activa para este número y fecha
    const { data: existing } = await supabaseAdmin
      .from('reservations')
      .select('id')
      .eq('client_phone', phone)
      .eq('reservation_date', date)
      .not('status', 'eq', 'cancelled')
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ 
        error: 'Ya existe una reserva activa para este número de teléfono en la fecha seleccionada.' 
      }, { status: 400 })
    }

    // 2. Verificar disponibilidad de aforo
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .insert({
        client_name: name,
        client_email: email,
        client_phone: phone,
        guests: parseInt(guests),
        reservation_date: date,
        reservation_time: time,
        zone: zone || 'inside',
        notes: notes,
        status: 'confirmed'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, reservation: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
