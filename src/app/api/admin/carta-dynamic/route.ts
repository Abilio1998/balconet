import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { rateLimit, sanitizeString } from '@/lib/security'
import { z } from 'zod'

const supplementSchema = z.object({
  name: z.string(),
  name_ca: z.string().optional().nullable(),
  name_en: z.string().optional().nullable(),
  name_fr: z.string().optional().nullable(),
  price: z.number(),
})

const promoScheduleSchema = z.object({
  start: z.string(), // "08:00"
  end: z.string(), // "12:00"
  days: z.array(z.string()), // ["mon", "tue"...]
})

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  name_ca: z.string().max(200).optional().nullable(),
  name_en: z.string().max(200).optional().nullable(),
  name_fr: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  description_ca: z.string().max(500).optional().nullable(),
  description_en: z.string().max(500).optional().nullable(),
  description_fr: z.string().max(500).optional().nullable(),
  price: z.number().optional().nullable(),
  price_exterior: z.number().optional().nullable(),
  allergens: z.array(z.string()).default([]),
  order_index: z.number().int().min(0),
  is_featured: z.boolean().optional().nullable(),
  is_web_featured: z.boolean().optional().nullable(),
  show_in_lunch: z.boolean().default(true),
  show_in_dinner: z.boolean().default(true),
  show_in_breakfast: z.boolean().default(true),
  available_days: z.array(z.string()).default(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  image_url: z.string().url().optional().nullable(),
  image_alt: z.string().max(200).optional().nullable(),
  supplements: z.array(supplementSchema).optional().nullable(),
  show_in_ficha: z.boolean().default(true).optional().nullable(),
  promo_schedules: z.array(promoScheduleSchema).optional().nullable(),
})

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  name_ca: z.string().max(200).optional().nullable(),
  name_en: z.string().max(200).optional().nullable(),
  name_fr: z.string().max(200).optional().nullable(),
  is_visible: z.boolean().default(true),
  hide_in_full: z.boolean().optional().nullable(),
  show_in_ficha: z.boolean().default(true).optional().nullable(),
  pdf_layout_lunch: z.string().optional().nullable(),
  pdf_layout_dinner: z.string().optional().nullable(),
  order_index: z.number().int().min(0),
  products: z.array(productSchema).max(100),
})

const saveCartaSchema = z.array(categorySchema).max(40)

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 20)
  if (limited) return limited

  try {
    const supabaseAdmin = createAdminClient()
    
    // Fetch all categories
    const { data: categories, error: catError } = await supabaseAdmin
      .from('carta_categories')
      .select(`*`)
      .order('order_index', { ascending: true })

    if (catError) throw catError

    // Fetch all products
    const { data: products, error: prodError } = await supabaseAdmin
      .from('carta_products')
      .select(`*`)
      .order('order_index', { ascending: true })

    if (prodError) throw prodError

    // Combine
    const fullCarta = categories.map(cat => ({
      ...cat,
      products: products.filter(p => p.category_id === cat.id)
    }))

    return NextResponse.json({ carta: fullCarta })
  } catch (err) {
    console.error('Error fetching dynamic carta:', err)
    return NextResponse.json({ error: 'Failed to fetch dynamic carta' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 10)
  if (limited) return limited

  try {
    const body = await request.json()
    const parsed = saveCartaSchema.parse(body)
    const supabaseAdmin = createAdminClient()

    // We'll perform a sync: anything not in 'parsed' should be deleted (simple model)
    // 1. Get existing IDs to know what to delete
    const { data: existingCats } = await supabaseAdmin.from('carta_categories').select('id')
    const existingCatIds = existingCats?.map(c => c.id) || []
    const receivedCatIds = parsed.map(c => c.id).filter(Boolean) as string[]
    const catsToDelete = existingCatIds.filter(id => !receivedCatIds.includes(id))

    // 2. Perform deletes
    if (catsToDelete.length > 0) {
      // First delete all products belonging to these categories to prevent Foreign Key constraint errors
      await supabaseAdmin.from('carta_products').delete().in('category_id', catsToDelete)
      // Then delete the categories themselves
      await supabaseAdmin.from('carta_categories').delete().in('id', catsToDelete)
    }

    // 3. Upsert Categories and Products
    for (const cat of parsed) {
      const { id: catId, products, ...catData } = cat
      
      const { data: savedCat, error: catError } = await supabaseAdmin
        .from('carta_categories')
        .upsert({
          ...(catId ? { id: catId } : {}),
          ...catData,
          name: sanitizeString(catData.name),
          name_ca: catData.name_ca ? sanitizeString(catData.name_ca) : null,
          name_en: catData.name_en ? sanitizeString(catData.name_en) : null,
          name_fr: catData.name_fr ? sanitizeString(catData.name_fr) : null,
          show_in_ficha: catData.show_in_ficha !== undefined ? catData.show_in_ficha : true,
          pdf_layout_lunch: catData.pdf_layout_lunch || 'classic',
          pdf_layout_dinner: catData.pdf_layout_dinner || 'classic',
        })
        .select('id')
        .single()

      if (catError || !savedCat) throw catError

      // Products for this category
      const currentCatId = savedCat.id
      
      // Get existing product IDs for this category for deletion
      const { data: catProds } = await supabaseAdmin.from('carta_products').select('id').eq('category_id', currentCatId)
      const existingProdIds = catProds?.map(p => p.id) || []
      const receivedProdIds = products.map(p => p.id).filter(Boolean) as string[]
      const prodsToDelete = existingProdIds.filter(id => !receivedProdIds.includes(id))

      if (prodsToDelete.length > 0) {
        await supabaseAdmin.from('carta_products').delete().in('id', prodsToDelete)
      }

      // Upsert products
      if (products.length > 0) {
        const productsToProcess = products.map(p => ({
          id: p.id || undefined,
          category_id: currentCatId,
          name: sanitizeString(p.name),
          name_ca: p.name_ca ? sanitizeString(p.name_ca) : null,
          name_en: p.name_en ? sanitizeString(p.name_en) : null,
          name_fr: p.name_fr ? sanitizeString(p.name_fr) : null,
          description: p.description ? sanitizeString(p.description) : null,
          description_ca: p.description_ca ? sanitizeString(p.description_ca) : null,
          description_en: p.description_en ? sanitizeString(p.description_en) : null,
          description_fr: p.description_fr ? sanitizeString(p.description_fr) : null,
          price: p.price,
          price_exterior: p.price_exterior,
          allergens: p.allergens,
          order_index: p.order_index,
          is_featured: p.is_featured,
          is_web_featured: p.is_web_featured,
          show_in_lunch: p.show_in_lunch,
          show_in_dinner: p.show_in_dinner,
          show_in_breakfast: p.show_in_breakfast,
          available_days: p.available_days,
          image_url: p.image_url,
          image_alt: p.image_alt ? sanitizeString(p.image_alt) : null,
          supplements: p.supplements,
          show_in_ficha: p.show_in_ficha !== undefined ? p.show_in_ficha : true,
          promo_schedules: p.promo_schedules || [],
        }))

        const updates = productsToProcess.filter(p => p.id)
        const inserts = productsToProcess.map(({ id, ...rest }) => rest).filter((_, i) => !productsToProcess[i].id)

        if (updates.length > 0) {
          const { error: updateError } = await supabaseAdmin.from('carta_products').upsert(updates)
          if (updateError) throw updateError
        }
        
        if (inserts.length > 0) {
          const { error: insertError } = await supabaseAdmin.from('carta_products').insert(inserts)
          if (insertError) throw insertError
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('Validation Error:', err.issues)
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 422 })
    }
    console.error('Save Error Details:', err)
    return NextResponse.json({ 
      error: 'Failed to save carta', 
      details: err instanceof Error ? err.message : String(err) 
    }, { status: 500 })
  }
}
