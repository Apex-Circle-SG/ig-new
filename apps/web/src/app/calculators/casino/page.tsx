import { SiteLink as Link } from '@insightginie/ui';
import type { Metadata } from 'next';
import { casinoTools } from '../../../lib/casino/probability';
import { casinoLabs } from '../../../lib/casino/catalogue';
import s from './lab/lab.module.css';
export const metadata: Metadata = {
  title: 'Casino probability lab — play, calculate, simulate',
  description:
    'Interactive Baccarat, Blackjack, Sic Bo, Craps, roulette, video poker and more. Play with virtual units and reveal the mathematics.',
  alternates: { canonical: '/calculators/casino/' },
};
export default function CasinoPage() {
  const entries = [
    {
      id: 'roulette',
      group: 'Wheel & reel games',
      title: 'Roulette · Build a multi-bet table',
      description:
        'Place overlapping chips, compare zero rules and replay spins with every payout explained.',
    },
    ...casinoLabs,
    ...casinoTools.map((t) => ({ ...t, group: 'Probability & session tools' })),
  ];
  return (
    <div className={`shell ${s.page}`}>
      <p>
        <Link href="/calculators/">← All calculators</Link>
      </p>
      <header>
        <p className={s.eyebrow}>CASINO · PROBABILITY LAB</p>
        <h1>
          Play the game.
          <br />
          Reveal the mathematics.
        </h1>
        <p className={s.intro}>
          Cards, dice and wheels become experiments. Make a decision, follow its calculation, then
          see what happens across hundreds of virtual sessions.
        </p>
      </header>
      <div className={s.metrics}>
        <div>
          <span>Card games</span>
          <strong>5 playable tables</strong>
        </div>
        <div>
          <span>Dice games</span>
          <strong>Sic Bo & Craps</strong>
        </div>
        <div>
          <span>Beyond one round</span>
          <strong>Replay & compare</strong>
        </div>
      </div>
      <section className={s.note}>
        <strong>Three ways to explore:</strong> Play with virtual units. Explain a hand or bet.
        Experiment with repeatable simulations. Exact odds describe possibilities; simulations show
        sampled paths.
      </section>
      {['Card games', 'Dice games', 'Wheel & reel games', 'Probability & session tools'].map(
        (group) => (
          <section key={group} className={s.panel}>
            <p className={s.eyebrow}>{group.toUpperCase()}</p>
            <h2>{group}</h2>
            <div className={s.grid}>
              {entries
                .filter((t) => t.group === group)
                .map((t) => (
                  <Link
                    key={t.id}
                    className={s.hubCard}
                    href={
                      t.id === 'roulette'
                        ? '/calculators/roulette/'
                        : `/calculators/casino/${t.id}/`
                    }
                  >
                    <span className={s.badge}>
                      {casinoTools.some((v) => v.id === t.id)
                        ? 'Calculate'
                        : t.id === 'session-lab'
                          ? 'Experiment'
                          : 'Play · Explain · Experiment'}
                    </span>
                    <h3>{t.title}</h3>
                    <p>{t.description}</p>
                    <strong>Explore →</strong>
                  </Link>
                ))}
            </div>
          </section>
        ),
      )}
      <p className={s.note}>
        All stakes are virtual. No deposits, cash prizes or casino referrals. Betting progressions
        do not remove a game’s house edge. Calculator inputs stay in your browser.
      </p>
    </div>
  );
}
