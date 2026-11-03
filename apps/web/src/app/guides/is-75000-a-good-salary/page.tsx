import type { Metadata } from 'next';
import Link from 'next/link';
import GuideArticle from '../../../components/guide-article';

export const metadata: Metadata = {
  title: 'Is $75,000 a good salary in the US?',
  description:
    'On the US Census individual-income basis, about 75–76% of people earn less than $75,000, so $75,000 is around the top quarter — but whether it feels good depends on costs, not on the income table alone.',
  alternates: { canonical: '/guides/is-75000-a-good-salary/' },
};

export default function Is75000AGoodSalary() {
  return (
    <GuideArticle
      title="Is $75,000 a good salary in the US?"
      answer={<>
        <strong>Answer first:</strong> On the Census individual-income basis,
        about 75–76% of US individuals earn less than $75,000, so $75,000 sits
        around the top quarter of individual incomes. That is a position in the
        distribution, not a verdict: whether $75,000 feels good depends on
        housing, debts, household size, and where you live, which this income
        table does not measure.
      </>}
    >
      <h2>Where $75,000 sits in the distribution</h2>
      <p>
        The published thresholds are: 37.1% earn under $25,000, 59.3% earn under
        $50,000, 74.7% earn under $75,000, and 83.3% earn under $100,000. The
        $75,000–$77,499 band runs from 74.72% to 76.28%, which is why $75,000 is
        described as about 75–76% earning less, rather than a single pinpoint
        percentile. In round terms, about one in four US individuals earns
        $75,000 or more.
      </p>
      <h2>Why the table cannot answer “good” on its own</h2>
      <p>
        “Good” is about what an income covers after the costs of a particular
        life: rent or a mortgage, transport, childcare, debts, and how many
        people the income supports. Two people on $75,000 can have very
        different outgoings. The Census income table gives the national
        position only, so it is best used as a starting point, then compared
        with your own monthly costs — for example with a cash runway or
        budget check — rather than as a pass-or-fail judgement.
      </p>
      <h2>How $75,000 compares with the middle</h2>
      <p>
        The median individual income falls in the $37,500–$39,999 band.
        At $75,000, you are well above
        that middle band, and above the under-$50,000 mark (59.3% earn less
        than $50,000), while still below the under-$100,000 mark (83.3% earn
        less than $100,000).
      </p>
      <h2>Frequently asked questions</h2>
      <h3>Is $75,000 in the top 25%?</h3>
      <p>
        In round terms, yes on this individual-income basis: about 75–76% earn
        less than $75,000, so roughly a quarter earn $75,000 or more. The band
        width means this is an approximate position, not an exact percentile.
      </p>
      <h3>Is this household income?</h3>
      <p>
        No. This is individual income, before tax, for US people age 15 and
        over, including people with no income or losses. Household income
        combines all earners in a home and is a different figure.
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
      </p>    </GuideArticle>
  );
}
