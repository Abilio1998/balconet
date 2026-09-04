import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Listar reservas para el panel de administración
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  try {
    let query = supabaseAdmin
      .from('reservations')
      .select('*')
      .order('reservation_date', { ascending: true })
      .order('reservation_time', { ascending: true })

    if (date) {
      query = query.eq('reservation_date', date)
    } else if (month) {
      // Filtrar por mes de forma robusta (YYYY-MM)
      const [yearStr, monthIdx] = month.split('-').map(Number)
      const startDate = `${month}-01`
      const endDate = new Date(yearStr, monthIdx, 1).toISOString().split('T')[0]
      
      query = query.gte('reservation_date', startDate).lt('reservation_date', endDate)
    } else if (year) {
      // Filtrar por año completo (YYYY)
      const startDate = `${year}-01-01`
      const endDate = `${parseInt(year) + 1}-01-01`
      query = query.gte('reservation_date', startDate).lt('reservation_date', endDate)
    } else {
      // Por defecto día de hoy
      query = query.eq('reservation_date', new Date().toISOString().split('T')[0])
    }

    const { data, error } = await query

    if (error) throw error

    // Obtener también los settings completos
    const { data: settings } = await supabaseAdmin
      .from('reservation_settings')
      .select('*')
      .single()

    // Obtener override si hay fecha
    let daily_override = null
    if (date) {
      const { data: overData } = await supabaseAdmin
        .from('reservation_overrides')
        .select('*')
        .eq('reservation_date', date)
        .maybeSingle()
      daily_override = overData
    }

    return NextResponse.json({ reservations: data, settings, daily_override })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Crear una reserva manualmente desde el panel admin
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { client_name, client_phone, guests, reservation_date, reservation_time, notes, zone, table_name, force_override } = body

    if (!client_name || !client_phone || !guests || !reservation_date || !reservation_time) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // ── Validación de mesa (sin cambios) ──────────────────────────────────
    if (table_name && table_name.trim() !== '') {
      const { data: settingsForTable } = await supabaseAdmin.from('reservation_settings').select('stay_duration_minutes').single()
      const stayDurationForTable = settingsForTable?.stay_duration_minutes || 120

      const { data: overlapping } = await supabaseAdmin
        .from('reservations')
        .select('client_name, reservation_time')
        .eq('reservation_date', reservation_date)
        .eq('table_name', table_name)
        .in('status', ['confirmed', 'seated'])
      
      if (overlapping && overlapping.length > 0) {
        const targetMinutes = parseInt(reservation_time.split(':')[0]) * 60 + parseInt(reservation_time.split(':')[1])
        for (const res of overlapping) {
           const resMinutes = parseInt(res.reservation_time.split(':')[0]) * 60 + parseInt(res.reservation_time.split(':')[1])
           if (Math.abs(targetMinutes - resMinutes) < stayDurationForTable) {
             return NextResponse.json({ error: `MESA BLOQUEADA: La mesa ${table_name} ya está asignada a ${res.client_name} a las ${res.reservation_time.substring(0,5)}` }, { status: 409 })
           }
        }
      }
    }

    // ── Validación de aforo de zona + caudal de cocina (sin permanencia) ──
    // El aforo de zona se verifica POR HORA EXACTA (no por ventana de permanencia).
    // Así 13:00 y 13:15 son slots independientes. La permanencia solo afecta al semáforo.
    if (!force_override) {
      const { data: settings } = await supabaseAdmin.from('reservation_settings').select('*').single()

      if (settings) {
        const guestsNum = parseInt(guests)
        const maxCapacityZone = (zone === 'terrace')
          ? (settings.max_capacity_terrace || 10)
          : (settings.max_capacity_inside || 20)
        const maxPerSlot = settings.max_capacity_per_slot || 15
        const slotInterval = settings.slot_interval_minutes || 30

        const timeToMinutes = (t: string) => {
          const [h, m] = t.split(':').map(Number)
          return h * 60 + m
        }

        const slotMinutes = timeToMinutes(reservation_time.substring(0, 5))
        const requestedTimeStr = reservation_time.substring(0, 5)

        // Obtener todas las reservas activas del día
        const { data: dayReservations } = await supabaseAdmin
          .from('reservations')
          .select('reservation_time, guests, zone')
          .eq('reservation_date', reservation_date)
          .neq('status', 'cancelled')

        const allRes = dayReservations || []

        // 1. Aforo de zona: personas con la MISMA HORA EXACTA en la misma zona
        //    (sin ventana de permanencia — 13:00 y 13:15 son slots independientes)
        const atSameTimeInZone = allRes
          .filter(r =>
            r.reservation_time.substring(0, 5) === requestedTimeStr &&
            (r.zone || 'inside') === (zone || 'inside')
          )
          .reduce((sum, r) => sum + r.guests, 0)

        // 2. Caudal de cocina: personas que llegan a esta hora exacta (todo el local)
        const arrivingExactly = allRes
          .filter(r => r.reservation_time.substring(0, 5) === requestedTimeStr)
          .reduce((sum, r) => sum + r.guests, 0)

        const hasSpaceInZone = (atSameTimeInZone + guestsNum) <= maxCapacityZone
        const hasKitchenCapacity = (arrivingExactly + guestsNum) <= maxPerSlot

        if (!hasSpaceInZone || !hasKitchenCapacity) {
          const reason = !hasSpaceInZone ? 'zone' : 'kitchen'

          // Determinar el límite del turno en el que cae la hora solicitada
          const minutesToTime = (mins: number): string => {
            const h = Math.floor(mins / 60).toString().padStart(2, '0')
            const m = (mins % 60).toString().padStart(2, '0')
            return `${h}:${m}`
          }

          const getServiceEndMinutes = (): number => {
            if (settings.lunch_start && settings.lunch_end) {
              const lunchStartMin = timeToMinutes(settings.lunch_start)
              const lunchEndMin = timeToMinutes(settings.lunch_end)
              if (slotMinutes >= lunchStartMin && slotMinutes < lunchEndMin) return lunchEndMin
            }
            if (settings.dinner_start && settings.dinner_end) {
              const dinnerStartMin = timeToMinutes(settings.dinner_start)
              const dinnerEndMin = timeToMinutes(settings.dinner_end)
              if (slotMinutes >= dinnerStartMin && slotMinutes < dinnerEndMin) return dinnerEndMin
            }
            const ends: number[] = []
            if (settings.lunch_end) ends.push(timeToMinutes(settings.lunch_end))
            if (settings.dinner_end) ends.push(timeToMinutes(settings.dinner_end))
            return ends.length > 0 ? Math.max(...ends) : slotMinutes + 240
          }

          const serviceEndMinutes = getServiceEndMinutes()

          // Buscar el siguiente slot donde ambos límites sean satisfechos
          // Los candidatos se generan sumando el intervalo desde la hora pedida
          // (garantiza horas limpias: 13:15, 13:30... independiente del lunch_start)
          let suggestedTime: string | null = null
          let candidateMin = slotMinutes + slotInterval

          while (candidateMin < serviceEndMinutes) {
            const candidateTime = minutesToTime(candidateMin)

            const atCandidateInZone = allRes
              .filter(r =>
                r.reservation_time.substring(0, 5) === candidateTime &&
                (r.zone || 'inside') === (zone || 'inside')
              )
              .reduce((sum, r) => sum + r.guests, 0)

            const arrivingAtCandidate = allRes
              .filter(r => r.reservation_time.substring(0, 5) === candidateTime)
              .reduce((sum, r) => sum + r.guests, 0)

            if (
              (atCandidateInZone + guestsNum) <= maxCapacityZone &&
              (arrivingAtCandidate + guestsNum) <= maxPerSlot
            ) {
              suggestedTime = candidateTime
              break
            }

            candidateMin += slotInterval
          }

          return NextResponse.json({
            error: `${reason === 'kitchen' ? 'Límite de cocina' : 'Aforo de zona'} alcanzado a las ${requestedTimeStr}`,
            capacity_full: true,
            reason,
            requested_time: requestedTimeStr,
            suggested_time: suggestedTime
          }, { status: 409 })
        }
      }
    }


    // ── Insertar la reserva ───────────────────────────────────────────────
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .insert({
        client_name,
        client_phone,
        guests: parseInt(guests),
        reservation_date,
        reservation_time,
        notes,
        zone: zone || 'inside',
        table_name: table_name || null,
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

// PATCH: Actualizar una reserva (ya sea estado o datos completos)
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    // Si viene guests, asegurarnos que es un número
    if (updates.guests) updates.guests = parseInt(updates.guests)

    if (updates.table_name && updates.table_name.trim() !== '') {
      const { data: settings } = await supabaseAdmin.from('reservation_settings').select('stay_duration_minutes').single()
      const stayDuration = settings?.stay_duration_minutes || 120

      const { data: targetRes } = await supabaseAdmin.from('reservations').select('reservation_date, reservation_time').eq('id', id).single()
      if (targetRes) {
        const { data: overlapping } = await supabaseAdmin
          .from('reservations')
          .select('client_name, reservation_time')
          .eq('reservation_date', targetRes.reservation_date)
          .eq('table_name', updates.table_name)
          .neq('id', id)
          .in('status', ['confirmed', 'seated'])
        
        if (overlapping && overlapping.length > 0) {
          const targetMinutes = parseInt(targetRes.reservation_time.split(':')[0]) * 60 + parseInt(targetRes.reservation_time.split(':')[1])
          for (const res of overlapping) {
             const resMinutes = parseInt(res.reservation_time.split(':')[0]) * 60 + parseInt(res.reservation_time.split(':')[1])
             if (Math.abs(targetMinutes - resMinutes) < stayDuration) {
               return NextResponse.json({ error: `La mesa ${updates.table_name} ya la ocupa ${res.client_name} a las ${res.reservation_time.substring(0,5)}` }, { status: 409 })
             }
          }
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, reservation: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT: Actualizar configuración de reservas
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    
    // Usar upsert para asegurar que solo modificamos o creamos el registro activo
    // Al incluir el ID (que viene del GET), Supabase actualizará el registro existente
    const { data, error } = await supabaseAdmin
      .from('reservation_settings')
      .upsert({ ...body, is_active: true })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, settings: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
// DELETE: Eliminar reserva individual o masiva por fecha
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const date = searchParams.get('date')

    if (id) {
      // Eliminar una reserva específica
      const { error } = await supabaseAdmin
        .from('reservations')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return NextResponse.json({ success: true, message: 'Reserva eliminada' })
    } 
    
    if (date) {
      // Eliminar TODAS las reservas de una fecha
      const { error } = await supabaseAdmin
        .from('reservations')
        .delete()
        .eq('reservation_date', date)

      if (error) throw error
      return NextResponse.json({ success: true, message: `Todas las reservas del día ${date} han sido eliminadas` })
    }

    return NextResponse.json({ error: 'ID o Fecha requerida' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
