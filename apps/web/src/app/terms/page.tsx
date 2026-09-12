import type { Metadata } from 'next';
import { Document } from '../../components/document';
export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'Use InsightGinie as educational context. Understand the scope, source limitations and current preview status.',
  alternates: { canonical: '/terms/' },
};
export default function Terms() {
  return (
    <Document
      title="Use insight with context."
      eyebrow="TERMS · CURRENT PREVIEW"
      lead="InsightGinie helps you explore data. It does not decide for you."
    >
      <p className="document-meta">
        Version: September 12, 2026 · Public-launch legal review pending
      </p>
      <section>
        <h2>Educational use</h2>
        <p>
          Calculators provide general educational information. They do not provide individualized
          financial, investment, legal or tax advice. Consider your own circumstances and seek an
          appropriately qualified professional when needed.
        </p>
      </section>
      <section>
        <h2>Data and estimates</h2>
        <p>
          Published sources can contain sampling error, revisions and limitations. Calculations use
          the displayed dataset version and stated assumptions. A percentile describes a comparison
          population; it is not a credit score, judgment of financial health or guarantee of an
          outcome.
        </p>
      </section>
      <section>
        <h2>Preview availability</h2>
        <p>
          Features and datasets may change. This preview has no paid services or user accounts.
          Operating entity details, support arrangements and final legal terms must be reviewed
          before public production launch.
        </p>
      </section>
      <section>
        <h2>Responsible use</h2>
        <p>
          Do not attempt unauthorized access, interfere with the service, or misrepresent the
          provenance or certainty of its results. Attribute the original data publisher when reusing
          published public data and check the publisher’s terms.
        </p>
      </section>
    </Document>
  );
}
