import type { Metadata } from 'next';
import { SiteLink as Link } from '@insightginie/ui';
import { Document } from '../../components/document';
export const metadata: Metadata = {
  title: 'Contact',
  description:
    'How to prepare a calculator correction or source question during the InsightGinie preview.',
  alternates: { canonical: '/contact/' },
  robots: { index: false, follow: true },
};
export default function Contact() {
  return (
    <Document
      title="Good insights welcome questions."
      eyebrow="CONTACT & CORRECTIONS"
      lead="Help make the workings clearer."
    >
      <div className="document-callout">
        The support channel is not yet configured for this preview. No form submission or message
        collection is enabled.
      </div>
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
