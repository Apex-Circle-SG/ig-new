import type { Metadata } from 'next';
import { Document } from '../../components/document';
import { FinanceTrust } from '../../components/finance-trust';
import { TRUST_POLICY_UPDATED_AT } from '../../components/finance-trust-model';

export const metadata: Metadata = {
  title: 'Financial Information Disclaimer',
  description:
    'Understand the educational scope of InsightGinie financial tools, their assumptions, missing factors and limits before using a result.',
  alternates: { canonical: '/finance-disclaimer/' },
};

export default function FinanceDisclaimer() {
  return (
    <Document
      title="A calculation gives context, not a decision."
      eyebrow="FINANCIAL INFORMATION"
      lead="Use the result to understand an assumption and explore alternatives."
    >
      <section>
        <h2>Educational scope</h2>
        <p>
          InsightGinie provides general information, source comparisons and scenario calculations.
          It does not act as your financial adviser, investment adviser, lender, accountant, tax
          adviser or lawyer. Using a tool does not establish a professional advisory relationship.
        </p>
        <p>
          A result does not determine whether you should borrow, invest, hire, cut spending or
          purchase a product. Consider factors outside the model and consult an appropriately
          qualified professional when your circumstances require individual advice.
        </p>
      </section>
      <section>
        <h2>Inputs, estimates and missing factors</h2>
        <p>
          Formula-based scenarios use the values you supply. Example inputs illustrate the
          mechanics; they are not industry benchmarks or recommended assumptions. A projected saving
          is not cash already earned, and a modeled runway is not a guarantee that a business can
          continue operating for that period.
        </p>
        <p>
          Taxes, fees, timing, changing prices, variable rates, demand and implementation costs may
          affect an actual outcome. Include them only where the tool provides a defined input, and
          read the assumptions for what remains outside the model.
        </p>
      </section>
      <section>
        <h2>Investment and borrowing tools</h2>
        <p>
          Drawdown and concentration calculations describe mathematical relationships or the inputs
          shown. They do not predict investment returns, measure every source of risk, or recommend
          buying, selling or holding a security.
        </p>
        <p>
          A loan calculation is not an offer, eligibility decision, quote or lender comparison.
          Actual terms must be checked with the provider. No guaranteed return, financing approval
          or financial outcome is implied.
        </p>
      </section>
      <section>
        <h2>Check the version and the workings</h2>
        <p>
          Published datasets can have sampling error, revisions and delays. Use the stated reference
          year and comparison population. Review the{' '}
          <a href="/research-methodology/">research methodology</a>, page-specific assumptions and{' '}
          <a href="/corrections-policy/">correction process</a> when a result is unclear.
        </p>
        <p>
          This page explains product limitations. The <a href="/terms/">terms of use</a> remain
          separate.
        </p>
      </section>
      <FinanceTrust updatedAt={TRUST_POLICY_UPDATED_AT} />
    </Document>
  );
}
