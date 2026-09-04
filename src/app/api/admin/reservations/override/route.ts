import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: Crear o actualizar un bloqueo manual para un día específico
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { reservation_date, is_accepting_inside, is_accepting_terrace } = body

    if (!reservation_date) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('reservation_overrides')
      .upsert({
        reservation_date,
        is_accepting_inside,
        is_accepting_terrace,
        updated_at: new Date().toISOString()
      }, { onConflict: 'reservation_date' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, override: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
