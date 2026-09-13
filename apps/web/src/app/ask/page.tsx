import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { SiteLink as Link } from '@insightginie/ui';
import { AskChat } from '../../components/ask-chat';
import { breadcrumbSchema, safeJsonLd } from '@insightginie/seo';
import { generalAccessMode } from '../../lib/ask/general-access';

export const metadata: Metadata = {
  title: 'Ask Ginie — Clear Explanations and Useful Tools',
  description:
    'Explore questions with Ginie. See how each answer was prepared, follow available sources, and use deterministic tools for supported calculations.',
  alternates: { canonical: '/ask/' },
  openGraph: {
    title: 'Ask Ginie — Clear Explanations and Useful Tools',
    description:
      'Explore questions, follow available sources, and understand how answers are prepared.',
    url: '/ask/',
    siteName: 'InsightGinie',
    type: 'website',
    images: ['/opengraph-image/'],
  },
};
export default async function AskPage() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const generalAvailable = Boolean(generalAccessMode(process.env));
  return (
    <div className="shell listing-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span>Ask Ginie</span>
      </nav>
      <div className="eyebrow">A QUESTION IS A GOOD START</div>
      <h1>Explore your next question.</h1>
      <p className="page-lead">
        {generalAvailable
          ? 'Ask about science, coding, writing, or any other topic. Ginie distinguishes general AI answers from published explanations and calculated results.'
          : 'Understand a method, explore published explanations, and find a useful tool. Each response shows how it was prepared.'}
      </p>
      <AskChat generalAvailable={generalAvailable} />
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
