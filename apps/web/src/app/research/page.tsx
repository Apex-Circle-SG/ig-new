import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { SiteLink as Link } from '@insightginie/ui';
import { breadcrumbSchema, safeJsonLd } from '@insightginie/seo';
import { getIndividualIncomeDistribution, incomeOverviewGroups } from '@insightginie/datasets';
import { FinanceTrust } from '../../components/finance-trust';
import styles from '../insights/content.module.css';

export const metadata: Metadata = {
  title: 'US Income Data and Research',
  description:
    'Explore the validated Census US income distribution, download its derived table and understand the population, reference year and limitations.',
  alternates: { canonical: '/research/' },
};

export default async function Research() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const distribution = getIndividualIncomeDistribution();
  const groups = distribution ? incomeOverviewGroups(distribution) : [];
  const version = distribution?.datasetVersion;
  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Research', path: '/research/' },
            ]),
          ),
        }}
      />
      {version && (
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              '@context': 'https://schema.org',
              '@type': 'Dataset',
              name: `${version.year} US individual income distribution grouped by InsightGinie`,
              description:
                'Broad income groups derived from Census CPS PINC-11 for US people age 15 and over, including people without income and with income losses.',
              url: 'https://insightginie.com/research/',
              creator: {
                '@type': 'Organization',
                name: 'InsightGinie',
                url: 'https://insightginie.com/',
              },
              isBasedOn: version.sourceUrl,
              temporalCoverage: String(version.year),
              spatialCoverage: 'United States',
              version: version.id,
              distribution: {
                '@type': 'DataDownload',
                encodingFormat: 'text/csv',
                contentUrl: 'https://insightginie.com/data/us-income-distribution.csv',
              },
            }),
          }}
        />
      )}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link> / Research
      </nav>
      <p className={styles.eyebrow}>The evidence behind the insight</p>
      <h1>
        Research starts with
        <br />
        data you can inspect.
      </h1>
      <p className={styles.lead}>
        Explore a published distribution, understand who it represents and download the workings.
        Original editorial studies will appear here after authorship and review are complete.
      </p>
      <section className={styles.section} aria-labelledby="income-distribution-heading">
        <p className={styles.eyebrow}>Available now · source data explorer</p>
        <h2 id="income-distribution-heading">
          {version?.year ?? ''} US individual income distribution
        </h2>
        {distribution && version ? (
          <>
            <div className={styles.notice}>
              <p>
                <strong>Comparison population:</strong> US people age 15 and over, including people
                without income and with income losses. This is individual money income before taxes,
                not a household or full-time-worker salary comparison.
              </p>
              <p>
                <strong>Source:</strong> Census CPS {version.surveyYear} ASEC, PINC-11. Income
                reference year: {version.year}. Figures are survey estimates.
              </p>
            </div>
            <div
              className={styles.tableWrap}
              role="region"
              aria-label="Income distribution table"
              tabIndex={0}
            >
              <table className={styles.table}>
                <caption>Published income bands combined into broad groups</caption>
                <thead>
                  <tr>
                    <th scope="col">Annual income</th>
                    <th scope="col">Estimated people</th>
                    <th scope="col">Population share</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.label}>
                      <th scope="row">{group.label}</th>
                      <td>{group.count.toLocaleString('en-US')}</td>
                      <td>{group.share.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.lead}>
              The groups sum the validated published band counts. Shares can differ slightly from
              100% after rounding. Sampling and reporting error remain; this table does not measure
              anyone’s financial wellbeing or prescribe what they should earn.
            </p>
            <div className={styles.actions}>
              <a href="/data/us-income-distribution.csv" download>
                Download the derived CSV
              </a>
              <Link href="/data/census-cps/">Source and transformation details</Link>
              <Link href="/calc/individual-income-percentile/">Compare an individual income</Link>
              <a href={version.sourceUrl} rel="noopener noreferrer">
                Original Census table
              </a>
            </div>
            <p className={styles.meta}>
              Dataset version: {version.id}. Retrieved{' '}
              {new Date(version.retrievedAt).toLocaleDateString('en-US', {
                dateStyle: 'long',
                timeZone: 'UTC',
              })}
              .
            </p>
          </>
        ) : (
          <p className={styles.empty}>
            Data unavailable. A validated source snapshot is required before figures are displayed.
          </p>
        )}
      </section>
      <section className={styles.section}>
        <h2>Built to be checked</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>Named source</h3>
            <p>Every published dataset points to its original publisher and reference year.</p>
            <Link href="/data/">Explore datasets →</Link>
          </div>
          <div className={styles.card}>
            <h3>Reproducible calculations</h3>
            <p>Definitions, transformations and limitations stay beside the result.</p>
            <Link href="/methodology/">Read the methods →</Link>
          </div>
          <div className={styles.card}>
            <h3>Reviewed editorial work</h3>
            <p>
              New research articles remain drafts until a real author and appropriate review are
              recorded.
            </p>
            <Link href="/editorial-policy/">Read the policy →</Link>
          </div>
        </div>
      </section>
      <FinanceTrust
        updatedAt="2026-09-13"
        formulaVersion="cps-income-overview-v1"
        methodologyPath="/data/census-cps/"
        sources={
          version
            ? [
                {
                  name: version.sourceName,
                  url: version.sourceUrl,
                  year: version.year,
                  version: version.id,
                },
              ]
            : []
        }
      />
    </div>
  );
}
