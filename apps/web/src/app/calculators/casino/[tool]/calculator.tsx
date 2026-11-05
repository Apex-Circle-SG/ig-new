'use client';

import { SiteLink as Link } from '@insightginie/ui';
import { useState } from 'react';
import {
  casinoTools,
  diceSums,
  expectedValue,
  losingStreak,
} from '../../../../lib/casino/probability';
import styles from '../../roulette/roulette.module.css';

type Tool = (typeof casinoTools)[number];
const percent = (n: number) =>
  (n * 100).toLocaleString(undefined, { maximumFractionDigits: 4 }) + '%';
const amount = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
export default function CasinoCalculator({ tool }: { tool: Tool }) {
  const [chance, setChance] = useState((18 / 37) * 100),
    [payout, setPayout] = useState(1),
    [stake, setStake] = useState(10),
    [rounds, setRounds] = useState(100),
    [length, setLength] = useState(6),
    [sides, setSides] = useState(6),
    [sum, setSum] = useState(7);
  const valid =
    [chance, payout, stake, rounds, length, sides, sum].every(Number.isFinite) &&
    chance >= 0 &&
    chance <= 100 &&
    payout >= 0 &&
    payout <= 1000000 &&
    stake > 0 &&
    stake <= 1000000 &&
    Number.isInteger(rounds) &&
    rounds >= 1 &&
    rounds <= 10000 &&
    Number.isInteger(length) &&
    length >= 1 &&
    length <= 100 &&
    Number.isInteger(sides) &&
    sides >= 2 &&
    sides <= 20 &&
    Number.isInteger(sum) &&
    sum >= 2 &&
    sum <= sides * 2;
  const ev = valid ? expectedValue(chance / 100, payout, stake, rounds) : null;
  const streak = valid ? losingStreak(1 - chance / 100, rounds, length) : 0;
  const distribution = valid ? diceSums(sides) : [];
  const selected = distribution.find((item) => item.sum === sum);
  function field(
    label: string,
    value: number,
    set: (n: number) => void,
    min: number,
    max: number,
    step = 1,
  ) {
    return (
      <label>
        {label}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => set(Number(e.target.value))}
        />
      </label>
    );
  }
  return (
    <div className={`shell ${styles.page}`}>
      <p>
        <Link href="/calculators/casino/">← Casino probability calculators</Link>
      </p>
      <p className={styles.eyebrow}>CHANCE, EXPLAINED</p>
      <h1>{tool.title}</h1>
      <p>{tool.description}</p>
      <section className={styles.form}>
        <h2>Your assumptions</h2>
        <div className={styles.grid}>
          {tool.id === 'dice' ? (
            <>
              {field(
                'Sides on each die',
                sides,
                (n) => {
                  setSides(n);
                  setSum(Math.min(sum, n * 2));
                },
                2,
                20,
              )}
              {field('Target sum', sum, setSum, 2, sides * 2)}
            </>
          ) : (
            <>
              {field('Win probability (%)', chance, setChance, 0, 100, 0.0001)}
              {field('Independent rounds', rounds, setRounds, 1, 10000)}
              {tool.id === 'expected-value' ? (
                <>
                  {field('Net payout per unit stake', payout, setPayout, 0, 1000000, 0.01)}
                  {field('Stake per round (virtual units)', stake, setStake, 0.01, 1000000, 0.01)}
                </>
              ) : (
                field('Consecutive losses', length, setLength, 1, 100)
              )}
            </>
          )}
        </div>
        <p>Results update as you change valid inputs.</p>
      </section>
      {!valid ? (
        <p role="alert">
          Enter values within the displayed limits. Rounds, dice sides, target sum and streak length
          must be whole numbers.
        </p>
      ) : (
        <section className={styles.results} aria-live="polite">
          <h2>What the numbers say</h2>
          {tool.id === 'expected-value' && ev && (
            <>
              <div className={styles.metrics}>
                <div>
                  <span>Expected net per round</span>
                  <strong>{amount(ev.perRound)}</strong>
                </div>
                <div>
                  <span>Expected session net</span>
                  <strong>{amount(ev.total)}</strong>
                </div>
                <div>
                  <span>{ev.perUnit <= 0 ? 'House edge' : 'Player advantage'}</span>
                  <strong>{percent(Math.abs(ev.perUnit))}</strong>
                </div>
                <div>
                  <span>Break-even win probability</span>
                  <strong>{percent(ev.breakEven)}</strong>
                </div>
              </div>
              <p>
                On a win: +{amount(stake * payout)} net. On a loss: −{amount(stake)}. Total
                turnover: {amount(stake * rounds)} virtual units.
              </p>
              <p>
                Formula: expected net = stake × [p × net payout − (1 − p)]. Multiply by rounds for a
                fixed-stake session. A 1:1 payout means one unit of profit plus the returned stake.
                No ties, commission, partial losses or bonuses are modeled.
              </p>
              <p>
                This average is not a predicted balance or a guarantee. Positive results only
                reflect the probability and payout you entered; they do not establish an exploitable
                casino game.
              </p>
            </>
          )}
          {tool.id === 'losing-streak' && (
            <>
              <div className={styles.metrics}>
                <div>
                  <span>
                    At least one streak of {length} losses in {rounds} rounds
                  </span>
                  <strong>{percent(streak)}</strong>
                </div>
                <div>
                  <span>Next {length} rounds all lose</span>
                  <strong>{percent((1 - chance / 100) ** length)}</strong>
                </div>
              </div>
              <meter
                className={styles.probability}
                min={0}
                max={1}
                value={streak}
                aria-label="Probability of at least one losing streak"
              />
              <p>
                These are different questions: a session contains many overlapping chances to start
                a streak. The calculation tracks the current run of losses and accumulates the
                probability of reaching your target length. It does not treat overlapping windows as
                independent.
              </p>
              <p>
                Assumes the same win probability on every independent round, with no pushes. A loss
                streak does not make a win due. This is a pattern calculator, not a bankroll-ruin
                calculation.
              </p>
            </>
          )}
          {tool.id === 'dice' && selected && (
            <>
              <div className={styles.metrics}>
                <div>
                  <span>Probability of sum {sum}</span>
                  <strong>{percent(selected.probability)}</strong>
                </div>
                <div>
                  <span>Winning ordered combinations</span>
                  <strong>
                    {selected.ways} / {sides * sides}
                  </strong>
                </div>
                <div>
                  <span>Fair net payout</span>
                  <strong>{amount(1 / selected.probability - 1)}:1</strong>
                </div>
              </div>
              <div className={styles.frequencies}>
                {distribution.map((item) => (
                  <div key={item.sum}>
                    <span>{item.sum}</span>
                    <meter
                      min={0}
                      max={1 / sides}
                      value={item.probability}
                      aria-label={`Sum ${item.sum}: ${percent(item.probability)}`}
                    />
                    <span>{percent(item.probability)}</span>
                  </div>
                ))}
              </div>
              <h3>Combinations that make {sum}</h3>
              <p>
                {Array.from({ length: sides }, (_, i) => i + 1)
                  .filter((a) => sum - a >= 1 && sum - a <= sides)
                  .map((a) => `${a} + ${sum - a}`)
                  .join(' · ')}
              </p>
              <p>
                Two fair, independent dice have {sides * sides} equally likely ordered outcomes.
                Probability = winning combinations ÷ total outcomes. A fair net payout is 1 ÷
                probability − 1, before fees. Actual casino paytables can differ; this is not a full
                craps or sic bo simulator.
              </p>
            </>
          )}
        </section>
      )}
      <p>
        Related: <Link href="/calculators/roulette/">Roulette simulator</Link>
        {casinoTools
          .filter((item) => item.id !== tool.id)
          .map((item) => (
            <span key={item.id}>
              {' '}
              · <Link href={`/calculators/casino/${item.id}/`}>{item.title}</Link>
            </span>
          ))}
      </p>
    </div>
  );
}
