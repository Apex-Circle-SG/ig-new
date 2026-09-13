import { siteIsIndexable } from '@insightginie/seo';
import { getSiteEntries, sitemapGroup } from '../../../lib/site-index';
import { escapeXml } from '../../../lib/content';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const group = filename.replace(/\.xml$/, '');
  if (!['tools.xml', 'content.xml', 'site.xml'].includes(filename))
    return new Response('Not found', { status: 404 });
  const entries = siteIsIndexable()
    ? getSiteEntries().filter((entry) => sitemapGroup(entry.path) === group)
    : [];
  const items = entries
    .map(
      (entry) =>
        `<url><loc>${escapeXml(entry.url)}</loc>${entry.lastModified ? `<lastmod>${escapeXml(entry.lastModified)}</lastmod>` : ''}</url>`,
    )
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    },
  );
}
