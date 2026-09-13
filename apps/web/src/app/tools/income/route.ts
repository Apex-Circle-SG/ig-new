import { randomBytes } from 'node:crypto';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { incomeEmbedDocuments } from '../../../generated/income-embed';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Public seed data only. User input never reaches this route or the parent document. */
export function GET(request: Request) {
  const compact = new URL(request.url).searchParams.get('view') === 'compact';
  const nonce = randomBytes(24).toString('base64');
  const document = incomeEmbedDocuments[compact ? 'compact' : 'full'].replaceAll(
    '__INSIGHTGINIE_EMBED_NONCE__',
    nonce,
  );
  // no-transform protects nonce scripts from edge rewriting, so compress at the origin.
  const accepted = request.headers.get('accept-encoding') ?? '';
  const encoding = /\bbr\b/.test(accepted) ? 'br' : /\bgzip\b/.test(accepted) ? 'gzip' : undefined;
  const compressed =
    encoding === 'br'
      ? brotliCompressSync(document, { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } })
      : encoding === 'gzip'
        ? gzipSync(document)
        : undefined;
  return new Response(compressed ? new Uint8Array(compressed) : document, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': [
        "default-src 'none'",
        `script-src 'nonce-${nonce}'`,
        "style-src 'unsafe-inline'",
        "connect-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
        "frame-ancestors 'self'",
        // allow-forms permits React's submit event; form-action 'none' forbids network submission.
        'sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox',
      ].join('; '),
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'private, no-store, no-transform',
      Vary: 'Accept-Encoding',
      ...(encoding ? { 'Content-Encoding': encoding } : {}),
    },
  });
}
