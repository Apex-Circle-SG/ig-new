import type { Metadata } from 'next';
import { SiteLink as Link } from '@insightginie/ui';
import {
  catalog,
  dateLabel,
  type CatalogStats,
  type OpportunityResults,
} from '../../lib/opportunities';
import { OpportunityNavigation, CatalogUnavailable } from '../../components/opportunity-navigation';
import styles from '../../components/opportunities.module.css';
import { DiscoveryTopics } from '../../components/discovery-hub';
export const metadata: Metadata = {
  title: 'Online opportunities, remote work and ways to earn',
  description:
    'Find remote work, explore earning platforms and test creative business ideas. Source-linked listings, eligibility and payment conditions in one place.',
  alternates: {
    canonical: '/opportunities/',
    types: { 'application/rss+xml': 'https://insightginie.com/opportunities/feed.xml' },
  },
};
type Params = Record<string, string | string[] | undefined>;
export default async function Opportunities({ searchParams }: { searchParams: Promise<Params> }) {
  const raw = await searchParams;
  const value = (key: string) => (typeof raw[key] === 'string' ? raw[key].slice(0, 160) : '');
  const query = new URLSearchParams();
  for (const key of ['q', 'location', 'source', 'paid', 'page', 'category', 'arrangement'])
    if (value(key)) query.set(key, value(key));
  const [result, stats] = await Promise.all([
    catalog<OpportunityResults>(`/v1/opportunities?${query}`),
    catalog<CatalogStats>('/v1/stats'),
  ]);
  const pageUrl = (page: number) => {
    const next = new URLSearchParams(query);
    next.set('page', String(page));
    return `/opportunities/?${next}`;
  };
  return (
    <div className={`shell ${styles.page}`}>
      <OpportunityNavigation current="/opportunities/" />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Your next possibility</span>
        <h1>
          Find work.
          <br />
          Explore what’s possible.
        </h1>
        <p>
          Employer-listed remote work, part-time and contract arrangements, open-source rewards and
          creative ways to earn. Start with your skills and check what you qualify for.
        </p>
        {stats && (
          <div className={styles.stats}>
            <div>
              <strong>{stats.opportunities}</strong>active source listings
            </div>
            <div>
              <strong>{stats.platforms}</strong>earning platforms
            </div>
            <div>
              <strong>{stats.methods}</strong>practical earning methods
            </div>
            <div>
              <strong>{stats.ideas}</strong>business experiments
            </div>
          </div>
        )}
      </header>
      <form action="/opportunities/" method="get" className={styles.form}>
        <label>
          What can you do?
          <input
            name="q"
            type="search"
            defaultValue={value('q')}
            placeholder="Writing, Python, customer support…"
            maxLength={160}
          />
        </label>
        <label>
          Listed location
          <input
            name="location"
            defaultValue={value('location')}
            placeholder="USA, Europe, worldwide…"
            maxLength={80}
          />
        </label>
        <label>
          Source
          <select name="source" defaultValue={value('source')}>
            <option value="">All live sources</option>
            {stats?.sources
              .filter((source) => source.status === 'enabled')
              .map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Opportunity type
          <select name="category" defaultValue={value('category')}>
            <option value="">All opportunities</option>
            <option value="jobs">Remote jobs</option>
            <option value="bounties">Open-source rewards</option>
          </select>
        </label>
        <label>
          Arrangement
          <select name="arrangement" defaultValue={value('arrangement')}>
            <option value="">Any arrangement</option>
            {['Full-time', 'Part-time', 'Contract', 'Freelance', 'Temporary', 'Internship'].map(
              (mode) => (
                <option key={mode}>{mode}</option>
              ),
            )}
          </select>
        </label>
        <button type="submit">Find opportunities →</button>
        <label className={styles.check}>
          <input type="checkbox" name="paid" value="1" defaultChecked={value('paid') === '1'} />
          Only roles with a source-listed pay range
        </label>
      </form>
      <DiscoveryTopics />
      <div className={styles.links}>
        <Link href="/earn/">Creative ways to earn</Link>
        <Link href="/opportunities/?category=jobs&arrangement=Part-time">
          Remote part-time work
        </Link>
        <Link href="/platforms/#bounties">Coding & security bounties</Link>
        <Link href="/platforms/#competitions">Competitions & funding</Link>
        <Link href="/ideas/?category=Playful">Funny & unusual ideas</Link>
        <Link href="/ideas/">Start a small business</Link>
      </div>
      <div className={styles.results}>
        <h2>{result ? `${result.total} matching opportunities` : 'Latest opportunities'}</h2>
        <span className={styles.muted}>Original providers handle applications and payment.</span>
      </div>
      {!result ? (
        <CatalogUnavailable />
      ) : result.items.length === 0 ? (
        <div className={styles.empty}>
          <h2>No matching opportunities right now.</h2>
          <p>Try fewer filters, or explore platforms and ideas while new listings arrive.</p>
          <Link href="/opportunities/">Clear filters</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {result.items.map((item) => (
            <article className={styles.card} key={item.id}>
              <span className={styles.badge}>
                {item.category === 'bounties' ? 'Project reward' : 'Remote role'} ·{' '}
                {item.source_name}
              </span>
              <h2>
                <Link href={`/opportunities/${item.id}/`}>{item.title}</Link>
              </h2>
              <p>
                <strong>{item.organization}</strong>
                <br />
                {item.location}
              </p>
              <div className={styles.reward}>{item.reward}</div>
              <div className={styles.tags}>
                <span>{item.employment_type || 'Not specified'}</span>
                {item.skills.slice(0, 4).map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <div className={styles.cardBottom}>
                <span>Listed {dateLabel(item.published_at)}</span>
                <a href={item.source_url} target="_blank" rel="noopener">
                  View on {item.source_name} ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
      {result && result.pages > 1 && (
        <nav aria-label="Result pages" className={styles.pagination}>
          {result.page > 1 && <Link href={pageUrl(result.page - 1)}>← Previous</Link>}
          <span>
            Page {result.page} of {result.pages}
          </span>
          {result.page < result.pages && <Link href={pageUrl(result.page + 1)}>Next →</Link>}
        </nav>
      )}
      <aside className={styles.notice}>
        <h2>Remote doesn’t always mean worldwide.</h2>
        <p>
          Eligibility and pay come from the listed source. A listing is an invitation to apply, not
          a promise of selection or earnings. Check current details with the original provider
          before sharing personal information or doing work.
        </p>
      </aside>
      <section className={styles.callout}>
        <h2>Prefer to create your own opportunity?</h2>
        <p>
          Explore playful gifts, practical services, tiny tools and community businesses. Each
          concept includes a buyer hypothesis and a small first experiment.
        </p>
        <Link href="/ideas/">Visit the idea lab →</Link>
      </section>
    </div>
  );
}
