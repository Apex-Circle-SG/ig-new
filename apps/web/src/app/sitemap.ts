import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  if (process.env.SITE_INDEXABLE !== 'true' || process.env.VERCEL_ENV === 'preview') return [];
  return [
    '/',
    '/calc/',
    '/calc/individual-income-percentile/',
    '/data/',
    '/data/census-cps/',
    '/methodology/',
    '/methodology/individual-income/',
    '/about/',
    '/editorial-policy/',
    '/privacy/',
    '/terms/',
  ].map((path) => ({ url: `https://insightginie.com${path}` }));
}
