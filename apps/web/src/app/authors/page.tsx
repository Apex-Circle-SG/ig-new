import type { Metadata } from 'next';
import { Document } from '../../components/document';
export const metadata: Metadata = {
  title: 'Authors and Reviewers',
  description: 'Authorship and review status for InsightGinie editorial content.',
  alternates: { canonical: '/authors/' },
};
export default function Authors() {
  return (
    <Document
      title="Authors and reviewers"
      eyebrow="AUTHORS & REVIEWERS"
      lead="Authorship should tell you who stands behind an article."
    >
      <section>
        <h2>Organizational product maintenance</h2>
        <p>
          <a href="/authors/insightginie/">InsightGinie</a> maintains the project’s calculators,
          source methods and product policies. This attribution identifies an organization, not an
          individual financial expert or a completed independent review.
        </p>
      </section>
      <section>
        <h2>No editorial authors published yet</h2>
        <p>
          We are establishing our author and review process. Editorial research stays in draft until
          it has a real author and the required review. Dataset attribution identifies the
          publisher; it does not imply that the publisher reviewed or endorsed InsightGinie.
        </p>
      </section>
      <section>
        <h2>What a reviewer label should tell you</h2>
        <p>
          A reviewed page should identify the reviewer, their public profile, the review date and
          scope. Technical testing, editorial review and professional advice are different things. A
          missing reviewer label must not be replaced with a made-up name or credential.
        </p>
        <a href="/research-methodology/">See our research and review standards →</a>
      </section>
    </Document>
  );
}
