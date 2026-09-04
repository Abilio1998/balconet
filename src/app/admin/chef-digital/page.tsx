import AIChefAssistant from '@/components/admin/AIChefAssistant'
import { Sparkles, Trophy, ChefHat } from 'lucide-react'

export default function ChefDigitalPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Premium Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <p className="text-[#D4AF37] text-[10px] tracking-[0.5em] uppercase mb-2 font-bold opacity-80">
            Inteligencia Gastronómica
          </p>
          <h1 className="font-serif text-4xl text-white">Chef Digital</h1>
          <p className="text-white/40 text-sm mt-2 max-w-lg">
            Sugerencias creativas basadas en datos reales de tus clientes, tendencias de alérgenos y productos de temporada.
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-sm flex items-center gap-3">
            <Sparkles className="text-[#D4AF37]" size={16} />
            <span className="text-white/60 text-xs font-medium uppercase tracking-widest">IA Conectada</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        <AIChefAssistant />
      </div>

      {/* Footer / Context Info */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/5">
        <div className="flex gap-4">
           <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="text-blue-400" size={18} />
           </div>
           <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-1">Mente Estacional</h4>
              <p className="text-white/30 text-[10px] leading-relaxed">
                La IA conoce la fecha actual y siempre priorizará ingredientes que estén en su mejor momento de temporada.
              </p>
           </div>
        </div>
        <div className="flex gap-4">
           <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <Trophy className="text-red-400" size={18} />
           </div>
           <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-1">Filtro de Seguridad</h4>
              <p className="text-white/30 text-[10px] leading-relaxed">
                Analizamos los alérgenos más comunes de tus reservas para sugerir platos inclusivos y seguros.
              </p>
           </div>
        </div>
        <div className="flex gap-4">
           <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <ChefHat className="text-green-400" size={18} />
           </div>
           <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-1">Recetario Ilimitado</h4>
              <p className="text-white/30 text-[10px] leading-relaxed">
                No te limites a las ideas iniciales; pídeme la receta completa y trucos de cocina para cualquier plato.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
