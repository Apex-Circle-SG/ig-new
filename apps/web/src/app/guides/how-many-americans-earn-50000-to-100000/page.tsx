import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How many Americans earn between $50,000 and $100,000?',
  description:
    'About 24.0% of US individuals earn between $50,000 and $100,000 a year — the arithmetic is 83.3% under $100,000 minus 59.3% under $50,000, from Census CPS ASEC PINC-11 2024.',
  alternates: { canonical: '/guides/how-many-americans-earn-50000-to-100000/' },
};

export default function Earn50000To100000() {
  return (
    <main>
      <h1>How many Americans earn between $50,000 and $100,000 a year?</h1>
      <p>
        <strong>Answer first:</strong> About 24.0% — roughly one in four US individuals.
        That is not a new Census figure; it is the difference between two published
        cumulatives: 83.3% earn under $100,000, and 59.3% earn under $50,000, so
        83.3% − 59.3% = 24.0% earn between those two lines.
      </p>
      <h2>The arithmetic, shown</h2>
      <p>
        Under $50,000: 59.3%. Under $100,000: 83.3%. Between $50,000 and $100,000:
        83.3% − 59.3% = 24.0%. The same method gives the neighbouring bands: under
        $25,000 is 37.1%, so $25,000–$50,000 is 59.3% − 37.1% = 22.2%; and
        $75,000–$100,000 is 83.3% − 74.7% = 8.6%.
      </p>
      <h2>What sits inside this $50,000–$100,000 band</h2>
      <p>
        It is a wide band, not a single lifestyle. It spans people just above $50,000 and
        people just below $100,000, and the published table does not break it into finer
        bands at this level in the headline figures — the full 44-band table on the data
        page does, in $2,500 steps below $100,000.
      </p>
      <h2>What this band is not</h2>
      <p>
        It is not a household band, not an employed-only band, and not a full-time salary
        band. It covers all US individuals age 15 and over, before tax, including people
        with no income or losses. Do not compare a household total with it.
      </p>
      <h2>Where does your income fall?</h2>
      <p>
        Use the calculator to find your own published band, and the data page to see every
        band and download the table.
      </p>
      <h2>Frequently asked questions</h2>
      <h3>Is 24.0% exact?</h3>
      <p>No. It is arithmetic on rounded published cumulatives (83.3% and 59.3%), so treat it as approximately one in four.</p>
      <h3>Does this include people with no income?</h3>
      <p>
        Yes, in the population — but people with no income are in the under-$25,000 group,
        not in this $50,000–$100,000 band.
      </p>
      <h3>What about $100,000 and over?</h3>
      <p>
        100% − 83.3% = 16.7% earn $100,000 or more, by the same subtraction. That includes
        the $250,000+ group at 2.5%.
      </p>
      <h2>Source and limits</h2>
      <p>
        US Census Bureau, CPS ASEC PINC-11, 2024 income, US individuals age 15+, before
        tax, including no income/losses. Derived percentages are arithmetic on rounded
        figures, not separately published Census percentages.
      </p>
      <p>
        <Link href="/data/us-income-distribution/">US income distribution (full table)</Link>
        {' '}· <Link href="/calc/individual-income-percentile/">Income calculator</Link>
        {' '}· <Link href="/calculators/">All calculators</Link>
        {' '}· <Link href="/guides/">All guides</Link>
      </p>
    </main>
  );
}
