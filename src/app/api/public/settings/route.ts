import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const { data: settings, error } = await supabasePublic
      .from('reservation_settings')
      .select('lunch_start, lunch_end, dinner_start, dinner_end, breakfast_start, breakfast_end, lunch_menu_active, dinner_menu_active, breakfast_menu_active')
      .eq('is_active', true)
      .single()

    if (error) throw error

    return NextResponse.json(
      { settings },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
