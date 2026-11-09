'use client';
import { useState } from 'react';
import { SiteLink as Link } from '@insightginie/ui';
import { casinoLabs } from '../../../../lib/casino/catalogue';
import { sicBets } from '../../../../lib/casino/table-games';
import { bets, type Bet } from '../../../../lib/casino/roulette';
import type { ExperimentGame } from '../../../../lib/casino/experiments';
import Experiment from './experiment';
import s from './lab.module.css';
export default function SessionLab() {
  const [game, setGame] = useState<ExperimentGame>('baccarat'),
    [baccaratBet, setBaccaratBet] = useState<'Banker' | 'Player' | 'Tie'>('Banker'),
    [sicBet, setSicBet] = useState('small'),
    [rouletteBet, setRouletteBet] = useState<Bet>('red'),
    [dont, setDont] = useState(false);
  return (
    <>
      <section className={s.panel}>
        <h2>Choose the experiment</h2>
        <div className={s.grid}>
          <label>
            Game
            <select value={game} onChange={(e) => setGame(e.target.value as ExperimentGame)}>
              {casinoLabs
                .filter((g) => g.id !== 'session-lab')
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title.split(' · ')[0]}
                  </option>
                ))}
              <option value="roulette">Roulette</option>
            </select>
          </label>
          {game === 'baccarat' && (
            <label>
              Baccarat bet
              <select
                value={baccaratBet}
                onChange={(e) => setBaccaratBet(e.target.value as typeof baccaratBet)}
              >
                {['Banker', 'Player', 'Tie'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          )}
          {game === 'sic-bo' && (
            <label>
              Sic Bo bet
              <select value={sicBet} onChange={(e) => setSicBet(e.target.value)}>
                {sicBets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {game === 'roulette' && (
            <label>
              Roulette outside bet
              <select value={rouletteBet} onChange={(e) => setRouletteBet(e.target.value as Bet)}>
                {bets
                  .filter(
                    (b) => !['straight', 'split', 'street', 'corner', 'six-line'].includes(b.value),
                  )
                  .map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {game === 'craps' && (
            <label>
              Line bet
              <select value={String(dont)} onChange={(e) => setDont(e.target.value === 'true')}>
                <option value="false">Pass</option>
                <option value="true">Don’t Pass</option>
              </select>
            </label>
          )}
        </div>
        <p>
          Defaults: commission Baccarat with 8:1 ties; eight-deck Blackjack, S17 and 3:2; European
          roulette; default Sic Bo paytable; no side bets. Set game-specific variants inside the
          individual labs.
        </p>
        <Link
          href={game === 'roulette' ? '/calculators/roulette/' : `/calculators/casino/${game}/`}
        >
          Open the {game.replaceAll('-', ' ')} table →
        </Link>
      </section>
      <Experiment
        key={`${game}-${baccaratBet}-${sicBet}-${rouletteBet}-${dont}`}
        defaults={{ game, baccaratBet, sicBet, rouletteBet, dont }}
      />
    </>
  );
}
