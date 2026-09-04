import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'

/**
 * Next.js 16+ Proxy (formerly middleware)
 * Handles security, localization, and role-based access control.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Locale detection (SSR consistency)
  let locale = 'es'
  const supportedLocales = ['es', 'ca', 'en', 'fr']
  const langParam = request.nextUrl.searchParams.get('lang')
  
  if (langParam && supportedLocales.includes(langParam)) {
    locale = langParam
  } else {
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
    if (cookieLocale && supportedLocales.includes(cookieLocale)) {
      locale = cookieLocale
    } else {
      const acceptLanguage = request.headers.get('accept-language')
      if (acceptLanguage) {
        const preferred = acceptLanguage.split(',')[0].split('-')[0].toLowerCase()
        if (supportedLocales.includes(preferred)) {
          locale = preferred
        }
      }
    }
  }

  // 2. Prepare headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-locale', locale)

  // 3. Protection Logic
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = await auth()
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const userRole = (session.user as any)?.role

    // Admin: Full access — pass through immediately
    if (userRole === 'admin') {
      return NextResponse.next({ request: { headers: requestHeaders } })
    }

    // Sala role: belongs in /sala, not /admin
    if (userRole === 'sala') {
      return NextResponse.redirect(new URL('/sala', request.url))
    }

    // Cocina role: limited access to specific admin paths
    if (userRole === 'cocina') {
      const allowedPaths = [
        '/admin',
        '/admin/menu',
        '/admin/carta',
        '/admin/chef-digital',
        '/admin/help',
      ]
      const isAllowed = allowedPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
      if (!isAllowed) {
        // Redirect to the admin dashboard root (which they can see)
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      // isAllowed = true → fall through to NextResponse.next() at the end
      return NextResponse.next({ request: { headers: requestHeaders } })
    }

    // Unknown or missing role → deny access
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // 4. Default Allow for other paths (Sala, Public, etc.)
  if (pathname.startsWith('/sala')) {
    const session = await auth()
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Final Response with headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Set response headers for security and locale
  response.headers.set('x-locale', locale)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com https://images.unsplash.com https://xsgames.co https://ui-avatars.com https://api.qrserver.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.qrserver.com; frame-src https://www.google.com https://www.openstreetmap.org;"
  )

  return response
}

export const config = {
  matcher: [
    // Protected routes — need auth check
    '/admin/:path*',
    '/sala/:path*',
    '/api/admin/:path*',
    // Public pages — only need locale header injection
    // Excludes _next/static, _next/image, favicon, and file extensions
    '/((?!_next/static|_next/image|favicon\.ico|.*\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|css|js)).*)',
  ],
}
