import type { Metadata } from 'next';
import { Document } from '../../components/document';
import { FinanceTrust } from '../../components/finance-trust';
import { TRUST_POLICY_UPDATED_AT } from '../../components/finance-trust-model';

export const metadata: Metadata = {
  title: 'AI and Automated Assistance Disclosure',
  description:
    'The limits of InsightGinie automated answers, the role of deterministic calculators, and our standards for AI-assisted drafts and source citations.',
  alternates: { canonical: '/ai-disclosure/' },
};

export default function AiDisclosure() {
  return (
    <Document
      title="What automated assistance can tell you."
      eyebrow="AI DISCLOSURE"
      lead="A fluent answer is not evidence. Sources and calculation assumptions matter."
    >
      <section>
        <h2>What Ginie does in this release</h2>
        <p>
          Ask Ginie searches approved public explanations on the InsightGinie server. For supported
          explanatory questions, our Datadog agent selects useful passages from that material. The
          application displays the original source text and citations; the model cannot insert
          invented facts or alter a calculator result. Each answer identifies a Datadog selection, a
          cached selection, a local calculation or a local source fallback.
        </p>
        <p>
          Datadog receives only published excerpts and a general topic category. It does not receive
          your question, financial values or conversation history. Selections are reused for up to
          14 days while the underlying source text is unchanged. Timeouts, usage limits or invalid
          output fall back to the approved local sources.
        </p>
        <p>
          Unless an answer explicitly identifies a current source and its date, do not treat it as
          live market data, a current rate quote or an up-to-date legal or tax determination.
          Unsupported questions should receive a limitation or a relevant tool link rather than an
          invented fact.
        </p>
      </section>
      <section>
        <h2>Calculations have their own engine</h2>
        <p>
          Where an InsightGinie calculator supports a question, its numerical outputs come from
          deterministic formulas. The result should expose inputs or assumptions and a formula or
          dataset version. A search match is not itself a completed calculation; open the linked
          tool to supply the required inputs.
        </p>
        <p>
          Tools and automated answers provide educational context, not personalized financial,
          investment, legal or tax advice.
        </p>
      </section>
      <section>
        <h2>Questions and private inputs are different</h2>
        <p>
          A question submitted to Ginie is processed transiently by the application; raw questions
          are not persisted by this feature. This differs from financial calculator inputs that
          remain inside a browser sandbox. Do not include account numbers, credentials, names of
          other people or other sensitive identifying information in a question.
        </p>
        <p>
          The Datadog workflow is called by our server using server-held credentials. Only the
          approved public selection task is sent; visitors cannot invoke arbitrary agent tools.
          Provider-side records of these public tasks follow the Datadog account’s retention
          settings. See the <a href="/privacy/">privacy policy</a> for the currently enabled
          processing and retention.
        </p>
      </section>
      <section>
        <h2>AI-assisted development and drafts</h2>
        <p>
          AI may assist with software development, research planning and draft text. It does not
          supply a person’s identity, qualifications or completed professional review. Editorial
          drafts require real authorship, source checking and the required review before
          publication.
        </p>
        <p>
          <a href="/corrections-policy/">Report a misleading answer or source problem</a> with a
          public example instead of private financial details.
        </p>
      </section>
      <FinanceTrust updatedAt={TRUST_POLICY_UPDATED_AT} />
    </Document>
  );
}
