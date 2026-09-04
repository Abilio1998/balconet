import { NextResponse } from 'next/server'
import React from 'react'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { categories, lang, session } = await req.json()

    if (!categories) {
      return NextResponse.json({ error: 'Missing categories' }, { status: 400 })
    }

    const currentSession = session || 'lunch'

    // 🔥 IMPORTS DINÁMICOS
    let ReactPdf;
    if (process.env.NODE_ENV === 'development') {
      ReactPdf = await (new Function("return import('@react-pdf/renderer')"))();
    } else {
      ReactPdf = await import('@react-pdf/renderer');
    }
    
    const { renderToBuffer } = ReactPdf;
    const { CartaLunchPDF } = await import('@/lib/CartaLunchPDF')

    const pdfBuffer = await renderToBuffer(
      React.createElement(CartaLunchPDF, { categories, lang: lang || 'es', session: currentSession, ReactPdf }) as any
    )

    const filenames: any = {
      breakfast: 'Carta_Desayuno.pdf',
      lunch: 'Carta_Mediodia.pdf',
      dinner: 'Carta_Noche.pdf'
    }

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filenames[currentSession] || 'Carta.pdf'}"`
      }
    })

  } catch (err: any) {
    console.error('Server error during Session PDF generation:', err)
    return NextResponse.json({
      error: 'Error al generar el PDF de la carta',
      details: err.message || 'Unknown error',
    }, { status: 500 })
  }
}
