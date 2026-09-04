import translate from 'google-translate-api-x'

function decodeHTMLEntities(text: string): string {
  let decoded = text
  let prev
  do {
    prev = decoded
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#x2F;/g, '/')
  } while (decoded !== prev)
  return decoded
}

// ---------------------------------------------------------------
// GOOGLE TRANSLATE — ÚNICO SISTEMA
// ---------------------------------------------------------------
async function translateWithGoogle(text: string, targetLang: string): Promise<string> {
  const res = await translate(text, { from: 'es', to: targetLang })
  const rawText = Array.isArray(res) ? res[0].text : (res as any).text
  return decodeHTMLEntities(rawText)
}

// ---------------------------------------------------------------
// FUNCIÓN PRINCIPAL DE TRADUCCIÓN
// ---------------------------------------------------------------
export async function translateText(
  name: string,
  description?: string | null,
  supplements?: string[]
): Promise<Record<string, { name: string; description?: string; supplements?: string[] }>> {
  const languages = ['ca', 'en', 'fr']
  const translations: Record<string, { name: string; description?: string; supplements?: string[] }> = {}

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  let textToTranslate = name
  if (description) textToTranslate += ` ||| ${description}`
  if (supplements && supplements.length > 0) {
    textToTranslate += ` ||| ${supplements.join(' ### ')}`
  }

  for (const lang of languages) {
    let translatedText = ''
    try {
      translatedText = await translateWithGoogle(textToTranslate, lang)
    } catch (googleErr) {
      console.error(`Google Translate failed for ${lang}:`, googleErr)
      translations[lang] = { name, description: description || undefined, supplements }
      continue
    }

    // Separar partes: nombre ||| descripción ||| suplementos
    const parts = translatedText.split('|||')
    let translatedName = parts[0]?.trim() || name
    let translatedDesc = description ? (parts[1]?.trim() || description) : undefined

    // Hard-cap de seguridad para no romper el schema de DB
    if (translatedName.length > 195) {
      translatedName = translatedName.slice(0, 195).trimEnd()
      console.warn(`[translate] name_${lang} truncated for "${name}"`)
    }
    if (translatedDesc && translatedDesc.length > 490) {
      translatedDesc = translatedDesc.slice(0, 490).trimEnd()
      console.warn(`[translate] description_${lang} truncated for "${name}"`)
    }

    let supplementsPart = ''
    if (description && parts.length > 2) {
      supplementsPart = parts[2]
    } else if (!description && parts.length > 1) {
      supplementsPart = parts[1]
    }

    const translatedSups = supplementsPart
      ? supplementsPart.split('###').map(s => s.trim())
      : (supplements || [])

    translations[lang] = {
      name: translatedName,
      description: translatedDesc,
      supplements: translatedSups
    }

    await delay(200) // Delay simple
  }

  return translations
}
