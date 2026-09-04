import { NextRequest, NextResponse } from 'next/server'
import translate from 'google-translate-api-x'
import Groq from 'groq-sdk'

async function spellcheckWithGroq(text: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) throw new Error("No GROQ_API_KEY");
  
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  
  const systemPrompt = `You are an expert culinary spellchecker for a high-end restaurant in Spain.
Your task is to correct ONLY the spelling, accents, and punctuation of the provided Spanish menu text.
Rules:
1. DO NOT translate the text. Keep it in Spanish.
2. Fix missing accents (e.g., "fideua" -> "fideuá", "arroz" -> "arróz" is incorrect, keep "arroz", "jamon" -> "jamón").
3. DO NOT change the culinary meaning or words, just fix orthographic errors.
4. ONLY return the corrected text. Do not add quotes, notes, or explanations.
5. Preserve the exact structure, including the '|||' separators if they exist.`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    max_completion_tokens: 500,
  });

  return completion.choices[0]?.message?.content?.trim() || text;
}

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json()

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Faltan los platos a corregir' }, { status: 400 })
    }

    const correctedItems = []
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    for (const item of items) {
      if (!item.name?.trim()) {
        correctedItems.push(item)
        continue
      }

      const textToTranslate = item.description 
        ? `${item.name} ||| ${item.description}` 
        : item.name

      let correctedName = item.name;
      let correctedDescription = item.description;

      try {
        let cleanText = '';
        
        try {
          // 1. Try Llama 3 for intelligent context-aware spellchecking
          cleanText = await spellcheckWithGroq(textToTranslate);
        } catch (groqErr) {
          console.warn(`Groq spellcheck failed, falling back to Google autoCorrect:`, groqErr);
          // 2. Fallback to Google autoCorrect
          const res = await translate(textToTranslate, { from: 'es', to: 'en', autoCorrect: true }) as any
          if (res.from?.text?.autoCorrected || res.from?.text?.didYouMean) {
            const rawCorrectedText = res.from.text.value || textToTranslate
            cleanText = rawCorrectedText.replace(/\[/g, '').replace(/\]/g, '')
          } else {
            cleanText = textToTranslate;
          }
        }

        if (cleanText !== textToTranslate) {
          if (item.description) {
            const parts = cleanText.split('|||')
            correctedName = parts[0]?.trim() || item.name
            correctedDescription = parts[1]?.trim() || item.description
          } else {
            correctedName = cleanText.trim()
          }
        }

        correctedItems.push({
          ...item,
          name: correctedName,
          description: correctedDescription
        })

        await delay(500) // Avoid rate limits
      } catch (err) {
        console.error(`Error auto-correcting item:`, err)
        correctedItems.push(item) // Fallback to original
      }
    }

    return NextResponse.json({ success: true, items: correctedItems })
  } catch (err) {
    console.error('Spellcheck error:', err)
    return NextResponse.json({ error: 'Error al corregir ortografía' }, { status: 500 })
  }
}
