import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import {
  AD_PREFERENCE_COOKIE,
  AdSenseScript,
  adsenseClientId,
  advertisingEnabled,
  advertisingPolicy,
} from '@insightginie/ads';
import { Header } from '../components/header';
import { Footer } from '../components/footer';
import { PageAnalytics } from '../components/analytics';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://insightginie.com'),
  title: { default: 'InsightGinie — Understand where you stand', template: '%s | InsightGinie' },
  description:
    'Understand your income with real US data, transparent comparisons, and personal calculators. See where you stand and explore what changes next.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'InsightGinie',
    locale: 'en_US',
    images: ['/opengraph-image/'],
  },
  robots:
    process.env.SITE_INDEXABLE === 'true' && process.env.VERCEL_ENV !== 'preview'
      ? { index: true, follow: true }
      : { index: false, follow: false },
};
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get('x-nonce') ?? '';
  const enabled = advertisingEnabled();
  const preference = (await cookies()).get(AD_PREFERENCE_COOKIE)?.value;
  const policy = advertisingPolicy({
    enabled,
    pathname: requestHeaders.get('x-insightginie-pathname') ?? '/',
    country: requestHeaders.get('cf-ipcountry'),
    preference,
    globalPrivacyControl: requestHeaders.get('sec-gpc') === '1',
  });
  const clientId = adsenseClientId();
  return (
    <html lang="en-US">
      <head>
        {enabled && <meta name="google-adsense-account" content={clientId} />}
        {policy.load && (
          <AdSenseScript
            clientId={clientId}
            nonce={nonce}
            nonPersonalized={policy.nonPersonalized}
          />
        )}
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <PageAnalytics
          pathname={requestHeaders.get('x-insightginie-pathname') ?? '/'}
          enabled={Boolean(process.env.ANALYTICS_DIRECTORY)}
        />
        <Footer
          adsEnabled={enabled}
          adPreference={preference}
          advertisingPage={policy.eligible && policy.consentRequired}
        />
      </body>
    </html>
  );
}
