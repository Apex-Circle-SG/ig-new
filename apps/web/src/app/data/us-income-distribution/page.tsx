import type { Metadata } from 'next';
import { headers } from 'next/headers';
import {
  getIndividualIncomeDistribution,
  incomeDistributionRows,
  incomeOverviewGroups,
} from '@insightginie/datasets';
import { safeJsonLd } from '@insightginie/seo';
import { SiteLink as Link } from '@insightginie/ui';
import { Document } from '../../../components/document';
import { IncomeDistributionTable } from '../../../components/income-distribution-table';

export const metadata: Metadata = {
  title: 'US Individual Income Distribution: Census Data, Chart & CSV',
  description:
    'Explore US individual income bands with Census CPS data, population shares, an accessible chart, downloadable CSV and transparent methodology.',
  alternates: { canonical: '/data/us-income-distribution/' },
};

export default async function IncomeDistribution() {
  const distribution = getIndividualIncomeDistribution();
  if (!distribution)
    return (
      <Document
        title="US individual income distribution"
        eyebrow="PUBLIC DATA"
        lead="Data unavailable"
      >
        <p>
          A validated snapshot is unavailable. Please check again after the next successful update.
        </p>
      </Document>
    );
  const version = distribution.datasetVersion;
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const groups = incomeOverviewGroups(distribution);
  return (
    <Document
      title={`US individual income distribution, ${version.year}`}
      eyebrow="EXPLORE THE DATA"
      lead="See how individual money income is distributed across the United States, with every published band available to explore and download."
    >
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            name: `US individual income distribution, ${version.year}`,
            description: distribution.universe,
            url: 'https://insightginie.com/data/us-income-distribution/',
            creator: {
              '@type': 'Organization',
              name: 'US Census Bureau',
              url: 'https://www.census.gov/',
            },
            publisher: {
              '@type': 'Organization',
              name: 'InsightGinie',
              url: 'https://insightginie.com/',
            },
            isBasedOn: version.sourceUrl,
            temporalCoverage: String(version.year),
            spatialCoverage: 'United States',
            version: version.id,
            dateModified: version.retrievedAt,
            distribution: {
              '@type': 'DataDownload',
              encodingFormat: 'text/csv',
              contentUrl: 'https://insightginie.com/data/us-income-distribution.csv',
            },
          }),
        }}
      />
      <p className="document-meta">
        Income year {version.year} · CPS survey {version.surveyYear} · Retrieved{' '}
        {new Date(version.retrievedAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}
      </p>
      <div className="document-callout">
        This compares all US people age 15 and over, including people with no income and income
        losses. It is not a household, employed-only or full-time salary distribution.
      </div>
      <section>
        <h2>The distribution at a glance</h2>
        <p>
          These eight groups combine the {distribution.brackets.length} published bands. Bars show
          the share of the comparison population in each group, using the sum of rounded band counts
          as the denominator.
        </p>
        <div
          className="income-overview"
          role="img"
          aria-label="Income distribution chart. Each bar includes its income group and population share as text."
        >
          {groups.map((group) => (
            <div className="overview-row" key={group.label}>
              <span>{group.label}</span>
              <div className="overview-track">
                <i style={{ width: `${group.share}%` }} />
              </div>
              <strong>{group.share.toFixed(1)}%</strong>
            </div>
          ))}
        </div>
        <p>
          Source: <a href={version.sourceUrl}>{version.sourceName}</a>, {version.year} income.
          Population estimates, not exact counts.
        </p>
        <Link href="/calc/individual-income-percentile/" className="button primary">
          Compare your individual income →
        </Link>
      </section>
      <section>
        <h2>Explore every income band</h2>
        <p>
          Cumulative share includes people in this band and all lower bands. Band percentages do not
          reveal the exact distribution within a band.
        </p>
        <IncomeDistributionTable rows={incomeDistributionRows(distribution)} />
        <p>
          <a href="/data/us-income-distribution.csv" download>
            Download the complete CSV
          </a>{' '}
          · <Link href="/data/census-cps/">Source files and validation</Link>
        </p>
      </section>
      <section>
        <h2>How to use these figures</h2>
        <p>
          These are individual, before-tax money incomes for {version.year}. Household income,
          wealth and local purchasing power answer different questions. Survey uncertainty and
          rounded estimates mean percentages should be interpreted approximately.
        </p>
        <p>
          The first group includes losses and zero income. The highest published band has no upper
          bound. The calculator shows a percentile range when the source cannot support a more
          precise position.
        </p>
        <Link href="/methodology/individual-income/">Read the calculation assumptions →</Link>
      </section>
      <section>
        <h2>Embed or cite this chart</h2>
        <p>
          Use the public chart in a resource that benefits from the comparison. The embed contains
          source attribution and does not load advertising or collect financial inputs. Attribution
          is appreciated; a followed link is not required.
        </p>
        <pre className="embed-code">
          <code>
            {
              '<iframe src="https://insightginie.com/embed/income-distribution/" title="US individual income distribution" width="100%" height="570" loading="lazy" style="border:0"></iframe>'
            }
          </code>
        </pre>
        <p>
          Suggested citation: US Census Bureau, CPS ASEC PINC-11, {version.year} individual money
          income; chart and normalized table by InsightGinie. Dataset version{' '}
          <code>{version.id}</code>.
        </p>
      </section>
    </Document>
  );
}
