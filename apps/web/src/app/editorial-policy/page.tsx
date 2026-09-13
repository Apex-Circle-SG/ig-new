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
          publication. Named editorial authors and independent professional reviewers are not yet
          listed. New editorial research remains in draft until those requirements are met.
          Organizational product maintenance is identified separately and does not imply expert
          review.
        </p>
        <Link prefetch={false} href="/authors/">
          Author and reviewer status →
        </Link>
      </section>
      <section>
        <h2>Neutral calculations</h2>
        <p>
          Advertising and commercial relationships do not change formulas, source selection or
          results. Future partner offers will be identified separately. Eligible public pages may
          include display advertising. No affiliate offer or sponsored editorial program is enabled
          in this release.
        </p>
        <Link href="/advertising-disclosure/">Advertising and commercial disclosure →</Link>
      </section>
      <section>
        <h2>Corrections and updates</h2>
        <p>
          Dataset versions are preserved so calculations remain reproducible. New data pass
          validation before replacing a published snapshot. Material methodological changes are
          documented alongside their version.
        </p>
        <Link prefetch={false} href="/corrections-policy/">
          Correction reporting and version history →
        </Link>
      </section>
      <section>
        <h2>Automated assistance and suggested links</h2>
        <p>
          AI-assisted research plans and drafts are not approved findings. Sources must be checked,
          and an automated system must not invent authors, review records or numerical results.
          Contextual link suggestions require approval before insertion into editorial prose.
        </p>
        <Link href="/ai-disclosure/">Current automated-assistance disclosure →</Link>
      </section>
    </Document>
  );
}
