/**
 * Single source of truth for the /guides/ index.
 *
 * Every new guide page MUST add one entry here (same commit as the page),
 * otherwise the page is live by direct URL but orphaned from the index —
 * which is what happened to the two guides pushed on 31 Oct 2026.
 * Summaries are band ranges only, never a pinpoint percentile.
 */
export const GUIDES = [
  {
    href: '/guides/what-before-tax-income-means/',
    title: 'What does before-tax income mean?',
    summary:
      'Before-tax income is income before tax is taken out. Use it, not take-home pay, when comparing with the Census distribution.',
  },
  {
    href: '/guides/how-many-americans-earn-50000-to-100000/',
    title: 'How many Americans earn between $50,000 and $100,000?',
    summary:
      'About 24.0% — 83.3% under $100,000 minus 59.3% under $50,000, shown as arithmetic.',
  },
  {
    href: '/guides/why-median-income-is-a-range/',
    title: 'Why is the median US income a range, $37,500–$39,999?',
    summary:
      'The Census publishes income in bands, so the middle person falls inside a band — the table cannot give a single median dollar figure.',
  },
  {
    href: '/guides/do-most-americans-earn-more-than-75000/',
    title: 'Do most Americans earn more than $75,000 a year?',
    summary:
      'No — 74.7% of US individuals earn under $75,000 a year, so about one in four earns $75,000 or more.',
  },
  {
    href: '/guides/income-above-half-of-americans/',
    title: 'How much do you need to earn to be above half of all Americans?',
    summary:
      'Above $39,999 — above the top of the median band. Inside the band, the table cannot place you exactly.',
  },
  {
    href: '/guides/what-income-band-are-you-in/',
    title: 'What income band are you in? (A 4-question check, not a precise ranking)',
    summary:
      'Four concept-only questions that point you to a band to check in the calculator. No income amount is asked, and no pinpoint percentile is claimed.',
  },
  {
    href: '/guides/what-percentile-is-60000-a-year/',
    title: 'What percentile is $60,000 a year in the US?',
    summary:
      'Above the median band and the under-$50,000 mark, but below the under-$75,000 mark — the published band, not a pinpoint percentile.',
  },
  {
    href: '/guides/what-is-the-average-salary-in-america/',
    title: 'What is the average salary in America?',
    summary:
      '“Average” can mean mean, median, individual, household, or full-time-only. On the Census individual-income basis, the median falls in the $37,500–$39,999 band.',
  },
  {
    href: '/guides/is-75000-a-good-salary/',
    title: 'Is $75,000 a good salary in the US?',
    summary:
      'About 75–76% of US individuals earn less than $75,000 — a position in the distribution, not a verdict on whether it feels good.',
  },
];
