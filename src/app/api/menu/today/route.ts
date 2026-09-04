import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/security'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {

  const limited = rateLimit(request, 30)
  if (limited) return limited

  try {

    const supabaseAdmin = createAdminClient()
    
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
    const tomorrowDate = new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/Madrid"}))
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    const tomorrow = tomorrowDate.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })

    const { data: menus, error } = await supabaseAdmin
      .from('daily_menus')
      .select(`
        id, date, price, price_exterior, published, is_holiday,
        dishes (id, name, name_ca, name_en, name_fr, description, description_ca, description_en, description_fr, course, order_index, supplement, allergens, likes_count)
      `)
      .eq('published', true)
      .in('date', [today, tomorrow])

    if (error) {
      return NextResponse.json({ menu: null, tomorrowMenu: null }, { status: 200 })
    }

    const todayMenu = menus?.find(m => m.date === today) || null
    const tomorrowMenu = menus?.find(m => m.date === tomorrow) || null

    return NextResponse.json({ menu: todayMenu, tomorrowMenu }, { status: 200 })

  } catch (err) {
    console.error('Menu API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
