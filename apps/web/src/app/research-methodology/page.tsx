import type { Metadata } from 'next';
import { Document } from '../../components/document';
import { FinanceTrust } from '../../components/finance-trust';
import { TRUST_POLICY_UPDATED_AT } from '../../components/finance-trust-model';

export const metadata: Metadata = {
  title: 'Research and Financial Tool Methodology',
  description:
    'How InsightGinie separates source facts, formula outputs, assumptions and projections, with reproducible methods and explicit editorial review gates.',
  alternates: { canonical: '/research-methodology/' },
};

export default function ResearchMethodology() {
  return (
    <Document
      title="Show what the answer depends on."
      eyebrow="RESEARCH METHODOLOGY"
      lead="Sources, formulas and assumptions should be available beside a result."
    >
      <section>
        <h2>Four different kinds of statements</h2>
        <p>
          A source fact reports an identified publication or dataset. A calculated result applies a
          documented formula. An assumption supplies an input that has not been established as fact.
          A projection describes what follows if stated assumptions hold. These categories must not
          be presented as interchangeable.
        </p>
      </section>
      <section>
        <h2>Public datasets</h2>
        <p>
          Record the source publisher and URL, reference year, retrieval time, transformation
          version and validation status. Preserve the last validated snapshot while evaluating an
          update. Explain the comparison population, units, missing values and any interpolation.
        </p>
        <p>
          The <a href="/methodology/individual-income/">individual income methodology</a> applies
          this approach to the Census distribution. The <a href="/data/census-cps/">dataset page</a>{' '}
          identifies the version used. A retrieval date is not a new income year.
        </p>
      </section>
      <section>
        <h2>Formula-based financial scenarios</h2>
        <p>
          AI workflow economics, cash runway, break-even, borrowing, drawdown recovery and portfolio
          concentration require different inputs. Their tool pages should state the formula, units,
          version and excluded factors. A tool using your assumptions does not imply that we
          supplied or verified market rates, wages or future returns.
        </p>
        <p>
          Tests should cover ordinary examples, invalid inputs and important boundaries. When a
          denominator is zero or a result cannot be defined, show a limitation rather than a made-up
          number. Rounding for display must not silently change the underlying method.
        </p>
      </section>
      <section>
        <h2>Research and editorial publication</h2>
        <p>
          Research begins with a useful question, a source plan and an explicit comparison.
          Candidate sources and outlines are not published findings. New editorial articles require
          a real author, documented source checks and the required review; organizational product
          maintenance is not a substitute for specialist review.
        </p>
        <p>
          Studies should retain the analysis method, inputs, source versions and reproducible
          outputs. Comparisons need consistent units, periods and populations. Describe limitations
          that could change the interpretation, not only favorable results.
        </p>
      </section>
      <section>
        <h2>Updates and suggested links</h2>
        <p>
          Material changes should explain what changed and which results are affected. A “reviewed”
          date means a recorded review occurred; it must not be regenerated automatically at build
          time.
        </p>
        <p>
          Contextual link suggestions require editorial approval before insertion. A link must help
          explain a claim or a next step; keyword overlap alone is not sufficient. See our{' '}
          <a href="/editorial-policy/">editorial policy</a> and{' '}
          <a href="/corrections-policy/">corrections policy</a>.
        </p>
      </section>
      <FinanceTrust updatedAt={TRUST_POLICY_UPDATED_AT} methodologyPath="/methodology/" />
    </Document>
  );
}
