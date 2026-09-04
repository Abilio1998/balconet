import LoyaltyManager from '@/components/admin/LoyaltyManager'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fidelización (Personal) | El Balconet',
  description: 'Sistema de puntos para personal de sala.'
}

export default function SalaLoyaltyPage() {
  return (
    <div className="max-w-7xl mx-auto py-8">
      <LoyaltyManager />
    </div>
  )
}
