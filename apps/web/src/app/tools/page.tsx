import type { Metadata } from 'next';
import { FINANCE_TOOLS } from '@insightginie/calculators';
import { SiteLink as Link } from '@insightginie/ui';
import styles from '../../components/finance/finance-tool.module.css';
export const metadata: Metadata = {
  title: 'Business and Finance Calculators',
  description:
    'Explore private, transparent calculators for cash runway, break-even sales, business loans, AI workflow ROI, drawdown recovery and portfolio concentration.',
  alternates: { canonical: '/tools/' },
};
export default function FinanceTools() {
  return (
    <div className={`shell ${styles.page}`}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span>Tools</span>
      </nav>
      <header className={styles.header}>
        <div className={styles.eyebrow}>CLEARER NUMBERS. BETTER QUESTIONS.</div>
        <h1>Put the numbers to work.</h1>
        <p>
          Explore business decisions and financial tradeoffs with transparent formulas, explicit
          assumptions and inputs that stay in your browser.
        </p>
        <div className={styles.badges}>
          <span>Free to use</span>
          <span>No account required</span>
          <span>Private calculations</span>
        </div>
      </header>
      <div className={styles.grid}>
        {FINANCE_TOOLS.map((tool) => (
          <Link className={styles.card} href={`/tools/${tool.id}/`} key={tool.id}>
            <span>{tool.category}</span>
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
            <strong>Explore the calculator →</strong>
          </Link>
        ))}
      </div>
      <section className={styles.section}>
        <h2>A model, with the workings in view.</h2>
        <p>
          Every tool includes a worked example, its formula, limitations and source context. Example
          interest rates and returns are assumptions, not live market quotes. Results provide
          educational context rather than a recommendation to borrow, invest, or change a portfolio.
        </p>
        <p>
          Looking for personal income comparisons?{' '}
          <Link href="/calc/individual-income-percentile/">
            Explore the US income percentile calculator
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
