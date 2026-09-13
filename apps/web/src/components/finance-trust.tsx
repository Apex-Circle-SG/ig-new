import { SiteLink as Link } from '@insightginie/ui';
import {
  financeTrustSchema,
  INSIGHTGINIE_MAINTAINER,
  type FinanceTrustProps,
} from './finance-trust-model';
import styles from './finance-trust.module.css';

export type { FinanceTrustProps } from './finance-trust-model';

function dateLabel(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Omit unknown dates and unconfigured reviewers; attribution is not expert certification. */
export function FinanceTrust(props: FinanceTrustProps) {
  const data = financeTrustSchema.parse(props);
  return (
    <aside className={styles.trust} aria-label="Sources, maintenance and review">
      <h2 className={styles.heading}>Sources and accountability</h2>
      <dl className={styles.facts}>
        <div>
          <dt>Maintained by</dt>
          <dd>
            <Link href={INSIGHTGINIE_MAINTAINER.profilePath}>{INSIGHTGINIE_MAINTAINER.name}</Link>
          </dd>
        </div>
        {data.publishedAt && (
          <div>
            <dt>First published</dt>
            <dd>
              <time dateTime={data.publishedAt}>{dateLabel(data.publishedAt)}</time>
            </dd>
          </div>
        )}
        {data.updatedAt && (
          <div>
            <dt>Updated</dt>
            <dd>
              <time dateTime={data.updatedAt}>{dateLabel(data.updatedAt)}</time>
            </dd>
          </div>
        )}
        {data.formulaVersion && (
          <div>
            <dt>Formula version</dt>
            <dd>{data.formulaVersion}</dd>
          </div>
        )}
        {data.reviewer && (
          <div>
            <dt>Reviewed by</dt>
            <dd>
              <Link href={data.reviewer.profilePath}>{data.reviewer.name}</Link> ·{' '}
              <time dateTime={data.reviewer.reviewedAt}>{dateLabel(data.reviewer.reviewedAt)}</time>
              <span className={styles.scope}>{data.reviewer.scope}</span>
            </dd>
          </div>
        )}
      </dl>
      {data.sources.length > 0 ? (
        <ul className={styles.sources}>
          {data.sources.map((source) => (
            <li key={`${source.url}:${source.name}`}>
              <a href={source.url} rel="noopener noreferrer">
                {source.name}
              </a>
              {source.year !== undefined && ` · ${source.year}`}
              {source.version && ` · ${source.version}`}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.note}>
          See the methodology for formulas, assumptions and source status.
        </p>
      )}
      <p className={styles.links}>
        <Link href={data.methodologyPath}>Methodology and limitations</Link>
        <Link href="/corrections-policy/">Report a correction</Link>
        <Link href="/advertising-disclosure/">Commercial independence</Link>
      </p>
      <p className={styles.note}>
        Educational information. Estimates depend on the inputs and assumptions shown; they are not
        personalized financial, investment, legal or tax advice.{' '}
        <Link href="/finance-disclaimer/">Understand the limits</Link>.
      </p>
    </aside>
  );
}
