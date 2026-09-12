import type { Metadata } from 'next';
import { Document } from '../../components/document';
export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'Your calculator inputs stay in browser memory. Learn what InsightGinie currently stores, shares and measures.',
  alternates: { canonical: '/privacy/' },
};
export default function Privacy() {
  return (
    <Document
      title="Your financial picture belongs to you."
      eyebrow="PRIVACY · CURRENT PREVIEW"
      lead="The first calculator works without an account, an email address or saving your income."
    >
      <p className="document-meta">Policy version: September 12, 2026</p>
      <section>
        <h2>Calculator inputs</h2>
        <p>
          Your income and calculated result remain in the browser tab’s memory. This release does
          not send those values to our server, analytics, an AI provider or an advertising provider.
          They are not placed in a URL or stored in browser storage. Reloading the page resets the
          calculator.
        </p>
        <p>The share action copies the calculator’s public URL without your income or result.</p>
      </section>
      <section>
        <h2>Server requests</h2>
        <p>
          Loading the website sends ordinary web requests to its hosting infrastructure. A deployed
          host may process IP addresses, requested paths, browser information and security logs.
          Financial inputs are not part of those requests. Hosting retention settings must be
          configured and disclosed before a public production launch.
        </p>
      </section>
      <section id="cookies">
        <h2>Cookie settings</h2>
        <p>
          This release does not set application cookies or load third-party analytics, advertising
          or tracking scripts. There are no optional cookies to enable or disable. If optional
          tracking is introduced, consent controls will be provided before it runs.
        </p>
      </section>
      <section>
        <h2>Accounts, email and financial profiles</h2>
        <p>
          Accounts, saved profiles and email reports are not enabled. There is no stored financial
          profile to export or delete in this release. Those features will require explicit
          retention, export and deletion controls before activation.
        </p>
      </section>
      <section>
        <h2>Contact and production review</h2>
        <p>
          A privacy contact and hosting-specific retention terms are pending configuration. They are
          required before production launch. This policy describes the preview’s implemented
          behavior and will be updated before additional collection begins.
        </p>
      </section>
    </Document>
  );
}
