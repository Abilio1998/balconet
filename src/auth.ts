import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials)

          // Admin Access
          if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            return {
              id: 'admin-1',
              email: email,
              name: 'Administrador',
              role: 'admin',
            }
          }

          // Staff Access (Sala)
          if (email === 'sala@balconet.es' && password === 'balconet') {
            return {
              id: 'sala-1',
              email: email,
              name: 'Personal de Sala',
              role: 'sala',
            }
          }

          // Staff Access (Cocina)
          if (email === 'cocina@balconet.es' && password === 'balconet') {
            return {
              id: 'cocina-1',
              email: email,
              name: 'Jefe de Cocina',
              role: 'cocina',
            }
          }

          return null
        } catch {
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 Días (evita auto-cierre en la tablet)
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (token?.role) {
        (session.user as { role?: string }).role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  trustHost: true,
})
