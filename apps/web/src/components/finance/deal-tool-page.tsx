import { SiteLink as Link } from '@insightginie/ui';
import { PrivateFinanceTool } from './private-finance-tool';
import { FinanceTrust } from '../finance-trust';
import {
  calculateDeal,
  formatDealValue,
  defaults,
  DEAL_FORMULA_VERSION,
  type DealTool,
} from '@insightginie/calculators/deals';
import styles from './finance-tool.module.css';
export function DealToolPage({ tool }: { tool: DealTool }) {
  const example = tool.kind === 'calculator' ? calculateDeal(tool.id, defaults(tool)) : null;
  return (
    <div className={`shell ${styles.page}`}>
      <nav aria-label="Breadcrumb">
        <Link href="/calculators/">Calculators</Link> /{' '}
        <Link
          href={
            tool.id === 'vwap-volume' ? '/calculators/markets/' : '/calculators/corporate-finance/'
          }
        >
          {tool.category}
        </Link>
      </nav>
      <header className={styles.header}>
        <p>{tool.category}</p>
        <h1>{tool.title}</h1>
        <p>{tool.description}</p>
        <p>Private browser workspace · Local scenario import/export · No account required</p>
      </header>
      <PrivateFinanceTool toolId={tool.id} href={tool.path} title={tool.title} />
      <section className={styles.section}>
        <h2>How to use this workspace</h2>
        <ol>
          {tool.methods.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ol>
        <p>
          Enter assumptions in the labelled units. Calculate after editing, inspect the charts and
          expand the complete tables. Export a private JSON scenario to save inputs; CSV exports
          retain all result rows. Reloading clears drafts. Compare up to three calculated scenarios.
        </p>
      </section>
      {example && (
        <section className={styles.section}>
          <h2>Illustrative starting example</h2>
          <p>
            These public figures come from the default example, not your private inputs. Monetary
            model figures use millions unless a field states otherwise.
          </p>
          <dl>
            {example.metrics.map((m) => (
              <div key={m.label}>
                <dt>{m.label}</dt>
                <dd>
                  {formatDealValue(m.value)} {m.unit}
                </dd>
              </div>
            ))}
          </dl>
          {example.notes.map((n) => (
            <p key={n}>{n}</p>
          ))}
        </section>
      )}
      <section className={styles.section}>
        <h2>Read the concepts and source review</h2>
        <ul>
          {tool.guides.map((slug) => (
            <li key={slug}>
              <Link href={`/library/knowledge/${slug}/`}>{guideName(slug)} →</Link>
            </li>
          ))}
        </ul>
        <p>
          The original historical spreadsheets are available in the model source register. Known
          source defects are disclosed; these calculators independently implement the stated
          methods. They do not execute workbook macros or reproduce stale spreadsheet outputs.
        </p>
      </section>
      <FinanceTrust
        updatedAt="2026-11-06"
        formulaVersion={DEAL_FORMULA_VERSION}
        methodologyPath="/library/knowledge/ma-model-source-register/"
        sources={[
          {
            name: 'NYU Stern: corporate finance and valuation resources',
            url: 'https://pages.stern.nyu.edu/~adamodar/',
          },
        ]}
      />
    </div>
  );
}
function guideName(slug: string) {
  return (
    (
      {
        'ma-deal-structures': 'Deal structures and acquisition impact',
        'ma-synergies-value': 'Synergies and value creation',
        'ma-model-source-register': 'Model methods, historical workbooks and limitations',
        'ma-financing-models': 'Debt capacity, LBOs and recapitalizations',
        'corporate-restructuring': 'Corporate restructuring',
        'saas-scaling-scenarios': 'SaaS scale and funding scenarios',
        'ma-due-diligence': 'Due-diligence process and request library',
        'ma-diligence-finance': 'Financial diligence',
        'post-merger-integration-planning': 'Integration planning',
        'organizational-culture': 'Organizational culture',
        'trading-indicators-reference': 'Trading indicators',
        'arr-growth-practice': 'ARR growth practice',
        'founder-investment-terms': 'Founder investment terms',
      } as Record<string, string>
    )[slug] ?? slug.replaceAll('-', ' ')
  );
}
