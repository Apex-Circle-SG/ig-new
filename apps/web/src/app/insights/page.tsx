import type { Metadata } from 'next';
import { SiteLink as Link } from '@insightginie/ui';
import { listContent, getContentStatus } from '../../lib/content';
import styles from './content.module.css';

type Search = { q?: string; category?: string };
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const search = await searchParams;
  return {
    title: 'Insights, Research and Practical Tools',
    description:
      'Explore InsightGinie research, transparent calculator methods and preserved article previews with original attribution.',
    alternates: { canonical: '/insights/' },
    ...('q' in search || 'category' in search ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function Insights({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const query = typeof search.q === 'string' ? search.q.slice(0, 160) : '';
  const category = typeof search.category === 'string' ? search.category.slice(0, 240) : '';
  const items = listContent({ query, category });
  const all = listContent({ limit: 100 });
  const categories = [
    ...new Map(all.flatMap((item) => item.categories).map((item) => [item.slug, item])).values(),
  ];
  const status = getContentStatus();
  return (
    <div className={styles.page}>
      <p className={styles.eyebrow}>Ideas, evidence and useful next steps</p>
      <h1>
        Understand the numbers.
        <br />
        Explore the context.
      </h1>
      <p className={styles.lead}>
        Start with a transparent tool, look at the underlying data, or explore an article with its
        original source in view.
      </p>
      <div className={styles.grid}>
        <section className={styles.card}>
          <p className={styles.eyebrow}>Calculate</p>
          <h2>Try a decision tool</h2>
          <p>Change an assumption and see the mathematical result, with the formula explained.</p>
          <Link href="/tools/">Explore tools →</Link>
        </section>
        <section className={styles.card}>
          <p className={styles.eyebrow}>Investigate</p>
          <h2>Follow the data</h2>
          <p>Explore the published US income distribution and download the source-backed table.</p>
          <Link href="/research/">Explore research →</Link>
        </section>
        <section className={styles.card}>
          <p className={styles.eyebrow}>Understand</p>
          <h2>Read the method</h2>
          <p>
            See what the comparison measures, how it is calculated and where uncertainty remains.
          </p>
          <Link href="/methodology/">See our methodology →</Link>
        </section>
      </div>
      <section className={styles.section} aria-labelledby="topics-heading">
        <p className={styles.eyebrow}>Choose the decision you are working through</p>
        <h2 id="topics-heading">Explore a topic</h2>
        <p>
          Work through the costs, assumptions and tradeoffs with calculators you can adjust. Each
          tool explains its formula and the limits of its results.
        </p>
        <nav className={styles.actions} aria-label="Insight topics">
          <a href="#ai-economics">AI economics</a>
          <a href="#founder-finance">Founder finance</a>
          <a href="#quantitative-risk">Quantitative risk</a>
        </nav>
        <div className={styles.grid}>
          <section id="ai-economics" className={styles.card} aria-labelledby="ai-economics-heading">
            <h3 id="ai-economics-heading">AI economics</h3>
            <p>
              Does an AI workflow save enough usable time to justify software, setup and review
              costs? Compare the work before and after automation, including human checks.
            </p>
            <p>
              Adjust task volume and the value of an hour to explore capacity value and payback.
              Time saved becomes cash savings only when spending actually falls.
            </p>
            <div className={styles.actions}>
              <Link href="/tools/ai-workflow-roi/">Model AI workflow ROI →</Link>
            </div>
          </section>
          <section
            id="founder-finance"
            className={styles.card}
            aria-labelledby="founder-finance-heading"
          >
            <h3 id="founder-finance-heading">Founder finance</h3>
            <p>
              How long can available cash cover your operating plans? Start with cash received, cash
              paid out and a reserve, then explore changes in sales volume or borrowing.
            </p>
            <p>
              Model steady cash flow, find the units needed to cover costs, and compare loan
              payments and fees. Keep cash timing and changing demand in view when interpreting
              these estimates.
            </p>
            <div className={styles.actions}>
              <Link href="/tools/cash-runway/">Estimate cash runway →</Link>
              <Link href="/tools/break-even/">Find break-even sales →</Link>
              <Link href="/tools/business-loan/">Compare business loan costs →</Link>
            </div>
          </section>
          <section
            id="quantitative-risk"
            className={styles.card}
            aria-labelledby="quantitative-risk-heading"
          >
            <h3 id="quantitative-risk-heading">Quantitative risk</h3>
            <p>
              What would it take to recover from a loss, and how much depends on your largest
              holding? Explore the recovery gain required and the effect of a hypothetical position
              loss.
            </p>
            <p>
              Use your own values and assumptions to inspect drawdowns and concentration. These
              calculations do not forecast returns or measure correlations between holdings.
            </p>
            <div className={styles.actions}>
              <Link href="/tools/drawdown-recovery/">Calculate drawdown recovery →</Link>
              <Link href="/tools/portfolio-concentration/">Check portfolio concentration →</Link>
            </div>
          </section>
        </div>
      </section>
      <section className={styles.section} aria-labelledby="archive-heading">
        <p className={styles.eyebrow}>From the original publication</p>
        <h2 id="archive-heading">Article previews</h2>
        <div className={styles.notice}>
          <p>
            These preserved articles retain their original author, dates and source. The original
            publication remains authoritative while migration checks are completed.
          </p>
          <p>
            Previewed here: {status.syncedPosts.toLocaleString('en-US')} of{' '}
            {status.inventoriedPosts.toLocaleString('en-US')} inventoried posts. This is a migration
            preview, not a completed archive transfer.
          </p>
        </div>
        <form action="/insights/" method="get" className={styles.filter} role="search">
          <div className={styles.field}>
            <label htmlFor="insights-query">Search article previews</label>
            <input
              id="insights-query"
              name="q"
              type="search"
              maxLength={160}
              defaultValue={query}
              placeholder="Title, topic or original author"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="insights-category">Original category</label>
            <select id="insights-category" name="category" defaultValue={category}>
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit">Find articles</button>
        </form>
        {items.length ? (
          <div className={styles.grid}>
            {items.map((item) => (
              <article key={item.id} className={styles.card}>
                <p className={styles.eyebrow}>Migration preview</p>
                <h3>
                  <Link href={item.path}>{item.title}</Link>
                </h3>
                <p>
                  {item.excerpt.slice(0, 210)}
                  {item.excerpt.length > 210 ? '…' : ''}
                </p>
                <div className={styles.meta}>
                  <span>{item.author.name}</span>
                  <time dateTime={item.publishedAt}>
                    {new Date(item.publishedAt).toLocaleDateString('en-US', {
                      dateStyle: 'medium',
                      timeZone: 'UTC',
                    })}
                  </time>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>
            {status.available
              ? 'No article previews match this search. Try another term or clear the category.'
              : 'Article previews are temporarily unavailable. The original publication is still available.'}
          </p>
        )}
        <div className={styles.actions}>
          <a href="https://blog.insightginie.com/" rel="noopener noreferrer">
            Visit the original publication →
          </a>
          {(query || category) && <Link href="/insights/">Clear filters</Link>}
        </div>
      </section>
    </div>
  );
}
