import type { Metadata } from 'next';
import { Document } from '../../components/document';
import { FinanceTrust } from '../../components/finance-trust';
import { TRUST_POLICY_UPDATED_AT } from '../../components/finance-trust-model';

export const metadata: Metadata = {
  title: 'Advertising and Commercial Disclosure',
  description:
    'How advertising supports InsightGinie, how calculator results stay independent, and how future commercial relationships will be disclosed.',
  alternates: { canonical: '/advertising-disclosure/' },
};

export default function AdvertisingDisclosure() {
  return (
    <Document
      title="How InsightGinie is supported."
      eyebrow="ADVERTISING DISCLOSURE"
      lead="Advertising can fund useful tools. It must not change their answers."
    >
      <section>
        <h2>Display advertising</h2>
        <p>
          Google AdSense is configured on eligible public pages. Whether an ad appears depends on
          visitor choices, regional handling, account eligibility and available advertising. Google
          and advertisers control the delivered creative; an ad is not our endorsement of its claims
          or the product it promotes.
        </p>
        <p>
          Calculator inputs run in a separate browser sandbox. Our calculators do not send entered
          financial values or results to advertising providers. Advertising does not belong inside
          private tools or the Ginie conversation.
        </p>
        <p>
          Use Cookie settings in the footer to change your advertising choice. The{' '}
          <a href="/privacy/#cookies">privacy policy</a> describes regional handling, cookies and
          provider information.
        </p>
      </section>
      <section>
        <h2>Independent formulas and source selection</h2>
        <p>
          Advertiser payments must not influence a formula, calculator result, research conclusion
          or dataset choice. We do not present paid placement as a calculation result, a required
          step or an instruction to click an advertisement.
        </p>
      </section>
      <section>
        <h2>Affiliate links and sponsorships</h2>
        <p>
          No affiliate offer or sponsored editorial program is enabled in this release. If one is
          introduced, the relevant page must disclose the relationship near the offer or
          recommendation. A general disclosure page does not replace a clear label where a
          commercial relationship matters.
        </p>
        <p>
          Our disclosure standard draws on the{' '}
          <a
            href="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking"
            rel="noopener noreferrer"
          >
            FTC’s guidance on endorsements and material connections
          </a>
          . This statement is a product policy, not a legal determination about a particular
          advertisement.
        </p>
      </section>
      <FinanceTrust updatedAt={TRUST_POLICY_UPDATED_AT} />
    </Document>
  );
}
