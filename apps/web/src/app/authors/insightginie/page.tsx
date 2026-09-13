import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { safeJsonLd } from '@insightginie/seo';
import { Document } from '../../../components/document';
import { maintainerOrganizationSchema } from '../../../components/finance-trust-model';

export const metadata: Metadata = {
  title: 'InsightGinie Product Maintainer',
  description:
    'InsightGinie is the organizational maintainer of this site’s tools, public data methods and policies. See the scope of that attribution and review status.',
  alternates: { canonical: '/authors/insightginie/' },
};

export default async function InsightGinieMaintainer() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <Document
      title="InsightGinie"
      eyebrow="ORGANIZATIONAL MAINTAINER"
      lead="Product maintenance, public data methods and transparent workings."
    >
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: safeJsonLd(maintainerOrganizationSchema()) }}
      />
      <section>
        <h2>What this attribution means</h2>
        <p>
          “Maintained by InsightGinie” identifies the project responsible for the tool, its
          implementation and the accompanying product documentation. This is an organizational
          identity, not a fictional individual author.
        </p>
        <p>
          It does not certify professional qualifications or imply independent financial, tax, legal
          or investment review. A named reviewer appears only when their identity, review scope and
          review date have been configured for the page.
        </p>
      </section>
      <section>
        <h2>Scope of the work</h2>
        <p>
          The project maintains deterministic calculators, source documentation, validation checks
          and website policies. Public data remain attributed to their original publishers; those
          publishers have not endorsed InsightGinie.
        </p>
        <p>
          The{' '}
          <a href="https://github.com/Apex-Circle-SG/ig-new" rel="noopener noreferrer">
            public project repository
          </a>{' '}
          provides implementation history. Software changes alone do not establish expert editorial
          review.
        </p>
      </section>
      <section>
        <h2>Review and corrections</h2>
        <p>
          No named editorial authors or independent professional reviewers are listed at present.
          New editorial research stays in draft until the required authorship and review are
          recorded.
        </p>
        <p>
          Read the <a href="/research-methodology/">research methodology</a>,{' '}
          <a href="/ai-disclosure/">AI disclosure</a> and{' '}
          <a href="/corrections-policy/">corrections policy</a>, or use the{' '}
          <a href="/contact/">current reporting channel</a>.
        </p>
      </section>
    </Document>
  );
}
