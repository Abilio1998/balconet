import HelpCenter from '@/components/admin/HelpCenter'
import ChefHelpGuide from '@/components/admin/ChefHelpGuide'
import { auth } from '@/auth'

export const metadata = {
  title: 'Centro de Ayuda | El Balconet Admin',
  description: 'Manual de operaciones para la gestión del restaurante.',
}

export default async function HelpPage() {
  const session = await auth()
  const userRole = (session?.user as any)?.role

  return (
    <div className="animate-in fade-in duration-700">
      {userRole === 'cocina' ? (
        <ChefHelpGuide />
      ) : (
        <HelpCenter />
      )}
    </div>
  )
}
