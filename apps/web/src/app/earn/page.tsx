import type { Metadata } from 'next';
import { SiteLink as Link } from '@insightginie/ui';
import { catalog, type EarningMethod } from '../../lib/opportunities';
import { OpportunityNavigation, CatalogUnavailable } from '../../components/opportunity-navigation';
import styles from '../../components/opportunities.module.css';
import { DiscoveryTopics } from '../../components/discovery-hub';
export const metadata: Metadata = {
  title: 'Creative ways to earn online: practical methods and first steps',
  description:
    'Explore paid research, creative services, digital products and skill-based rewards. Understand buyers, eligibility, costs and a practical first step.',
  alternates: { canonical: '/earn/' },
};
export default async function Earn({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const category = typeof raw.category === 'string' ? raw.category : '';
  const data = await catalog<{ items: EarningMethod[] }>('/v1/methods');
  const items = data?.items.filter((item) => !category || item.category === category);
  const categories = [...new Set(data?.items.map((item) => item.category) || [])];
  return (
    <div className={`shell ${styles.page}`}>
      <OpportunityNavigation current="/earn/" />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Beyond the usual side hustle</span>
        <h1>
          Interesting ways to earn.
          <br />A practical place to start.
        </h1>
        <p>
          Turn a skill, perspective or creative streak into something useful. Explore{' '}
          {data?.items.length || 'our'} curated methods, understand the trade-offs, and take one
          small first step.
        </p>
      </header>
      <DiscoveryTopics />
      <aside className={styles.notice}>
        <strong>Methods, not paid assignments.</strong> These guides explain earning routes. They
        are not promises of available tasks, customers, acceptance or income. Programme links are
        checked daily; a reachable website does not prove that work is available.
      </aside>
      <nav className={styles.links} aria-label="Earning method categories">
        <Link href="/earn/" aria-current={!category ? 'page' : undefined}>
          All methods
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/earn/?category=${encodeURIComponent(c)}`}
            aria-current={category === c ? 'page' : undefined}
          >
            {c}
          </Link>
        ))}
      </nav>
      {!data ? (
        <CatalogUnavailable />
      ) : (
        <div className={styles.grid}>
          {items?.map((item) => (
            <article key={item.id} className={styles.card}>
              <span className={styles.eyebrow}>{item.category}</span>
              <h2>
                <Link href={`/earn/${item.id}/`}>{item.title}</Link>
              </h2>
              <p>{item.description}</p>
              <p>
                <strong>Start here:</strong> {item.first_step}
              </p>
              <div className={styles.cardFooter}>
                <span>{item.source_name}</span>
                <Link href={`/earn/${item.id}/`}>See the method →</Link>
              </div>
            </article>
          ))}
        </div>
      )}
      <section className={styles.detail}>
        <h2>Prefer to invent your own offer?</h2>
        <p>
          Our idea lab explores unusual services, gifts and tiny businesses, each with a possible
          buyer and a small validation experiment.
        </p>
        <Link href="/ideas/">Explore creative business ideas →</Link>
      </section>
    </div>
  );
}
