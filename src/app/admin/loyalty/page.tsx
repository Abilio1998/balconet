import LoyaltyManager from '@/components/admin/LoyaltyManager'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gestión de Fidelización | El Balconet Admin',
  description: 'Sistema de puntos y premios para clientes de El Balconet.'
}

export default function LoyaltyAdminPage() {
  return (
    <div className="max-w-7xl mx-auto py-8">
      <LoyaltyManager />
    </div>
  )
}
