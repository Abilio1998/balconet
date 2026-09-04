import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Fetch all categories
    const { data: categories, error: catError } = await supabase
      .from('carta_categories')
      .select(`*`)
      .order('order_index', { ascending: true })

    if (catError) throw catError

    // Fetch all products
    const { data: products, error: prodError } = await supabase
      .from('carta_products')
      .select(`*`)
      .order('order_index', { ascending: true })

    if (prodError) throw prodError

    // Combine
    const fullCarta = categories.map(cat => ({
      ...cat,
      products: products.filter(p => p.category_id === cat.id)
    }))

    return NextResponse.json(
      { carta: fullCarta },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (err) {
    console.error('Error fetching public dynamic carta:', err)
    return NextResponse.json({ error: 'Failed to fetch dynamic carta' }, { status: 500 })
  }
}
