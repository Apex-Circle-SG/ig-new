import { randomBytes } from 'node:crypto';
import { expandedEmbed } from '../../generated/expanded-embed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET() {
  const nonce = randomBytes(24).toString('base64');
  return new Response(expandedEmbed.replaceAll('__NONCE__', nonce), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store, no-transform',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'; sandbox allow-scripts allow-forms`,
    },
  });
}
