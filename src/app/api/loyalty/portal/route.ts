import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const supabase = createAdminClient()

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })

  // 1. Get client by magic_token
  const { data: client, error: clientError } = await supabase
    .from('loyalty_clients')
    .select('id, name, total_points, last_activity, restaurant_name')
    .eq('magic_token', token)
    .single()

  if (clientError || !client) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 404 })
  }

  // 2. Get active rewards
  const { data: rewards } = await supabase
    .from('loyalty_rewards')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  // 3. Get generic settings for the portal
  const { data: settings } = await supabase
    .from('loyalty_settings')
    .select('points_threshold, points_expiration_months')
    .single()

  // 4. Dynamic Suggestions (Fetch real dishes from carta and daily menu)
  let suggestions: any[] = []

  // A. Get featured products from Carta (Dynamic & Randomized Suggestions)
  const { data: featuredPool } = await supabase
    .from('carta_products')
    .select('name, description, price, image_url')
    .eq('is_featured', true)
    .not('image_url', 'is', null) // Prioritize items with photos for premium feel
    .limit(10)

  if (featuredPool && featuredPool.length > 0) {
    // Shuffle the array to show different items on each load
    const shuffled = [...featuredPool].sort(() => Math.random() - 0.5)
    suggestions = shuffled.slice(0, 2).map(p => ({ ...p, type: 'carta' }))
  }

  // B. Get latest published menu dishes (Daily context)
  const { data: menu } = await supabase
    .from('daily_menus')
    .select('id, date, price')
    .eq('published', true)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (menu && suggestions.length < 3) {
    const today = new Date()
    const isWeekend = today.getDay() === 0 || today.getDay() === 6 // 0=Sunday, 6=Saturday
    
    // Add unified Full Menu suggestion
    suggestions.push({
      name: 'Menú del Día Completo',
      type: 'full_menu',
      price: menu.price || 14.50,
      description: 'Disfruta de la experiencia completa: un primero, un segundo y un postre o café.',
      includes: ['Primero', 'Segundo', 'Postre o Café', !isWeekend ? 'Bebida Incluida' : 'Bebida No Incluida'],
      isWeekend,
      image_url: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1000' // High impact experience photo
    })
  }

  // Get 1 random image from carta for background if needed
  const { data: cartaImgs } = await supabase
    .from('carta_images')
    .select('url, alt')
    .limit(3)
  
  const randomImg = cartaImgs && cartaImgs.length > 0 
    ? cartaImgs[Math.floor(Math.random() * cartaImgs.length)] 
    : null

  return NextResponse.json({
    client,
    rewards,
    settings,
    suggestions,
    randomImg
  })
}
