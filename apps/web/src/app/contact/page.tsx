import type { Metadata } from 'next';
import { SiteLink as Link } from '@insightginie/ui';
import { Document } from '../../components/document';
export const metadata: Metadata = {
  title: 'Contact and Calculator Corrections',
  description:
    'Report an InsightGinie calculator issue or data correction, and find the source version and methodology needed to explain your question.',
  alternates: { canonical: '/contact/' },
};
export default function Contact() {
  return (
    <Document
      title="Contact and calculator corrections"
      eyebrow="CONTACT & CORRECTIONS"
      lead="Help make the workings clearer."
    >
      <section>
        <h2>Report an issue</h2>
        <p>
          Use the project’s public GitHub issue tracker for calculator bugs, source questions,
          accessibility problems and corrections. A GitHub account is required to submit an issue.
          Reports are public, so use hypothetical examples and do not include your income, contact
          details, credentials or other private information.
        </p>
        <a href="https://github.com/Apex-Circle-SG/ig-new/issues/new">
          Open an InsightGinie issue on GitHub →
        </a>
        <p>
          We do not currently provide a private support inbox. The issue tracker is for product
          feedback, not personal financial advice.
        </p>
      </section>
      <section>
        <h2>For a data or calculation issue</h2>
        <p>
          Note the calculator name, source dataset version and the behavior you expected. You can
          use a hypothetical input in place of personal financial information. Keep credentials and
          identifying financial details out of any report.
        </p>
        <Link prefetch={false} href="/data/census-cps/">
          Find the current dataset version →
        </Link>
      </section>
      <section>
        <h2>Before contacting us</h2>
        <p>
          The methodology explains comparison populations, income definitions, reference years and
          open-ended bands.
        </p>
        <Link prefetch={false} href="/methodology/individual-income/">
          Read the income methodology →
        </Link>
      </section>
    </Document>
  );
}
