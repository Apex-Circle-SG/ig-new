import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Guides: US income, explained in bands',
  description:
    'Short, source-grounded guides to US individual income, using only published Census income bands — no pinpoint percentile is claimed.',
  alternates: { canonical: '/guides/' },
};

const guides = [
  {
    href: '/guides/what-before-tax-income-means/',
    title: 'What does before-tax income mean?',
    summary: 'Before-tax income is income before tax is taken out. Use it, not take-home pay, when comparing with the Census distribution.',
  },
  {
    href: '/guides/how-many-americans-earn-50000-to-100000/',
    title: 'How many Americans earn between $50,000 and $100,000?',
    summary: 'About 24.0% — 83.3% under $100,000 minus 59.3% under $50,000, shown as arithmetic.',
  },
  {
    href: '/guides/why-median-income-is-a-range/',
    title: 'Why is the median US income a range, $37,500–$39,999?',
    summary: 'The Census publishes income in bands, so the middle person falls inside a band — the table cannot give a single median dollar figure.',
  },
  {
    href: '/guides/do-most-americans-earn-more-than-75000/',
    title: 'Do most Americans earn more than $75,000 a year?',
    summary: 'No — 74.7% of US individuals earn under $75,000 a year, so about one in four earns $75,000 or more.',
  },
  {
    href: '/guides/income-above-half-of-americans/',
    title: 'How much do you need to earn to be above half of all Americans?',
    summary: 'Above $39,999 — above the top of the median band. Inside the band, the table cannot place you exactly.',
  },
  {
    href: '/guides/what-income-band-are-you-in/',
    title: 'What income band are you in? (A 4-question check, not a precise ranking)',
    summary: 'Four concept-only questions that point you to a band to check in the calculator. No income amount is asked, and no pinpoint percentile is claimed.',
  },
];

export default function GuidesIndex() {
  return (
    <main>
      <h1>Guides: US income, explained in bands</h1>
      <p>
        These guides use only published income bands from the US Census Bureau, CPS ASEC
        PINC-11, 2024 income, for US individuals age 15 and over, before tax, including
        people with no income or losses. They are not household, employed-only, or
        full-time-only figures.
      </p>
      <ul>
        {guides.map((guide) => (
          <li key={guide.href}>
            <Link href={guide.href}>{guide.title}</Link>
            <p>{guide.summary}</p>
          </li>
        ))}
      </ul>
      <p>
        Check your own band with the free calculator, no sign-up:{' '}
        <Link href="/calc/individual-income-percentile/">Income calculator</Link>
        {' '}· Explore the full data:{' '}
        <Link href="/data/us-income-distribution/">US income distribution</Link>
        {' '}· All calculators:{' '}
        <Link href="/calculators/">Calculators</Link>
      </p>
    </main>
  );
}
