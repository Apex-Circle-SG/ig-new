import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'What is the average salary in America?',
  description:
    '“Average” can mean mean, median, individual, household, or full-time-only — and those figures differ. On the Census individual-income basis, the median falls in the $37,500–$39,999 band.',
  alternates: { canonical: '/guides/what-is-the-average-salary-in-america/' },
};

export default function WhatIsTheAverageSalaryInAmerica() {
  return (
    <main>
      <h1>What is the average salary in America?</h1>
      <p>
        <strong>Answer first:</strong> It depends on which “average” you mean, so start
        with one clearly defined figure. On the Census individual-income basis, the
        median falls in the $37,500–$39,999 band: 59.3% earn under $50,000, 74.7%
        earn under $75,000, and 83.3% earn under $100,000. A mean (“average”) is a
        different figure from the median, and household income is a different
        population again.
      </p>
      <h2>Mean vs. median</h2>
      <p>
        The median is the middle of the distribution — half of people earn less,
        half earn more. A mean adds up all incomes and divides by the number of
        people, so a small number of very high incomes pulls it up above the
        median. Quoting a mean as if it were the typical income therefore
        overstates what most people earn.
      </p>
      <h2>Individual vs. household</h2>
      <p>
        Individual income is one person’s income. Household income combines all
        earners in a home, so it is higher by construction. Comparing a household
        figure with an individual figure — or vice versa — misplaces a person by
        a large margin. Always check which population a salary article is using
        before trusting its figure.
      </p>
      <h2>What this dataset does not show</h2>
      <p>
        This page does not mix this Census individual-income dataset with
        full-time-worker or household figures in the same sentence without
        labelling which is which, and it does not claim a cost-of-living
        adjustment from this dataset. Location, household size, and hours worked
        all change what the same income means in practice.
      </p>
      <h2>Check your own income</h2>
      <p>
        Enter your annual individual before-tax income in the free calculator, and see
        which published band it falls in — the calculator reports a range, not a
        pinpoint percentile, where the source table cannot support more precision.
      </p>
      <h2>Frequently asked questions</h2>
      <h3>Is the median the same as the average?</h3>
      <p>
        No. The median is the middle value; the mean is the arithmetic average.
        They answer different questions, and for income they give different numbers.
      </p>
      <h3>Is this figure before or after tax?</h3>
      <p>
        Before tax. This is individual money income, before tax, for US people age
        15 and over, including people with no income or losses. Do not enter
        take-home pay for this comparison.
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
