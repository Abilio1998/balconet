import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const bucketName = 'menus'
    const folderPath = 'carta-real'

    // Update bucket configuration to allow images and PDFs
    try {
      await supabaseAdmin.storage.updateBucket(bucketName, {
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        public: true
      })
    } catch (e) {
      console.warn("Could not update bucket config, proceeding anyway:", e)
    }

    // Format file name chronologically to retain sequence order
    const fileExt = file.name.split('.').pop()
    const fileName = `carta-actual-${Date.now()}.${fileExt}`
    const filePath = `${folderPath}/${fileName}`

    // 3. Upload file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type || 'application/pdf',
        upsert: true
      })

    if (uploadError) throw uploadError

    // 4. Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return NextResponse.json({ url: publicUrl })
  } catch (err: any) {
    console.error('Upload carta error:', err)
    return NextResponse.json({ error: err.message || 'Error al subir la carta' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { fileName } = await request.json()
    if (!fileName) {
      return NextResponse.json({ error: 'Falta el nombre del archivo' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin.storage
      .from('menus')
      .remove([`carta-real/${fileName}`])

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Delete carta error:', err)
    return NextResponse.json({ error: err.message || 'Error al eliminar el documento' }, { status: 500 })
  }
}
