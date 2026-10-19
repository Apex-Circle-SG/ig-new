import { catalog, type OpportunityResults } from '../../../lib/opportunities';
import { escapeXml } from '../../../lib/content';
export async function GET() {
  const data = await catalog<OpportunityResults>('/v1/opportunities?limit=30');
  if (!data)
    return new Response('Opportunity feed temporarily unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  const items = data.items
    .map(
      (item) =>
        `<item><title>${escapeXml(`${item.title} — ${item.organization}`)}</title><link>${escapeXml(item.source_url)}</link><guid isPermaLink="false">${escapeXml(item.id)}</guid><pubDate>${new Date(item.published_at).toUTCString()}</pubDate><description>${escapeXml(`${item.location}. ${item.reward}. Source: ${item.source_name}. Apply and check current eligibility at the original provider.`)}</description></item>`,
    )
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>InsightGinie opportunities</title><link>https://insightginie.com/opportunities/</link><description>Recent source-linked remote roles. Original providers handle applications and payment.</description><language>en</language>${items}</channel></rss>`,
    {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=120',
        'X-Robots-Tag': 'noindex',
      },
    },
  );
}
