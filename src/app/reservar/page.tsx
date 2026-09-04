'use client'

import ReservationForm from '@/components/ReservationForm'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ReservarPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-[#D4AF37] selection:text-white">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h1 className="font-serif text-5xl md:text-7xl text-[#111111] mb-6 uppercase tracking-tighter font-bold">
            Reserva tu <span className="text-[#D4AF37]">Mesa</span> en El Balconet
          </h1>
          <p className="text-[#111111]/60 font-medium text-lg max-w-2xl mx-auto">
            Asegura tu mejor mesa con vistas al mar en Premià de Dalt. 
            Todas las reservas se gestionan y confirman vía WhatsApp para tu comodidad.
          </p>
        </div>
        
        <ReservationForm />
      </div>

      <Footer />
    </main>
  )
}
