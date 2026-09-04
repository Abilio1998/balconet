import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string // 'diario' or 'fin-de-semana'
    const filename = formData.get('filename') as string

    if (!file || !folder || !filename) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()
    
    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.find(b => b.name === 'menus')
    
    if (!bucketExists) {
      await supabase.storage.createBucket('menus', {
        public: true,
        allowedMimeTypes: ['application/pdf']
      })
    }
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('menus')
      .upload(`${folder}/${filename}`, file, {
        upsert: true,
        contentType: 'application/pdf'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, path: uploadData.path })
  } catch (err: any) {
    console.error('Server error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
