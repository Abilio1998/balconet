import { NextRequest, NextResponse } from 'next/server'
import { translateText } from '@/lib/translations'

export async function POST(request: NextRequest) {
  try {
    const { name, description, supplements } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 })
    }

    const translations = await translateText(name, description, supplements)

    return NextResponse.json({ success: true, translations })
  } catch (err) {
    console.error('Translation error:', err)
    return NextResponse.json({ error: 'Error al procesar la traducción' }, { status: 500 })
  }
}
