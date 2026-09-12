import type { NextConfig } from 'next';
const config: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  trailingSlash: true,
  transpilePackages: [
    '@insightginie/schema',
    '@insightginie/datasets',
    '@insightginie/calculators',
    '@insightginie/ui',
    '@insightginie/charts',
    '@insightginie/seo',
    '@insightginie/analytics',
    '@insightginie/ads',
    '@insightginie/config',
  ],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'" +
              (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '') +
              "; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
          },
          ...(process.env.SITE_INDEXABLE === 'true' && process.env.VERCEL_ENV !== 'preview'
            ? []
            : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]),
        ],
      },
    ];
  },
};
export default config;
