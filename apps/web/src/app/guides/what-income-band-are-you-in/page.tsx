import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'What income band are you in? (A 4-question check, not a precise ranking)',
  description:
    'Four concept-only questions that point you to a US income band to check in the free calculator. No income amount is asked, and no pinpoint percentile is claimed.',
  alternates: { canonical: '/guides/what-income-band-are-you-in/' },
};

export default function WhatIncomeBandAreYouIn() {
  return (
    <main>
      <h1>What income band are you in?</h1>
      <p>A 4-question check, not a precise ranking.</p>
      <p>
        <strong>This quiz cannot place you precisely — only the calculator, using your
        income, can put you in a band.</strong> It asks about work and pay patterns, not
        for an income amount. Your answers are not collected or stored; they stay in your
        browser.
      </p>
      <h2>The 4 questions</h2>
      <h3>1. How is your pay usually described?</h3>
      <ul>
        <li>A. An hourly rate, paid for hours worked</li>
        <li>B. A monthly salary</li>
        <li>C. Variable — freelance, gig, or seasonal work</li>
        <li>D. I am not currently earning</li>
      </ul>
      <h3>2. Which best describes your working pattern?</h3>
      <ul>
        <li>A. Part-time or irregular hours</li>
        <li>B. Full-time, one job</li>
        <li>C. Full-time plus extra work</li>
        <li>D. Not working right now</li>
      </ul>
      <h3>3. When you think about a “typical” income, what do you compare against?</h3>
      <ul>
        <li>A. People in my town or neighbourhood</li>
        <li>B. People in my industry</li>
        <li>C. The national picture</li>
        <li>D. I have never compared it</li>
      </ul>
      <h3>4. What do you most want to know?</h3>
      <ul>
        <li>A. Whether most people earn more or less than me</li>
        <li>B. What share of people earn under a round number (like $50,000 or $100,000)</li>
        <li>C. Whether I am above or below the middle</li>
        <li>D. Just a rough sense of where I sit</li>
      </ul>
      <h2>What your outcome means</h2>
      <p>
        The quiz routes by Question 4 to a reading outcome — it does not score to a
        number:
      </p>
      <ul>
        <li>
          <strong>If you answered A or B to Question 4 — start with a round-number band:</strong>{' '}
          pick the round number closest to your situation from the bands below, then check
          it in the calculator.
        </li>
        <li>
          <strong>If you answered C — start with the middle:</strong> the median band is
          $37,500–$39,999; the median is a range, not a single salary, and being above
          $39,999 puts you above half of US individuals on this basis.
        </li>
        <li>
          <strong>If you answered D — start with the whole picture:</strong> read the full
          band table on the data page.
        </li>
      </ul>
      <h2>Why this quiz cannot give you a percentile</h2>
      <p>
        Because the published Census table is grouped in bands; a single pinpoint number
        would be invented. Only the calculator, with your income, gives a band check, and
        no pinpoint percentile is claimed.
      </p>
      <h2>The full band table</h2>
      <ul>
        <li>Under $25,000 — 37.1% of US individuals earn under $25,000</li>
        <li>Under $50,000 — 59.3% of US individuals earn under $50,000</li>
        <li>Under $75,000 — 74.7% of US individuals earn under $75,000</li>
        <li>Under $100,000 — 83.3% of US individuals earn under $100,000</li>
        <li>$250,000 or more — 2.5% of US individuals earn $250,000 or more</li>
        <li>Median band — $37,500–$39,999</li>
      </ul>
      <h2>Check your band with the calculator</h2>
      <p>
        Check your own band with the free calculator, no sign-up:{' '}
        <Link href="/calc/individual-income-percentile/">Income calculator</Link>
      </p>
      <h2>Share your band</h2>
      <p>
        Share the band, not an income amount. Band cards for each band above are prepared
        in the workspace (under $25,000 / under $50,000 / under $75,000 / under $100,000 /
        $250,000+); they are not binary files in this commit.
      </p>
      <h2>Frequently asked questions</h2>
      <h3>Does this quiz tell me my exact percentile?</h3>
      <p>
        No. It only points you to a band. Only the calculator, with your income, gives a
        band check, and no pinpoint percentile is claimed.
      </p>
      <h3>Are your answers stored?</h3>
      <p>No. Answers stay in your browser and are not collected or stored.</p>
      <h3>What population is this about?</h3>
      <p>
        US individuals, before-tax, Census CPS ASEC PINC-11 2024, age 15+, including no
        income/losses — not households, not full-time workers only.
      </p>
      <h3>Why bands, not a single number?</h3>
      <p>
        Because the published Census table is grouped in bands; a single pinpoint number
        would be invented.
      </p>
      <h2>Source and limits</h2>
      <p>
        US individuals, before-tax income, Census CPS ASEC PINC-11 2024, age 15+,
        including no income/losses. Survey estimates, not exact counts.
      </p>
      <p>
        <Link href="/calculators/">All calculators</Link>
        {' '}· <Link href="/data/us-income-distribution/">US income distribution</Link>
        {' '}· <Link href="/guides/">All guides</Link>
      </p>
    </main>
  );
}
