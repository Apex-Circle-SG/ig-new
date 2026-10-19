import type { Metadata } from 'next';
import { SiteLink as Link } from '@insightginie/ui';
import { catalog, categoryDescriptions, type Idea } from '../../lib/opportunities';
import { OpportunityNavigation, CatalogUnavailable } from '../../components/opportunity-navigation';
import styles from '../../components/opportunities.module.css';
export const metadata: Metadata = {
  title: 'Creative ways to earn: the business idea lab',
  description:
    'Explore playful services, creative businesses and small tools. Each original idea has a buyer hypothesis, delivery approach and first validation experiment.',
  alternates: { canonical: '/ideas/' },
};
export default async function Ideas({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selected = typeof params.category === 'string' ? params.category : '';
  const data = await catalog<{ items: Idea[] }>('/v1/ideas');
  const categories = Object.keys(categoryDescriptions).filter(
    (category) => !selected || category === selected,
  );
  return (
    <div className={`shell ${styles.page}`}>
      <OpportunityNavigation current="/ideas/" />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Small experiments. Unexpected possibilities.</span>
        <h1>
          What if you
          <br />
          tried something different?
        </h1>
        <p>
          Practical, playful and occasionally wonderfully odd ways to turn a skill into an offer.
          Pick a concept, find a potential buyer, and test it small.
        </p>
      </header>
      <aside className={styles.notice}>
        <strong>Ideas, not paid listings.</strong>
        <p>
          These are original brainstorming concepts. Demand and earnings are unvalidated. No buyer
          has committed to paying; the first step is finding out whether someone will.
        </p>
      </aside>
      <nav className={styles.links} aria-label="Idea categories">
        <Link href="/ideas/">All ideas{data ? ` · ${data.items.length}` : ''}</Link>
        {Object.keys(categoryDescriptions).map((category) => (
          <Link href={`/ideas/?category=${encodeURIComponent(category)}`} key={category}>
            {category}
          </Link>
        ))}
      </nav>
      {!data ? (
        <CatalogUnavailable />
      ) : categories.length === 0 ? (
        <div className={styles.empty}>
          <h2>Choose a category above.</h2>
          <Link href="/ideas/">See all ideas</Link>
        </div>
      ) : (
        categories.map((category) => (
          <section className={styles.category} key={category}>
            <h2>{category}</h2>
            <p>{categoryDescriptions[category]}</p>
            <div className={styles.grid}>
              {data.items
                .filter((idea) => idea.category === category)
                .map((idea) => (
                  <article key={idea.id} className={styles.card}>
                    <span className={styles.badge}>Business experiment · Unvalidated</span>
                    <h3>
                      <Link href={`/ideas/${idea.id}/`}>{idea.title}</Link>
                    </h3>
                    <p>{idea.description}</p>
                    <div className={styles.tags}>
                      {idea.skills.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>
                    <div className={styles.cardBottom}>
                      <span>Hypothetical customer</span>
                      <Link href={`/ideas/${idea.id}/`}>See the first experiment →</Link>
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
