'use client'

import { useState } from 'react'
import {
  BookOpen,
  UtensilsCrossed,
  Calendar,
  Heart,
  Languages,
  LayoutDashboard,
  Clock,
  AlertTriangle,
  Star,
  Wand2,
  Smartphone,
  Info,
  ChevronRight,
  ChevronDown,
  Printer,
  CheckCircle2,
  Users,
  Sun,
  Moon,
  Flame,
  ImageIcon,
  Coffee,
  FileDown,
  BarChart3
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SectionProps {
  id: string
  title: string
  icon: any
  active: boolean
  onClick: () => void
}

const SectionTab = ({ id, title, icon: Icon, active, onClick }: SectionProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-6 py-4 rounded-sm transition-all duration-300 text-left border ${active
        ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.1)]'
        : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10 hover:text-white'
      }`}
  >
    <Icon size={20} className={active ? 'text-[#D4AF37]' : 'text-current'} />
    <span className="text-[10px] uppercase tracking-[0.2em] font-bold">{title}</span>
    {active && <motion.div layoutId="activeTab" className="ml-auto"><ChevronRight size={16} /></motion.div>}
  </button>
)

export default function HelpCenter() {
  const [activeSection, setActiveSection] = useState('dashboard')

  const sections = [
    { id: 'dashboard', title: 'Dashboard & Cocina', icon: LayoutDashboard },
    { id: 'reservations', title: 'Gestión de Reservas', icon: Calendar },
    { id: 'carta', title: 'Carta Interactiva', icon: UtensilsCrossed },
    { id: 'menu', title: 'Menú del Día', icon: Clock },
    { id: 'loyalty', title: 'Fidelización', icon: Heart },
    { id: 'translations', title: 'Idiomas & Ortografía', icon: Languages },
  ]

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-12">
        <h1 className="font-serif text-4xl text-white mb-2">Centro de Ayuda</h1>
        <p className="text-white/40 text-sm max-w-2xl">Manual de operaciones detallado para dominar todas las herramientas del panel de control de El Balconet.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map(s => (
            <SectionTab
              key={s.id}
              {...s}
              active={activeSection === s.id}
              onClick={() => setActiveSection(s.id)}
            />
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-[#111111] border border-white/10 rounded-sm p-8 md:p-10"
            >
              {activeSection === 'dashboard' && <DashboardHelp />}
              {activeSection === 'reservations' && <ReservationsHelp />}
              {activeSection === 'carta' && <CartaHelp />}
              {activeSection === 'menu' && <MenuHelp />}
              {activeSection === 'loyalty' && <LoyaltyHelp />}
              {activeSection === 'translations' && <TranslationsHelp />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function DashboardHelp() {
  return (
    <div className="space-y-8">
      <header className="border-b border-white/5 pb-6">
        <h2 className="text-[#D4AF37] font-serif text-3xl mb-2">Dashboard & Vista de Cocina</h2>
        <p className="text-white/40 text-sm italic">"Donde la inteligencia se encuentra con el servicio"</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Panel del Jefe de Cocina">
          <p className="text-sm text-white/60 mb-4">El centro del dashboard está diseñado para anticipar las necesidades del servicio antes de que el cliente se siente.</p>
          <ul className="space-y-3 text-xs text-white/40">
            <li className="flex items-start gap-2 border-l border-[#D4AF37]/20 pl-3">
              <strong className="text-white">Alerta de Alérgenos:</strong> Monitoriza qué alérgenos están filtrando los clientes que están consultando la carta en ese momento. Útil para prever stocks y precauciones.
            </li>
            <li className="flex items-start gap-2 border-l border-[#D4AF37]/20 pl-3">
              <strong className="text-white">Total PAX:</strong> Muestra el número total de comensales confirmados para el periodo seleccionado (Hoy, Semana, Mes).
            </li>
          </ul>
        </Card>

        <Card title="Platos Promocionados">
          <p className="text-sm text-white/60 mb-4">Usa el sistema de estrellas para dar visibilidad a lo que te interesa vender hoy:</p>
          <ul className="space-y-3 text-xs text-white/40">
            <li className="flex items-start gap-2">
              <Star size={14} className="text-white shrink-0" />
              <span className="text-white">Icono WEB:</span> Destaca el plato en la página principal para atraer a nuevos clientes.
            </li>
            <li className="flex items-start gap-2">
              <Smartphone size={14} className="text-[#D4AF37] shrink-0" />
              <span className="text-white">Icono APP:</span> Promociona el plato exclusivamente dentro del portal de fidelización (ideal para premios de puntos).
            </li>
          </ul>
        </Card>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 rounded-sm">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2 uppercase tracking-widest text-[10px]">
          <Info size={16} className="text-[#D4AF37]" /> Recursos de Marketing
        </h3>
        <p className="text-xs text-white/60 leading-relaxed mb-4">Desde el Dashboard puedes descargar el <strong className="text-white">KIT DE MESA</strong>. Es un PDF profesional con el QR que apunta directamente al menú del día de hoy. Imprímelo diariamente para que los clientes tengan la carta en su móvil al instante.</p>
      </div>
    </div>
  )
}

function ReservationsHelp() {
  return (
    <div className="space-y-8">
      <header className="border-b border-white/5 pb-6">
        <h2 className="text-[#D4AF37] font-serif text-3xl mb-2">Control de Reservas</h2>
        <p className="text-white/40 text-sm italic">"Optimiza el caudal de tu cocina y sala"</p>
      </header>

      <div className="space-y-6">
        <Subsection title="Aforo y Zonificación">
          <p className="text-sm text-white/60 mb-4">El sistema diferencia entre <strong className="text-white">Interior (Sala)</strong> y <strong className="text-white">Terraza</strong>. Puedes tener aforos distintos para cada uno.</p>
          <div className="bg-black/20 p-4 border border-white/5 rounded-sm">
            <h4 className="text-[10px] uppercase tracking-widest text-[#D4AF37] mb-2 font-bold">Bloqueo Rápido</h4>
            <p className="text-xs text-white/40">Si llueve o hay un evento privado, puedes bloquear solo la Terraza o solo el Salón haciendo clic en el botón de estado. Esto impedirá que entren reservas web para esa zona inmediatamente.</p>
          </div>
        </Subsection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Caudal de Cocina">
            <p className="text-xs text-white/40 leading-relaxed">Configurado en <strong className="text-white">Ajustes</strong>, permite limitar cuántos comensales pueden entrar <strong className="text-white">AL MISMO TIEMPO</strong> (en intervalos de 15 o 30 min). Esto evita que la cocina colapse si entran 40 personas de golpe a las 14:00.</p>
          </Card>
          <Card title="Intervalos de Tiempo">
            <p className="text-xs text-white/40 leading-relaxed">Define la duración estimada de una comida (ej. 90 min). El sistema usará esto para saber cuándo una mesa vuelve a estar "libre" y puede ser ofrecida a otro cliente en la web.</p>
          </Card>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-sm flex gap-4 items-start">
          <AlertTriangle className="text-red-500 shrink-0" size={20} />
          <div>
            <h4 className="text-sm text-white font-medium mb-1 uppercase tracking-tighter">Daily Overrides (Excepciones)</h4>
            <p className="text-xs text-white/40">Si quieres cambiar el aforo <strong className="text-white">solo para hoy</strong> (sin cambiar la configuración general), selecciónalo en la agenda principal. Eso se llama "Override" y solo afecta al día seleccionado.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CartaHelp() {
  return (
    <div className="space-y-10">
      <header className="border-b border-white/5 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <ImageIcon className="text-[#D4AF37]" size={24} />
          <h2 className="text-[#D4AF37] font-serif text-3xl">Manual de Carta / Hero</h2>
        </div>
        <p className="text-white/40 text-sm italic">"Domina el editor dinámico y la inteligencia de ventas"</p>
      </header>

      <div className="space-y-12">
        {/* Paso 1: Añadir Platos */}
        <Subsection title="1. Gestión de Productos y Secciones">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-sm text-white/60 leading-relaxed">
                La carta se organiza en <strong>Secciones</strong> (ej: "Para Picar", "Nuestras Carnes").
              </p>
              <ul className="space-y-3 text-xs text-white/40">
                <li className="flex gap-3">
                  <span className="text-[#D4AF37] font-bold">A:</span>
                  <span><strong>Añadir Plato:</strong> Entra en una sección y pulsa "+ Añadir Plato". Rellena el nombre y el precio (Sala y Terraza).</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#D4AF37] font-bold">B:</span>
                  <span><strong>Imágenes:</strong> Pulsa el icono de la cámara. El sistema comprimirá la foto automáticamente para que la web cargue rápido.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#D4AF37] font-bold">C:</span>
                  <span><strong>Alérgenos:</strong> Haz clic en los iconos (trigo, leche, etc.) para que aparezcan en la web pública.</span>
                </li>
              </ul>
            </div>
            <Card title="Suplementos y Extras">
              <p className="text-xs text-white/40 mb-4">Si un plato tiene extras (ej: "Añadir Queso +1.50€"), despliega el plato y ve a la sección de <strong>Suplementos</strong>.</p>
              <p className="text-[10px] text-white/30 italic">Nota: Los suplementos también se traducen automáticamente a los 4 idiomas al guardar.</p>
            </Card>
          </div>
        </Subsection>

        {/* Paso 2: Mini Cartas y Sesiones */}
        <Subsection title="2. Creación de Mini-Cartas (Sesiones)">
          <p className="text-sm text-white/60 mb-6">
            No necesitas borrar platos para cambiar de la mañana a la noche. Usa el sistema de <strong>Visibilidad por Sesión</strong>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-sm border border-white/5">
              <Coffee size={20} className="text-orange-400 mb-3" />
              <h4 className="text-[10px] text-white font-bold uppercase mb-2">Desayuno</h4>
              <p className="text-[10px] text-white/40">Activa el icono de la taza para platos de mañana.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-sm border border-white/5">
              <Sun size={20} className="text-yellow-400 mb-3" />
              <h4 className="text-[10px] text-white font-bold uppercase mb-2">Mediodía</h4>
              <p className="text-[10px] text-white/40">Activa el sol para platos de almuerzo.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-sm border border-white/5">
              <Moon size={20} className="text-blue-400 mb-3" />
              <h4 className="text-[10px] text-white font-bold uppercase mb-2">Noche</h4>
              <p className="text-[10px] text-white/40">Activa la luna para cenas.</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-sm">
            <p className="text-xs text-white/60">
              <strong>Acción Masiva:</strong> En la parte superior del editor tienes botones para "Activar Todos" o "Quitar Todos" de una sesión completa con un solo clic. Ideal para crear la carta de mediodía en segundos.
            </p>
          </div>
        </Subsection>

        {/* Paso 3: PDF y Exportación */}
        <Subsection title="3. Generación de PDF para Sala">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-sm text-white/60 leading-relaxed">
                Puedes descargar una versión profesional de la carta lista para imprimir.
              </p>
              <ol className="text-xs text-white/40 space-y-3">
                <li>1. Selecciona el idioma (ES, CA, EN, FR) en la barra de exportación.</li>
                <li>2. Haz clic en el icono de la sesión que quieras imprimir (Sol para mediodía, Luna para noche).</li>
                <li>3. El sistema generará un PDF limpio, con alérgenos y precios actualizados.</li>
              </ol>
            </div>
            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-sm">
              <FileDown size={32} className="text-[#D4AF37] mb-4" />
              <p className="text-[10px] text-white/40 uppercase tracking-widest text-center">Exportación en Alta Definición</p>
            </div>
          </div>
        </Subsection>

        {/* Paso 4: Herramientas IA */}
        <Subsection title="4. Ortografía y Traducción Automática">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Magia con un Clic">
              <p className="text-xs text-white/40 leading-relaxed mb-4">
                Antes de guardar, pulsa <strong>"Revisar Ortografía"</strong>. La IA corregirá errores y tildes.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-green-400 font-bold uppercase">
                <Wand2 size={14} /> Sugerencias de calidad
              </div>
            </Card>
            <Card title="Traducción Total">
              <p className="text-xs text-white/40 leading-relaxed">
                Al pulsar <strong>"Guardar Cambios"</strong>, el sistema detecta qué platos no tienen traducción y los traduce automáticamente a Catalán, Inglés y Francés. No tienes que hacer nada más.
              </p>
            </Card>
          </div>
        </Subsection>

        {/* Inteligencia Visual */}
        <div className="bg-black/40 border border-[#D4AF37]/20 p-8 rounded-sm space-y-6">
          <div className="flex items-center gap-3">
            <Star className="text-[#D4AF37]" size={20} />
            <h3 className="text-white font-serif text-xl">Sección Hero y Destacados</h3>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">
            La estrella dorada en cada plato lo convierte en un <strong>"Plato Destacado"</strong>. Estos platos aparecen en la sección "Hero" (bienvenida) de la web con una fotografía a gran tamaño.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
            <div className="flex items-start gap-3">
              <Flame className="text-orange-500 shrink-0" size={18} />
              <div>
                <h5 className="text-[10px] text-white font-bold uppercase mb-1">Impacto en Ventas</h5>
                <p className="text-[10px] text-white/40 italic">Usa los destacados para productos con mucho margen o platos firma del Chef.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Info className="text-blue-400 shrink-0" size={18} />
              <div>
                <h5 className="text-[10px] text-white font-bold uppercase mb-1">Dato de interés</h5>
                <p className="text-[10px] text-white/40 italic">El 70% de los clientes piden al menos un plato de la sección Hero.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MenuHelp() {
  return (
    <div className="space-y-8">
      <header className="border-b border-white/5 pb-6">
        <h2 className="text-[#D4AF37] font-serif text-3xl mb-2">Semanario & Menú del Día</h2>
        <p className="text-white/40 text-sm italic">"Gestión masiva y profesional de menús diarios"</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Creación Rápida">
          <p className="text-xs text-white/40 leading-relaxed">El menú se divide en <strong className="text-white">Primeros, Segundos y Postres</strong>. Puedes añadir suplementos de precio específicos por plato (ej. +€2.50 por un secreto ibérico dentro de un menú estándar).</p>
        </Card>

        <Card title="Guardado Masivo (Tramo)">
          <p className="text-xs text-white/40">Si el menú de hoy es el mismo que para toda la semana, usa la <strong className="text-white">"Fecha Hasta"</strong>. El sistema replicará el menú automáticamente en todos esos días, ahorrándote horas de edición.</p>
        </Card>
      </div>

      <div className="bg-white/5 border border-white/10 p-8 rounded-sm">
        <h3 className="text-white font-medium mb-6 flex items-center gap-2 uppercase tracking-widest text-[10px]">
          <Printer size={16} className="text-[#D4AF37]" /> Exportación y Sala
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <h4 className="text-[#D4AF37] text-xs mb-2">Imprimir</h4>
            <p className="text-[10px] text-white/30">Genera un PDF limpio listo para tu impresora de sala.</p>
          </div>
          <div>
            <h4 className="text-[#D4AF37] text-xs mb-2">Descargar</h4>
            <p className="text-[10px] text-white/30">Guarda una copia en tu dispositivo por seguridad.</p>
          </div>
          <div>
            <h4 className="text-[#D4AF37] text-xs mb-2">Idiomas</h4>
            <p className="text-[10px] text-white/30">Elige exportar el PDF en Español, Catalán, Inglés o Francés.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoyaltyHelp() {
  return (
    <div className="space-y-8">
      <header className="border-b border-white/5 pb-6">
        <h2 className="text-[#D4AF37] font-serif text-3xl mb-2">Club VIP & Fidelización</h2>
        <p className="text-white/40 text-sm italic">"Un cliente contento siempre vuelve"</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Subsection title="Objetivo Comercial">
            <p className="text-sm text-white/60">No solo queremos dar puntos, queremos <strong className="text-white">conocer al cliente</strong>. El sistema gamifica la experiencia premiando la recurrencia.</p>
            <ul className="mt-4 space-y-2 text-xs text-white/40">
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> Fidelizar sin tarjetas físicas.</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500" /> Aumentar el ticket medio (por puntos).</li>
            </ul>
          </Subsection>
          <Subsection title="Cómo Gestionar Clientes">
            <ol className="list-decimal list-inside text-xs text-white/40 space-y-2 pl-2">
              <li className="pl-2">Añade Cliente (Nombre y Teléfono).</li>
              <li className="pl-2">Asigna <strong className="text-white">Puntos</strong> tras pagar la cuenta (ej. 1€ = 1 punto).</li>
              <li className="pl-2">Cuando lleguen al umbral (ej. 100 puntos), el cliente recibe un premio automático.</li>
            </ol>
          </Subsection>
        </div>

        <div className="bg-[#111111] border border-[#D4AF37]/10 p-8 rounded-sm flex flex-col items-center text-center justify-center space-y-6">
          <WhatsAppIcon />
          <h3 className="text-white font-medium">WhatsApp Directo</h3>
          <p className="text-xs text-white/40 leading-relaxed">Usa el botón de WhatsApp junto al cliente para enviarle su <strong className="text-white">"Magic Link"</strong>. Es su portal personal donde verá sus puntos sin necesidad de descargar apps ni contraseñas.</p>
        </div>
      </div>
    </div>
  )
}

function TranslationsHelp() {
  return (
    <div className="space-y-8">
      <header className="border-b border-white/5 pb-6">
        <h2 className="text-[#D4AF37] font-serif text-3xl mb-2">Motor de Idiomas & Estilo</h2>
        <p className="text-white/40 text-sm italic">"La excelencia reside en los detalles"</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Traducciones Inteligentes">
          <p className="text-xs text-white/60 mb-4 leading-relaxed">Nuestro motor utiliza IA avanzada para traducir platos culinarios. No traduce palabra por palabra, sino que <strong className="text-white">entiende la gastronomía local</strong>.</p>
          <p className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-widest pl-3 border-l border-[#D4AF37]/30">Auto-traducción: Ocurre automáticamente al guardar el menú o la carta si los campos están vacíos.</p>
        </Card>

        <Card title="La Importancia de la Ortografía">
          <p className="text-xs text-white/60 leading-relaxed">Un plato mal escrito daña la imagen del restaurante. Usa el botón <strong className="text-white"><Wand2 size={12} className="inline mb-1" /> Revisar Ortografía</strong> en el editor. La IA corregirá tildes, mayúsculas y términos técnicos antes de traducir, asegurando que tanto el Menú como la Carta se vean impecables.</p>
        </Card>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 rounded-sm">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2 uppercase tracking-widest text-[10px]">
          <Languages size={16} className="text-[#D4AF37]" /> El Gestor de Traducciones
        </h3>
        <p className="text-xs text-white/40 mb-4">Si necesitas refinar una traducción específica (ej: prefieres un término regional en francés), ve al apartado <strong className="text-white">Traducciones</strong>. Allí puedes editar manualmente todos los textos estáticos de la web pública.</p>
        <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
          <span className="text-[9px] text-white/30 border border-white/10 px-2 py-1">CA: Català</span>
          <span className="text-[9px] text-white/30 border border-white/10 px-2 py-1">EN: English</span>
          <span className="text-[9px] text-white/30 border border-white/10 px-2 py-1">FR: Français</span>
        </div>
      </div>
    </div>
  )
}

// UI Components
function Card({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/5 p-6 rounded-sm hover:border-white/10 transition-colors">
      <h3 className="text-white font-medium mb-4 text-sm uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  )
}

function Subsection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-white font-serif text-lg">{title}</h3>
      {children}
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <div className="w-16 h-16 bg-[#25D366]/20 rounded-full flex items-center justify-center text-[#25D366] border border-[#25D366]/30 shadow-[0_0_30px_rgba(37,211,102,0.1)]">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </div>
  )
}
