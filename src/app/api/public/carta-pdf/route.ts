import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient()
    
    // We check the menus bucket for the carta-real folder
    const { data: files, error } = await supabaseAdmin.storage
      .from('menus')
      .list('carta-real', { limit: 20, sortBy: { column: 'created_at', order: 'asc' } })

    if (error) throw error

    // Find all valid files
    const validFiles = files?.filter(f => f.name !== '.emptyFolderPlaceholder') || []

    if (validFiles.length === 0) {
      return NextResponse.json({ documents: [] })
    }

    // Map them to public URLs
    const documents = validFiles.map(f => {
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('menus')
        .getPublicUrl(`carta-real/${f.name}`)

      return {
        id: f.name,
        url: publicUrl,
        isPdf: f.name.toLowerCase().endsWith('.pdf')
      }
    })

    return NextResponse.json({ documents })
  } catch (err) {
    console.error('Error fetching public carta PDFs:', err)
    return NextResponse.json({ documents: [] }) // Return seamlessly
  }
}
