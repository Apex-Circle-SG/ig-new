import { adsenseClientId } from '@insightginie/ads';

export function GET() {
  const publisherId = adsenseClientId().replace(/^ca-/, '');
  return new Response(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
