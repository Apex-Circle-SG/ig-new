'use client';
import { useRef, useState } from 'react';
import { seeded, type Random } from '../../../../lib/casino/cards';
import {
  settleCrapsContract,
  crapsResolve,
  pointWays,
  rollDice,
} from '../../../../lib/casino/table-games';
import { Dice, fmt, Metrics, NumberField, pct } from './shared';
import Experiment from './experiment';
import s from './lab.module.css';
type Contract = {
  id: number;
  type: 'Line' | 'Come';
  dont: boolean;
  point: number | null;
  stake: number;
  odds: number;
};
const props = [
  { id: 'seven', label: 'Any 7', win: [7], payout: 4 },
  { id: 'craps', label: 'Any craps', win: [2, 3, 12], payout: 7 },
  { id: 'two', label: '2', win: [2], payout: 30 },
  { id: 'three', label: '3', win: [3], payout: 15 },
  { id: 'eleven', label: '11', win: [11], payout: 15 },
  { id: 'twelve', label: '12', win: [12], payout: 30 },
];
export default function Craps() {
  const [contracts, setContracts] = useState<Contract[]>([]),
    [tablePoint, setTablePoint] = useState<number | null>(null),
    [dont, setDont] = useState(false),
    [stake, setStake] = useState(10),
    [odds, setOdds] = useState(10),
    [balance, setBalance] = useState(1000),
    [dice, setDice] = useState([3, 4]),
    [seed, setSeed] = useState(42),
    [prop, setProp] = useState('seven'),
    [propStake, setPropStake] = useState(0),
    [message, setMessage] = useState('Place a line bet to begin.'),
    [error, setError] = useState(''),
    [history, setHistory] = useState<string[]>([]);
  const rng = useRef<Random | null>(null),
    id = useRef(0),
    exposure = contracts.reduce((a, b) => a + b.stake + b.odds, 0) + propStake;
  function add(type: 'Line' | 'Come') {
    if (!Number.isFinite(stake) || stake <= 0 || stake > 1e6 || exposure + stake > balance) {
      setError('Your virtual balance must cover all committed bets.');
      return;
    }
    setError('');
    setContracts((c) => [...c, { id: id.current++, type, dont, point: null, stake, odds: 0 }]);
  }
  function roll() {
    if (
      !Number.isInteger(seed) ||
      seed < 0 ||
      seed > 4294967295 ||
      !Number.isFinite(propStake) ||
      propStake < 0 ||
      propStake > 1e6 ||
      exposure > balance
    ) {
      setError('Check the replay seed and committed amounts.');
      return;
    }
    rng.current ??= seeded(seed);
    const d = rollDice(rng.current),
      sum = d[0] + d[1];
    let net = 0;
    const lines: string[] = [];
    const next: Contract[] = [];
    for (const c of contracts) {
      const r = settleCrapsContract(
        sum,
        c.point,
        c.dont,
        c.stake,
        c.odds,
        c.type === 'Come',
        tablePoint,
      );
      if (r.net === null) next.push({ ...c, point: r.point });
      else {
        const n = r.net;
        net += n;
        lines.push(`${c.dont ? 'Don’t ' : ''}${c.type}${c.point ? ` ${c.point}` : ''}: ${fmt(n)}`);
      }
    }
    if (propStake) {
      const p = props.find((p) => p.id === prop)!;
      const n = propStake * (p.win.includes(sum) ? p.payout : -1);
      net += n;
      lines.push(`${p.label}: ${fmt(n)}`);
    }
    const table = crapsResolve(sum, tablePoint, false);
    setTablePoint(table.point);
    setDice(d);
    setContracts(next);
    setBalance((v) => v + net);
    setPropStake(0);
    setError('');
    const m = `${d.join(' + ')} = ${sum}. ${table.message} Net ${fmt(net)}. ${lines.join('; ')}`;
    setMessage(m);
    setHistory((h) => [m, ...h].slice(0, 20));
  }
  const chosen = props.find((p) => p.id === prop)!,
    propProbability = chosen.win.reduce((n, v) => n + pointWays(v), 0) / 36;
  return (
    <>
      <section className={s.table}>
        <p className={s.eyebrow}>PLAY · COME-OUT → POINT → RESOLUTION</p>
        <h2>{tablePoint === null ? 'Come-out roll' : `Point is ${tablePoint}`}</h2>
        <Dice values={dice} />
        <div className={s.grid}>
          <label>
            Side
            <select value={String(dont)} onChange={(e) => setDont(e.target.value === 'true')}>
              <option value="false">Pass / Come</option>
              <option value="true">Don’t Pass / Don’t Come (bar 12)</option>
            </select>
          </label>
          <NumberField
            label="Base stake (virtual units)"
            value={stake}
            onChange={setStake}
            min={1}
          />
          <NumberField label="Odds amount to add" value={odds} onChange={setOdds} min={1} />
          <NumberField
            label="Replay seed (after reset)"
            value={seed}
            onChange={setSeed}
            max={4294967295}
          />
        </div>
        <div className={s.actions}>
          <button
            disabled={tablePoint !== null || contracts.some((c) => c.type === 'Line')}
            onClick={() => add('Line')}
          >
            Place line bet
          </button>
          <button
            disabled={
              tablePoint === null || contracts.some((c) => c.type === 'Come' && c.point === null)
            }
            onClick={() => add('Come')}
          >
            Place Come bet
          </button>
          <button className={s.primary} onClick={roll}>
            Roll dice
          </button>
          <button
            onClick={() => {
              rng.current = null;
              setContracts([]);
              setBalance(1000);
              setTablePoint(null);
              setHistory([]);
              setPropStake(0);
              setMessage('Session reset.');
            }}
          >
            Reset session
          </button>
        </div>
        <p role="status" className={s.outcomeLine}>
          {message}
        </p>
        {error && <p role="alert">{error}</p>}
        <Metrics
          items={[
            ['Virtual balance', fmt(balance)],
            ['Committed exposure', fmt(exposure)],
            ['Active contracts', String(contracts.length)],
          ]}
        />
        {contracts.length > 0 && (
          <div
            className={s.scroll}
            tabIndex={0}
            role="region"
            aria-label="Scrollable results table"
          >
            <table>
              <thead>
                <tr>
                  <th>Bet</th>
                  <th>Point</th>
                  <th>Base / odds stake</th>
                  <th>Odds</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.dont ? 'Don’t ' : ''}
                      {c.type}
                    </td>
                    <td>{c.point ?? 'Pending'}</td>
                    <td>
                      {fmt(c.stake)} / {fmt(c.odds)}
                    </td>
                    <td>
                      <button
                        disabled={c.point === null || c.odds > 0}
                        onClick={() => {
                          if (
                            !Number.isFinite(odds) ||
                            odds <= 0 ||
                            odds > 1e6 ||
                            exposure + odds > balance
                          ) {
                            setError('Enter an odds stake covered by your balance.');
                            return;
                          }
                          setContracts((cs) => cs.map((x) => (x.id === c.id ? { ...x, odds } : x)));
                          setError('');
                        }}
                      >
                        Add odds
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <details>
          <summary>One-roll proposition bet</summary>
          <div className={s.grid}>
            <label>
              Proposition
              <select
                value={prop}
                disabled={propStake > 0}
                onChange={(e) => setProp(e.target.value)}
              >
                {props.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} · {p.payout}:1 net
                  </option>
                ))}
              </select>
            </label>
            <NumberField
              label="One-roll stake (0 = none)"
              value={propStake}
              onChange={setPropStake}
            />
          </div>
          <p>
            Win chance {pct(propProbability)} · house edge{' '}
            {pct(1 - propProbability * (chosen.payout + 1))}. Settles on the next roll.
          </p>
        </details>
        <details>
          <summary>Last 20 rolls</summary>
          <ol className={s.steps}>
            {history.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </details>
      </section>
      <section className={s.panel}>
        <h2>Why odds bets are different</h2>
        <div className={s.scroll} tabIndex={0} role="region" aria-label="Scrollable results table">
          <table>
            <thead>
              <tr>
                <th>Point</th>
                <th>Point before 7</th>
                <th>Pass odds net payout</th>
                <th>Don’t odds net payout</th>
              </tr>
            </thead>
            <tbody>
              {[4, 5, 6, 8, 9, 10].map((p) => (
                <tr key={p}>
                  <td>{p}</td>
                  <td>
                    {pointWays(p)} / {pointWays(p) + 6} = {pct(pointWays(p) / (pointWays(p) + 6))}
                  </td>
                  <td>{fmt(6 / pointWays(p))}:1</td>
                  <td>{fmt(pointWays(p) / 6)}:1</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          True odds have zero expected net: win probability × profit − loss probability × stake = 0.
          The original line bet retains its edge: Pass 7/495 ≈ 1.414%; Don’t Pass (bar 12) 3/220 ≈
          1.364%. Adding odds increases exposure while leaving the expected loss on the original
          base bet.
        </p>
        <p className={s.note}>
          Come bets use the same initial rules as Pass, then travel to their own point. Come odds
          are off during a table come-out roll: if the base resolves, its odds stake is returned
          with zero net. Don’t Come lay odds remain working. Odds here have no casino-specific
          multiple limit. No buy, lay, place, hardway or field bets are simulated.
        </p>
      </section>
      <Experiment key={String(dont)} defaults={{ game: 'craps', dont }} />
    </>
  );
}
