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
          You can allow or decline advertising using Cookie settings in the footer. Your choice is
          stored in a first-party preference cookie for up to 180 days. It contains only your
          advertising choice, never your income. You can change your choice at any time; the page
          reloads to apply it.
        </p>
        <p>
          If you allow advertising, Google AdSense may load on our public data and methodology
          pages. Google may process your IP address, browser or device information, page context and
          cookies to deliver, measure and protect ads. Google may request additional choices where
          applicable. Read{' '}
          <a
            href="https://policies.google.com/technologies/partner-sites"
            rel="noopener noreferrer"
          >
            how Google uses information from sites that use its services
          </a>
          .
        </p>
        <p>
          Advertising scripts do not load in the homepage calculator or individual-income tool.
          Navigation into those pages starts a fresh document so advertising code cannot access your
          calculator inputs. Declining advertising does not limit the tools or source pages. No
          third-party analytics provider is enabled.
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
