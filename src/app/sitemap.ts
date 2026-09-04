import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://elbalconet.es'
  const locales = ['es', 'ca', 'en', 'fr']
  const now = new Date()

  // Public routes with their SEO priority
  const routes = [
    { path: '',           priority: 1.0,  freq: 'daily'   },
    { path: 'menu',       priority: 0.9,  freq: 'daily'   },
    { path: 'reservar',   priority: 0.9,  freq: 'weekly'  },
    { path: 'aviso-legal',          priority: 0.3, freq: 'yearly' },
    { path: 'politica-privacidad',  priority: 0.3, freq: 'yearly' },
    { path: 'politica-cookies',     priority: 0.3, freq: 'yearly' },
  ]

  const entries = routes.flatMap(({ path, priority, freq }) =>
    locales.map(locale => ({
      url: `${baseUrl}${path ? '/' + path : ''}${locale === 'es' ? '' : '?lang=' + locale}`,
      lastModified: now,
      changeFrequency: freq as MetadataRoute.Sitemap[0]['changeFrequency'],
      priority,
    }))
  )

  return entries
}
