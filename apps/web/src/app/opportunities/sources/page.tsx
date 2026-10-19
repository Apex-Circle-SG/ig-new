import type { Metadata } from 'next';
import { SiteLink as Link } from '@insightginie/ui';
import { catalog, dateLabel, type CatalogStats } from '../../../lib/opportunities';
import {
  OpportunityNavigation,
  CatalogUnavailable,
} from '../../../components/opportunity-navigation';
import styles from '../../../components/opportunities.module.css';
export const metadata: Metadata = {
  title: 'Opportunity sources, coverage and update status',
  description:
    'See which opportunity feeds are live, which sources need permission, and how listings and business ideas are handled.',
  alternates: { canonical: '/opportunities/sources/' },
};
export default async function Sources() {
  const stats = await catalog<CatalogStats>('/v1/stats');
  return (
    <div className={`shell ${styles.page}`}>
      <OpportunityNavigation current="/opportunities/sources/" />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Coverage you can inspect</span>
        <h1>
          Real sources.
          <br />
          Clear distinctions.
        </h1>
        <p>
          We import permitted remote-role feeds, link to earning platforms and publish clearly
          labeled business experiments. Here is what is connected today.
        </p>
      </header>
      {!stats ? (
        <CatalogUnavailable />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.muted}>
              {stats.sources.length} researched source channels; only feeds marked live are imported
              automatically.
            </caption>
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">Coverage</th>
                <th scope="col">Integration</th>
                <th scope="col">Last successful import</th>
              </tr>
            </thead>
            <tbody>
              {stats.sources.map((source) => (
                <tr key={source.id}>
                  <td>
                    <a href={source.url} target="_blank" rel="noopener">
                      {source.name} ↗
                    </a>
                  </td>
                  <td>{source.category}</td>
                  <td>
                    {source.status === 'enabled'
                      ? source.last_success
                        ? 'Live feed'
                        : 'Awaiting first import'
                      : source.status === 'directory'
                        ? 'Directory profile'
                        : 'Permission / access review'}
                    {source.status === 'enabled' && source.last_error && (
                      <span> · Latest refresh failed</span>
                    )}
                  </td>
                  <td>{source.last_success ? dateLabel(source.last_success) : 'Not importing'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <section className={styles.detail}>
        <h2>How updates work</h2>
        <p>
          A scheduled job runs hourly and rotates across the three live feeds. Each source is
          visited every three hours, with bounded batches cycling through its recent records.
          Listings not reconfirmed within seven days leave active search. A fresh feed appearance
          does not guarantee that the employer is still accepting applications.
        </p>
        <h2>Payment and qualification</h2>
        <p>
          Rewards and salary ranges are supplied by the source. Eligibility may include a country,
          work authorization, screening or an assessment. Prizes and grants have different
          conditions from paid work. We do not process applications or payments.
        </p>
        <h2>Privacy and access</h2>
        <p>
          Search works without an account. We do not collect CVs, identity documents or private
          platform credentials. Original providers handle their own signup and application process.
          Automatic email alerts are not enabled in this release.
        </p>
        <h2>Ideas are experiments</h2>
        <p>
          Our idea lab contains original brainstorming, not funded work or validated business
          demand. Each concept asks you to test a small offer with a real potential customer.
        </p>
        <h2>Something looks wrong?</h2>
        <p>
          <Link href="/contact/">Contact us</Link> with the listing URL and what needs correction.
          Source permissions and new feeds are reviewed before being enabled.
        </p>
      </section>
    </div>
  );
}
