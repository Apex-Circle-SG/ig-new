'use client';
import { useMemo, useState } from 'react';
import {
  compareSessions,
  referenceReturn,
  type ExperimentOptions,
} from '../../../../lib/casino/experiments';
import { CalculationStatus, Chart, fmt, Metrics, NumberField, useCalculation } from './shared';
import s from './lab.module.css';
export default function Experiment({
  defaults,
}: {
  defaults: Partial<ExperimentOptions> & Pick<ExperimentOptions, 'game'>;
}) {
  const [rounds, setRounds] = useState(200),
    [runs, setRuns] = useState(30),
    [seed, setSeed] = useState(42),
    [bankroll, setBankroll] = useState(1000),
    [stake, setStake] = useState(defaults.stake ?? 10),
    [limit, setLimit] = useState(500),
    [stopWin, setStopWin] = useState(0),
    [stopLoss, setStopLoss] = useState(0);
  const baseline = useMemo(() => referenceReturn(defaults), [defaults]);
  const calc = useCalculation<ReturnType<typeof compareSessions>>();
  function edit(set: (n: number) => void) {
    return (n: number) => {
      calc.cancel();
      set(n);
    };
  }
  return (
    <section className={s.panel} id="experiment">
      <p className={s.eyebrow}>EXPERIMENT · REPLAYABLE RANDOMNESS</p>
      <h2>Same outcomes, different stakes</h2>
      <p>
        Compare a fixed stake with doubling after a loss. Both receive the same seeded cards or dice
        until a stopping rule ends a session. Pushes leave the next stake unchanged.
      </p>
      <div className={s.grid}>
        <NumberField
          label="Starting virtual balance"
          value={bankroll}
          onChange={edit(setBankroll)}
          min={1}
        />
        <NumberField
          label="Base stake (virtual units)"
          value={stake}
          onChange={edit(setStake)}
          min={1}
        />
        <NumberField
          label="Maximum total stake per round"
          value={limit}
          onChange={edit(setLimit)}
          min={1}
        />
        <NumberField
          label="Rounds per session"
          value={rounds}
          onChange={edit(setRounds)}
          min={1}
          max={10000}
        />
        <NumberField
          label="Number of sessions"
          value={runs}
          onChange={edit(setRuns)}
          min={1}
          max={100}
        />
        <NumberField label="Replay seed" value={seed} onChange={edit(setSeed)} max={4294967295} />
        <NumberField
          label="Stop at profit (0 disables)"
          value={stopWin}
          onChange={edit(setStopWin)}
        />
        <NumberField
          label="Stop at loss (0 disables)"
          value={stopLoss}
          onChange={edit(setStopLoss)}
        />
      </div>
      {baseline !== null && Number.isFinite(rounds) && Number.isFinite(stake) && (
        <p className={s.note}>
          Reference expected net per base stake unit: {fmt(baseline)}. For{' '}
          {Number.isFinite(rounds) ? rounds : '—'} planned fixed-stake rounds at {fmt(stake)} units:{' '}
          {fmt(baseline * rounds * stake)} expected net, before stopping rules. Baccarat uses a
          fresh eight-deck reference; play through a depleted shoe can differ. This reference is
          separate from the sampled results below.
        </p>
      )}
      <div className={s.actions}>
        <button
          className={s.primary}
          disabled={calc.busy}
          onClick={() =>
            calc.calculate({
              kind: 'sessions',
              options: {
                ...defaults,
                rounds,
                runs,
                seed,
                bankroll,
                stake,
                limit,
                stopWin,
                stopLoss,
              },
            })
          }
        >
          Compare sessions
        </button>
        {calc.busy && <button onClick={calc.cancel}>Cancel</button>}
      </div>
      <CalculationStatus {...calc} />
      {calc.value && (
        <div aria-live="polite">
          <Chart
            series={calc.value.map((r) => r.first.points)}
            labels={['Fixed stake', 'Double after loss']}
          />
          <div className={s.split}>
            {calc.value.map((r) => (
              <div key={String(r.progression)}>
                <h3>{r.progression ? 'Double after loss' : 'Fixed stake'}</h3>
                <Metrics
                  items={[
                    ['Average final balance', fmt(r.mean)],
                    ['10th–90th percentile', `${fmt(r.low)}–${fmt(r.high)}`],
                    ['Profitable sessions', `${r.profitable}/${runs}`],
                    ['Insufficient balance', `${r.insufficient}/${runs}`],
                  ]}
                />
                <p>
                  First session: {r.first.played} rounds; turnover {fmt(r.first.turnover)}; maximum
                  drawdown {fmt(r.first.drawdown)}. {r.first.reason}.
                </p>
              </div>
            ))}
          </div>
          <details>
            <summary>First fixed-stake session: last 20 outcomes</summary>
            <div
              className={s.scroll}
              tabIndex={0}
              role="region"
              aria-label="Scrollable results table"
            >
              <table>
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Outcome</th>
                    <th>Net</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.value[0].first.history.map((r) => (
                    <tr key={r.round}>
                      <td>{r.round}</td>
                      <td>{r.label}</td>
                      <td>{fmt(r.net)}</td>
                      <td>{fmt(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
      <p className={s.note}>
        These are sampled session results, not theoretical confidence intervals or predictions. A
        progression changes exposure; it does not remove a negative expected return. Stops can
        overshoot by a round’s loss. The maximum stake includes possible additional wagers.
      </p>
      <details>
        <summary>Simulation rules</summary>
        <p>
          Card games use an eight-deck shoe, reshuffled below 52 cards; three-card poker uses one
          freshly shuffled deck each round. Baccarat uses the selected rule and tie payout.
          Blackjack uses hit/stand only: stand on hard 17 or soft 18; selected dealer soft-17 and
          blackjack payout apply. This is a stated demonstration policy, not optimal strategy. Video
          poker uses a simple demonstration policy: keep made two-pair-or-better hands; otherwise
          keep any pair and all J/Q/K/A cards, replacing the rest. This is not optimal play. Casino
          War starts each round with a fresh six-deck shoe; a second tie pays the war wager at the
          selected rate (default 2:1). A roulette portfolio scales all chip amounts proportionally
          to the base stake. Three-card poker plays Q–6–4 or better, with no Pair Plus. Craps
          simulates complete line bets without odds or Come bets. Slots use the displayed
          independent reel weights. Pseudorandom seeds are for replay, not gambling-grade
          randomness.
        </p>
      </details>
    </section>
  );
}
