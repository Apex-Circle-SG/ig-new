import type { Metadata } from 'next';
import { catalog, type Platform } from '../../lib/opportunities';
import { OpportunityNavigation, CatalogUnavailable } from '../../components/opportunity-navigation';
import styles from '../../components/opportunities.module.css';
export const metadata: Metadata = {
  title: 'Platforms for paid research, freelance work and bounties',
  description:
    'Explore places to find online work, paid studies, coding bounties, competitions and funding. Understand eligibility and payment conditions before signing up.',
  alternates: { canonical: '/platforms/' },
};
const groups = [
  {
    id: 'research',
    title: 'Paid research & usability testing',
    names: ['Prolific', 'Respondent', 'UserTesting', 'User Interviews'],
  },
  {
    id: 'tasks',
    title: 'AI evaluation & microtasks',
    names: ['DataAnnotation', 'Outlier', 'Clickworker'],
  },
  { id: 'freelance', title: 'Freelance & contract marketplaces', names: ['Freelancer', 'Upwork'] },
  {
    id: 'bounties',
    title: 'Coding & security bounties',
    names: ['Algora', 'HackerOne', 'Immunefi'],
  },
  {
    id: 'competitions',
    title: 'Competitions & innovation prizes',
    names: ['Kaggle', 'Devpost', 'HeroX', 'NASA Solve'],
  },
  {
    id: 'funding',
    title: 'Funding, procurement & government roles',
    names: ['Grants.gov', 'SAM.gov', 'EU TED', 'USAJOBS'],
  },
  { id: 'local', title: 'Local services', names: ['Taskrabbit'] },
];
export default async function Platforms() {
  const data = await catalog<{ items: Platform[] }>('/v1/platforms');
  return (
    <div className={`shell ${styles.page}`}>
      <OpportunityNavigation current="/platforms/" />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Find your starting point</span>
        <h1>
          Different skills.
          <br />
          Different ways to earn.
        </h1>
        <p>
          Research participation, technical bounties, freelance projects and more. Explore the
          original platforms and check which opportunities you qualify for.
        </p>
      </header>
      <aside className={styles.notice}>
        <strong>A directory, not a live task feed.</strong>
        <p>
          These profiles link to providers. Available work may be personalized, limited, competitive
          or behind a qualification process. Inclusion is not a guarantee of admission, payout or
          current tasks.
        </p>
      </aside>
      <nav className={styles.links} aria-label="Platform categories">
        {groups.map((group) => (
          <a href={`#${group.id}`} key={group.id}>
            {group.title}
          </a>
        ))}
      </nav>
      {!data ? (
        <CatalogUnavailable />
      ) : (
        groups.map((group) => (
          <section id={group.id} key={group.id} className={styles.category}>
            <h2>{group.title}</h2>
            <div className={styles.grid}>
              {data.items
                .filter((platform) => group.names.includes(platform.name))
                .map((platform) => (
                  <article className={styles.card} key={platform.id}>
                    <span className={styles.badge}>Platform directory</span>
                    <h3>{platform.name}</h3>
                    <p>{platform.description}</p>
                    <p>{platform.payment}</p>
                    <details>
                      <summary>Check your eligibility</summary>
                      <p>{platform.eligibility}</p>
                    </details>
                    <div className={styles.cardBottom}>
                      <a href={platform.url} target="_blank" rel="noopener">
                        Visit {platform.name} ↗
                      </a>
                      <span>No affiliate placement</span>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
