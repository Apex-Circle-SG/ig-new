import { NextRequest, NextResponse } from 'next/server';
import { AD_PREFERENCE_COOKIE, advertisingEnabled, advertisingPolicy } from '@insightginie/ads';

export function proxy(request: NextRequest) {
  if (request.headers.get('host')?.split(':')[0].toLowerCase() === 'www.insightginie.com') {
    const target = new URL('https://insightginie.com');
    target.pathname = request.nextUrl.pathname;
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 308);
  }
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const allowAds = advertisingPolicy({
    enabled: advertisingEnabled(),
    pathname: request.nextUrl.pathname,
    country: request.headers.get('cf-ipcountry'),
    preference: request.cookies.get(AD_PREFERENCE_COOKIE)?.value,
    globalPrivacyControl: request.headers.get('sec-gpc') === '1',
  }).load;
  const allowEval = allowAds || process.env.NODE_ENV === 'development';
  const csp = [
    `default-src 'self'${allowAds ? ' https: data: blob:' : ''}`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${allowEval ? " 'unsafe-eval'" : ''}${allowAds ? " 'unsafe-inline' https:" : ''}`,
    `style-src 'self' 'unsafe-inline'${allowAds ? ' https:' : ''}`,
    `img-src 'self' data: https://blog.insightginie.com${allowAds ? ' https: blob:' : ''}`,
    `font-src 'self'${allowAds ? ' https: data:' : ''}`,
    `connect-src 'self'${allowAds ? ' https:' : ''}`,
    `frame-src 'self'${allowAds ? ' https:' : ''}`,
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('x-insightginie-pathname', request.nextUrl.pathname);
  headers.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', csp);
  // Permit HTTP compression for public SSR HTML. Opaque calculator documents
  // keep their separate origin-compressed no-transform policy.
  response.headers.set('Cache-Control', 'private, no-store');
  if (request.nextUrl.searchParams.size > 0)
    response.headers.set('X-Robots-Tag', 'noindex, follow');
  return response;
}

export const config = {
  matcher: [
    '/((?!api/|tools/income/|private-tools/|embed/|_next/|ads\\.txt|indexnow-key\\.txt|robots\\.txt|sitemap\\.xml|sitemap-index\\.xml|sitemaps/|feed/|feed\\.xml|admin/|icon\\.svg|opengraph-image|favicon\\.ico|fonts\\.css).*)',
  ],
};
