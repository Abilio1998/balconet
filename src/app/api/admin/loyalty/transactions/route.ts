import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'

const supabase = createAdminClient()

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  let { client_id, invoice_id, amount, restaurant_name } = body

  // Normalize invoice_id and restaurant_name
  invoice_id = invoice_id?.toString().toUpperCase().trim()
  restaurant_name = restaurant_name || 'El Balconet'

  if (!client_id || !invoice_id || !amount) {
    return NextResponse.json({ error: 'Faltan datos requeridos (cliente, factura, importe)' }, { status: 400 })
  }

  // 1. Get settings
  const { data: settings, error: settingsError } = await supabase
    .from('loyalty_settings')
    .select('*')
    .single()

  if (settingsError) return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 })

  const points_earned = Math.floor(amount * (settings.points_per_euro || 1))

  // 2. Check invoice ID scoping by restaurant
  const { data: existingTx } = await supabase
    .from('loyalty_transactions')
    .select('id')
    .eq('invoice_id', invoice_id)
    .eq('restaurant_name', restaurant_name)
    .maybeSingle()

  if (existingTx) {
    return NextResponse.json({ error: `La factura ${invoice_id} ya ha sido registrada en ${restaurant_name}.` }, { status: 409 })
  }

  // 3. Get and update client (handle expiration)
  const { data: client, error: clientError } = await supabase
    .from('loyalty_clients')
    .select('total_points, last_activity')
    .eq('id', client_id)
    .single()

  if (clientError) return NextResponse.json({ error: 'Error al obtener datos del cliente' }, { status: 500 })

  let currentPoints = client.total_points || 0
  const lastActivity = new Date(client.last_activity || 0)
  const now = new Date()
  
  // Check point expiration
  if (settings.points_expiration_months > 0) {
     const expirationDate = new Date(lastActivity)
     expirationDate.setMonth(expirationDate.getMonth() + settings.points_expiration_months)
     
     if (now > expirationDate) {
        currentPoints = 0 // RESET POINTS DUE TO INACTIVITY
     }
  }

  const newTotalPoints = currentPoints + points_earned

  // 4. Record transaction
  const { error: txError } = await supabase
    .from('loyalty_transactions')
    .insert([{ client_id, invoice_id, amount, points_earned, restaurant_name }])

  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

  // 5. Update client (new balance + new activity)
  const { error: updateError } = await supabase
    .from('loyalty_clients')
    .update({ 
      total_points: newTotalPoints,
      last_activity: now.toISOString(),
      restaurant_name // Update preferred restaurant to current one
    })
    .eq('id', client_id)

  if (updateError) return NextResponse.json({ error: 'Error al guardar saldo' }, { status: 500 })

  // 6. Check if threshold reached
  let rewardGenerated = null
  let finalPoints = newTotalPoints

  if (newTotalPoints >= settings.points_threshold) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (settings.reward_validity_days || 14))

    const { data: reward, error: rewardError } = await supabase
      .from('loyalty_rewards')
      .insert([{
        client_id,
        reward_name: settings.reward_name || 'Consumición Gratis',
        status: 'pending',
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single()

    if (!rewardError) {
      rewardGenerated = reward
      finalPoints = newTotalPoints - settings.points_threshold
      await supabase
        .from('loyalty_clients')
        .update({ total_points: finalPoints })
        .eq('id', client_id)
    }
  }

  return NextResponse.json({
    success: true,
    points_earned,
    new_total: finalPoints,
    reward: rewardGenerated,
    was_reset: currentPoints === 0 && client.total_points > 0 // Flag if points were expired
  })
}
