import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit, sanitizeString } from '@/lib/security'
import { z } from 'zod'

const uploadSchema = z.object({
  url: z.string().url(),
  alt: z.string().min(1).max(200),
  order_index: z.number().int().min(0).max(100),
  type: z.enum(['carta', 'hero']),
})

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'carta'
    const table = type === 'hero' ? 'hero_images' : 'carta_images'

    const { data, error } = await supabaseAdmin
      .from(table)
      .select('id, url, alt, order_index')
      .order('order_index', { ascending: true })

    if (error) throw error
    return NextResponse.json({ images: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = uploadSchema.parse({
      ...body,
      alt: sanitizeString(body.alt ?? ''),
    })

    const supabaseAdmin = createAdminClient()
    const table = parsed.type === 'hero' ? 'hero_images' : 'carta_images'

    const { data, error } = await supabaseAdmin
      .from(table)
      .insert({ url: parsed.url, alt: parsed.alt, order_index: parsed.order_index })
      .select('id')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, id: data.id }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 422 })
    }
    return NextResponse.json({ error: 'Failed to save image' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const id = z.string().uuid().parse(body.id)
    const type = z.enum(['carta', 'hero']).parse(body.type)
    const table = type === 'hero' ? 'hero_images' : 'carta_images'

    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin.from(table).delete().eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
