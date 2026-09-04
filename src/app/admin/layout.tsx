'use client'

import AdminSidebar from '@/components/admin/AdminSidebar'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      {!isLoginPage && <AdminSidebar />}
      <main className={`flex-1 overflow-x-hidden ${!isLoginPage ? 'p-6 md:p-10' : ''}`}>
        {children}
      </main>
    </div>
  )
}
