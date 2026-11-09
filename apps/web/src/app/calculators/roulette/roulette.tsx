'use client';

import { SiteLink as Link } from '@insightginie/ui';
import { useState, type FormEvent } from 'react';
import styles from './roulette.module.css';
import RouletteTable from '../casino/lab/roulette-table';

import {
  anchors,
  bets,
  hits,
  play,
  red,
  payoutFor,
  type Bet,
  type Run,
} from '../../../lib/casino/roulette';
type Output = {
  first: Run;
  runs: number;
  profitRuns: number;
  mean: number;
  ruined: number;
  wheel: string;
  edge: number;
  winChance: number;
  totalStake: number;
  expectedLoss: number;
  low: number;
  high: number;
};
const money = (cents: number) =>
  (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export default function Roulette() {
  const [wheel, setWheel] = useState(37),
    [bet, setBet] = useState<Bet>('red'),
    [number, setNumber] = useState(0),
    [base, setBase] = useState(10),
    [initial, setInitial] = useState(1000),
    [limit, setLimit] = useState(500),
    [spins, setSpins] = useState(100),
    [runs, setRuns] = useState(1),
    [target, setTarget] = useState(0),
    [loss, setLoss] = useState(0),
    [strategy, setStrategy] = useState('fixed'),
    [output, setOutput] = useState<Output | null>(null),
    [error, setError] = useState('');
  function run(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const toCents = (n: number) => Math.round(n * 100);
    if (
      ![base, initial, limit, target, loss, spins, runs, number].every(Number.isFinite) ||
      base < 0.01 ||
      initial < 0.01 ||
      limit < 0.01 ||
      target < 0 ||
      loss < 0 ||
      [base, initial, limit, target, loss].some((n) => n > 1000000) ||
      !Number.isInteger(spins) ||
      spins < 1 ||
      spins > 10000 ||
      !Number.isInteger(runs) ||
      runs < 1 ||
      runs > 100 ||
      !Number.isInteger(number) ||
      number < 0 ||
      number > (wheel === 38 ? 37 : 36)
    ) {
      setError('Enter valid amounts up to 1,000,000, 1–10,000 spins and 1–100 runs.');
      return;
    }
    setError('');
    const results: Run[] = [];
    for (let i = 0; i < runs; i++)
      results.push(
        play(
          wheel,
          bet,
          number,
          toCents(base),
          toCents(initial),
          toCents(limit),
          toCents(target),
          toCents(loss),
          spins,
          strategy === 'double',
        ),
      );
    const first = results[0],
      winning = Array.from({ length: wheel }, (_, i) => i).filter((n) =>
        hits(n, bet, number),
      ).length;
    const finals = results.map((r) => r.final).sort((a, b) => a - b);
    setOutput({
      first,
      runs,
      profitRuns: results.filter((x) => x.final > toCents(initial)).length,
      mean: results.reduce((n, x) => n + x.final, 0) / runs,
      ruined: results.filter((x) => x.reason === 'Balance cannot cover the next bet').length,
      wheel: wheel === 37 ? 'European' : 'American',
      edge: ((wheel - 36) / wheel) * 100,
      winChance: (winning / wheel) * 100,
      totalStake: toCents(base) * (bet === 'two-columns' ? 2 : 1),
      expectedLoss:
        ((results.reduce((sum, r) => sum + r.turnover, 0) / runs) * (wheel - 36)) / wheel,
      low: finals[Math.floor((runs - 1) * 0.1)],
      high: finals[Math.floor((runs - 1) * 0.9)],
    });
  }
  const points = output?.first.points ?? [],
    min = Math.min(...points),
    max = Math.max(...points),
    range = Math.max(1, max - min),
    polyline = points
      .map(
        (value, i) =>
          `${points.length === 1 ? 0 : (i / (points.length - 1)) * 600},${145 - ((value - min) / range) * 130}`,
      )
      .join(' ');
  return (
    <div className={`shell ${styles.page}`}>
      <header>
        <p className={styles.eyebrow}>PROBABILITY LAB · VIRTUAL MONEY</p>
        <h1>Roulette probability simulator</h1>
        <p>
          Explore how chance, bet sizes and table limits affect a virtual balance. No real money or
          predictions.
        </p>
      </header>
      <div className={styles.callout}>
        <strong>Every spin is independent.</strong> A progression changes the size and timing of
        outcomes; it does not remove the house edge. Results are illustrative, not a way to predict
        a wheel.
      </div>
      <p>
        <Link href="/calculators/casino/">← Casino probability calculators</Link>
      </p>
      <RouletteTable />
      <h2>Classic single-bet strategy simulator</h2>
      <section className={styles.results}>
        <h2>Your bet on the table</h2>
        <p>
          Highlighted pockets win. Each pocket has probability 1/{wheel}; this is the betting
          layout, not wheel order. Change the settings below to compare coverage.
        </p>
        <div className={styles.board} role="group" aria-label="Roulette betting layout">
          {Array.from({ length: wheel }, (_, n) => (
            <button
              type="button"
              key={n}
              className={`${n === 0 || n === 37 ? styles.green : red.has(n) ? styles.red : styles.black} ${hits(n, bet, number) ? styles.selected : ''}`}
              aria-label={`${n === 37 ? '00' : n}${hits(n, bet, number) ? ', covered by your bet' : ''}. Select single number`}
              onClick={() => {
                setBet('straight');
                setNumber(n);
              }}
            >
              {n === 37 ? '00' : n}
              {hits(n, bet, number) ? ' ●' : ''}
            </button>
          ))}
        </div>
        <p>
          <strong>
            {(
              (Array.from({ length: wheel }, (_, n) => n).filter((n) => hits(n, bet, number))
                .length /
                wheel) *
              100
            ).toFixed(2)}
            % win chance
          </strong>{' '}
          ·{' '}
          {bet === 'two-columns'
            ? 'Net +1 stake on a hit; −2 stakes on a miss'
            : `${payoutFor(bet)}:1 net payout`}{' '}
          · house edge {(((wheel - 36) / wheel) * 100).toFixed(2)}% per unit wagered.
        </p>
      </section>
      <form onSubmit={run} className={styles.form}>
        <h2>Set up a simulation</h2>
        <div className={styles.grid}>
          <label>
            Wheel
            <select
              value={wheel}
              onChange={(e) => {
                setWheel(Number(e.target.value));
                setNumber(anchors(bet, Number(e.target.value))[0]);
              }}
            >
              <option value={37}>European · 0</option>
              <option value={38}>American · 0 and 00</option>
            </select>
          </label>
          <label>
            Bet
            <select
              value={bet}
              onChange={(e) => {
                setBet(e.target.value as Bet);
                setNumber(anchors(e.target.value as Bet, wheel)[0]);
              }}
            >
              {bets.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>
          {['straight', 'split', 'street', 'corner', 'six-line'].includes(bet) && (
            <label>
              Starting number
              <select value={number} onChange={(e) => setNumber(Number(e.target.value))}>
                {anchors(bet, wheel).map((i) => (
                  <option value={i} key={i}>
                    {i === 37 ? '00' : i}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Strategy
            <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
              <option value="fixed">Fixed stake</option>
              <option value="double">Double stake after a loss</option>
            </select>
          </label>
          <label>
            Starting balance
            <input
              type="number"
              min="0.01"
              max="1000000"
              step="0.01"
              value={initial}
              onChange={(e) => setInitial(Number(e.target.value))}
            />
          </label>
          <label>
            {bet === 'two-columns' ? 'Stake per column' : 'Starting stake'}
            <input
              type="number"
              min="0.01"
              max="1000000"
              step="0.01"
              value={base}
              onChange={(e) => setBase(Number(e.target.value))}
            />
          </label>
          <label>
            Table limit per bet
            <input
              type="number"
              min="0.01"
              max="1000000"
              step="0.01"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </label>
          <label>
            Spins per run
            <input
              type="number"
              min="1"
              max="10000"
              step="1"
              value={spins}
              onChange={(e) => setSpins(Number(e.target.value))}
            />
          </label>
          <label>
            Independent runs
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={runs}
              onChange={(e) => setRuns(Number(e.target.value))}
            />
          </label>
          <label>
            Stop at profit <small>0 disables</small>
            <input
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
            />
          </label>
          <label>
            Stop at loss <small>0 disables</small>
            <input
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              value={loss}
              onChange={(e) => setLoss(Number(e.target.value))}
            />
          </label>
        </div>
        <p>
          All amounts are virtual units. Runs stop before placing a bet that exceeds the table limit
          or available balance. A stop threshold can be exceeded by the last spin.
        </p>
        {error && <p role="alert">{error}</p>}
        <button type="submit">Run simulation</button>
      </form>
      {output && (
        <section aria-live="polite" className={styles.results}>
          <h2>Results</h2>
          <p>
            {output.wheel} wheel · initial combined stake {money(output.totalStake)} · {output.runs}{' '}
            independent {output.runs === 1 ? 'run' : 'runs'}. Settings shown reflect the last run;
            rerun after changing them.
          </p>
          <div className={styles.metrics}>
            <div>
              <span>House edge per unit wagered</span>
              <strong>{output.edge.toFixed(2)}%</strong>
            </div>
            <div>
              <span>Chance of a winning spin</span>
              <strong>{output.winChance.toFixed(2)}%</strong>
            </div>
            <div>
              <span>Runs ending in profit</span>
              <strong>
                {output.profitRuns} / {output.runs}
              </strong>
            </div>
            <div>
              <span>Average final balance</span>
              <strong>{money(output.mean)}</strong>
            </div>
          </div>
          <p>
            {output.ruined} {output.ruined === 1 ? 'run stopped' : 'runs stopped'} because the
            balance could not cover the next bet. A table-limit stop is counted separately.
          </p>
          <p>
            10th–90th percentile final balances across simulated runs: {money(output.low)}–
            {money(output.high)}. With few runs this range is unstable. House-edge benchmark at the
            average simulated turnover: {money(output.expectedLoss)} lost; stopped sessions can
            differ from this benchmark.
          </p>
          <h3>First run</h3>
          <p>
            {output.first.spins} spins · final balance {money(output.first.final)} · total wagered{' '}
            {money(output.first.turnover)} · maximum drawdown {money(output.first.maxDrawdown)} ·{' '}
            {output.first.reason}.
          </p>
          <svg
            viewBox="0 0 600 160"
            role="img"
            aria-label={`First run balance, ranging from ${money(min)} to ${money(max)} virtual units`}
            className={styles.chart}
          >
            <polyline fill="none" stroke="currentColor" strokeWidth="3" points={polyline} />
          </svg>
          <p>
            Balance range on sampled chart: {money(min)}–{money(max)}. The chart samples long runs;
            the drawdown uses every spin.
          </p>
          <h3>Observed pocket frequencies</h3>
          <p>First run only. Uneven counts in a short run do not predict the next spin.</p>
          <div className={styles.frequencies}>
            {output.first.frequencies.map((count, n) => (
              <div key={n}>
                <span>{n === 37 ? '00' : n}</span>
                <meter
                  min={0}
                  max={Math.max(1, ...output.first.frequencies)}
                  value={count}
                  aria-label={`Pocket ${n === 37 ? '00' : n}: ${count} hits`}
                />
                <span>{count}</span>
              </div>
            ))}
          </div>
          <details>
            <summary>Last {output.first.history.length} spins of first run</summary>
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Stake</th>
                    <th>Net</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {output.first.history.map((x, i) => (
                    <tr key={i}>
                      <td>{x.number}</td>
                      <td>{money(x.stake)}</td>
                      <td>{money(x.net)}</td>
                      <td>{money(x.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <p>
            Standard net payouts: even-money bets 1:1, dozens and columns 2:1, single numbers 35:1,
            split 17:1, street 11:1, corner 8:1 and six line 5:1. Split options cover horizontal
            pairs; zero splits, baskets and special rules are not included. The two-column option
            places equal separate bets on the first two columns. Zero and 00 lose outside bets; no
            special surrender or bonus rules. Each simulated outcome is sampled independently with
            JavaScript’s pseudo-random generator.
          </p>
        </section>
      )}
      <p>
        Learn more about{' '}
        <a href="https://www.gamblingcommission.gov.uk/public-and-players/guide/return-to-player-how-much-gaming-machines-payout">
          house edge from the Gambling Commission
        </a>
        .{' '}
        <a href="https://www.nj.gov/oag/ge/docs/Regulations/CHAPTER69.pdf">
          New Jersey roulette payout rules
        </a>
        . Workbook-specific bonus games and unusual payouts are not modeled.
      </p>
    </div>
  );
}
