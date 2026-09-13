import type { Metadata } from 'next';
import { SiteLink as Link } from '@insightginie/ui';
import { Document } from '../../components/document';
export const metadata: Metadata = {
  title: 'Our Data',
  description:
    'Explore the public datasets behind InsightGinie. See source publishers, years, transformations and limitations.',
  alternates: { canonical: '/data/' },
};
export default function Data() {
  return (
    <Document
      title="Real sources. Open workings."
      eyebrow="THE DATA BEHIND THE INSIGHT"
      lead="Every number starts somewhere. Here’s where ours come from."
    >
      <section>
        <h2>US individual income</h2>
        <p>
          The US Census Bureau’s Current Population Survey Annual Social and Economic Supplement
          publishes the income distribution used in our first calculator.
        </p>
        <Link prefetch={false} href="/data/census-cps/">
          Explore the Census CPS dataset →
        </Link>
      </section>
      <section>
        <h2>Explore the US income distribution</h2>
        <p>
          See population shares across income bands, sort the complete table, download the CSV, or
          embed a source-attributed chart in your own resource.
        </p>
        <Link href="/data/us-income-distribution/">Open the income data explorer →</Link>
      </section>
      <section>
        <h2>Coverage grows with confidence</h2>
        <p>
          Regional prices, occupation wages, household income and tax rules are planned next. No
          city, salary or tax figure is shown until a validated source is available.
        </p>
        <Link prefetch={false} href="/methodology/">
          How we validate and use data →
        </Link>
      </section>
    </Document>
  );
}
