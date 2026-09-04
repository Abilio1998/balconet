import { NextRequest, NextResponse } from 'next/server'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  request: NextRequest,
  limit = 10,
  windowMs = 60 * 1000
): NextResponse | null {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous'

  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return null
  }

  if (entry.count >= limit) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  entry.count++
  return null
}

// Sanitize string input to prevent XSS
// NOTE: We only encode < and > to prevent HTML injection.
// Apostrophes and quotes are intentionally NOT encoded because React's JSX escapes
// them automatically at render time, and DB-level encoding causes double-encoding
// in multilingual translated strings.
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
    .slice(0, 2000)
}

// Validate CSRF token
export function validateCsrfToken(request: NextRequest): boolean {
  const csrfHeader = request.headers.get('x-csrf-token')
  const csrfCookie = request.cookies.get('csrf-token')?.value
  if (!csrfHeader || !csrfCookie) return false
  return csrfHeader === csrfCookie
}
