import { Metadata } from 'next'
import RgpdManager from '@/components/admin/RgpdManager'

export const metadata: Metadata = {
  title: 'Privacidad y RGPD | Admin El Balconet',
}

export default function RgpdPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-serif text-white mb-2">Privacidad y RGPD</h1>
        <p className="text-white/40 text-sm max-w-3xl">
          Gestione las solicitudes de <strong>Derecho de Acceso</strong> y <strong>Derecho al Olvido</strong> de sus clientes. 
          Use esta herramienta para descargar un informe completo de la huella digital del cliente o para anonimizar sus datos
          personales de forma segura manteniendo intactas las estadísticas globales de facturación.
        </p>
      </div>

      <RgpdManager />
    </div>
  )
}
