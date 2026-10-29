import type { Metadata } from 'next';
import { FINANCE_TOOLS } from '@insightginie/calculators';
import { SiteLink as Link } from '@insightginie/ui';
import { WeeklyInsight } from '../../components/weekly-insight';
import styles from '../../components/finance/finance-tool.module.css';

export const metadata: Metadata = {
  title: 'Calculators — Understand Where You Stand',
  description:
    'Compare your income, explore all 44 Census bands, model cash runway and automation costs — Free, no sign-up, source: US Census Bureau.',
  alternates: { canonical: '/calculators/' },
};
export default function Calculators() {
  const cards = [
    {
      path: '/calc/individual-income-percentile/',
      title: 'Compare my income',
      description: 'Individual income vs. US Census distribution.',
    },
    {
      path: '/data/us-income-distribution/',
      title: 'US income distribution data, chart & CSV',
      description: 'The full 44-band table, population shares and downloadable data.',
    },
    ...[
      'cash-runway',
      'ai-workflow-roi',
      'break-even',
      'business-loan',
      'drawdown-recovery',
      'portfolio-concentration',
    ].map((id) => {
      const tool = FINANCE_TOOLS.find((candidate) => candidate.id === id)!;
      return {
        path: `/tools/${id}/`,
        title:
          id === 'ai-workflow-roi' ? 'Cost of automation — AI workflow ROI calculator' : tool.title,
        description: tool.description,
      };
    }),
  ];
  return (
    <div className={`shell ${styles.page}`}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>YOUR NUMBERS, WITH CONTEXT</div>
        <h1>Calculators — Understand where you stand</h1>
        <p>
          Your numbers tell a story. Use real, published data to see how your income compares, how
          long your money lasts, and what automation really costs. Free to explore. No account
          needed. Your inputs stay in your browser.
        </p>
      </header>
      <div className={styles.grid}>
        {cards.map((card) => (
          <Link className={styles.card} href={card.path} key={card.path}>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <strong>Explore →</strong>
          </Link>
        ))}
      </div>
      <section className={styles.section}>
        <h2>Know what the numbers can tell you.</h2>
        <p>
          The income comparison uses published US Census data. Other decision tools use transparent
          formulas and your assumptions. Worked examples are illustrative, not market quotes or
          promises. Sources, methods and limits remain alongside every tool.
        </p>
        <Link href="/methodology/">Read our methodology →</Link>
      </section>
      <WeeklyInsight id="hub-weekly" />
    </div>
  );
}
