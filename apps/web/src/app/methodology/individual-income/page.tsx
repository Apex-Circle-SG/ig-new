import type { Metadata } from 'next';
import { SiteLink as Link } from '@insightginie/ui';
import { Document } from '../../../components/document';
export const metadata: Metadata = {
  title: 'Individual Income Percentile Methodology',
  description:
    'The exact formula, comparison population, open-tail handling and limitations behind the individual income percentile calculator.',
  alternates: { canonical: '/methodology/individual-income/' },
};
export default function IncomeMethod() {
  return (
    <Document
      title="How we estimate your income percentile."
      eyebrow="CALCULATOR METHODOLOGY"
      lead="One published distribution. A reproducible calculation. No hidden adjustments."
    >
      <section>
        <h2>1. Define the comparison</h2>
        <p>
          We compare annual individual money income before taxes with all US people age 15 and over
          in the Census CPS PINC-11 population. This includes nonworkers, students, retirees, people
          with no income and people reporting losses. It does not compare only with earners,
          full-time workers or similarly aged adults.
        </p>
        <Link prefetch={false} href="/data/census-cps/">
          Dataset scope and definitions →
        </Link>
      </section>
      <section>
        <h2>2. Find your published income band</h2>
        <p>
          Bands are lower-inclusive and upper-exclusive. An income of exactly $75,000 belongs to the
          band beginning at $75,000. Counts in all lower bands contribute to the cumulative
          population below your band.
        </p>
      </section>
      <section>
        <h2>3. Estimate within a closed band</h2>
        <p>
          For income x in a band with lower edge L and upper edge U, population B below the band,
          population C in the band and total population N:
        </p>
        <p>
          <code>percentile = 100 × (B + C × (x − L) / (U − L)) / N</code>
        </p>
        <p>
          This assumes incomes are evenly distributed within the band. In practice they may cluster.
          The displayed estimate uses one decimal place; that display precision is not a claim of
          statistical accuracy.
        </p>
      </section>
      <section>
        <h2>4. Keep open ends honest</h2>
        <p>
          The first band combines no income, losses and incomes below $2,500. The last is $250,000
          or more. There is no finite band width for either. We therefore report the range from 100
          × B / N to 100 × (B + C) / N. We do not invent a tail distribution.
        </p>
        <p>
          These are band bounds, not statistical confidence intervals. For open tails, displayed
          lower bounds round down and upper bounds round up, so display rounding does not narrow the
          possible range.
        </p>
      </section>
      <section>
        <h2>5. Preserve the reference year</h2>
        <p>
          The input is compared directly with income measured in the dataset year shown on the
          result. No inflation adjustment, tax adjustment, household equivalence scale or
          cost-of-living adjustment is applied.
        </p>
      </section>
      <section>
        <h2>What this calculation cannot tell you</h2>
        <p>
          It cannot establish your exact rank, your rank among people of the same age, your
          financial health, or whether a salary meets your needs. It does not produce a statistical
          confidence interval because the aggregate source does not provide all information needed
          for that calculation.
        </p>
        <Link prefetch={false} href="/calc/individual-income-percentile/">
          Try the income calculator →
        </Link>
      </section>
    </Document>
  );
}
