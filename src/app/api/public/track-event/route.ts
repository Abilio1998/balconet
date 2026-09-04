import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { eventType, eventValue, metadata } = await req.json()
    
    if (!eventType) {
      return NextResponse.json({ error: 'Missing eventType' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
      .from('interaction_events')
      .insert({
        event_type: eventType,
        event_value: eventValue,
        metadata: metadata || {}
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Interaction event tracking error:', err)
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
  }
}
