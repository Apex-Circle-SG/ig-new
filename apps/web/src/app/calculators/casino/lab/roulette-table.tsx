'use client';
import { useRef, useState } from 'react';
import { seeded, type Random } from '../../../../lib/casino/cards';
import { anchors, bets, red, type Bet } from '../../../../lib/casino/roulette';
import { portfolioNet, type RouletteChip } from '../../../../lib/casino/portfolio';
import { Distribution, fmt, Metrics, NumberField, pct } from './shared';
import Experiment from './experiment';
import s from './lab.module.css';
export default function RouletteTable() {
  const [wheel, setWheel] = useState(37),
    [partage, setPartage] = useState(false),
    [chips, setChips] = useState<RouletteChip[]>([]),
    [bet, setBet] = useState<Bet>('red'),
    [number, setNumber] = useState(0),
    [stake, setStake] = useState(10),
    [seed, setSeed] = useState(42),
    [balance, setBalance] = useState(1000),
    [pocket, setPocket] = useState<number | null>(null),
    [message, setMessage] = useState('Add chips to build a combined bet.'),
    [error, setError] = useState(''),
    [history, setHistory] = useState<
      { pocket: number; nets: number[]; net: number; balance: number }[]
    >([]);
  const rng = useRef<Random | null>(null),
    total = chips.reduce((n, c) => n + c.stake * (c.bet === 'two-columns' ? 2 : 1), 0),
    nets = Array.from({ length: wheel }, (_, n) =>
      portfolioNet(n, chips, partage).reduce((a, b) => a + b, 0),
    ),
    ev = nets.reduce((a, b) => a + b, 0) / wheel;
  const distribution = new Map<number, number>();
  nets.forEach((n) => distribution.set(n, (distribution.get(n) ?? 0) + 1));
  function add(b = bet, n = number) {
    if (
      !Number.isFinite(stake) ||
      stake <= 0 ||
      stake > 1e6 ||
      chips.length >= 30 ||
      total + stake * (b === 'two-columns' ? 2 : 1) > 1e6
    ) {
      setError('Use a positive stake; maximum 30 entries and 1,000,000 combined units.');
      return;
    }
    setError('');
    setPocket(null);
    setChips((c) => [...c, { bet: b, number: n, stake }]);
  }
  function spin() {
    if (
      !chips.length ||
      total > balance ||
      !Number.isInteger(seed) ||
      seed < 0 ||
      seed > 4294967295
    ) {
      setError('Add bets covered by the balance and enter a whole replay seed.');
      return;
    }
    rng.current ??= seeded(seed);
    const n = Math.floor(rng.current() * wheel),
      each = portfolioNet(n, chips, partage),
      net = each.reduce((a, b) => a + b, 0);
    setPocket(n);
    setBalance((b) => b + net);
    setMessage(`Pocket ${n === 37 ? '00' : n} · combined net ${fmt(net)} virtual units.`);
    setHistory((h) => [{ pocket: n, nets: each, net, balance: balance + net }, ...h].slice(0, 20));
    setError('');
  }
  const options = anchors(bet, wheel);
  return (
    <section className={s.page} id="multi-bet-table">
      <p className={s.eyebrow}>NEW · PLAY A MULTI-BET TABLE</p>
      <h2>Put several bets on one spin</h2>
      <p>
        Click numbered pockets to add straight-up chips, or combine inside and outside bets below.
        Every wager settles against the same pocket.
      </p>
      <div className={s.panel}>
        <div className={s.grid}>
          <label>
            Wheel
            <select
              value={wheel}
              onChange={(e) => {
                setWheel(Number(e.target.value));
                setChips([]);
                setPocket(null);
                setPartage(false);
                rng.current = null;
                setHistory([]);
              }}
            >
              <option value={37}>European · single zero</option>
              <option value={38}>American · double zero</option>
            </select>
          </label>
          <label>
            Zero rule
            <select
              disabled={wheel !== 37}
              value={String(partage)}
              onChange={(e) => {
                setPocket(null);
                setPartage(e.target.value === 'true');
              }}
            >
              <option value="false">Standard: zero loses outside bets</option>
              <option value="true">La partage: half loss on even-money bets</option>
            </select>
          </label>
          <NumberField
            label="Chip amount (virtual units)"
            value={stake}
            onChange={setStake}
            min={0.01}
            step={0.01}
          />
          <NumberField
            label="Replay seed (after reset)"
            value={seed}
            onChange={setSeed}
            max={4294967295}
          />
        </div>
        <div className={s.board}>
          {Array.from({ length: wheel }, (_, n) => (
            <button
              key={n}
              className={
                n === 0 || n === 37 ? s.pocketGreen : red.has(n) ? s.pocketRed : s.pocketBlack
              }
              aria-pressed={chips.some((c) => c.bet === 'straight' && c.number === n)}
              onClick={() => add('straight', n)}
            >
              {n === 37 ? '00' : n}
              {pocket === n ? ' ←' : ''}
            </button>
          ))}
        </div>
        <div className={s.grid}>
          <label>
            Bet type
            <select
              value={bet}
              onChange={(e) => {
                const b = e.target.value as Bet;
                setBet(b);
                setNumber(anchors(b, wheel)[0] ?? 0);
              }}
            >
              {bets.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          {['straight', 'split', 'street', 'corner', 'six-line'].includes(bet) && (
            <label>
              Starting pocket
              <select value={number} onChange={(e) => setNumber(Number(e.target.value))}>
                {options.map((n) => (
                  <option key={n} value={n}>
                    {n === 37 ? '00' : n}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className={s.actions}>
          <button onClick={() => add()}>Add selected bet</button>
          <button className={s.primary} onClick={spin}>
            Spin & settle all bets
          </button>
          <button
            onClick={() => {
              setChips([]);
              setPocket(null);
              setHistory([]);
            }}
          >
            Clear bets
          </button>
          <button
            onClick={() => {
              rng.current = null;
              setBalance(1000);
              setHistory([]);
              setMessage('Balance and random sequence reset.');
            }}
          >
            Reset balance & sequence
          </button>
        </div>
        <p role="status" className={s.outcomeLine}>
          {message}
        </p>
        {error && <p role="alert">{error}</p>}
        {chips.length > 0 && (
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
                  <th>Stake</th>
                  <th>Last spin net</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {chips.map((c, i) => (
                  <tr key={i}>
                    <td>
                      {bets.find((b) => b.value === c.bet)?.label}
                      {['straight', 'split', 'street', 'corner', 'six-line'].includes(c.bet)
                        ? ` · ${c.number === 37 ? '00' : c.number}`
                        : ''}
                    </td>
                    <td>{fmt(c.stake * (c.bet === 'two-columns' ? 2 : 1))}</td>
                    <td>{pocket === null ? '—' : fmt(portfolioNet(pocket, [c], partage)[0])}</td>
                    <td>
                      <button
                        aria-label={`Remove bet ${i + 1}`}
                        onClick={() => {
                          setPocket(null);
                          setChips((cs) => cs.filter((_, j) => i !== j));
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Metrics
          items={[
            ['Balance', fmt(balance)],
            ['Total stake / spin', fmt(total)],
            ['Expected net / spin', fmt(ev)],
            ['Chance of net profit', pct(nets.filter((n) => n > 0).length / wheel)],
            ['Combined house edge', total ? pct(-ev / total) : '—'],
          ]}
        />
        {chips.length > 0 && (
          <Distribution
            rows={[...distribution]
              .sort(([a], [b]) => a - b)
              .map(([net, count]) => ({ label: `Net ${fmt(net)}`, probability: count / wheel }))}
          />
        )}
        <p className={s.note}>
          Coverage is not the same as profit: a winning chip can be outweighed by other losing
          chips. La partage applies only to Red/Black, Odd/Even and Low/High when zero lands. No en
          prison, American basket or triple-zero wheel. “Two columns” uses two equal chips.
        </p>
        <details>
          <summary>Replay: last 20 spins</summary>
          <ol className={s.steps}>
            {history.map((r, i) => (
              <li key={i}>
                Pocket {r.pocket === 37 ? '00' : r.pocket}: net {fmt(r.net)}; balance{' '}
                {fmt(r.balance)}.
              </li>
            ))}
          </ol>
        </details>
      </div>
      {chips.length > 0 && (
        <Experiment
          key={JSON.stringify([wheel, partage, chips])}
          defaults={{ game: 'roulette', wheel, chips, partage, stake: total }}
        />
      )}
    </section>
  );
}
