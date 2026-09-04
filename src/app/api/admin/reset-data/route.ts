import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { auth } from '@/auth'

// Security: Verify admin session first, then verify password for the action
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'balconet_admin2024'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { password, type } = await req.json()

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient()

    if (type === 'analytics') {
      // 1. Reset Website Visits
      const { error: visitError } = await supabaseAdmin
        .from('website_visits')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      // 2. Reset Interaction Events (Allergens + Dwell Time)
      const { error: eventError } = await supabaseAdmin
        .from('interaction_events')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      // 3. Reset Product Likes (Zero out the counter)
      const { error: productError } = await supabaseAdmin
        .from('carta_products')
        .update({ likes_count: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (visitError || eventError || productError) {
        throw new Error('Error al limpiar analíticas')
      }

      return NextResponse.json({ success: true, message: 'Analíticas resteadas con éxito' })
    } 
    
    if (type === 'reservations') {
      // 1. Reset Reservations
      const { error: resError } = await supabaseAdmin
        .from('reservations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (resError) throw new Error('Error al limpiar reservas')

      return NextResponse.json({ success: true, message: 'Reservas resteadas con éxito' })
    }

    return NextResponse.json({ error: 'Tipo de reset no especificado' }, { status: 400 })
  } catch (err: any) {
    console.error('Reset data error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
