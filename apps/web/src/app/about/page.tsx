import type { Metadata } from 'next';
import { Document } from '../../components/document';
export const metadata: Metadata = {
  title: 'About',
  description:
    'InsightGinie helps people understand their income and life decisions with public US data and transparent calculators.',
  alternates: { canonical: '/about/' },
};
export default function About() {
  return (
    <Document
      title="A little clarity for your next move."
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
