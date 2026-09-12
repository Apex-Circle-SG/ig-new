import type { Metadata } from 'next';
import { Document } from '../../components/document';
export const metadata: Metadata = {
  title: 'Authors and Reviewers',
  description: 'Authorship and review status for InsightGinie editorial content.',
  alternates: { canonical: '/authors/' },
  robots: { index: false, follow: true },
};
export default function Authors() {
  return (
    <Document
      title="Real people. Accountable work."
      eyebrow="AUTHORS & REVIEWERS"
      lead="Authorship should tell you who stands behind an article."
    >
      <section>
        <h2>No editorial authors published yet</h2>
        <p>
          We are establishing our author and review process. Editorial research stays in draft until
          it has a real author and the required review. Dataset attribution identifies the
          publisher; it does not imply that the publisher reviewed or endorsed InsightGinie.
        </p>
      </section>
    </Document>
  );
}
