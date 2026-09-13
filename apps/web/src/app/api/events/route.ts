import { createAggregateCollector } from './aggregate-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const collect = createAggregateCollector({
  directory: process.env.ANALYTICS_DIRECTORY,
  siteOrigin: process.env.ANALYTICS_SITE_ORIGIN ?? 'https://insightginie.com',
});

export function POST(request: Request) {
  return collect(request);
}
