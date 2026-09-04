import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/security'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 10)
  if (limited) return limited

  try {
    const supabaseAdmin = createAdminClient()

    // Count rows in each relevant table
    const [reservations, loyaltyClients, dailyMenus, dishes, products] = await Promise.all([
      supabaseAdmin.from('reservations').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('loyalty_clients').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('daily_menus').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('dishes').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('carta_products').select('id', { count: 'exact', head: true }),
    ])

    const todayStr = new Date().toISOString().split('T')[0]
    
    // Total interactions and visits
    const [visits, interactions, todayVisits, todayInteractions] = await Promise.all([
      supabaseAdmin.from('website_visits').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('interaction_events').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('website_visits').select('id', { count: 'exact', head: true }).gte('created_at', todayStr),
      supabaseAdmin.from('interaction_events').select('id', { count: 'exact', head: true }).gte('created_at', todayStr),
    ])

    const totalAnalyticsRows = (visits.count ?? 0) + (interactions.count ?? 0)
    const totalRequestsToday = (todayVisits.count ?? 0) + (todayInteractions.count ?? 0)

    const tables = [
      { name: 'Reservas', count: reservations.count ?? 0, limit: 50000 },
      { name: 'Clientes VIP', count: loyaltyClients.count ?? 0, limit: 10000 },
      { name: 'Menús Diarios', count: dailyMenus.count ?? 0, limit: 5000 },
      { name: 'Platos', count: dishes.count ?? 0, limit: 10000 },
      { name: 'Carta / Productos', count: products.count ?? 0, limit: 5000 },
      { name: 'Analíticas y Visitas', count: totalAnalyticsRows, limit: 100000 },
    ]

    const totalRows = tables.reduce((s, t) => s + t.count, 0)
    // Supabase Free tier: 500MB storage, ~500K rows rough estimate
    const FREE_TIER_LIMIT = 500000

    return NextResponse.json({
      tables,
      totalRows,
      freeTierLimit: FREE_TIER_LIMIT,
      percentUsed: Math.min((totalRows / FREE_TIER_LIMIT) * 100, 100),
      todayRequests: totalRequestsToday
    })
  } catch (err) {
    console.error('DB Stats error:', err)
    return NextResponse.json({ error: 'Error fetching DB stats' }, { status: 500 })
  }
}
