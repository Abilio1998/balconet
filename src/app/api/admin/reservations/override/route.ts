import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Listar overrides (incluyendo días cerrados)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('reservation_overrides')
      .select('*')
      .order('reservation_date', { ascending: true })

    if (error) throw error

    return NextResponse.json({ overrides: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Crear o actualizar un bloqueo manual para un día específico
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { reservation_date, is_accepting_inside, is_accepting_terrace, is_closed } = body

    if (!reservation_date) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
    }

    // Si ya está cerrado ese día y no estamos explícitamente quitando el cierre, preservarlo
    const { data: existing } = await supabaseAdmin
      .from('reservation_overrides')
      .select('is_closed')
      .eq('reservation_date', reservation_date)
      .maybeSingle()

    const finalIsClosed = existing?.is_closed === true && !is_closed === true
      ? true  // mantener el cierre aunque el toggle de zona no lo envíe
      : (is_closed ?? false)

    const { data, error } = await supabaseAdmin
      .from('reservation_overrides')
      .upsert({
        reservation_date,
        is_accepting_inside: finalIsClosed ? false : (is_accepting_inside ?? true),
        is_accepting_terrace: finalIsClosed ? false : (is_accepting_terrace ?? true),
        is_closed: finalIsClosed,
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

// DELETE: Eliminar un override (desbloquear una fecha)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('reservation_overrides')
      .delete()
      .eq('reservation_date', date)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
