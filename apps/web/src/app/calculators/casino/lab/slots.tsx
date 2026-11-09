'use client';
import { useRef, useState } from 'react';
import { seeded, type Random } from '../../../../lib/casino/cards';
import {
  defaultSlotPays,
  defaultWeights,
  slotOutcomes,
  slotSpin,
  slotSymbols,
} from '../../../../lib/casino/table-games';
import { Distribution, fmt, Metrics, NumberField, pct } from './shared';
import Experiment from './experiment';
import s from './lab.module.css';
export default function Slots() {
  const [weights, setWeights] = useState([...defaultWeights]),
    [pays, setPays] = useState([...defaultSlotPays]),
    [symbols, setSymbols] = useState([0, 1, 2]),
    [seed, setSeed] = useState(42),
    [stake, setStake] = useState(1),
    [balance, setBalance] = useState(1000),
    [spins, setSpins] = useState(0),
    [grossTotal, setGrossTotal] = useState(0),
    [turnover, setTurnover] = useState(0),
    [message, setMessage] = useState('Build a small reel game and compare observed returns.'),
    [error, setError] = useState('');
  const rng = useRef<Random | null>(null),
    valid =
      weights.every((n) => Number.isInteger(n) && n >= 0 && n <= 100) &&
      weights.some((n) => n > 0) &&
      pays.every((n) => Number.isFinite(n) && n >= 0 && n <= 1e6);
  const outcomes = valid ? slotOutcomes(weights, pays) : [],
    rtp = outcomes.reduce((n, o) => n + o.probability * o.gross, 0),
    hit = outcomes.filter((o) => o.gross > 0).reduce((n, o) => n + o.probability, 0),
    variance = outcomes.reduce((n, o) => n + o.probability * (o.gross - rtp) ** 2, 0),
    totalWeight = weights.reduce((a, b) => a + b, 0);
  function reset() {
    rng.current = null;
    setBalance(1000);
    setSpins(0);
    setGrossTotal(0);
    setTurnover(0);
    setMessage('Session reset for this reel design.');
  }
  function spin() {
    if (
      !valid ||
      !Number.isInteger(seed) ||
      seed < 0 ||
      seed > 4294967295 ||
      !Number.isFinite(stake) ||
      stake <= 0 ||
      stake > balance
    ) {
      setError(
        'Use whole nonnegative weights with a positive total, valid payouts, a whole seed and a covered positive stake.',
      );
      return;
    }
    rng.current ??= seeded(seed);
    const r = slotSpin(weights, pays, rng.current),
      net = stake * (r.gross - 1);
    setSymbols(r.symbols);
    setBalance((v) => v + net);
    setSpins((v) => v + 1);
    setGrossTotal((v) => v + r.gross * stake);
    setTurnover((v) => v + stake);
    setMessage(
      `${r.symbols.map((i) => slotSymbols[i]).join(' · ')}: ${r.gross}× gross, ${fmt(net)} net.`,
    );
    setError('');
  }
  return (
    <>
      <section className={s.table}>
        <p className={s.eyebrow}>PLAY · DESIGN YOUR OWN REELS</p>
        <div className={s.reels}>
          {symbols.map((n, i) => (
            <span key={i}>{slotSymbols[n]}</span>
          ))}
        </div>
        <div className={s.grid}>
          <NumberField label="Stake (virtual units)" value={stake} onChange={setStake} min={1} />
          <NumberField
            label="Replay seed (after reset)"
            value={seed}
            onChange={setSeed}
            max={4294967295}
          />
        </div>
        <div className={s.actions}>
          <button className={s.primary} onClick={spin}>
            Spin reels
          </button>
          <button onClick={reset}>Reset session</button>
        </div>
        <p role="status" className={s.outcomeLine}>
          {message}
        </p>
        {error && <p role="alert">{error}</p>}
        <Metrics
          items={[
            ['Virtual balance', fmt(balance)],
            ['Spins', String(spins)],
            ['Observed gross / turnover', turnover ? pct(grossTotal / turnover) : '—'],
          ]}
        />
      </section>
      <section className={s.panel}>
        <p className={s.eyebrow}>EXPLAIN · WEIGHT IS NOT THE PAYOUT</p>
        <h2>Change the machine’s mathematics</h2>
        <p>
          Three independent identical reels, one payline, three matching symbols required. Weight
          controls how often a symbol appears on each reel. A payout is the gross return including
          the stake.
        </p>
        <div className={s.scroll} tabIndex={0} role="region" aria-label="Scrollable results table">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Weight / reel</th>
                <th>Three-match gross payout</th>
              </tr>
            </thead>
            <tbody>
              {slotSymbols.map((label, i) => (
                <tr key={label}>
                  <th>{label}</th>
                  <td>
                    <NumberField
                      label={`${label} weight`}
                      value={weights[i]}
                      max={100}
                      onChange={(n) => {
                        setWeights((w) => w.map((v, j) => (i === j ? n : v)));
                        reset();
                      }}
                    />
                  </td>
                  <td>
                    <NumberField
                      label={`${label} gross payout`}
                      value={pays[i]}
                      onChange={(n) => {
                        setPays((p) => p.map((v, j) => (i === j ? n : v)));
                        reset();
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!valid ? (
          <p role="alert">
            Weights must be whole numbers from 0–100, at least one positive; gross payouts must be
            0–1,000,000.
          </p>
        ) : (
          <>
            <Metrics
              items={[
                ['Theoretical return (RTP)', pct(rtp)],
                ['House edge', pct(1 - rtp)],
                ['Paying spin chance', pct(hit)],
                ['Gross return std. deviation', fmt(Math.sqrt(variance))],
              ]}
            />
            <Distribution
              rows={slotSymbols.map((label, i) => ({
                label,
                probability: (weights[i] / totalWeight) ** 3,
              }))}
            />
            <p>
              RTP = Σ [(symbol weight ÷ total weight)³ × gross payout]. A paying spin can return
              less than the stake. RTP above 100% is possible in your hypothetical design; it does
              not describe an available commercial machine.
            </p>
          </>
        )}
        <p className={s.note}>
          This is an original teaching model, not a reproduction of a commercial slot. No bonus
          rounds, wilds, near-miss weighting, jackpots or casino recommendations. Theoretical return
          is a long-run mean, not a promised session result.
        </p>
      </section>
      {valid && (
        <Experiment
          key={JSON.stringify([weights, pays])}
          defaults={{ game: 'slots', weights, pays }}
        />
      )}
    </>
  );
}
