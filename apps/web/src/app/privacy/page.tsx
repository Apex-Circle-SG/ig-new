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
      eyebrow="PRIVACY"
      lead="Use our calculators without an account, an email address or saving your financial inputs."
    >
      <p className="document-meta">Policy version: September 13, 2026</p>
      <section>
        <h2>Calculator inputs</h2>
        <p>
          Your calculator inputs and results remain in the browser tab’s memory. This release does
          not send those values to our server, analytics, an AI provider or an advertising provider.
          They are not placed in a URL or stored in browser storage. Reloading the page resets the
          calculator.
        </p>
        <p>
          The share action copies the calculator’s public URL without your inputs or result. Finance
          tools can download a CSV or print a scenario locally when you choose; these files can
          contain your inputs. Keep any downloaded or printed copy private.
        </p>
      </section>
      <section>
        <h2>Server requests</h2>
        <p>
          Loading the website sends ordinary web requests to its hosting infrastructure. A deployed
          host may process IP addresses, requested paths, browser information and security logs.
          Private calculator inputs are not part of those requests. Questions you choose to submit
          to Ginie are sent to our server as described below. Cloudflare handles delivery and
          security at the edge. The application does not store individual access histories.
        </p>
      </section>
      <section>
        <h2>Ginie questions and service health</h2>
        <p>
          Ginie processes questions in server memory to retrieve approved public material and run
          supported calculations. For source selection, Datadog receives only approved public
          excerpts and a general topic category; your question is not included in that selection
          task.
        </p>
        <p>
          When general AI answers are enabled, an unmatched question can be sent to Datadog to
          generate an answer. The Ask page discloses this before submission. The application checks
          for identifiers and omits detected financial amounts before sending the current question.
          These filters cannot guarantee that all personal or confidential information is removed.
          Do not submit sensitive details. Your conversation history, browser headers, cookies and
          visitor identifiers are not attached to provider requests.
        </p>
        <p>
          This feature does not persist questions or answers locally, attach them to analytics, or
          place general questions and answers in a shared cache. The browser holds recent exchanges
          in the current tab’s memory. Datadog may retain general prompts and generated answers
          under its account policy. Local transient processing does not guarantee deletion from the
          provider. A short-lived, essential security cookie expires after ten minutes and binds
          requests to the browser that obtained it.
        </p>
        <p>
          Operational monitoring stores daily totals of answers, fallbacks, refusals, errors and
          issue categories for up to 30 days. These totals contain no questions, answers, financial
          values, cookies or IP addresses. Datadog receives these aggregate service-health
          measurements and the applicable tasks described above; its account retention settings also
          apply. We cache public passage selections for up to 14 days, keyed by the source content
          rather than a visitor. This cache does not contain general prompts or generated answers.
          No session replay or browser recording is enabled.
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
          Google AdSense may load on our public pages, including pages containing calculators. We
          wait for your choice in the EEA, UK, Switzerland or when your region is unknown; otherwise
          advertising normally loads unless you have declined it. Google may process your IP
          address, browser or device information, page context and cookies to deliver, measure and
          protect ads. Google may request additional choices where applicable. Read{' '}
          <a
            href="https://policies.google.com/technologies/partner-sites"
            rel="noopener noreferrer"
          >
            how Google uses information from sites that use its services
          </a>
          .
        </p>
        <p>
          Your calculator runs in a browser sandbox that prevents the surrounding page’s advertising
          scripts from reading its inputs or results. Only the frame’s size, a request to copy the
          public tool link, and general interaction events leave the calculator. Declining
          advertising does not limit the tools or source pages. We request non-personalized ads when
          a Global Privacy Control signal is present, and after an advertising choice in regions
          where we wait for consent. Google may present additional regional choices.
        </p>
      </section>
      <section>
        <h2>Anonymous usage counts</h2>
        <p>
          If you allow optional analytics in the footer, we count page visits and general tool
          interactions, such as starting, completing or exporting a calculation. Analytics is off
          until you allow it, and remains off when your browser sends Global Privacy Control or Do
          Not Track. Your preference cookie lasts up to 180 days and can be changed at any time. We
          keep daily totals for up to 30 days. These totals contain no income, result, profile, IP
          address, device identifier or individual browsing history. No third-party analytics
          provider is enabled. Temporary in-memory request limits help prevent abuse.
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
        <h2>Privacy questions and corrections</h2>
        <p>
          Use the reporting options on our <a href="/contact/">Contact page</a>. Public issue
          reports must not include personal financial information or other confidential details.
          This policy will be updated before additional collection begins.
        </p>
      </section>
    </Document>
  );
}
