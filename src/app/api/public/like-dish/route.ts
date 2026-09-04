import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit } from '@/lib/security'

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 30)
  if (limited) return limited

  try {
    const { dishId, action = 'like' } = await request.json()
    if (!dishId) return NextResponse.json({ error: 'Missing dish ID' }, { status: 400 })

    const supabaseAdmin = createAdminClient()

    // 1. Get current count
    const { data: current, error: getError } = await supabaseAdmin
      .from('dishes')
      .select('likes_count')
      .eq('id', dishId)
      .single()

    if (getError) throw getError

    const currentLikes = current?.likes_count || 0
    // 2. Calculate new count (don't go below 0)
    const newCount = action === 'like' ? currentLikes + 1 : Math.max(0, currentLikes - 1)

    // 3. Update
    const { error: updateError } = await supabaseAdmin
      .from('dishes')
      .update({ likes_count: newCount })
      .eq('id', dishId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, newCount })
  } catch (err: any) {
    console.error('Error toggling dish like:', err)
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
  }
}
