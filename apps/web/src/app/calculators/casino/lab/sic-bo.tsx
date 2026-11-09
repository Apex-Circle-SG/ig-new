'use client';
import { useRef, useState } from 'react';
import { seeded, type Random } from '../../../../lib/casino/cards';
import { diceOutcomes, rollDice, sicBets, sicNet } from '../../../../lib/casino/table-games';
import { Dice, fmt, Metrics, NumberField, pct } from './shared';
import Experiment from './experiment';
import s from './lab.module.css';
export default function SicBo() {
  const [id, setId] = useState('small'),
    [payout, setPayout] = useState(1),
    [dice, setDice] = useState([1, 2, 3]),
    [seed, setSeed] = useState(42),
    [stake, setStake] = useState(10),
    [balance, setBalance] = useState(1000),
    [message, setMessage] = useState('Choose a bet on the table.'),
    [error, setError] = useState('');
  const rng = useRef<Random | null>(null),
    bet = sicBets.find((b) => b.id === id)!,
    nets = diceOutcomes.map((d) => sicNet(d, bet, payout)),
    valid = Number.isFinite(payout) && payout >= 0 && payout <= 1e6,
    wins = nets.filter((n) => n >= 0).length,
    ev = nets.reduce((a, b) => a + b, 0) / 216;
  function choose(next: string) {
    const b = sicBets.find((b) => b.id === next)!;
    setId(next);
    setPayout(b.payout);
  }
  function roll() {
    if (
      !valid ||
      !Number.isFinite(stake) ||
      stake <= 0 ||
      stake > balance ||
      !Number.isInteger(seed) ||
      seed < 0 ||
      seed > 4294967295
    ) {
      setError('Use a valid payout, positive stake within the balance and a whole replay seed.');
      return;
    }
    rng.current ??= seeded(seed);
    const d = rollDice(rng.current, 3),
      net = stake * sicNet(d, bet, payout);
    setDice(d);
    setBalance((b) => b + net);
    setMessage(
      `${d.join(' + ')} = ${d.reduce((a, b) => a + b, 0)} · ${bet.label} · net ${fmt(net)}`,
    );
    setError('');
  }
  return (
    <>
      <section className={s.table}>
        <p className={s.eyebrow}>PLAY · THREE DICE, 216 OUTCOMES</p>
        <h2>Place a virtual bet</h2>
        {[
          [
            'Main bets',
            sicBets.filter((b) => ['small', 'big', 'odd', 'even', 'any-triple'].includes(b.kind)),
          ],
          ['Totals', sicBets.filter((b) => b.kind === 'total')],
          [
            'Faces & combinations',
            sicBets.filter((b) => ['single', 'double', 'triple', 'pair'].includes(b.kind)),
          ],
        ].map(([label, items]) => (
          <details key={label as string} open={label === 'Main bets'}>
            <summary>{label as string}</summary>
            <div className={s.betGrid}>
              {(items as typeof sicBets).map((b) => (
                <button key={b.id} aria-pressed={id === b.id} onClick={() => choose(b.id)}>
                  {b.label}
                </button>
              ))}
            </div>
          </details>
        ))}
        <Dice values={dice} />
        <div className={s.grid}>
          <NumberField
            label="Net payout per unit (editable)"
            value={payout}
            onChange={setPayout}
            step={0.01}
          />
          <NumberField label="Stake (virtual units)" value={stake} onChange={setStake} min={1} />
          <NumberField
            label="Replay seed (after reset)"
            value={seed}
            onChange={setSeed}
            max={4294967295}
          />
        </div>
        <div className={s.actions}>
          <button className={s.primary} onClick={roll}>
            Roll three dice
          </button>
          <button
            onClick={() => {
              rng.current = null;
              setBalance(1000);
              setMessage('Balance and random sequence reset.');
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
            ['Balance', fmt(balance)],
            ['Winning combinations', `${wins} / 216`],
            ['Win chance', valid ? pct(wins / 216) : '—'],
            ['House edge', valid ? pct(-ev) : '—'],
          ]}
        />
      </section>
      <section className={s.panel}>
        <p className={s.eyebrow}>EXPLAIN · COUNT THE POSSIBILITIES</p>
        <h2>Which dice combinations win?</h2>
        <p>
          Every ordered result is equally likely. Highlighted combinations win for{' '}
          <strong>{bet.label}</strong>. Small, Big, Odd and Even lose on triples. A specific double
          includes the matching triple. Single-face bets pay once, twice or three times the
          displayed payout when that face appears one, two or three times.
        </p>
        <div
          className={s.outcomes}
          tabIndex={0}
          role="region"
          aria-label="All 216 ordered dice results"
        >
          {diceOutcomes.map((d, i) => (
            <span className={nets[i] >= 0 ? s.wins : ''} key={i}>
              {d.join('·')}
            </span>
          ))}
        </div>
        <p>
          Expected net per unit = sum of the net returns across all 216 results ÷ 216 ={' '}
          <strong>{valid ? fmt(ev) : '—'}</strong>.{' '}
          {bet.kind === 'single'
            ? 'Each winning outcome has its own return, so one flat payout cannot describe this bet.'
            : `Break-even net payout: ${fmt(216 / wins - 1)}:1.`}
        </p>
        <p className={s.note}>
          Payouts are an illustrative editable table, not a claim about every casino. The default
          specific triple pays 150:1 and any triple 30:1. Compare the exact table in front of you.
          Net payouts exclude returned stake.
        </p>
      </section>
      {valid && (
        <Experiment
          key={`${id}-${payout}`}
          defaults={{ game: 'sic-bo', sicBet: id, sicPayout: payout }}
        />
      )}
    </>
  );
}
