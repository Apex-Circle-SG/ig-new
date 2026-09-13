import type { Metadata } from 'next';
import { Document } from '../../components/document';
import { FinanceTrust } from '../../components/finance-trust';
import { TRUST_POLICY_UPDATED_AT } from '../../components/finance-trust-model';

export const metadata: Metadata = {
  title: 'Corrections Policy',
  description:
    'How to report an InsightGinie calculation or source error, and how material corrections and dataset changes should be documented.',
  alternates: { canonical: '/corrections-policy/' },
};

export default function CorrectionsPolicy() {
  return (
    <Document
      title="Corrections should be easy to follow."
      eyebrow="CORRECTIONS POLICY"
      lead="A useful result must be open to challenge, verification and repair."
    >
      <section>
        <h2>Report the page and the problem</h2>
        <p>
          Use our <a href="/contact/">contact and corrections channel</a>. Include the page address,
          displayed dataset or formula version, what you expected and what happened. A hypothetical
          input is enough to reproduce most calculator issues. Public reports must not include your
          financial information or other identifying details.
        </p>
        <p>
          We do not promise a response time or offer individual financial casework. A report is a
          request for investigation, not confirmation that a result is incorrect.
        </p>
      </section>
      <section>
        <h2>Separate errors from updates</h2>
        <p>
          A calculation error is different from a source revision, a new data year or a changed
          assumption. The correction should identify which occurred, which result or claim it
          affects, and the version that resolves it.
        </p>
        <p>
          Material corrections should receive a visible note on the affected page. Typographic
          changes that do not alter meaning need not be presented as a new research finding.
          Changing a page date alone is not a correction.
        </p>
      </section>
      <section>
        <h2>Preserve the evidence</h2>
        <p>
          Published dataset snapshots and formula versions make results reproducible. A replacement
          dataset must pass validation before becoming current. If a critical result cannot be
          supported, the affected functionality should be withdrawn or clearly marked unavailable
          until resolved.
        </p>
        <p>
          We have not published a complete historical correction register. Individual reports are
          tracked through the current issue channel; a public correction note must not expose the
          reporter’s private information.
        </p>
      </section>
      <FinanceTrust updatedAt={TRUST_POLICY_UPDATED_AT} methodologyPath="/research-methodology/" />
    </Document>
  );
}
