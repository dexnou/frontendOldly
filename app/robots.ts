import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://oldyfuns.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/', // Bloquea rutas privadas si las tienes
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}