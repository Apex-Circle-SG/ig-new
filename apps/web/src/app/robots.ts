import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      ...(process.env.SITE_INDEXABLE === 'true' && process.env.VERCEL_ENV !== 'preview'
        ? { allow: '/', disallow: ['/api/', '/me/', '/admin/'] }
        : { disallow: '/' }),
    },
    sitemap: 'https://insightginie.com/sitemap.xml',
    host: 'https://insightginie.com',
  };
}
