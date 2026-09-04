'use client'

import { ChefHat, Sparkles, TrendingDown, BookOpen, Star, UtensilsCrossed, CheckCircle2, Palette, Ban } from 'lucide-react'

export default function ChefHelpGuide() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      
      {/* Header Premium */}
      <div className="text-center space-y-4 pt-8">
        <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 px-4 py-2 rounded-full border border-[#D4AF37]/20 mb-4">
           <ChefHat className="text-[#D4AF37]" size={18} />
           <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Manual del Jefe de Cocina</span>
        </div>
        <h1 className="font-serif text-5xl text-white">Bienvenidos a la Cocina 4.0</h1>
        <p className="text-white/40 text-lg max-w-2xl mx-auto">
          Inteligencia Artificial diseñada para elevar la creatividad y eficiencia de "El Balconet".
        </p>
      </div>

      {/* Los 4 Pilares del Chef Digital */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-[#111111] border border-white/5 p-6 rounded-sm hover:border-[#D4AF37]/30 transition-all group">
          <div className="w-10 h-10 bg-[#D4AF37]/10 flex items-center justify-center rounded-sm mb-4 group-hover:scale-110 transition-transform">
            <TrendingDown className="text-[#D4AF37]" size={20} />
          </div>
          <h3 className="text-white text-base font-serif mb-2">Control de Alérgenos</h3>
          <p className="text-white/30 text-[11px] leading-relaxed">
            Filtra tus creaciones usando los datos reales de alérgenos detectados en tus clientes.
          </p>
        </div>

        <div className="bg-[#111111] border border-white/5 p-6 rounded-sm hover:border-blue-500/30 transition-all group">
          <div className="w-10 h-10 bg-blue-500/10 flex items-center justify-center rounded-sm mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="text-blue-400" size={20} />
          </div>
          <h3 className="text-white text-base font-serif mb-2">Estacionalidad</h3>
          <p className="text-white/30 text-[11px] leading-relaxed">
            Sugerencias basadas en productos frescos según la estación del año actual.
          </p>
        </div>

        <div className="bg-[#111111] border border-white/5 p-6 rounded-sm hover:border-purple-500/30 transition-all group">
          <div className="w-10 h-10 bg-purple-500/10 flex items-center justify-center rounded-sm mb-4 group-hover:scale-110 transition-transform">
            <Palette className="text-purple-400" size={20} />
          </div>
          <h3 className="text-white text-base font-serif mb-2">Asesor de Diseño</h3>
          <p className="text-white/30 text-[11px] leading-relaxed">
            Guía experta de emplatado: vajilla, colores y texturas para cada creación.
          </p>
        </div>

        <div className="bg-[#111111] border border-white/5 p-6 rounded-sm hover:border-green-500/30 transition-all group">
          <div className="w-10 h-10 bg-green-500/10 flex items-center justify-center rounded-sm mb-4 group-hover:scale-110 transition-transform">
            <BookOpen className="text-green-400" size={20} />
          </div>
          <h3 className="text-white text-base font-serif mb-2">Técnica Culinaria</h3>
          <p className="text-white/30 text-[11px] leading-relaxed">
            Recetarios paso a paso y consejos de cocción profesional en segundos.
          </p>
        </div>

      </div>

      {/* Sección Especial: Nuevas Herramientas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Toggle Alérgenos Explicación */}
        <div className="bg-black/40 border border-white/10 p-8 rounded-sm space-y-4">
           <div className="flex items-center gap-3 text-[#D4AF37]">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center shadow-lg shadow-[#D4AF37]/5">
                 <Ban size={16} />
              </div>
              <h3 className="text-white font-serif text-xl italic">Interruptor de Alérgenos</h3>
           </div>
           <p className="text-white/40 text-sm leading-relaxed">
             Ahora dispones de un interruptor para activar o desactivar el filtro inteligente.
           </p>
           <ul className="space-y-3">
              <li className="flex items-start gap-2 text-[12px] text-white/60">
                 <CheckCircle2 size={14} className="mt-0.5 text-green-500 shrink-0" />
                 <span><strong>MODO ACTIVO:</strong> La IA evitará los alérgenos más comunes de tus clientes actuales.</span>
              </li>
              <li className="flex items-start gap-2 text-[12px] text-white/60">
                 <CheckCircle2 size={14} className="mt-0.5 text-gray-500 shrink-0" />
                 <span><strong>MODO LIBRE:</strong> La IA generará ideas sin restricciones, ideal para pruebas creativas.</span>
              </li>
           </ul>
        </div>

        {/* Emplatado Explicación */}
        <div className="bg-black/40 border border-[#D4AF37]/20 p-8 rounded-sm space-y-4">
           <div className="flex items-center gap-3 text-[#D4AF37]">
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center shadow-lg shadow-[#D4AF37]/5">
                 <Palette size={16} />
              </div>
              <h3 className="text-white font-serif text-xl italic">Asesoría de Emplatado</h3>
           </div>
           <p className="text-white/40 text-sm leading-relaxed">
             No solo importa el sabor, sino la mirada. Utiliza el botón <strong>"Sugerir Emplatado Textual"</strong> tras generar una idea.
           </p>
           <div className="bg-white/5 border border-white/5 p-4 rounded-sm">
              <p className="text-white/30 text-[11px] italic">
                "La IA te describirá la vajilla ideal, la paleta cromática sugerida y cómo disponer los elementos para dar altura y elegancia al plato."
              </p>
           </div>
        </div>

      </div>

      {/* Guía de Uso Rápido */}
      <div className="bg-[#111111]/50 border border-white/10 p-12 rounded-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <UtensilsCrossed size={200} />
        </div>
        
        <h2 className="font-serif text-3xl text-white mb-8 border-b border-white/5 pb-4">¿Cómo generar el Menú del Día?</h2>
        
        <div className="space-y-8 relative z-10">
          <div className="flex gap-6">
            <div className="w-8 h-8 rounded-full border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-bold text-sm shrink-0">1</div>
            <div>
              <h4 className="text-white font-medium mb-1 truncate">Configura el contexto</h4>
              <p className="text-white/40 text-sm">Elige el nº de platos y activa/desactiva el filtro de alérgenos según necesites.</p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="w-8 h-8 rounded-full border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-bold text-sm shrink-0">2</div>
            <div>
              <h4 className="text-white font-medium mb-1 truncate">Indica tu stock</h4>
              <p className="text-white/40 text-sm">Escribe los ingredientes principales que quieres usar (ej: "bacalao, berenjenas, miel").</p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="w-8 h-8 rounded-full border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-bold text-sm shrink-0">3</div>
            <div>
              <h4 className="text-white font-medium mb-1 truncate">Pulsa Generar</h4>
              <p className="text-white/40 text-sm">La IA analizará la temporada y la configuración para darte las mejores combinaciones.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-sm">
           <div className="flex items-center gap-3 text-[#D4AF37] mb-2 font-bold text-sm">
              <Star size={16} />
              TRUCO DE EXPERTO
           </div>
           <p className="text-white/50 text-sm italic leading-relaxed">
             "Usa el chat inferior para preguntar dudas técnicas. Por ejemplo: **¿A qué temperatura interna debo cocinar el solomillo para que quede al punto?**" 
           </p>
        </div>
      </div>

    </div>
  )
}
