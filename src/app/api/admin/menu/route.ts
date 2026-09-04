import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit, sanitizeString } from '@/lib/security'
import { z } from 'zod'

const menuSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  price: z.number().min(0.01).max(500),
  price_exterior: z.number().min(0.01).max(500).optional(),
  published: z.boolean().default(false),
  is_holiday: z.boolean().default(false),
  dishes: z.array(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1).max(500),
      name_ca: z.string().max(250).optional().nullable(),
      name_en: z.string().max(250).optional().nullable(),
      name_fr: z.string().max(250).optional().nullable(),
      description: z.string().max(500).optional().nullable(),
      description_ca: z.string().max(600).optional().nullable(),
      description_en: z.string().max(600).optional().nullable(),
      description_fr: z.string().max(600).optional().nullable(),
      course: z.enum(['first', 'second', 'dessert']),
      order_index: z.number().int().min(0),
      supplement: z.number().min(0).optional(),
      allergens: z.array(z.string()).optional(),
    })
  ).max(30),
})

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 20)
  if (limited) return limited

  try {
    const supabaseAdmin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '30'), 100)

    const { data, error } = await supabaseAdmin
      .from('daily_menus')
      .select(`id, date, price, price_exterior, published, is_holiday, dishes (id, name, name_ca, name_en, name_fr, description, description_ca, description_en, description_fr, course, order_index, supplement, allergens)`)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return NextResponse.json({ menus: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch menus' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 10)
  if (limited) return limited

  try {
    const body = await request.json()
    const parsed = menuSchema.parse({
      ...body,
      dishes: body.dishes?.map((d: Record<string, unknown>) => ({
        ...d,
        name: sanitizeString(d.name),
        name_ca: d.name_ca ? sanitizeString(d.name_ca as string) : null,
        name_en: d.name_en ? sanitizeString(d.name_en as string) : null,
        name_fr: d.name_fr ? sanitizeString(d.name_fr as string) : null,
        description: d.description ? sanitizeString(d.description as string) : null,
        description_ca: d.description_ca ? sanitizeString(d.description_ca as string) : null,
        description_en: d.description_en ? sanitizeString(d.description_en as string) : null,
        description_fr: d.description_fr ? sanitizeString(d.description_fr as string) : null,
        supplement: d.supplement ? Number(d.supplement) : 0,
        allergens: d.allergens ?? [],
      })),
    })

    const supabaseAdmin = createAdminClient()

    const startDate = new Date(parsed.date)
    const endDate = parsed.endDate ? new Date(parsed.endDate) : startDate

    if (endDate < startDate) {
      return NextResponse.json({ error: 'La fecha de fin no puede ser anterior a la fecha de inicio.' }, { status: 400 })
    }
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 45) {
      return NextResponse.json({ error: 'No puedes crear un tramo de fechas superior a 45 días de golpe.' }, { status: 400 })
    }

    const datesToProcess: string[] = []
    let currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      datesToProcess.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const isRange = datesToProcess.length > 1

    for (const d of datesToProcess) {
      // Upsert the menu header row
      const { data: menu, error: menuError } = await supabaseAdmin
        .from('daily_menus')
        .upsert({
          date: d,
          price: parsed.price,
          price_exterior: parsed.price_exterior || null,
          published: parsed.published,
          is_holiday: parsed.is_holiday,
        }, { onConflict: 'date' })
        .select('id')
        .single()

      if (menuError || !menu) throw menuError

      if (isRange) {
        // ── DATE RANGE: delete all dishes for this date, then INSERT fresh copies ──
        //
        // CRITICAL: we MUST strip dish IDs and use INSERT (not upsert).
        // If we kept the same dish IDs across multiple dates, each iteration
        // would UPDATE (re-parent) the existing dishes to the current menu_id,
        // leaving all previous dates with zero dishes.
        await supabaseAdmin.from('dishes').delete().eq('menu_id', menu.id)

        if (parsed.dishes.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { error: dishError } = await supabaseAdmin.from('dishes').insert(
            parsed.dishes.map(({ id: _stripped, ...dish }) => ({
              ...dish,
              menu_id: menu.id,
              // id intentionally omitted — Supabase generates a fresh UUID per date
            }))
          )
          if (dishError) throw dishError
        }

      } else {
        // ── SINGLE DATE: smart sync — preserve edits, only remove deleted dishes ──
        const { data: existingDishes } = await supabaseAdmin
          .from('dishes')
          .select('id')
          .eq('menu_id', menu.id)

        const existingDishIds = existingDishes?.map(row => row.id) || []
        const receivedDishIds = parsed.dishes.map(dish => dish.id).filter(Boolean) as string[]
        const dishesToDelete = existingDishIds.filter(id => !receivedDishIds.includes(id))

        if (dishesToDelete.length > 0) {
          await supabaseAdmin.from('dishes').delete().in('id', dishesToDelete)
        }

        if (parsed.dishes.length > 0) {
          const dishesToUpsert = parsed.dishes.map(({ id, ...dish }) => {
            // Keep the ID only if this dish already belongs to this menu's date.
            // Otherwise, strip the ID so Supabase inserts a fresh row. This prevents
            // "stealing" dishes from past menus when a user copies an old menu to a new date.
            if (id && existingDishIds.includes(id)) {
              return { id, ...dish, menu_id: menu.id }
            }
            return { ...dish, menu_id: menu.id }
          })

          const { error: dishError } = await supabaseAdmin.from('dishes').upsert(dishesToUpsert)
          if (dishError) throw dishError
        }
      }
    }

    return NextResponse.json({ success: true, count: datesToProcess.length }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('[Menu API] Validation error:', JSON.stringify(err.issues, null, 2))
      const fieldErrors = err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(' | ')
      return NextResponse.json({
        error: `Error de validación: ${fieldErrors}`,
        details: err.issues,
      }, { status: 422 })
    }
    console.error('[Menu API] Unexpected error:', err)
    return NextResponse.json({ error: 'Failed to save menu' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const limited = rateLimit(request, 10)
  if (limited) return limited

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    const supabaseAdmin = createAdminClient()

    if (id) {
      const { error } = await supabaseAdmin.from('daily_menus').delete().eq('id', id)
      if (error) throw error
    } else if (startDate && endDate) {
      const { error } = await supabaseAdmin.from('daily_menus').delete().gte('date', startDate).lte('date', endDate)
      if (error) throw error
    } else {
      return NextResponse.json({ error: 'Faltan parámetros requeridos para eliminar.' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete menu' }, { status: 500 })
  }
}
