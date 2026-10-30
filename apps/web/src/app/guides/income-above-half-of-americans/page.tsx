import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How much do you need to earn to be above half of all Americans?',
  description:
    'To be above half of all US individuals, your before-tax individual income needs to be above the median band of $37,500–$39,999 — inside the band, the table cannot say exactly, from Census CPS ASEC PINC-11 2024.',
  alternates: { canonical: '/guides/income-above-half-of-americans/' },
};

export default function IncomeAboveHalf() {
  return (
    <main>
      <h1>How much do you need to earn to be above half of all Americans?</h1>
      <p>
        <strong>Answer first:</strong> Above $39,999 — that is, above the top of the
        median band. Earn less than $37,500 and you are below half; earn inside
        $37,500–$39,999 and the table cannot say whether you are above or below the exact
        middle person, because it does not show incomes inside the band. Earn above $39,999
        and you are above half, on this basis.
      </p>
      <h2>The three zones</h2>
      <p>
        Below $37,500: below half (49.74% earn under $37,500, per the data page’s band
        table). Inside $37,500–$39,999: the middle band — position inside it is not
        published. Above $39,999: above half (51.36% earn under $40,000, so more than half
        earn under $40,000 and you are past the middle once you are above the band).
      </p>
      <h2>Why this question has a band answer, not a number answer</h2>
      <p>
        Same reason as the median-range guide: the source is grouped bands. A single “you
        need $X” figure would be an interpolation, not a Census publication. This site
        reports the band and the zones, and says plainly where the table stops.
      </p>
      <h2>Half of whom, on what basis?</h2>
      <p>
        Half of all US people age 15 and over, individual money income, before tax,
        including people with no income or losses. Not half of workers, not half of
        households, not half of full-time earners. Change the population and the answer
        changes — this page does not supply that other answer.
      </p>
      <h2>Check your own position</h2>
      <p>
        Enter your annual individual before-tax income in the calculator. It will show
        your published band and, where the source allows, a range — not a pinpoint rank.
      </p>
      <h2>Frequently asked questions</h2>
      <h3>Is earning $40,000 “above average”?</h3>
      <p>
        On this median basis, $40,000 is just above the median band. “Average” usually
        means the mean, which this page does not claim — no mean figure is given here,
        because no mean is in the verified band list.
      </p>
      <h3>What if I earn exactly $38,000?</h3>
      <p>
        You are inside the median band. The table cannot place you above or below the
        exact middle person from that alone, and this page will not guess.
      </p>
      <h3>Does household income change this?</h3>
      <p>
        Yes, but it is a different question: household income combines everyone under one
        roof and is not comparable with this individual-income median band.
      </p>
      <h2>Source and limits</h2>
      <p>
        US Census Bureau, CPS ASEC PINC-11, 2024 income. Median band $37,500–$39,999;
        cumulative figures 49.74% (under $37,500) and 51.36% (under $40,000) from the data
        page’s 44-band table. Survey estimates, not exact counts.
      </p>
      <p>
        <Link href="/data/us-income-distribution/">US income distribution (band table)</Link>
        {' '}· <Link href="/calc/individual-income-percentile/">Income calculator</Link>
        {' '}· <Link href="/guides/why-median-income-is-a-range/">Why the median is a range</Link>
        {' '}· <Link href="/calculators/">All calculators</Link>
        {' '}· <Link href="/guides/">All guides</Link>
      </p>
    </main>
  );
}
