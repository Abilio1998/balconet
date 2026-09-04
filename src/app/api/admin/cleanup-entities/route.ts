import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

/** Recursively decode HTML entities from a string */
function decodeEntities(text: string | null | undefined): string | null {
  if (!text) return text ?? null
  let decoded = text
  let prev: string
  do {
    prev = decoded
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#x2F;/g, '/')
  } while (decoded !== prev)
  return decoded
}

export async function POST() {
  const supabase = createAdminClient()
  let totalFixed = 0

  try {
    // ── Fix carta_products ──────────────────────────────────────────
    const { data: products } = await supabase
      .from('carta_products')
      .select('id, name_ca, name_en, name_fr, description_ca, description_en, description_fr')

    for (const p of products || []) {
      const fields = ['name_ca', 'name_en', 'name_fr', 'description_ca', 'description_en', 'description_fr'] as const
      const updates: Record<string, string | null> = {}
      let changed = false

      for (const field of fields) {
        const original = (p as any)[field]
        const fixed = decodeEntities(original)
        if (fixed !== original) {
          updates[field] = fixed
          changed = true
        }
      }

      if (changed) {
        await supabase.from('carta_products').update(updates).eq('id', p.id)
        totalFixed++
      }
    }

    // ── Fix carta_categories ────────────────────────────────────────
    const { data: categories } = await supabase
      .from('carta_categories')
      .select('id, name_ca, name_en, name_fr')

    for (const c of categories || []) {
      const fields = ['name_ca', 'name_en', 'name_fr'] as const
      const updates: Record<string, string | null> = {}
      let changed = false

      for (const field of fields) {
        const original = (c as any)[field]
        const fixed = decodeEntities(original)
        if (fixed !== original) {
          updates[field] = fixed
          changed = true
        }
      }

      if (changed) {
        await supabase.from('carta_categories').update(updates).eq('id', c.id)
        totalFixed++
      }
    }

    // ── Fix dishes ──────────────────────────────────────────────────
    const { data: dishes } = await supabase
      .from('dishes')
      .select('id, name_ca, name_en, name_fr, description_ca, description_en, description_fr')

    for (const d of dishes || []) {
      const fields = ['name_ca', 'name_en', 'name_fr', 'description_ca', 'description_en', 'description_fr'] as const
      const updates: Record<string, string | null> = {}
      let changed = false

      for (const field of fields) {
        const original = (d as any)[field]
        const fixed = decodeEntities(original)
        if (fixed !== original) {
          updates[field] = fixed
          changed = true
        }
      }

      if (changed) {
        await supabase.from('dishes').update(updates).eq('id', d.id)
        totalFixed++
      }
    }

    return NextResponse.json({ success: true, fixed: totalFixed })
  } catch (err) {
    console.error('Error during entity cleanup:', err)
    return NextResponse.json({ error: 'Error durante la limpieza' }, { status: 500 })
  }
}
