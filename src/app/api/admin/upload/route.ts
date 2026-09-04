import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'carta' or 'hero'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const bucketName = type === 'dish' ? 'carta-image' : 'images'

    // 1. Ensure bucket exists (or at least try to create it)
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === bucketName)

    if (!bucketExists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      })
      if (createError) {
        console.error('Error creating bucket:', createError)
        // If it fails because it already exists (race condition), ignore. 
        // Otherwise, it might be a permissions issue.
      }
    }

    // 2. Prepare file name and path
    const fileExt = file.name.split('.').pop()
    const fileName = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`
    const filePath = `${type}/${fileName}`

    // 3. Upload file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) throw uploadError

    // 4. Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return NextResponse.json({ url: publicUrl })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: err.message || 'Failed to upload image' }, { status: 500 })
  }
}
