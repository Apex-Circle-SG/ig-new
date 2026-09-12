import type { Metadata } from 'next';
import Link from 'next/link';
import { Document } from '../../components/document';
export const metadata: Metadata = {
  title: 'Methodology',
  description:
    'How InsightGinie turns public datasets into transparent, deterministic income comparisons, including assumptions and uncertainty.',
  alternates: { canonical: '/methodology/' },
};
export default function Methodology() {
  return (
    <Document
      title="You deserve to see the workings."
      eyebrow="OUR METHODOLOGY"
      lead="An insight is only useful when you know what it means—and what it leaves out."
    >
      <section>
        <h2>Start with the source</h2>
        <p>
          We use named, versioned public datasets. Each published calculation identifies its
          publisher, income year, retrieval date and transformation. Missing data are shown as
          unavailable.
        </p>
        <Link prefetch={false} href="/data/">
          Browse our data sources →
        </Link>
      </section>
      <section>
        <h2>Keep calculations deterministic</h2>
        <p>
          The same inputs and dataset produce the same financial result. Formulas live in shared
          calculator engines, independently of the interface. An AI model does not invent or
          calculate your percentile.
        </p>
      </section>
      <section>
        <h2>Show the uncertainty</h2>
        <p>
          Survey estimates describe a population with uncertainty. Grouped income data cannot reveal
          exact ranks. We disclose interpolation assumptions and return ranges for open-ended groups
          rather than extrapolating an unsupported number.
        </p>
        <Link prefetch={false} href="/methodology/individual-income/">
          Individual income percentile methodology →
        </Link>
      </section>
      <section>
        <h2>Validate before publishing</h2>
        <p>
          Data updates pass schema, row count, population-total, unit, year, ordering and range
          checks. A failed update cannot replace the last validated snapshot. Calculators have
          known-example, boundary, invalid-input and mathematical property tests.
        </p>
      </section>
      <section>
        <h2>Keep your circumstances in context</h2>
        <p>
          An income rank alone does not measure financial health. Our first comparison does not
          account for location, taxes, household needs, wealth, debt or age. The calculator is an
          educational comparison, not an individualized financial recommendation.
        </p>
      </section>
    </Document>
  );
}
