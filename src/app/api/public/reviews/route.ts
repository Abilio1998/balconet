import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient()
    
    // Get the direct storage public URL and append a timestamp to definitively bust all Next.js server caches
    const { data: { publicUrl } } = supabaseAdmin.storage.from('menus').getPublicUrl('reviews.json')
    
    const response = await fetch(`${publicUrl}?t=${Date.now()}`, { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ reviews: [] })
    }

    const reviews = await response.json()
    
    // Sort reviews by their manually defined order
    if (Array.isArray(reviews)) {
      reviews.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    }
    
    return NextResponse.json({ reviews })
  } catch (err) {
    console.error('Error fetching reviews.json:', err)
    return NextResponse.json({ reviews: [] })
  }
}
