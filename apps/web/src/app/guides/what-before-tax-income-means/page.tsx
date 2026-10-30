import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'What does before-tax income mean?',
  description:
    'Before-tax income is the income before tax is taken out. InsightGinie’s US income comparison uses before-tax individual income from Census CPS ASEC PINC-11 2024 — here is what that includes, and what it does not.',
  alternates: { canonical: '/guides/what-before-tax-income-means/' },
};

export default function BeforeTaxIncomeMeans() {
  return (
    <main>
      <h1>What does before-tax income mean?</h1>
      <p>
        <strong>Answer first:</strong> Before-tax income is your income before any tax is
        deducted. If you are comparing an income with InsightGinie’s US distribution, use
        the before-tax figure — because that is what the Census table counts. Do not use
        take-home pay for this comparison, or you will be comparing two different things.
      </p>
      <h2>What “before-tax” counts</h2>
      <p>
        Wages, net self-employment income, interest, dividends, retirement income, and
        other cash income covered by the Census definition of money income. Capital gains
        and noncash benefits are excluded, per the calculator page’s own “Which income
        should I enter?” section.
      </p>
      <h2>Why the comparison uses before-tax income</h2>
      <p>
        The source table (CPS ASEC PINC-11, 2024 income) is published on a before-tax
        basis. Using the same basis keeps the comparison like-for-like. A take-home figure
        has already had tax removed, so it would sit lower in the distribution than the
        same person’s before-tax income — not because they earn less, but because the
        number was changed before comparing.
      </p>
      <h2>What before-tax income does not tell you</h2>
      <p>
        It does not tell you what you keep after tax, what you can spend where you live,
        or whether an income is “enough”. Taxes, household size, debt, and local costs all
        change what the same before-tax figure means in practice. This page gives
        distribution context only.
      </p>
      <h2>Check your own income</h2>
      <p>
        Enter your annual individual before-tax income in the free calculator, and see
        which published band it falls in — the calculator reports a range, not a pinpoint
        percentile, where the source table cannot support more precision.
      </p>
      <h2>Frequently asked questions</h2>
      <h3>Is before-tax income the same as gross pay?</h3>
      <p>
        For most employees, gross pay is the closest everyday equivalent, but the Census
        definition is money income, which also includes the cash sources listed above —
        use the full money-income figure, not just salary, if it applies to you.
      </p>
      <h3>Should I enter take-home pay?</h3>
      <p>No, not for this comparison. Enter before-tax income, or the comparison will understate your position.</p>
      <h3>Is this household income?</h3>
      <p>
        No. This is individual income, before tax, for US people age 15 and over, including
        people with no income or losses.
      </p>
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
