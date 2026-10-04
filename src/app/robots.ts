import type { MetadataRoute } from 'next'

// Приложение для своих: поисковикам здесь делать нечего (см. также robots в layout и X-Robots-Tag в nginx)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
  }
}
