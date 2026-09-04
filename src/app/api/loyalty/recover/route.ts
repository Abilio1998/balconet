import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const supabase = createAdminClient()

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 })
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '')

    // Search for client
    const { data: client, error } = await supabase
      .from('loyalty_clients')
      .select('name, magic_token, phone')
      .eq('phone', cleanPhone)
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'No hemos encontrado ningún miembro con ese teléfono' }, { status: 404 })
    }

    // Generate WhatsApp recovery link
    const portalUrl = `${new URL(req.url).origin}/puntos?token=${client.magic_token}`
    const message = `Hola ${client.name}! Aquí tienes tu enlace para ver tus puntos del Grup El Balconet: ${portalUrl}`
    
    const waPhone = client.phone.length === 9 ? `34${client.phone}` : client.phone
    const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`

    return NextResponse.json({ 
      success: true, 
      waLink,
      message: '¡Encontrado! Haz clic en el botón para recibir tu enlace por WhatsApp.'
    })

  } catch (err) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
