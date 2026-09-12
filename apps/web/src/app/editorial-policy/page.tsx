import type { Metadata } from 'next';
import { SiteLink as Link } from '@insightginie/ui';
import { Document } from '../../components/document';
export const metadata: Metadata = {
  title: 'Editorial Policy',
  description:
    'Our standards for source attribution, authorship, corrections, calculator neutrality and publishing useful data products.',
  alternates: { canonical: '/editorial-policy/' },
};
export default function Editorial() {
  return (
    <Document
      title="Trust is part of the product."
      eyebrow="EDITORIAL POLICY"
      lead="Useful information should be traceable, explainable and open to correction."
    >
      <section>
        <h2>Sources before statements</h2>
        <p>
          Numerical claims must come from identified data or reproducible calculations. Estimates,
          assumptions and projections must be labeled. We do not publish fabricated values, invented
          experts or generic pages generated merely to target search queries.
        </p>
      </section>
      <section>
        <h2>Real authors and reviewers</h2>
        <p>
          Editorial articles require a real author, source list and appropriate review before
          publication. No named author or independent professional reviewer has yet been appointed
          for this preview. Editorial articles remain unpublished until those requirements are met.
        </p>
        <Link prefetch={false} href="/authors/">
          Author and reviewer status →
        </Link>
      </section>
      <section>
        <h2>Neutral calculations</h2>
        <p>
          Advertising and commercial relationships do not change formulas, source selection or
          results. Future partner offers will be identified separately. No advertisements or partner
          offers are enabled in this release.
        </p>
      </section>
      <section>
        <h2>Corrections and updates</h2>
        <p>
          Dataset versions are preserved so calculations remain reproducible. New data pass
          validation before replacing a published snapshot. Material methodological changes are
          documented alongside their version.
        </p>
        <Link prefetch={false} href="/contact/">
          Reporting a data issue →
        </Link>
      </section>
    </Document>
  );
}
