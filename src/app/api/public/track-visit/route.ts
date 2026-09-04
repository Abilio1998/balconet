import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { path, referrer, userAgent } = await req.json()
    const supabaseAdmin = createAdminClient()

    // Server-side guard: never track admin routes
    if (path && path.includes('/admin')) {
      return NextResponse.json({ success: true, message: 'Admin route, skipping log' })
    }

    // Basic cleaning of referrer (extract domain if possible)
    let cleanReferrer = referrer || 'Directo / Desconocido'
    try {
      if (referrer && referrer.startsWith('http')) {
        const url = new URL(referrer)
        cleanReferrer = url.hostname
        if (cleanReferrer.includes('google')) cleanReferrer = 'Google'
        if (cleanReferrer.includes('instagram')) cleanReferrer = 'Instagram'
        if (cleanReferrer.includes('facebook')) cleanReferrer = 'Facebook'
        if (cleanReferrer.includes('t.co')) cleanReferrer = 'Twitter / X'
      }
    } catch (e) {
      // Keep original if URL parsing fails
    }

    // 1. Filter out bots and crawlers to avoid inflating stats
    const botPatterns = /bot|crawler|spider|google|bing|yandex|slurp|duckduckbot|baiduspider|headless/i;
    if (userAgent && botPatterns.test(userAgent)) {
      return NextResponse.json({ success: true, message: 'Bot detected, skipping log' })
    }

    const { error } = await supabaseAdmin
      .from('website_visits')
      .insert({
        page_path: path || '/',
        referrer: cleanReferrer,
        user_agent: userAgent
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Visit tracking error:', err)
    return NextResponse.json({ error: 'Failed to log visit' }, { status: 500 })
  }
}
