import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Do most Americans earn more than $75,000 a year?',
  description:
    'No — 74.7% of US individuals earn under $75,000 a year, so about one in four earns $75,000 or more, from Census CPS ASEC PINC-11 2024.',
  alternates: { canonical: '/guides/do-most-americans-earn-more-than-75000/' },
};

export default function MostEarnMoreThan75000() {
  return (
    <main>
      <h1>Do most Americans earn more than $75,000 a year?</h1>
      <p>
        <strong>Answer first:</strong> No. 74.7% of US individuals earn under $75,000 a
        year, so most Americans do not earn more than $75,000. By subtraction,
        100% − 74.7% = 25.3% earn $75,000 or more — about one in four.
      </p>
      <h2>The numbers</h2>
      <p>
        Under $25,000: 37.1%. Under $50,000: 59.3%. Under $75,000: 74.7%. Under $100,000:
        83.3%. $250,000+: 2.5%. The $75,000 line sits at roughly the three-quarter mark
        of the distribution, not the middle.
      </p>
      <h2>Why the answer surprises people</h2>
      <p>
        Headline salaries, job adverts, and household figures all run higher than
        individual income. A household total combines everyone under one roof, so it will
        usually be higher than any one person’s income. Comparing a single salary with a
        household figure is the most common way this question gets the wrong answer.
      </p>
      <h2>Who is in the “most”?</h2>
      <p>
        Everyone in the population: US people age 15 and over, before tax, including
        students, retirees, part-time workers, and people with no income or losses. If the
        question were only about full-time workers, the answer would be different — but
        that is not the population this table covers, and this page does not invent that
        figure.
      </p>
      <h2>What $75,000 means in the distribution</h2>
      <p>
        Earning $75,000 puts you above roughly three-quarters of the population on this
        individual, before-tax basis. That is a position in a distribution, not a judgement
        about whether $75,000 is enough anywhere in particular — costs, household size,
        and taxes are not in this table.
      </p>
      <h2>Frequently asked questions</h2>
      <h3>Is $75,000 a high income?</h3>
      <p>
        On this distribution, it is above the 74.7% line — but “high” also depends on
        where you live, your household, and your costs, none of which this table measures.
      </p>
      <h3>What share earns $75,000 or more exactly?</h3>
      <p>
        About 25.3%, by subtraction from 100%. The table does not give a single pinpoint
        share at exactly $75,000, because $75,000 is a band boundary.
      </p>
      <h3>Does this include part-time workers?</h3>
      <p>Yes — the population is all US people age 15 and over, not full-time workers only.</p>
      <h2>Source and limits</h2>
      <p>
        US Census Bureau, CPS ASEC PINC-11, 2024 income, US individuals age 15+, before
        tax, including no income/losses. 25.3% is arithmetic (100% − 74.7%), not a
        separately published Census percentage.
      </p>
      <p>
        <Link href="/data/us-income-distribution/">US income distribution</Link>
        {' '}· <Link href="/calc/individual-income-percentile/">Income calculator</Link>
        {' '}· <Link href="/calculators/">All calculators</Link>
        {' '}· <Link href="/guides/">All guides</Link>
      </p>
    </main>
  );
}
