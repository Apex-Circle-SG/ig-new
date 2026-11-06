import type { Metadata } from 'next';
import Link from 'next/link';
import GuideArticle from '../../../components/guide-article';

export const metadata: Metadata = {
  title: 'Household income vs. individual income: why the two figures differ',
  description:
    'Household income adds up everyone in a home, while the Census individual-income table counts one person at a time. Comparing a household figure with individual bands overstates the position.',
  alternates: { canonical: '/guides/household-vs-individual-income/' },
};

export default function HouseholdVsIndividualIncome() {
  return (
    <GuideArticle
      title="Household income vs. individual income: why the two figures differ"
      answer={
        <>
          <strong>Answer first:</strong> Household income is the combined
          income of everyone in a household; individual income is one
          person's income. The InsightGinie data page uses individual income
          only, so a household total must not be looked up in the individual
          bands — doing so makes the household look higher up the
          distribution than any one earner in it actually is.
        </>
      }
    >
      <h2>What each figure counts</h2>
      <p>
        The published individual-income basis is: US individuals age 15 and
        over, before tax, including people with no income or losses. On that
        basis, 37.1% earn under $25,000, 59.3% earn under $50,000, 74.7% earn
        under $75,000, and 83.3% earn under $100,000. A household figure
        counts something else entirely: every earner's income in the same
        home, added together.
      </p>
      <h2>A simple example of the mismatch</h2>
      <p>
        Take two earners in one home, each on $40,000 before tax. Each
        person, looked up individually, sits around the middle of the
        individual distribution — the median individual band is
        $37,500–$39,999, so $40,000 is just above that
        middle band. Added together, the household income is $80,000. Put
        $80,000 into the individual table and it lands in the top quarter
        (about 75–76% earn less than $75,000). That top-quarter reading
        describes nobody in the home: it is an artefact of comparing a
        two-earner total with a one-person table.
      </p>
      <h2>Which figure to use, and when</h2>
      <p>
        Use individual income when the question is about one person's
        position — for example, where your own salary sits nationally. Use
        household income when the question is about what a home as a whole
        can afford, such as rent or a mortgage application, and compare it
        with household figures, not with the individual bands. Mixing the
        two is the most common way these comparisons go wrong.
      </p>
      <h2>Frequently asked questions</h2>
      <h3>Is household income usually higher than individual income?</h3>
      <p>
        In homes with more than one earner, yes by construction: the
        household total adds earners together, so it runs higher than any
        single earner's income in that home. That does not mean each earner
        is highly paid.
      </p>
      <h3>Can I compare my household income with the InsightGinie calculator?</h3>
      <p>
        No, not directly. The calculator compares one person's before-tax
        income with the individual distribution. Enter one person's income,
        not the household total.
      </p>
      <h2>Source and limits</h2>
      <p>
        US Census Bureau, CPS ASEC PINC-11, 2024 income. Population: US
        individuals age 15+, before tax, including no income/losses. Survey
        estimates, not exact counts; band percentages are approximate.
        Household figures are a different Census concept and are not
        derived from this individual table.
      </p>
      <p>
        <Link href="/calc/individual-income-percentile/">Income calculator</Link>
        {' '}· <Link href="/data/us-income-distribution/">US income distribution</Link>
        {' '}· <Link href="/calculators/">All calculators</Link>
        {' '}· <Link href="/guides/">All guides</Link>
      </p>
    </GuideArticle>
  );
}
