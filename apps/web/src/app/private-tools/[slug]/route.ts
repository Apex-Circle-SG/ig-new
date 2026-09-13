import { randomBytes } from 'node:crypto';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { financeEmbedDocuments } from '../../../generated/finance-embeds';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = Object.hasOwn(financeEmbedDocuments, slug)
    ? financeEmbedDocuments[slug as keyof typeof financeEmbedDocuments]
    : undefined;
  if (!template)
    return new Response('Calculator not found', {
      status: 404,
      headers: { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' },
    });
  const nonce = randomBytes(24).toString('base64');
  const html = template.replaceAll('__FINANCE_EMBED_NONCE__', nonce);
  const accepted = request.headers.get('accept-encoding') ?? '';
  const encoding = /\bbr\b/.test(accepted) ? 'br' : /\bgzip\b/.test(accepted) ? 'gzip' : undefined;
  const body =
    encoding === 'br'
      ? brotliCompressSync(html, { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } })
      : encoding === 'gzip'
        ? gzipSync(html)
        : undefined;
  return new Response(body ? new Uint8Array(body) : html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store, no-transform',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      Vary: 'Accept-Encoding',
      ...(encoding ? { 'Content-Encoding': encoding } : {}),
      'Content-Security-Policy': [
        `default-src 'none'`,
        `script-src 'nonce-${nonce}'`,
        `style-src 'unsafe-inline'`,
        `connect-src 'none'`,
        `base-uri 'none'`,
        `form-action 'none'`,
        `frame-ancestors 'self'`,
        'sandbox allow-scripts allow-forms allow-downloads allow-modals allow-popups allow-popups-to-escape-sandbox',
      ].join('; '),
    },
  });
}
