import { canonical, siteIsIndexable } from '@insightginie/seo';
export function GET() {
  const items = siteIsIndexable()
    ? ['tools', 'content', 'site']
        .map((group) => `<sitemap><loc>${canonical(`/sitemaps/${group}.xml`)}</loc></sitemap>`)
        .join('')
    : '';
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    },
  );
}
