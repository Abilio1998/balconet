'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { getBrand } from '@/lib/brand-config'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Image as ImageIcon,
  Languages,
  LogOut,
  Menu,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Heart,
  Settings,
  Calendar,
  BookOpen
} from 'lucide-react'
import { useState, useEffect } from 'react'


const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/menu', icon: UtensilsCrossed, label: 'Menú del Día' },
  { href: '/admin/reservations', icon: Calendar, label: 'Reservas' },
  { href: '/admin/carta', icon: ImageIcon, label: 'Carta / Hero' },
  { href: '/admin/translations', icon: Languages, label: 'Traducciones' },
  { href: '/admin/reviews', icon: Star, label: 'Reseñas de Google' },
  { href: '/admin/loyalty', icon: Heart, label: 'Fidelización' },
  { href: '/admin/rgpd', icon: ShieldCheck, label: 'Privacidad (RGPD)' },
  { href: '/admin/settings', icon: Settings, label: 'Ajustes de Sistema' },
  { href: '/admin/chef-digital', icon: Star, label: 'Chef Digital' },
  { href: '/admin/help', icon: BookOpen, label: 'Ayuda' },
]

export default function AdminSidebar() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role
  const brand = getBrand()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Auto-collapse on tablet/small laptop screens
  useEffect(() => {
    const handleResize = () => {
      // Collapse only between 768px and 1200px (Tablet/Small Laptop)
      // On mobile (< 768) and desktop (>= 1200), keep it expanded for better UX
      if (window.innerWidth >= 768 && window.innerWidth < 1200) {
        setIsCollapsed(true)
      } else {
        setIsCollapsed(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const SidebarContent = ({ isCollapsed, toggleCollapse }: { isCollapsed: boolean, toggleCollapse: () => void }) => (
    <div className="flex flex-col h-full relative group">
      {/* Toggle Button (Visible on all devices for touch access) */}
      <button 
        onClick={toggleCollapse}
        className="flex absolute -right-3 top-20 z-50 bg-[#D4AF37] text-black p-1.5 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all"
        title={isCollapsed ? "Expandir menú" : "Contraer menú"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div className={`p-5 mb-2 border-b border-white/10 flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center px-2' : 'gap-3'}`}>
        <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
          {brand.logo ? (
            <Image src={brand.logo} alt={brand.name} fill className="object-contain" sizes="40px" priority />
          ) : (
            <UtensilsCrossed size={24} className="text-[#D4AF37]" />
          )}
        </div>
        {!isCollapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <h2 className="font-serif text-base text-white leading-tight whitespace-nowrap">{brand.name}</h2>
            <p className="text-[#D4AF37] text-[8px] tracking-[0.25em] uppercase whitespace-nowrap">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.filter(item => {
          if (!userRole || userRole === 'admin') return true
          if (userRole === 'cocina') {
            return ['Dashboard', 'Menú del Día', 'Carta / Hero', 'Chef Digital', 'Ayuda'].includes(item.label)
          }
          return false
        }).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center transition-all duration-200 rounded-sm relative group/item ${
                isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3 text-sm'
              } ${
                isActive
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-l-2 border-[#D4AF37]'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={18} className={isActive ? 'text-[#D4AF37]' : 'text-current'} />
              {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-1 duration-300">{item.label}</span>}
              
              {/* Tooltip on collapse hover */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-widest rounded-sm border border-white/10 opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className={`p-4 border-t border-white/10 space-y-1 transition-all duration-300 ${isCollapsed ? 'items-center' : ''}`}>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className={`flex items-center transition-colors w-full rounded-sm ${
            isCollapsed ? 'justify-center p-3 text-white/20 hover:text-red-400' : 'gap-3 px-4 py-3 text-sm text-white/40 hover:text-red-400'
          }`}
          title={isCollapsed ? "Cerrar Sesión" : undefined}
        >
          <LogOut size={18} />
          {!isCollapsed && <span className="animate-in fade-in duration-300">Cerrar Sesión</span>}
        </button>
        <Link
          href="/"
          className={`flex items-center transition-colors text-white/25 hover:text-white/60 ${
            isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2 text-xs'
          }`}
          title={isCollapsed ? "Ver sitio web" : undefined}
        >
          {isCollapsed ? '←' : '← Ver sitio web'}
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col sticky top-0 h-screen bg-[#111111] border-r border-white/10 z-40 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarContent isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      </aside>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-[#111111] border border-white/20 p-2 text-white rounded-sm shadow-xl"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className={`relative flex flex-col h-full bg-[#111111] border-r border-white/10 animate-in slide-in-from-left duration-300 transition-all ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <SidebarContent isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
          </aside>
        </div>
      )}
    </>
  )
}
