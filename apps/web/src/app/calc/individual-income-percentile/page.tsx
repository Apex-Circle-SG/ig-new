import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { SiteLink as Link } from '@insightginie/ui';
import { ArrowRight, Check, ChevronRight, Database } from 'lucide-react';
import { getIndividualIncomeDistribution } from '@insightginie/datasets';
import { breadcrumbSchema, safeJsonLd, webApplicationSchema } from '@insightginie/seo';
import { PrivateIncomeTool } from '../../../components/private-income-tool';
import { FinanceTrust } from '../../../components/finance-trust';
export const metadata: Metadata = {
  title: 'US Individual Income Percentile Calculator',
  description:
    'See how your annual individual income compares with US people age 15 and over using Census data. Free, private, and transparent about assumptions.',
  alternates: { canonical: '/calc/individual-income-percentile/' },
};
export default async function Calculator() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const distribution = getIndividualIncomeDistribution();
  return (
    <div className="shell calculator-page">
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: safeJsonLd([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Calculators', path: '/calc/' },
              { name: 'Income percentile', path: '/calc/individual-income-percentile/' },
            ]),
            webApplicationSchema(
              'Individual Income Percentile Calculator',
              '/calc/individual-income-percentile/',
              'Compare annual individual money income with US people age 15 and over using Census data.',
            ),
          ]),
        }}
      />
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <Link prefetch={false} href="/">
          Home
        </Link>
        <ChevronRight size={13} />
        <Link prefetch={false} href="/calc/">
          Calculators
        </Link>
        <ChevronRight size={13} />
        <span>Income percentile</span>
      </nav>
      <div className="calculator-heading">
        <div className="eyebrow">A CLEARER VIEW OF YOUR INCOME</div>
        <h1>US individual income percentile calculator</h1>
        <p>See how your annual income compares with people across the United States.</p>
        <div className="tool-badges">
          <span>
            <Database size={14} />
            US Census Bureau
          </span>
          <span>
            <Check size={14} />
            {distribution?.datasetVersion.year ?? '—'} income data
          </span>
          <span>No account needed</span>
        </div>
      </div>
      <PrivateIncomeTool />
      <div className="below-tool-grid">
        <section>
          <div className="eyebrow">BEYOND THE NUMBER</div>
          <h2>What your percentile really means</h2>
          <p>
            An estimated 70th percentile means your income is higher than approximately 70% of the
            comparison population. It describes your relative position, not whether you earn enough
            for your needs.
          </p>
          <p>
            This comparison includes US people age 15 and over, including students, retirees,
            part-time workers and people with no income. It is not a comparison only with full-time
            workers or people your age.
          </p>
          <p>
            Location, household size, taxes, debt and savings can change what the same income means.
            This calculator does not adjust for those factors.
          </p>
          <Link prefetch={false} className="text-link" href="/methodology/individual-income/">
            Read the full methodology <ArrowRight size={16} />
          </Link>
          <p>
            <Link href="/data/us-income-distribution/">Explore the US income distribution</Link> to
            see the underlying bands and download the source-derived table.
          </p>
        </section>
        <aside className="source-card">
          <span className="feature-icon violet">
            <Database size={23} />
          </span>
          <h2>Real data. Open workings.</h2>
          <dl>
            <div>
              <dt>Publisher</dt>
              <dd>US Census Bureau</dd>
            </div>
            <div>
              <dt>Survey</dt>
              <dd>CPS Annual Social and Economic Supplement</dd>
            </div>
            <div>
              <dt>Income year</dt>
              <dd>{distribution?.datasetVersion.year ?? 'Data unavailable'}</dd>
            </div>
            <div>
              <dt>Retrieved</dt>
              <dd>
                {distribution
                  ? new Date(distribution.datasetVersion.retrievedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })
                  : 'Data unavailable'}
              </dd>
            </div>
            <div>
              <dt>Update cadence</dt>
              <dd>Annual</dd>
            </div>
          </dl>
          <Link prefetch={false} href="/data/census-cps/" className="text-link">
            Explore the dataset <ArrowRight size={16} />
          </Link>
        </aside>
      </div>
      <FinanceTrust
        updatedAt="2026-09-13"
        methodologyPath="/methodology/individual-income/"
        sources={
          distribution
            ? [
                {
                  name: distribution.datasetVersion.sourceName,
                  url: distribution.datasetVersion.sourceUrl,
                  year: distribution.datasetVersion.year,
                },
              ]
            : []
        }
      />
      <section className="faq-section">
        <h2>A few good questions</h2>
        {[
          {
            q: 'Which income should I enter?',
            a: 'Use annual individual money income before taxes: wages, net self-employment income, interest, dividends, retirement income and other cash income covered by the Census definition. Do not use combined household income or net worth. Capital gains and noncash benefits are excluded.',
          },
          {
            q: 'Is this a precise rank?',
            a: 'No. The source publishes grouped income estimates. We assume incomes are spread evenly within each closed band. At open ends, we show the possible percentile range instead of inventing a precise rank. The result also carries survey sampling uncertainty.',
          },
          {
            q: 'Why does the data year differ from today?',
            a: 'Annual income surveys take time to collect, process and publish. The year shown is the income reference year. Enter an amount in that year’s dollars for a like-for-like comparison; this calculator does not automatically adjust current income for inflation.',
          },
          {
            q: 'Do you save my income?',
            a: 'No. Your input and result remain in browser memory for this calculation. They are not put in a URL, sent to analytics, or saved to an account. Sharing the calculator copies a general tool link without your input.',
          },
        ].map((item) => (
          <details key={item.q}>
            <summary>
              {item.q}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
