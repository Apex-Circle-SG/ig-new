import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { isOpportunityContentPath } from '@insightginie/seo';
import { catalog, opportunityRecord, type Idea, type EarningMethod } from '../lib/opportunities';
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
import { GoogleAnalytics } from '../components/google-analytics';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://insightginie.com'),
  title: {
    default: 'InsightGinie — Discover remote work and creative ways to earn',
    template: '%s | InsightGinie',
  },
  description:
    'Discover remote jobs, flexible contracts, creative earning methods and original business experiments. Explore practical next steps, eligibility and original sources.',
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': 'https://insightginie.com/feed.xml' },
  },
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
  const pathname = requestHeaders.get('x-insightginie-pathname') ?? '/';
  let validContent = true;
  if (isOpportunityContentPath(pathname)) {
    const [, kind, id] = pathname.split('/');
    if (kind === 'opportunities') {
      const item = await opportunityRecord(id);
      validContent = Boolean(item && item.status === 'active');
    } else {
      const data = await catalog<{ items: (Idea | EarningMethod)[] }>(
        kind === 'ideas' ? '/v1/ideas' : '/v1/methods',
      );
      validContent = Boolean(data?.items.some((item) => item.id === id));
    }
  }
  const enabled = advertisingEnabled();
  const preference = (await cookies()).get(AD_PREFERENCE_COOKIE)?.value;
  const policy = advertisingPolicy({
    enabled: enabled && validContent,
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
        <GoogleAnalytics
          pathname={requestHeaders.get('x-insightginie-pathname') ?? '/'}
          nonce={nonce}
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
