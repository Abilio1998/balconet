import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reservar Mesa | El Balconet Premià de Dalt',
  description: 'Reserva tu mesa online en El Balconet. Disfruta de la mejor cocina mediterránea con vistas al mar en Premià de Dalt. Gestión y confirmación rápida vía WhatsApp.',
  keywords: ['reserva restaurante Premià de Dalt', 'donde comer Premià de Dalt', 'mesa terraza Premià de Dalt', 'El Balconet reservas'],
  openGraph: {
    title: 'Reserva tu mesa en El Balconet | Premià de Dalt',
    description: 'Asegura tu mesa en el restaurante con mejores vistas del Maresme. Cocina mediterránea y trato familiar.',
    images: ['/logo.png'],
  }
}

export default function ReservarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
