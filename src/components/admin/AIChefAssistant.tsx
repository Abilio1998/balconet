'use client'

import { useState } from 'react'
import { Sparkles, Utensils, ChefHat, Send, Loader2, BookOpen, AlertCircle, TrendingDown, Palette, CheckCircle2, Ban } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function AIChefAssistant() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('')
  const [query, setQuery] = useState('')

  // States
  const [firstsCount, setFirstsCount] = useState(3)
  const [secondsCount, setSecondsCount] = useState(3)
  const [ingredients, setIngredients] = useState('')
  const [useAllergens, setUseAllergens] = useState(true)

  const handleGenerateMenu = async (customPrompt?: string, isPlating = false) => {
    setLoading(true)
    if (!isPlating) setResponse('')

    // Si no hay prompt personalizado, generamos el del menú del día
    const finalPrompt = customPrompt || `Genera ideas para un Menú del Día con ${firstsCount} platos de primero y ${secondsCount} platos de segundo. 
    Es obligatorio o importante usar estos ingredientes o sabores: ${ingredients || 'Cualquiera de temporada'}. 
    Presenta solo los nombres de los platos y una breve justificación creativa.`

    try {
      const res = await fetch('/api/admin/kitchen/ai-chef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          useAllergens,
          isPlatingRequest: isPlating
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      if (isPlating) {
        // Si es una idea de emplatado, la añadimos al final de lo que ya había
        setResponse(prev => prev + '\n\n---\n\n' + data.content)
      } else {
        setResponse(data.content)
      }
    } catch (err: any) {
      setResponse(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/admin/kitchen/ai-chef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          useAllergens
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResponse(data.content)
      setQuery('')
    } catch (err: any) {
      setResponse(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">

      {/* Col 1: Tools & Inputs */}
      <div className="lg:col-span-1 space-y-6">

        {/* Generator Card */}
        <div className="bg-[#111111] border border-white/10 p-6 rounded-sm shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Utensils size={80} />
          </div>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <Sparkles className="text-[#D4AF37]" size={20} />
            <h2 className="font-serif text-lg text-white">Generador de Menú</h2>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Toggle Alérgenos */}
            <div className="bg-black/20 border border-white/5 p-4 rounded-sm flex items-center justify-between group cursor-pointer" onClick={() => setUseAllergens(!useAllergens)}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-sm transition-colors ${useAllergens ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {useAllergens ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                </div>
                <div>
                  <p className="text-[10px] text-white font-bold uppercase tracking-widest">Filtro Alérgenos</p>
                  <p className="text-[9px] text-white/30 uppercase">{useAllergens ? 'Activado (Datos de clientes)' : 'Desactivado (Libre)'}</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${useAllergens ? 'bg-green-600' : 'bg-white/10'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useAllergens ? 'left-6' : 'left-1'}`} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 block">Primeros platos</label>
                <input
                  type="number"
                  value={firstsCount}
                  onChange={(e) => setFirstsCount(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2 text-white focus:border-[#D4AF37] outline-none transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40 block">Segundos platos</label>
                <input
                  type="number"
                  value={secondsCount}
                  onChange={(e) => setSecondsCount(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2 text-white focus:border-[#D4AF37] outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 block">Ingredientes destacados</label>
              <textarea
                placeholder="Ej: Nueces, bechamel, setas de cardo..."
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                className="w-full h-24 bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white focus:border-[#D4AF37] outline-none transition-all resize-none text-sm placeholder:text-white/10"
              />
            </div>

            <button
              onClick={() => handleGenerateMenu()}
              disabled={loading}
              className="w-full bg-[#D4AF37] text-black font-bold py-4 rounded-sm flex items-center justify-center gap-2 hover:bg-[#E8C84A] transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-[#D4AF37]/10"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Utensils size={18} />}
              GENERAR IDEAS
            </button>
          </div>
        </div>

        {/* Action Quick Tools (NEW) */}
        {response && !loading && (
          <div className="bg-[#111111] border border-[#D4AF37]/30 p-6 rounded-sm space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-bold">Herramientas de Dise&ntilde;o</h3>
            <button
              onClick={() => handleGenerateMenu(response, true)}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all group"
            >
              <Palette size={16} className="text-[#D4AF37] group-hover:scale-110 transition-transform" />
              Sugerir Emplatado Textual
            </button>
          </div>
        )}

      </div>

      {/* Col 2 & 3: Chat & Output */}
      <div className="lg:col-span-2 flex flex-col h-[750px] bg-[#111111] border border-white/10 rounded-sm overflow-hidden shadow-2xl relative">

        {/* Header */}
        <div className="bg-white/5 p-5 border-b border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#D4AF37]/10 flex items-center justify-center rounded-sm border border-[#D4AF37]/20">
              <ChefHat className="text-[#D4AF37]" size={24} />
            </div>
            <div>
              <h3 className="text-white text-base font-serif">Chef Ejecutivo Digital</h3>
              <p className={`text-[10px] flex items-center gap-2 font-bold uppercase tracking-widest ${loading ? 'text-yellow-500' : 'text-green-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                {loading ? 'Preparando ideas...' : 'En línea • Asesorando'}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] text-white/30 uppercase tracking-widest">Base de Datos</p>
              <p className="text-[10px] text-white/60 font-bold uppercase">{useAllergens ? 'Sincronizada' : 'Modo Libre'}</p>
            </div>
          </div>
        </div>

        {/* Output Scroll Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
          {!response && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
              <ChefHat size={64} className="text-white mb-6" />
              <h4 className="text-white font-serif text-2xl mb-4 italic">"La cocina es un lenguaje mediante el cual se puede expresar armonía, creatividad y felicidad."</h4>
              <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] max-w-sm">
                Inicia el generador lateral o pregunta cualquier duda técnica.
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex gap-6 max-w-4xl mx-auto">
                <div className="hidden sm:flex w-10 h-10 rounded-sm bg-[#D4AF37]/10 items-center justify-center shrink-0 border border-[#D4AF37]/20">
                  <Sparkles size={18} className="text-[#D4AF37]" />
                </div>
                <div className="flex-1 space-y-6">
                  <div className="prose prose-invert prose-lg max-w-none 
                      prose-headings:font-serif prose-headings:text-[#D4AF37] prose-headings:border-b prose-headings:border-[#D4AF37]/20 prose-headings:pb-2 prose-headings:mb-8
                      prose-p:text-white/70 prose-p:leading-relaxed prose-p:mb-6
                      prose-li:text-white/60 prose-li:my-2
                      prose-strong:text-white prose-strong:font-bold
                      prose-hr:border-white/5 prose-hr:my-10">
                    {loading && !response ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
                        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.4em] font-bold">Creando alta gastronomía...</p>
                      </div>
                    ) : (
                      <ReactMarkdown>{response}</ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Area */}
        <div className="p-6 bg-black/40 border-t border-white/5 backdrop-blur-md">
          <form onSubmit={handleChat} className="flex gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative group">
              <input
                type="text"
                placeholder="Pide una receta, consejo de emplatado o técnica..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-sm px-6 py-4 text-white focus:border-[#D4AF37] focus:bg-white/[0.05] outline-none transition-all text-sm pr-12"
                disabled={loading}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-50 transition-opacity">
                <ChefHat size={18} className="text-white" />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black px-8 rounded-sm border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all disabled:opacity-50 font-bold uppercase text-[10px] tracking-widest flex items-center justify-center shadow-lg shadow-[#D4AF37]/5"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
