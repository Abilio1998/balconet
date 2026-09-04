import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'

const supabase = createAdminClient()

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const phone = searchParams.get('phone')

  let query = supabase.from('loyalty_clients').select('*')
  if (phone) query = query.eq('phone', phone)

  const { data, error } = await query.order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { name, phone, restaurant_name } = body

  if (!name || !phone) {
    return NextResponse.json({ error: 'Nombre y teléfono requeridos' }, { status: 400 })
  }

  // Check if client exists
  const { data: existing } = await supabase
    .from('loyalty_clients')
    .select('*')
    .eq('phone', phone)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(existing)
  }

  const { data, error } = await supabase
    .from('loyalty_clients')
    .insert([{ name, phone, restaurant_name: restaurant_name || 'El Balconet' }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { id, restaurant_name, name } = body

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('loyalty_clients')
    .update({ restaurant_name, name })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await supabase
    .from('loyalty_clients')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

