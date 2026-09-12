import type { Metadata } from 'next';
import { Header } from '../components/header';
import { Footer } from '../components/footer';
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
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-US">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
