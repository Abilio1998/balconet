'use client'

import { useState, FormEvent, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { getBrand } from '@/lib/brand-config'

function LoginForm() {
  const brand = getBrand()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const userEmail = email.trim().toLowerCase()

    try {
      // Determinamos el destino más rápido según el email para evitar redirecciones extra en el servidor
      let destination = callbackUrl || (userEmail.includes('sala') ? '/sala' : '/admin')

      const result = await signIn('credentials', {
        email: userEmail,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Credenciales incorrectas. Inténtalo de nuevo.')
        setLoading(false)
      } else {
        // Usamos window.location.href para forzar un refresco de sesión real y saltar directamente al panel
        // Esto es mucho más rápido y fiable para asegurar que el middleware vea la cookie a la primera
        window.location.href = destination
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-8 border border-white/10">
      <h2 className="font-serif text-xl text-white mb-1">Iniciar Sesión</h2>
      <p className="text-white/40 text-sm mb-8">Accede al panel de control</p>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 p-4 mb-6 text-sm animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label className="text-white/60 text-xs tracking-widest uppercase mb-2 block font-sans">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-input pl-10"
              placeholder={`user@${brand.name.toLowerCase().replace(/\s+/g, '')}.com`}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="text-white/60 text-xs tracking-widest uppercase mb-2 block font-sans">
            Contraseña
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input pl-10 pr-10"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full btn-gold justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2 h-12"
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <Loader2 className="animate-spin" size={18} />
              Entrando...
            </span>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 selection:bg-[#D4AF37] selection:text-black">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="w-full h-full opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.1) 0%, transparent 70%)',
          }}
        />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent shadow-[0_0_20px_rgba(212,175,55,0.1)]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-white mb-1 tracking-tight">{getBrand().name}</h1>
          <p className="text-[#D4AF37] text-[10px] tracking-[0.4em] uppercase font-bold">Administración</p>
        </div>

        <Suspense fallback={
          <div className="glass-card p-12 border border-white/10 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#D4AF37]" size={32} />
            <p className="text-white/20 text-xs uppercase tracking-widest">Cargando...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>

        <div className="mt-8 flex flex-col items-center gap-6">
          <Link
            href="/"
            className="text-white/40 hover:text-[#D4AF37] text-[10px] uppercase tracking-[0.2em] font-bold transition-all flex items-center gap-2 group"
          >
            <span className="w-4 h-[1px] bg-white/20 group-hover:bg-[#D4AF37]/50 transition-all" />
            Volver a la web principal
            <span className="w-4 h-[1px] bg-white/20 group-hover:bg-[#D4AF37]/50 transition-all" />
          </Link>

          <p className="text-center text-white/20 text-[10px] uppercase tracking-widest">
            Acceso exclusivo • Personal Autorizado
          </p>
        </div>
      </div>
    </div>
  )
}
