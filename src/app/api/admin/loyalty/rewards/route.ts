import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'

const supabase = createAdminClient()

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { reward_id, status, client_id } = body

  if (!reward_id || !status || !client_id) {
    return NextResponse.json({ error: 'ID de premio, cliente y estado son requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('loyalty_rewards')
    .update({ 
      status, 
      redeemed_at: status === 'redeemed' ? new Date().toISOString() : null 
    })
    .eq('id', reward_id)
    .eq('client_id', client_id) // STRICT SECURITY: Must match the client owner
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Operación no autorizada: El premio no pertenece a este cliente.' }, { status: 403 })
  }
  return NextResponse.json(data[0])
}
