import type { MetadataRoute } from 'next';
import { canonical, PUBLIC_AD_PATHS, siteIsIndexable } from '@insightginie/seo';

export default function robots(): MetadataRoute.Robots {
  const indexable = siteIsIndexable();
  return {
    rules: [
      {
        userAgent: '*',
        ...(indexable
          ? {
              allow: '/',
              disallow: [
                '/api/',
                '/me/',
                '/admin/',
                '/tools/income/',
                '/private-tools/',
                '/embed/',
                '/search/',
              ],
            }
          : { disallow: '/' }),
      },
      {
        userAgent: ['Mediapartners-Google', 'AdsBot-Google'],
        ...(indexable
          ? { allow: [...PUBLIC_AD_PATHS.map((path) => `${path}$`), '/ads.txt$', '/_next/'] }
          : {}),
        disallow: '/',
      },
    ],
    ...(indexable ? { sitemap: canonical('/sitemap-index.xml') } : {}),
    host: 'https://insightginie.com',
  };
}
