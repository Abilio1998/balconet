import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { translateText } from '@/lib/translations'

export async function GET() {
  const supabase = createAdminClient()
  
  try {
    // 1. Get Dishes
    const { data: dishes } = await supabase.from('dishes').select('*').order('created_at', { ascending: false })
    
    // 2. Get Carta Products
    const { data: products } = await supabase.from('carta_products').select('*').order('order_index')
    
    // 3. Get Carta Categories
    const { data: categories } = await supabase.from('carta_categories').select('*').order('order_index')

    const stats = {
      dishes: {
        total: dishes?.length || 0,
        pending: dishes?.filter((d: any) => !d.name_ca || !d.name_en || !d.name_fr).length || 0
      },
      products: {
        total: products?.length || 0,
        pending: products?.filter((p: any) => !p.name_ca || !p.name_en || !p.name_fr).length || 0
      },
      categories: {
        total: categories?.length || 0,
        pending: categories?.filter((c: any) => !c.name_ca || !c.name_en || !c.name_fr).length || 0
      }
    }

    return NextResponse.json({ success: true, stats, data: { dishes, products, categories } })
  } catch (err) {
    console.error('Error fetching global translation status:', err)
    return NextResponse.json({ error: 'Error al obtener estado de traducciones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const { type, items } = await request.json()

  if (!items || !Array.isArray(items)) {
    return NextResponse.json({ error: 'No hay elementos para traducir' }, { status: 400 })
  }

  try {
    const results = []
    
    for (const item of items) {
      const { id, name, description } = item
      const translations = await translateText(name, description)
      
      let updateData: any = {
        name_ca: translations.ca.name,
        name_en: translations.en.name,
        name_fr: translations.fr.name,
      }
      
      if (description) {
        updateData.description_ca = translations.ca.description
        updateData.description_en = translations.en.description
        updateData.description_fr = translations.fr.description
      }

      const table = type === 'dish' ? 'dishes' : (type === 'category' ? 'carta_categories' : 'carta_products')
      
      const { data, error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      results.push(data)
      
      // Pequeña pausa — Google Translate es más rápido que Groq
      await new Promise(r => setTimeout(r, 150))
    }

    return NextResponse.json({ success: true, items: results })
  } catch (err) {
    console.error('Error in batch translation:', err)
    return NextResponse.json({ error: 'Error en la traducción masiva' }, { status: 500 })
  }
}
