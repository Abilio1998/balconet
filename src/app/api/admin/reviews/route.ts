import { NextResponse, NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'El payload debe ser un array de reseñas' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    
    // Vital: Ensure the storage bucket permits JSON files, otherwise it gets rejected by the strict MIME policies we set yesterday
    try {
      await supabaseAdmin.storage.updateBucket('menus', {
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/json'],
        public: true
      })
    } catch (e) {
      console.warn("Could not auto-update bucket config to allow JSON:", e)
    }

    // Convert array structure into a clean JSON string
    const jsonString = JSON.stringify(body, null, 2)
    const jsonBuffer = Buffer.from(jsonString, 'utf-8')
    
    // Overwrite the single file cleanly without altering the database schema
    const { error } = await supabaseAdmin.storage
      .from('menus')
      .upload('reviews.json', jsonBuffer, {
        contentType: 'application/json',
        upsert: true
      })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, reviews: body })
  } catch (err: any) {
    console.error('Error saving reviews.json:', err)
    return NextResponse.json({ error: err.message || 'Error guardando reseñas' }, { status: 500 })
  }
}
