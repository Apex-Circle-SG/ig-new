import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteLink as Link } from '@insightginie/ui';
import { catalog, dateLabel, type EarningMethod } from '../../../lib/opportunities';
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
  return (
    <div className={`shell ${styles.page}`}>
      <article className={styles.detail}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/earn/">Ways to earn</Link> / {item.category}
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
      </article>
    </div>
  );
}
