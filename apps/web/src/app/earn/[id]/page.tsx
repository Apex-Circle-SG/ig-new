import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteLink as Link } from '@insightginie/ui';
import { headers } from 'next/headers';
import {
  PUBLIC_EARNING_GUIDE_PATHS,
  siteIsIndexable,
  breadcrumbSchema,
  safeJsonLd,
} from '@insightginie/seo';
import { catalog, dateLabel, type EarningMethod } from '../../../lib/opportunities';
import { earningHubPath } from '../../../lib/discovery-hubs';
import { CatalogUnavailable } from '../../../components/opportunity-navigation';
import styles from '../../../components/opportunities.module.css';
async function method(id: string) {
  const data = await catalog<{ items: EarningMethod[] }>('/v1/methods');
  return { data, item: data?.items.find((item) => item.id === id) };
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { item } = await method(id);
  return {
    title: item?.title || 'Earning method',
    description: item?.description,
    alternates: { canonical: `/earn/${id}/` },
    robots: {
      index:
        Boolean(item) &&
        siteIsIndexable() &&
        (PUBLIC_EARNING_GUIDE_PATHS as readonly string[]).includes(`/earn/${id}/`),
      follow: true,
    },
  };
}
export default async function Method({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, item } = await method(id);
  if (!data)
    return (
      <div className={`shell ${styles.page}`}>
        <CatalogUnavailable />
      </div>
    );
  if (!item) notFound();
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const hubPath = earningHubPath(item.category);
  const related = data.items
    .filter((other) => other.id !== item.id && other.category === item.category)
    .slice(0, 3);
  return (
    <div className={`shell ${styles.page}`}>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbSchema([
              { name: 'Ways to earn', path: '/earn/' },
              { name: item.title, path: `/earn/${id}/` },
            ]),
          ),
        }}
      />
      <article className={styles.detail}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/earn/">Ways to earn</Link> /{' '}
          {hubPath ? <Link href={hubPath}>{item.category}</Link> : item.category}
        </nav>
        <span className={styles.eyebrow}>{item.category} · Method guide</span>
        <h1>{item.title}</h1>
        <p>{item.description}</p>
        <aside className={styles.notice}>
          This is an earning method, not an available paid assignment. No customer, reward or
          acceptance is guaranteed.
        </aside>
        <h2>Who might pay?</h2>
        <p>{item.buyer}</p>
        <h2>Your first step</h2>
        <p>{item.first_step}</p>
        <h2>How to get started</h2>
        <p>{item.steps}</p>
        <h2>Eligibility and payment</h2>
        <p>{item.eligibility}</p>
        <p>{item.payment}</p>
        <h2>Costs and trade-offs</h2>
        <p>
          Budget for your time, equipment, payment processing, platform fees and any revisions.
          Check the provider’s current fee schedule before you commit.
        </p>
        <p>{item.risks}</p>
        <h2>Test before you invest</h2>
        <p>
          Start with one small eligible task or a clearly scoped offer. Record preparation, delivery
          and revision time alongside direct costs. An actual payment and a satisfied customer are
          stronger evidence than a signup or a compliment.
        </p>
        <h2>Make the numbers work</h2>
        <p>
          <Link href="/tools/break-even/">Explore break-even sales</Link> before investing in an
          offer, or <Link href="/tools/cash-runway/">estimate your cash runway</Link>. These
          scenarios do not predict earnings.
        </p>
        <h2>Original provider and link status</h2>
        <p>
          <a href={item.source_url} target="_blank" rel="noopener">
            {item.source_name} ↗
          </a>
        </p>
        <p>
          {item.last_checked
            ? `Link checked ${dateLabel(item.last_checked)}. `
            : 'Link check pending. '}
          {item.check_status === 'reachable'
            ? 'The provider page responded successfully. This does not verify open tasks or accepting participants.'
            : item.check_status === 'removed'
              ? 'The previous programme link is no longer available; do not rely on it.'
              : 'Availability needs checking directly with the provider.'}
        </p>
        <p>
          <Link href="/earn/">← More ways to earn</Link> ·{' '}
          <Link href="/opportunities/">Browse remote work and rewards →</Link>
        </p>
        {related.length > 0 && (
          <section>
            <h2>Compare related earning methods</h2>
            <ul>
              {related.map((other) => (
                <li key={other.id}>
                  <Link href={`/earn/${other.id}/`}>{other.title}</Link> — {other.description}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
