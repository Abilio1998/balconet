import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/security'

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 30)
  if (limited) return limited

  try {
    const supabaseAdmin = createAdminClient()
    const { data: images, error } = await supabaseAdmin
      .from('carta_images')
      .select('id, url, alt, order_index')
      .order('order_index', { ascending: true })

    if (error) throw error

    return NextResponse.json({ images: images ?? [] }, { status: 200 })
  } catch (err) {
    console.error('Carta API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
