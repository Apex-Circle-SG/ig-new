import { headers } from 'next/headers';
import { SiteLink as Link } from '@insightginie/ui';
import { breadcrumbSchema, canonical, safeJsonLd } from '@insightginie/seo';
import { discoveryHub, discoveryHubs } from '../lib/discovery-hubs';
import {
  catalog,
  dateLabel,
  type EarningMethod,
  type OpportunityResults,
} from '../lib/opportunities';
import { CatalogUnavailable, OpportunityNavigation } from './opportunity-navigation';
import styles from './opportunities.module.css';

export function DiscoveryTopics({ current }: { current?: string }) {
  return (
    <nav className={styles.links} aria-label="Explore earning topics">
      {discoveryHubs.map((hub) => (
        <Link key={hub.id} href={hub.path} aria-current={current === hub.path ? 'page' : undefined}>
          {hub.id === 'remote-contracts'
            ? 'Remote contracts'
            : hub.id === 'paid-research'
              ? 'Paid research & testing'
              : hub.id === 'creative-services'
                ? 'Creative freelance services'
                : 'Digital products to sell'}
        </Link>
      ))}
    </nav>
  );
}

export async function DiscoveryHubPage({ id }: { id: string }) {
  const hub = discoveryHub(id);
  const jobs =
    id === 'remote-contracts'
      ? await catalog<OpportunityResults>(
          '/v1/opportunities?category=jobs&arrangement=Contract&limit=6',
        )
      : null;
  const methods = hub.category ? await catalog<{ items: EarningMethod[] }>('/v1/methods') : null;
  const items = methods?.items.filter((method) => method.category === hub.category) ?? [];
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const parent = id === 'remote-contracts' ? '/opportunities/' : '/earn/';
  return (
    <div className={`shell ${styles.page}`}>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: safeJsonLd([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: parent === '/earn/' ? 'Ways to earn' : 'Opportunities', path: parent },
              { name: hub.title, path: hub.path },
            ]),
            {
              '@context': 'https://schema.org',
              '@type': 'CollectionPage',
              name: hub.title,
              description: hub.description,
              url: canonical(hub.path),
            },
          ]),
        }}
      />
      <OpportunityNavigation current={parent} />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>A practical earning guide</span>
        <h1>{hub.title}</h1>
        <p>{hub.lead}</p>
        <span className={styles.muted}>
          Guide updated 20 October 2026 · Live listings and provider links update separately.
        </span>
      </header>
      <DiscoveryTopics current={hub.path} />
      <section aria-labelledby="compare-routes">
        <h2 id="compare-routes">Compare your options</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.muted}>
              Choose by fit and commitment, rather than a promised income.
            </caption>
            <thead>
              <tr>
                <th scope="col">Route</th>
                <th scope="col">When it might fit</th>
                <th scope="col">What to check</th>
              </tr>
            </thead>
            <tbody>
              {hub.comparisons.map((row) => (
                <tr key={row.path}>
                  <th scope="row">
                    <Link href={row.path}>{row.name}</Link>
                  </th>
                  <td>{row.fit}</td>
                  <td>{row.tradeoff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className={styles.detail}>
        {hub.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </section>
        ))}
        <h2>A small first experiment</h2>
        <p>{hub.experiment}</p>
        <Link href={hub.nextPath}>{hub.nextLabel} →</Link>
      </section>
      <section className={styles.category} aria-labelledby="explore-matching">
        <h2 id="explore-matching">
          {id === 'remote-contracts'
            ? 'Current source-listed remote contracts'
            : 'Explore the methods and original providers'}
        </h2>
        {id === 'remote-contracts' ? (
          !jobs ? (
            <CatalogUnavailable />
          ) : jobs.items.length === 0 ? (
            <p>
              No matching contracts are currently listed.{' '}
              <Link href="/opportunities/">Explore other remote arrangements</Link> or return after
              the feeds update.
            </p>
          ) : (
            <>
              <p className={styles.muted}>
                Showing {jobs.items.length} of {jobs.total} matching records. An active feed record
                does not guarantee the employer is still accepting applications.
              </p>
              <div className={styles.grid}>
                {jobs.items.map((job) => (
                  <article className={styles.card} key={job.id}>
                    <span className={styles.badge}>
                      {job.employment_type} · {job.source_name}
                    </span>
                    <h3>
                      <Link href={`/opportunities/${job.id}/`}>{job.title}</Link>
                    </h3>
                    <p>
                      {job.organization} · {job.location}
                    </p>
                    <p>{job.reward}</p>
                    <p>
                      Last seen {dateLabel(job.last_seen_at)}. Check geography and terms with the
                      original provider.
                    </p>
                  </article>
                ))}
              </div>
              <p>
                <Link href="/opportunities/?category=jobs&arrangement=Contract">
                  Browse and filter all source-listed contracts →
                </Link>
              </p>
            </>
          )
        ) : !methods ? (
          <CatalogUnavailable />
        ) : (
          <div className={styles.grid}>
            {items.map((method) => (
              <article className={styles.card} key={method.id}>
                <span className={styles.badge}>Method guide · {method.source_name}</span>
                <h3>
                  <Link href={`/earn/${method.id}/`}>{method.title}</Link>
                </h3>
                <p>{method.description}</p>
                <p>
                  <strong>Start here:</strong> {method.first_step}
                </p>
                <p className={styles.muted}>
                  {method.check_status === 'reachable'
                    ? 'Provider link responded; tasks and acceptance are not guaranteed.'
                    : 'Provider availability needs checking directly.'}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
      <aside className={styles.notice}>
        <h2>What this page can tell you</h2>
        <p>
          Contracts are source-listed roles. Method guides describe routes to investigate, not
          available paid assignments. Read the linked guide for its original provider, requirements
          and link status. We do not guarantee customers, selection or earnings.
        </p>
        <p>
          <Link href="/opportunities/sources/">Inspect source coverage and updates</Link> ·{' '}
          <Link href="/editorial-policy/">Read our editorial policy</Link>
        </p>
      </aside>
    </div>
  );
}
