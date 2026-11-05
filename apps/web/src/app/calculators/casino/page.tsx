import { SiteLink as Link } from '@insightginie/ui';
import type { Metadata } from 'next';
import { casinoTools } from '../../../lib/casino/probability';
import styles from '../roulette/roulette.module.css';

export const metadata: Metadata = {
  title: 'Casino probability calculators',
  description:
    'Visual roulette simulations, expected value, losing streaks and two-dice probabilities. Explore the mathematics with virtual units.',
  alternates: { canonical: '/calculators/casino/' },
};
export default function CasinoPage() {
  return (
    <div className={`shell ${styles.page}`}>
      <p>
        <Link href="/calculators/">← All calculators</Link>
      </p>
      <p className={styles.eyebrow}>CASINO · PROBABILITY LAB</p>
      <h1>Understand the odds</h1>
      <p>
        Explore chance, payouts and session risk through interactive calculations and visual
        experiments. All inputs stay in your browser; amounts are virtual units.
      </p>
      <div className={styles.grid}>
        {[
          {
            id: 'roulette',
            title: 'Roulette odds & simulator',
            description:
              'See bet coverage, compare wheels and strategies, and inspect balance paths and pocket frequencies.',
          },
          ...casinoTools,
        ].map((tool) => (
          <Link
            className={styles.results}
            key={tool.id}
            href={
              tool.id === 'roulette' ? '/calculators/roulette/' : `/calculators/casino/${tool.id}/`
            }
          >
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
            <strong>Explore →</strong>
          </Link>
        ))}
      </div>
      <section className={styles.callout}>
        <h2>Three different questions</h2>
        <p>
          Expected value describes an average across repeated play. A simulation shows possible
          paths. Streak probability measures how often a pattern can occur. None predicts the next
          outcome, and a betting progression does not remove a negative expected value.
        </p>
      </section>
      <p>
        Start with roulette, use expected value to understand its house edge, then compare the
        chance of a losing streak. The dice tool explains why equally likely combinations do not
        produce equally likely sums.
      </p>
    </div>
  );
}
