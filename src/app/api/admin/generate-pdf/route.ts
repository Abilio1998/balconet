import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import React from 'react'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { menu, lang, folder } = await req.json()

    if (!menu || !lang || !folder) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const filename = `${menu.date}-${lang}.pdf`

    // 🔥 IMPORTS DINÁMICOS (CLAVE)
    let ReactPdf;
    if (process.env.NODE_ENV === 'development') {
      // Hide from Turbopack in local dev to prevent fatal panics, use native async import for ESM
      ReactPdf = await (new Function("return import('@react-pdf/renderer')"))();
    } else {
      // Standard dynamic import for production (Webpack tracing for Netlify)
      ReactPdf = await import('@react-pdf/renderer');
    }
    
    const { renderToBuffer } = ReactPdf;
    const { MenuPDF } = await import('@/lib/MenuPDF')

    const pdfBuffer = await renderToBuffer(
      React.createElement(MenuPDF, { menu, lang, logoData: null, ReactPdf }) as any
    )

    const supabase = createAdminClient()

    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.find(b => b.name === 'menus')

    if (!bucketExists) {
      await supabase.storage.createBucket('menus', {
        public: true,
        allowedMimeTypes: ['application/pdf']
      })
    }

    const { error: uploadError } = await supabase.storage
      .from('menus')
      .upload(`${folder}/${filename}`, pdfBuffer, {
        upsert: true,
        contentType: 'application/pdf'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
    }

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (err: any) {
    console.error('Server error during PDF generation:', err)
    try { require('fs').writeFileSync('pdf-error.log', err.stack || err.message || String(err)); } catch (e) {}
    return NextResponse.json({
      error: 'Error al generar el PDF en el servidor',
      details: err.message || 'Unknown error',
    }, { status: 500 })
  }
}