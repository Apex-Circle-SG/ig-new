export const dynamic = 'force-dynamic';

export function GET() {
  const key = process.env.INDEXNOW_KEY?.trim();
  const valid = key && /^[A-Za-z0-9-]{8,128}$/.test(key);

  return new Response(valid ? `${key}\n` : 'Not found\n', {
    status: valid ? 200 : 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, no-transform',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
    },
  });
}
