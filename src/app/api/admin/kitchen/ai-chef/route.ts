import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import Groq from 'groq-sdk'

const supabase = createAdminClient()

function getSeason() {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'Primavera'
  if (month >= 6 && month <= 8) return 'Verano'
  if (month >= 9 && month <= 11) return 'Otoño'
  return 'Invierno'
}

export async function POST(req: Request) {
  const session = await auth()
  const userRole = (session?.user as any)?.role

  if (!session || (userRole !== 'admin' && userRole !== 'cocina')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey || apiKey === 'tu_clave_groq_aqui') {
    return NextResponse.json({ error: 'La clave de Groq no está configurada.' }, { status: 500 })
  }

  try {
    const { prompt, useAllergens = true, isPlatingRequest = false } = await req.json()

    let allergenContext = 'Ninguno en particular o filtro desactivado.'
    
    if (useAllergens) {
      // 1. Fetch allergen trends from Supabase
      const { data: allergenData } = await supabase
        .from('interaction_events')
        .select('event_value')
        .eq('event_type', 'allergen_filter')
        .gt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const allergenCounts: Record<string, number> = {}
      allergenData?.forEach(e => {
        if (e.event_value) {
          allergenCounts[e.event_value] = (allergenCounts[e.event_value] || 0) + 1
        }
      })

      const topAllergens = Object.entries(allergenCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name)
        .join(', ')
      
      if (topAllergens) allergenContext = topAllergens
    }

    const season = getSeason()

    // 2. Call Groq
    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Eres un Chef Ejecutivo experto y asesor gastronómico senior para el restaurante "El Balconet".
Tu objetivo es ayudar al Jefe de Cocina de forma práctica, creativa y profesional.

CONTEXTO ACTUAL:
- Estación: ${season} (Prioriza ingredientes frescos de esta época).
- Sensibilidad de clientes (Alérgenos): ${allergenContext}.

REGLAS DE FORMATO Y ESTILO (CRÍTICO):
- Sé extremadamente visual. Si te piden un plato, descríbelo con pasión pero con brevedad.
- USA MUCHO ESPACIO EN BLANCO. Separa los párrafos claramente.
- Usa listas con viñetas para ingredientes o pasos.
- Si se detecta un interés en EMPLATADO (isPlatingRequest: ${isPlatingRequest}), dedica una sección específica a la estética: vajilla, disposición, colores y decoraciones finales.
- Usa una estructura limpia de Markdown (Títulos ##, negritas **texto**).`
        },
        {
          role: 'user',
          content: isPlatingRequest 
            ? `Basado en esta idea: "${prompt}", proporcióname una guía detallada de emplatado profesional y visualmente impresionante.` 
            : prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = completion.choices[0]?.message?.content || 'Sin respuesta de la IA.'
    return NextResponse.json({ content })

  } catch (error: any) {
    console.error('Groq Chef Error:', error)
    return NextResponse.json({ error: 'Error: ' + error.message }, { status: 500 })
  }
}
