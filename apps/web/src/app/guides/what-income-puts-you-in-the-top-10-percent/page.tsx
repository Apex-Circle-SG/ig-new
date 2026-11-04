import type { Metadata } from 'next';
import Link from 'next/link';
import GuideArticle from '../../../components/guide-article';

export const metadata: Metadata = {
  title: 'What income puts you in the top 10% in the US?',
  description:
    'On the Census individual-income basis, the top 10% threshold falls somewhere inside the wide $100,000–$149,999 band (83.32%–91.91% cumulative) — the table alone cannot give a single threshold figure.',
  alternates: { canonical: '/guides/what-income-puts-you-in-the-top-10-percent/' },
};

export default function WhatIncomePutsYouInTheTop10Percent() {
  return (
    <GuideArticle
      title="What income puts you in the top 10% in the US?"
      answer={<>
        <strong>Answer first:</strong> Somewhere in the $100,000–$149,999 band — and
        that is as precise as this table allows. 83.32% earn under $100,000 and
        91.91% earn under $150,000, so the 90% line falls inside that wide band.
        Any single dollar figure claimed as “the” top 10% threshold from this
        table alone is an interpolation, not a published Census figure.
      </>}
    >
      <h2>Why the answer is a band, not a number</h2>
      <p>
        The Census table publishes income in bands. Below $100,000 the bands are
        $2,500 wide, so thresholds near $50,000 or $75,000 can be located within
        a few thousand dollars. Above $100,000 the next band is $50,000 wide
        ($100,000–$149,999), so the 90% line cannot be located more precisely
        from this table. A finer dataset would be needed for a single threshold,
        and this page does not invent one.
      </p>
      <h2>The thresholds this table can locate</h2>
      <p>
        Top 25%: about $75,000 — 74.72% earn under $75,000, so roughly one in four
        earns $75,000 or more. Top 10%: inside $100,000–$149,999, as above.
        Top 2.5%: $250,000 or more, published directly (2.5% earn $250,000+).
        The pattern is clear: the further up the distribution you go, the wider
        the top bands get, and the less precise a single threshold becomes.
      </p>
      <h2>Individual, not household</h2>
      <p>
        This is individual money income, before tax, for US people age 15 and
        over, including people with no income or losses. A household top 10%
        threshold would be higher, because it combines everyone under one roof
        — do not compare a household figure with this individual-income band,
        or vice versa.
      </p>
      <h2>Check your own income</h2>
      <p>
        Enter your annual individual before-tax income in the free calculator, and see
        which published band it falls in — the calculator reports a range, not a
        pinpoint percentile, where the source table cannot support more precision.
      </p>
      <h2>Frequently asked questions</h2>
      <h3>Is $100,000 in the top 10%?</h3>
      <p>
        Not on its own: $100,000 is the bottom of the $100,000–$149,999 band, and
        83.32% earn under $100,000. Some people in that band are in the top 10%
        and some are not — the table cannot say which side of the 90% line a
        single income inside the band falls on.
      </p>
      <h3>Is $150,000 in the top 10%?</h3>
      <p>
        Yes, on this basis: 91.91% earn under $150,000, so earning $150,000 or
        more puts you above the 90% line — in the top 10% and a little beyond it.
      </p>
      <h3>Does this include part-time workers and people with no income?</h3>
      <p>
        Yes — the population is all US people age 15 and over, not full-time
        workers only. That is why the thresholds here are lower than figures
        based on full-time workers alone.
      </p>
      <h2>Source and limits</h2>
      <p>
        US Census Bureau, CPS ASEC PINC-11, 2024 income. Population: US individuals age
        15+, before tax, including no income/losses. Cumulative figures 83.32%
        (under $100,000) and 91.91% (under $150,000) from the data page’s 44-band
        table. Survey estimates, not exact counts; band percentages are approximate.
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
