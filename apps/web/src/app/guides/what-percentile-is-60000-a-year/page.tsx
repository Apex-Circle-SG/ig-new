import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'What percentile is $60,000 a year in the US?',
  description:
    'On the US Census individual-income basis, $60,000 sits above the median band and above the under-$50,000 mark, but below the under-$75,000 mark. InsightGinie reports the published band, not a pinpoint percentile.',
  alternates: { canonical: '/guides/what-percentile-is-60000-a-year/' },
};

export default function WhatPercentileIs60000AYear() {
  return (
    <main>
      <h1>What percentile is $60,000 a year in the US?</h1>
      <p>
        <strong>Answer first:</strong> On the Census individual-income basis, $60,000 is
        above the median band ($37,500–$39,999) and above the under-$50,000 mark
        (59.3% earn less than $50,000), but below the under-$75,000 mark (74.7%
        earn less than $75,000). So it sits in a band between those two thresholds.
        The calculator shows the exact published band for an income, rather than
        inventing a single pinpoint percentile.
      </p>
      <h2>Why there is no single percentile here</h2>
      <p>
        The Census table publishes income in bands, not as a continuous list of
        individual incomes. Bands are $2,500 wide up to $100,000, so a single income
        can be placed in its band, but a pinpoint percentile cannot be read off
        the table with more precision than the band allows. Any page that gives
        one exact percentile for $60,000 from this table is adding precision the
        source does not contain.
      </p>
      <h2>How to read the position of $60,000</h2>
      <p>
        Start from the published thresholds: 37.1% earn under $25,000, 59.3% earn
        under $50,000, 74.7% earn under $75,000, and 83.3% earn under $100,000.
        At $60,000, you are above the point where most Americans sit — the median
        band is $37,500–$39,999 — and below the $75,000 threshold. That range, not
        a single number, is the honest answer from this dataset.
      </p>
      <h2>Check your own income</h2>
      <p>
        Enter your annual individual before-tax income in the free calculator, and see
        which published band it falls in — the calculator reports a range, not a
        pinpoint percentile, where the source table cannot support more precision.
      </p>
      <h2>Frequently asked questions</h2>
      <h3>Is $60,000 a good salary?</h3>
      <p>
        This dataset can only give position, not a verdict. Whether $60,000 feels
        good depends on location, rent, debts, and household size, which this
        income table does not measure.
      </p>
      <h3>Is this household income?</h3>
      <p>
        No. This is individual income, before tax, for US people age 15 and over,
        including people with no income or losses. Household income combines all
        earners in a home and is a different figure.
      </p>
      <h3>Should I enter take-home pay?</h3>
      <p>No, not for this comparison. Enter before-tax income, or the comparison will understate your position.</p>
      <h2>Source and limits</h2>
      <p>
        US Census Bureau, CPS ASEC PINC-11, 2024 income. Population: US individuals age
        15+, before tax, including no income/losses. Survey estimates, not exact counts;
        band percentages are approximate.
      </p>
      <p>
        <Link href="/calc/individual-income-percentile/">Income calculator</Link>
        {' '}· <Link href="/data/us-income-distribution/">US income distribution</Link>
        {' '}· <Link href="/calculators/">All calculators</Link>
        {' '}· <Link href="/guides/">All guides</Link>
      </p>
    </main>
  );
}
