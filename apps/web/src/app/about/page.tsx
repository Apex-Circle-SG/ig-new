import type { Metadata } from 'next';
import { SiteLink as Link } from '@insightginie/ui';
import { Document } from '../../components/document';
export const metadata: Metadata = {
  title: 'About InsightGinie and Our Data Principles',
  description:
    'InsightGinie helps people understand their income and life decisions with public US data and transparent calculators.',
  alternates: { canonical: '/about/' },
};
export default function About() {
  return (
    <Document
      title="About InsightGinie"
      eyebrow="ABOUT INSIGHTGINIE"
      lead="Understand where you stand. See what changes next."
    >
      <section>
        <h2>Make public data useful to you</h2>
        <p>
          InsightGinie is a US-focused platform for understanding income, salary, cost of living and
          personal money decisions. We start with your question, connect it to authoritative data,
          and make the comparison understandable.
        </p>
        <p>
          Our first tool compares individual income with a published Census distribution. We are
          building the next tools around the same principles: real sources, deterministic
          calculations, clear limitations and privacy.
        </p>
        <Link href="/calc/individual-income-percentile/">
          Try the individual income calculator →
        </Link>
      </section>
      <section>
        <h2>Check the source. Ask about the result.</h2>
        <p>
          Each published tool links to its dataset and explains the comparison population, reference
          year and calculation method. Our income tool uses the Census Bureau’s Current Population
          Survey; the Bureau does not review or endorse this website.
        </p>
        <p>
          <Link href="/methodology/">Read our methodology</Link>,{' '}
          <Link href="/editorial-policy/">see our editorial policy</Link>, or{' '}
          <Link href="/contact/">report a correction</Link>.
        </p>
      </section>
      <section>
        <h2>Your situation is more than a percentile</h2>
        <p>
          A number can offer perspective. It cannot capture your whole life. Every calculator
          explains its comparison population, assumptions and missing context so you can use the
          result thoughtfully.
        </p>
      </section>
      <section>
        <h2>Independent and transparent</h2>
        <p>
          InsightGinie is an educational data product. It is not a financial adviser, tax adviser,
          lender or credit-scoring service. Calculator results are independent of advertising and
          partner economics. We do not claim affiliation with other similarly named services.
        </p>
      </section>
    </Document>
  );
}
