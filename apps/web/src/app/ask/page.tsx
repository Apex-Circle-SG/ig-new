import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { SiteLink as Link } from '@insightginie/ui';
import { AskChat } from '../../components/ask-chat';
import { breadcrumbSchema, safeJsonLd } from '@insightginie/seo';

export const metadata: Metadata = {
  title: 'Ask Ginie — Understand the Numbers',
  description:
    'Ask about finance calculations and US income data. Get explanations grounded in published sources, with links to private interactive tools.',
  alternates: { canonical: '/ask/' },
  openGraph: {
    title: 'Ask Ginie — Understand the Numbers',
    description: 'Source-linked explanations. Deterministic tools. A clearer next step.',
    url: '/ask/',
    siteName: 'InsightGinie',
    type: 'website',
    images: ['/opengraph-image/'],
  },
};
export default async function AskPage() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <div className="shell listing-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span>Ask Ginie</span>
      </nav>
      <div className="eyebrow">A QUESTION IS A GOOD START</div>
      <h1>Make sense of the numbers.</h1>
      <p className="page-lead">
        Understand the method, see the sources, and find the right tool for your next question.
      </p>
      <AskChat />
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Ask Ginie', path: '/ask/' },
            ]),
          ),
        }}
      />
    </div>
  );
}
