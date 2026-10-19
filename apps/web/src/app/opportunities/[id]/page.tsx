import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteLink as Link } from '@insightginie/ui';
import { opportunityRecord, dateLabel } from '../../../lib/opportunities';
import { CatalogUnavailable } from '../../../components/opportunity-navigation';
import { SaveOpportunity } from '../../../components/opportunity-save';
import styles from '../../../components/opportunities.module.css';
const get = (id: string) =>
  /^[a-zA-Z0-9_-]{1,200}$/.test(id) ? opportunityRecord(id) : Promise.resolve(null);
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await get(id);
  return {
    title: item ? `${item.title} at ${item.organization}` : 'Opportunity',
    description: item
      ? `${item.title}. ${item.location}. View eligibility and the original ${item.source_name} listing.`
      : undefined,
    alternates: { canonical: `/opportunities/${id}/` },
    robots: { index: false, follow: true },
  };
}
export default async function OpportunityDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{1,200}$/.test(id)) notFound();
  const item = await get(id);
  if (item === null) notFound();
  if (!item)
    return (
      <div className={`shell ${styles.page}`}>
        <CatalogUnavailable />
        <Link href="/opportunities/">Browse current roles →</Link>
      </div>
    );
  return (
    <div className={`shell ${styles.page}`}>
      <div className={styles.detail}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/opportunities/">Opportunities</Link> / {item.source_name}
        </nav>
        <span className={styles.eyebrow}>Source-linked opportunity</span>
        <h1>{item.title}</h1>
        <p>
          {item.organization} · {item.location}
        </p>
        <SaveOpportunity
          item={{ id: item.id, title: item.title, organization: item.organization }}
        />
        <dl>
          <dt>Payment</dt>
          <dd>{item.reward}</dd>
          <dt>Work arrangement</dt>
          <dd>
            {item.employment_type || 'Not specified'} ·{' '}
            {item.category === 'bounties'
              ? 'Online project reward; sponsor acceptance and payout eligibility apply.'
              : 'Remote; confirm location, schedule and work authorization with the source.'}
          </dd>
          <dt>Listed</dt>
          <dd>{dateLabel(item.published_at)}</dd>
          <dt>Last seen in feed</dt>
          <dd>{dateLabel(item.last_seen_at)}</dd>
          <dt>Source</dt>
          <dd>
            <a href={item.source_url} target="_blank" rel="noopener">
              {item.source_name} ↗
            </a>
          </dd>
        </dl>
        <h2>From the listing</h2>
        <p>
          {item.excerpt || 'See the original listing for the role description and requirements.'}
        </p>
        <div className={styles.tags}>
          {item.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
        <h2>Check before you apply</h2>
        <h3>Is this arrangement a fit?</h3>
        <p>
          {item.category === 'bounties'
            ? 'Confirm the reward sponsor, funding, claim process and acceptance criteria before doing any work. A public issue is not proof of escrow or permission to test systems.'
            : `The source lists ${item.employment_type || 'an unspecified employment arrangement'} in ${item.location}. Ask whether the role requires residency, local work authorisation, fixed working hours, travel or payroll through a particular country. Remote describes where you work; it does not remove those restrictions.`}
        </p>
        <h3>Compare the real commitment</h3>
        <p>
          {item.reward === 'Pay not supplied'
            ? 'Compensation is not supplied in the feed. Ask for the pay range, currency and pay period before investing substantial application time.'
            : `The displayed reward is ${item.reward}. Confirm whether this is base compensation, a range or a conditional project reward. Check hours, currency, payment timing, taxes, platform fees and any unpaid assessment.`}
        </p>
        <h3>Prepare a focused next step</h3>
        <p>
          Read the original requirements and match two examples of your work to the stated
          responsibilities. Keep sensitive identity and banking information out of initial messages.
          Verify the employer domain and avoid paying an application or equipment fee to an
          unverified recruiter.
        </p>
        <p>
          Review the original requirements, location restrictions, contract terms and current
          availability. The provider handles the application and any payment. InsightGinie does not
          hire for this role or guarantee a response.
        </p>
        {item.status === 'active' ? (
          <a className={styles.primary} href={item.source_url} target="_blank" rel="noopener">
            View original on {item.source_name} ↗
          </a>
        ) : (
          <aside className={styles.notice}>
            This listing is no longer confirmed fresh. Browse current roles instead.
          </aside>
        )}
        <p>
          <Link href="/opportunities/">← Back to opportunities</Link>
        </p>
      </div>
    </div>
  );
}
