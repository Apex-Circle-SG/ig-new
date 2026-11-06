import { SiteLink as Link } from '@insightginie/ui';
import { DEAL_TOOLS } from '@insightginie/calculators/deals';
import styles from './finance-tool.module.css';
export function DealToolHub({ markets = false }: { markets?: boolean }) {
  return (
    <div className={`shell ${styles.page}`}>
      <Link href="/calculators/">← All calculators</Link>
      <h1>{markets ? 'Trading and market analysis' : 'Corporate finance and deal workspaces'}</h1>
      <p>
        {markets
          ? 'Inspect weighted prices, volume distribution and turnover with explicit data definitions.'
          : 'Move from acquisition economics and valuation to diligence, integration and culture. Choose a calculation or a working planner.'}
      </p>
      {['calculator', 'planner'].map((kind) => {
        const tools = DEAL_TOOLS.filter(
          (t) => (t.id === 'vwap-volume') === markets && t.kind === kind,
        );
        return (
          tools.length > 0 && (
            <section key={kind}>
              <h2>{kind === 'calculator' ? 'Explore the numbers' : 'Plan and track the work'}</h2>
              <div className={styles.sections}>
                {tools.map((t) => (
                  <Link key={t.id} href={t.path} className={styles.section}>
                    <h3>{t.title}</h3>
                    <p>{t.description}</p>
                    <strong>Open workspace →</strong>
                  </Link>
                ))}
              </div>
            </section>
          )
        );
      })}
      <p>
        <Link
          href={`/library/knowledge/${markets ? 'trading-market-analysis' : 'mergers-acquisitions-integration'}/`}
        >
          Read the related learning hub →
        </Link>
      </p>
      <p>
        Inputs remain private in your browser. Export scenarios locally to keep your work. Models
        are illustrative and depend on your assumptions.
      </p>
    </div>
  );
}
