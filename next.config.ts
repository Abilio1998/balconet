import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable gzip/brotli compression for faster transfer
  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 3600, // Cache optimised images for 1h minimum
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'patzzbqvdbvgsoxvwjpg.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
    ],
  },

  outputFileTracingIncludes: {
    '/api/admin/generate-pdf': [
      './public/fonts/**/*',
      './public/Alergenos/**/*',
      './public/icons/**/*'
    ],
  },

  async headers() {
    const isProd = process.env.NODE_ENV === 'production'
    return [
      // ── Security headers for all routes ──
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: 'upgrade-insecure-requests;' },
        ],
      },
      // ── Aggressive CDN caching for static assets (1 year) — PRODUCTION ONLY ──
      // In development, we never cache JS chunks so HMR always serves fresh code.
      ...(isProd ? [{
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      }] : []),
      // ── Cache public images for 1 week ──
      {
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
      // ── Cache public API responses (reviews, settings, menu) for 5 min with SWR ──
      {
        source: '/api/public/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=60' },
        ],
      },
    ]
  },

  poweredByHeader: false,
}

export default nextConfig

