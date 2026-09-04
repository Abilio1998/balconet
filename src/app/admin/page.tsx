import Link from 'next/link'
import { UtensilsCrossed, Image as ImageIcon, Languages, ExternalLink, Star, Calendar as CalendarIcon, PieChart, Trophy, FileText, Download } from 'lucide-react'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'

const QUICK_LINKS = [
  {
    href: '/admin/reservations',
    icon: CalendarIcon,
    label: 'Reservas',
    description: 'Mesas y aforo',
    color: 'from-amber-500/10 to-amber-500/5',
  },
  {
    href: '/admin/menu',
    icon: UtensilsCrossed,
    label: 'Menú del Día',
    description: 'Edita el menú diario',
    color: 'from-blue-500/10 to-blue-500/5',
  },
  {
    href: '/admin/carta',
    icon: ImageIcon,
    label: 'Carta Interactiva',
    description: 'Sube platos y fotos',
    color: 'from-purple-500/10 to-purple-500/5',
  },
  {
    href: '/admin/translations',
    icon: Languages,
    label: 'Traducciones',
    description: 'Textos en 4 idiomas',
    color: 'from-emerald-500/10 to-emerald-500/5',
  },
  {
    href: '/admin/chef-digital',
    icon: Star,
    label: 'Chef Digital',
    description: 'Asistente IA para chefs',
    color: 'from-yellow-500/10 to-yellow-500/5',
  },
]

import { auth } from '@/auth'

export default async function AdminDashboardPage() {
  const session = await auth()
  const userRole = (session?.user as any)?.role

  const filteredLinks = QUICK_LINKS.filter(link => {
    if (!userRole || userRole === 'admin') return true
    if (userRole === 'cocina') {
      return ['Menú del Día', 'Carta Interactiva', 'Chef Digital'].includes(link.label)
    }
    return false
  })

  return (
    <div className="max-w-7xl mx-auto">
      {/* Premium Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <p className="text-[#D4AF37] text-[10px] tracking-[0.5em] uppercase mb-2 font-bold opacity-80">
            Inteligencia de Negocio
          </p>
          <h1 className="font-serif text-4xl text-white">Centro de Análisis</h1>
          <p className="text-white/40 text-sm mt-2 max-w-lg">
            Monitoriza el rendimiento de tu restaurante, las preferencias de tus clientes y gestiona el marketing de tu carta en tiempo real.
          </p>
        </div>
        
        <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-sm flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-white/60 text-xs font-medium">Sistema Sincronizado</span>
        </div>
      </div>

      {/* Main Stats & Analytics section */}
      <div className="mb-16">
        <AnalyticsDashboard userRole={userRole} />
      </div>

      {/* Secondary Quick Access section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
           <PieChart size={18} className="text-[#D4AF37]" />
           <h2 className="font-serif text-xl text-white">Accesos Directos</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {filteredLinks.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`bg-gradient-to-br ${item.color} border border-white/10 p-5 rounded-sm hover:border-[#D4AF37]/40 transition-all duration-300 group flex flex-col`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 border border-[#D4AF37]/30 flex items-center justify-center group-hover:border-[#D4AF37] transition-colors rounded-sm">
                    <Icon size={14} className="text-[#D4AF37]" />
                  </div>
                  <ExternalLink size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
                <h3 className="text-white text-sm font-medium">{item.label}</h3>
                <p className="text-white/30 text-[10px] mt-1">{item.description}</p>
              </Link>
            )
          })}
          
          {(!userRole || userRole === 'admin') && (
            <a
              href="/api/admin/ficha-tecnica"
              download
              className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-white/10 p-5 rounded-sm hover:border-[#D4AF37]/40 transition-all duration-300 group flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 border border-[#D4AF37]/30 flex items-center justify-center group-hover:border-[#D4AF37] transition-colors rounded-sm">
                  <FileText size={14} className="text-[#D4AF37]" />
                </div>
                <Download size={12} className="text-white/20 group-hover:text-white/50 transition-colors" />
              </div>
              <h3 className="text-white text-sm font-medium">Ficha Alérgenos</h3>
              <p className="text-white/30 text-[10px] mt-1">Descarga matriz legal obligatoria</p>
            </a>
          )}
        </div>
      </div>

      {/* Info panel (Refined) */}
      <div className="bg-[#111111]/50 border border-white/5 rounded-sm p-8 flex flex-col md:flex-row gap-12 items-center">
        <div className="flex-1">
          <h2 className="font-serif text-2xl text-white mb-4">El Balconet</h2>
          <p className="text-white/40 text-sm leading-relaxed mb-6">
            Este panel ha sido diseñado para optimizar la toma de decisiones basada en datos reales de tus clientes. 
            Recuerda revisar semanalmente las tendencias de reservas para ajustar el personal y las compras.
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-4 text-[11px] uppercase tracking-widest font-bold">
             <div className="flex flex-col">
               <span className="text-white/20 mb-1">Dirección</span>
               <span className="text-[#D4AF37]">Premià de Dalt, Maresme</span>
             </div>
             <div className="flex flex-col">
               <span className="text-white/20 mb-1">Soporte Express</span>
               <span className="text-white/60">WhatsApp Business</span>
             </div>
          </div>
        </div>
        <div className="w-full md:w-64 aspect-video relative rounded-sm overflow-hidden border border-white/10 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
           <div className="absolute inset-0 bg-black/40 z-10" />
           <iframe 
             src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2985.0!2d2.37!3d41.52!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDMxJzEyLjAiTiAywrAyMicxMi4wIkU!5e0!3m2!1ses!2ses!4v1" 
             width="100%" 
             height="100%" 
             style={{ border: 0 }} 
             allowFullScreen 
             loading="lazy" 
           />
        </div>
      </div>
    </div>
  )
}
