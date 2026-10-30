import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Why is the median US income a range, not a single number?',
  description:
    'The median US individual income falls in the $37,500–$39,999 band because Census publishes grouped income bands, not individual incomes — so the exact middle income cannot be read off the table.',
  alternates: { canonical: '/guides/why-median-income-is-a-range/' },
};

export default function MedianIncomeRange() {
  return (
    <main>
      <h1>Why is the median US income a range, $37,500–$39,999?</h1>
      <p>
        <strong>Answer first:</strong> Because the Census publishes income in bands, not
        as a list of every person’s income. The middle person — the median — falls inside
        the $37,500–$39,999 band, and the table alone cannot say exactly where inside
        that $2,500-wide band they sit. Any site that gives you a single median dollar
        figure from this table is estimating or interpolating, not reporting.
      </p>
      <h2>How a median works in a banded table</h2>
      <p>
        Line the whole population up by income. The median is the person in the middle.
        Cumulative shares show 49.74% earn under $37,500 and 51.36% earn under $40,000
        (from the data page’s 44-band table), so the 50% line falls inside the
        $37,500–$39,999 band. That is the whole answer the table can give.
      </p>
      <h2>Why not just pick the middle of the band?</h2>
      <p>
        The middle of $37,500–$39,999 would be about $38,750, but incomes are not
        necessarily spread evenly inside a band. Picking the midpoint would be an
        assumption dressed up as a fact, so this site reports the band, not a midpoint.
      </p>
      <h2>What the median band does and does not mean</h2>
      <p>
        It means half the population earns less than someone in this band, and half earns
        more. It does not mean the “typical worker” earns this — the population includes
        students, retirees, part-time workers, and people with no income, not only
        full-time workers. It is before tax, and it is individual income, not household
        income.
      </p>
      <h2>If you need a single number for your own planning</h2>
      <p>
        Use the calculator with your own income to see your band, and use your own budget
        for planning. A median band is a distribution fact, not a personal target.
      </p>
      <h2>Frequently asked questions</h2>
      <h3>Is the median $38,000?</h3>
      <p>
        Roughly, in the sense that $38,000 falls inside the median band — but the honest
        published answer is the band $37,500–$39,999, not a single figure.
      </p>
      <h3>Does the median change every year?</h3>
      <p>
        The income year here is 2024, from the CPS survey 2025. A new income year would
        come from a new Census release, not from this page updating itself.
      </p>
      <h3>Is this the median salary?</h3>
      <p>
        No. It is the median individual money income, before tax, for all US people age 15
        and over, including no income/losses — not a median salary for full-time workers.
      </p>
      <h2>Source and limits</h2>
      <p>
        US Census Bureau, CPS ASEC PINC-11, 2024 income. Cumulative figures 49.74% and
        51.36% are from the data page’s published band table; the median band
        $37,500–$39,999 is the verified headline band.
      </p>
      <p>
        <Link href="/data/us-income-distribution/">US income distribution (44-band table)</Link>
        {' '}· <Link href="/calc/individual-income-percentile/">Income calculator</Link>
        {' '}· <Link href="/calculators/">All calculators</Link>
        {' '}· <Link href="/guides/">All guides</Link>
      </p>
    </main>
  );
}
