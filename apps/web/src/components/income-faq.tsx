import { headers } from 'next/headers';
import { safeJsonLd } from '@insightginie/seo';

export const incomeFaq = [
  {
    q: 'What percentile is a $50,000 income?',
    a: 'About 59–62% of US people age 15 and over earn less than $50,000. $50,000 falls in the $50,000–$52,499 band, which ends at 62.42% cumulative. In plain terms: roughly 6 in 10 people earn less.',
  },
  {
    q: 'What percentile is a $75,000 income?',
    a: 'About 75–76% earn less. $75,000 falls in the $75,000–$77,499 band (74.72% to 76.28% cumulative).',
  },
  {
    q: 'What percentile is a $100,000 income?',
    a: 'At least 83% earn less, and $100,000 falls in the wide $100,000–$149,999 band (83.32% to 91.91% cumulative). Because that band is $50,000 wide, the published table alone cannot pinpoint a single percentile inside it — any site that gives you an exact number for $100,000 from this table is interpolating, not reporting.',
  },
  {
    q: 'What is the median individual income?',
    a: 'The median falls in the $37,500–$39,999 band (49.74% to 51.36% cumulative). Roughly $38,000–$40,000, before tax, for all US people age 15 and over — including people with no income.',
  },
  {
    q: 'What income gets you into the top 10%?',
    a: 'Somewhere in the $100,000–$149,999 band. 90% cumulative falls inside that wide band (83.32% to 91.91%), so the table alone cannot give a single threshold. Do not publish a single dollar figure here without a finer dataset.',
  },
  {
    q: 'What income gets you into the top 25%?',
    a: 'About $75,000. 75% cumulative is just above the $72,500–$74,999 band (74.72%).',
  },
  {
    q: 'Is this household income?',
    a: 'No. This is individual money income, before tax. Household income combines everyone under one roof and will be higher. Do not compare a single salary to a household figure, or vice versa.',
  },
  {
    q: 'Does this include people with no income?',
    a: 'Yes. The comparison population is all US people age 15 and over, including people with no income and income losses. That is why the share under $25,000 is so high: 37.1%.',
  },
] as const;
const source = 'Source: US Census Bureau, CPS ASEC PINC-11, 2024 income.';

export async function IncomeFaq() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <section className="faq-section">
      <h2>Income percentiles and thresholds</h2>
      <p>
        These answers report published band ranges, not an exact rank within a band. The existing
        calculator interpolates within closed bands; its single-number estimates are assumptions,
        not percentiles directly published by Census. Income year 2024, CPS survey 2025.
      </p>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: incomeFaq.map(({ q, a }) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text: `${a} ${source}` },
            })),
          }),
        }}
      />
      {incomeFaq.map(({ q, a }) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
          <p>{source}</p>
        </details>
      ))}
    </section>
  );
}
