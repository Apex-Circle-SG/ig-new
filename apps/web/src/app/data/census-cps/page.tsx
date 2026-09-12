import type { Metadata } from 'next';
import Link from 'next/link';
import { getIndividualIncomeDistribution } from '@insightginie/datasets';
import { safeJsonLd } from '@insightginie/seo';
import { Document } from '../../../components/document';
export const metadata: Metadata = {
  title: 'Census CPS Income Data',
  description:
    'Source, year, population, transformation and limitations of the Census CPS PINC-11 individual money-income distribution used by InsightGinie.',
  alternates: { canonical: '/data/census-cps/' },
};
export default function Census() {
  const d = getIndividualIncomeDistribution();
  const v = d?.datasetVersion;
  return (
    <Document
      title="The data behind your income insight."
      eyebrow="US CENSUS BUREAU · CURRENT POPULATION SURVEY"
      lead="A national view of individual money income, with its scope and limitations in plain sight."
    >
      {v && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              '@context': 'https://schema.org',
              '@type': 'Dataset',
              name: `Census CPS PINC-11 ${v.year} individual money income`,
              description: d.universe,
              url: 'https://insightginie.com/data/census-cps/',
              creator: {
                '@type': 'Organization',
                name: 'US Census Bureau',
                url: 'https://www.census.gov',
              },
              isBasedOn: v.sourceUrl,
              temporalCoverage: String(v.year),
              spatialCoverage: 'United States',
              version: v.id,
              dateModified: v.retrievedAt,
            }),
          }}
        />
      )}
      <div className="data-facts">
        <div>
          <strong>{v?.year ?? 'Unavailable'}</strong>
          <span>Income reference year</span>
        </div>
        <div>
          <strong>{d?.brackets.length ?? '—'} bands</strong>
          <span>Published income groups</span>
        </div>
        <div>
          <strong>Age 15+</strong>
          <span>US comparison population</span>
        </div>
      </div>
      <section>
        <h2>What does this dataset measure?</h2>
        <p>
          The Census CPS Annual Social and Economic Supplement measures money income received during
          the previous calendar year. PINC-11 reports income bands for people age 15 and over. Our
          national comparison includes people with no income and with income losses, across work
          statuses.
        </p>
        <p>
          Money income includes wages, net self-employment earnings, interest, dividends, pensions
          and other cash income before taxes. It excludes capital gains and noncash benefits. This
          is individual income, not household income, earnings only, wealth or take-home pay.
        </p>
      </section>
      <section>
        <h2>The version we use</h2>
        {v ? (
          <>
            <p>
              Income year: <strong>{v.year}</strong>. Survey year: <strong>{v.surveyYear}</strong>.
              Retrieved:{' '}
              <strong>
                {new Date(v.retrievedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  timeZone: 'UTC',
                })}
              </strong>
              . Refresh cadence: <strong>{v.refreshCadence}</strong>.
            </p>
            <p>
              Version: <code>{v.id}</code>
              <br />
              Transformation: <code>{v.transformationVersion}</code>
              <br />
              Validation: <strong>{v.validationStatus}</strong>
            </p>
            <p>
              This is a pinned reference-year dataset. A retrieval timestamp does not mean the
              underlying incomes are current.
            </p>
          </>
        ) : (
          <p>Data unavailable. A validated version has not been published.</p>
        )}
      </section>
      <section>
        <h2>How we transform it</h2>
        <p>
          We retrieve the publisher’s original spreadsheets, preserve their checksums, and read the
          all-person population counts. Rounded counts published in thousands are converted to
          counts. Consecutive income bands must be ordered, contiguous and nonnegative in population
          count.
        </p>
        <p>
          The calculator divides by the sum of the published band counts. That sum can differ
          slightly from the separately rounded total. The ingest validates this difference before
          publishing a new version. Failed validation leaves the previous validated snapshot in
          place.
        </p>
        {d && (
          <p>
            Current band sum: <strong>{d.total.toLocaleString('en-US')}</strong>; separately
            published population total:{' '}
            <strong>{d.sourceReportedTotal.toLocaleString('en-US')}</strong>. These are survey
            population estimates, not exact person counts.
          </p>
        )}
      </section>
      <section>
        <h2>What are the limitations?</h2>
        <ul>
          <li>Survey sampling, reporting error and rounding affect the estimates.</li>
          <li>
            Within-band income patterns are not observed. The calculator assumes a uniform spread in
            closed bands.
          </li>
          <li>
            Open tails below $2,500 and at $250,000 or more produce a percentile range, not a
            precise rank.
          </li>
          <li>This is not an age-matched, employed-only, state or metro comparison.</li>
          <li>Current-dollar income is not automatically adjusted to the source year.</li>
        </ul>
        <Link prefetch={false} href="/methodology/individual-income/">
          Read the calculation method →
        </Link>
      </section>
      <section>
        <h2>Access the original sources</h2>
        {v ? (
          <ul>
            <li>
              <a href={v.sourceUrl} target="_blank" rel="noreferrer">
                {v.sourceName}
              </a>
            </li>
            {v.artifacts.map((a) => (
              <li key={a.sourceUrl}>
                <a href={a.sourceUrl} target="_blank" rel="noreferrer">
                  {a.name}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>Data unavailable.</p>
        )}
        <p>
          <a
            href="https://www.census.gov/programs-surveys/cps/technical-documentation/subject-definitions.html"
            target="_blank"
            rel="noreferrer"
          >
            Census CPS subject definitions
          </a>
        </p>
      </section>
      <section>
        <h2>Put the data in perspective</h2>
        <Link prefetch={false} href="/calc/individual-income-percentile/">
          Calculate your individual income percentile →
        </Link>
      </section>
    </Document>
  );
}
