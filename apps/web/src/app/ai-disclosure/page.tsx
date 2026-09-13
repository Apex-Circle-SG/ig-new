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
          generated text into that sourced explanation or alter a calculator result. Each response
          identifies a source selection, a local calculation, a local response or a general AI
          answer.
        </p>
        <p>
          For source selection, Datadog receives only published excerpts and a general topic
          category. That task does not include your question or conversation history. Public
          selections are reused for up to 14 days while the underlying source text is unchanged.
          Timeouts, usage limits or invalid selection output fall back to approved local sources
          when available.
        </p>
        <p>
          When general AI answers are enabled, questions without a supported calculation or source
          match can receive a generated Datadog response on other topics. These responses are
          labelled “General AI answer” and have not been verified against published sources. They do
          not carry invented source citations. General answers are not placed in the shared
          source-selection cache. The Ask page indicates whether this mode is available.
        </p>
        <p>
          Unless an answer explicitly identifies a current source and its date, do not treat it as
          live market data, a current rate quote or an up-to-date legal or tax determination. AI can
          be wrong, incomplete or out of date. Check important claims against reliable sources. When
          an answer is unavailable, Ginie should state the limitation.
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
          Tools and automated answers provide educational context and are not a substitute for
          qualified professional advice, including medical, financial, investment, legal or tax
          advice.
        </p>
      </section>
      <section>
        <h2>Questions and private inputs are different</h2>
        <p>
          A question submitted to Ginie is processed transiently by the application; this feature
          does not persist prompts or answers locally. Financial calculator inputs remain inside a
          browser sandbox. General answer requests send the current question to Datadog after
          checking for identifiers and omitting detected financial amounts. These checks cannot
          guarantee removal of all personal or confidential information. Do not include account
          numbers, credentials or other sensitive details.
        </p>
        <p>
          Datadog is called by our server using server-held credentials. Your conversation history,
          browser headers, cookies and visitor identifiers are not attached to these requests.
          General mode stays disabled until the operator confirms the configured agent has no
          connected actions or tools. Datadog may retain general prompts and generated answers under
          its account policy; provider-side retention also applies to public selection tasks. See
          the <a href="/privacy/">privacy policy</a> for processing and retention details.
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
