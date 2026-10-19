import { SiteLink as Link } from '@insightginie/ui';
import styles from './opportunities.module.css';
export function OpportunityNavigation({ current }: { current: string }) {
  return (
    <nav className={styles.tabs} aria-label="Explore earning opportunities">
      {[
        ['/opportunities/', 'Remote work & rewards'],
        ['/earn/', 'Ways to earn'],
        ['/ideas/', 'Idea lab'],
        ['/platforms/', 'Earning platforms'],
        ['/opportunities/sources/', 'Sources & updates'],
      ].map(([href, label]) => (
        <Link key={href} href={href} aria-current={current === href ? 'page' : undefined}>
          {label}
        </Link>
      ))}
      <a href="/opportunities/feed.xml">RSS updates ↗</a>
    </nav>
  );
}
export function CatalogUnavailable() {
  return (
    <section className={styles.notice} role="status">
      <h2>The catalog is taking a moment.</h2>
      <p>
        We couldn’t load the latest records. Please try again shortly. We won’t substitute made-up
        listings.
      </p>
    </section>
  );
}
