import { NextRequest, NextResponse } from 'next/server';
import { AD_PREFERENCE_COOKIE, advertisingEnabled, advertisingPolicy } from '@insightginie/ads';

export function proxy(request: NextRequest) {
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
    `img-src 'self' data:${allowAds ? ' https: blob:' : ''}`,
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
  response.headers.set('Cache-Control', 'private, no-store, no-transform');
  return response;
}

export const config = {
  matcher: [
    '/((?!api/|tools/|embed/|_next/|ads\\.txt|indexnow-key\\.txt|robots\\.txt|sitemap\\.xml|icon\\.svg|opengraph-image|favicon\\.ico|fonts\\.css).*)',
  ],
};
