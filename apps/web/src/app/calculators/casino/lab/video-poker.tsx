'use client';
import { useState } from 'react';
import { draw, seeded, shoe } from '../../../../lib/casino/cards';
import {
  analyzeHolds,
  paytables,
  pokerCategories,
  pokerCategory,
} from '../../../../lib/casino/poker';
import {
  CalculationStatus,
  CardEditor,
  Cards,
  fmt,
  Metrics,
  NumberField,
  pct,
  useCalculation,
} from './shared';
import s from './lab.module.css';
import Experiment from './experiment';
export default function VideoPoker() {
  const [cards, setCards] = useState([0, 9, 10, 11, 12]),
    [held, setHeld] = useState<number[]>([]),
    [table, setTable] = useState<keyof typeof paytables>('9/6'),
    [seed, setSeed] = useState(42),
    [sequence, setSequence] = useState(0),
    [stake, setStake] = useState(5),
    [balance, setBalance] = useState(1000),
    [phase, setPhase] = useState<'ready' | 'draw' | 'done'>('ready'),
    [message, setMessage] = useState('Start a deal, or edit a hypothetical five-card hand.'),
    [error, setError] = useState('');
  const calc = useCalculation<ReturnType<typeof analyzeHolds>>(),
    unique = new Set(cards).size === 5;
  function deal() {
    if (
      !Number.isInteger(seed) ||
      seed < 0 ||
      seed > 4294967295 ||
      !Number.isFinite(stake) ||
      stake <= 0 ||
      stake > balance ||
      stake > 1e6
    ) {
      setError('Use a whole seed and a positive stake within the balance.');
      return;
    }
    const deck = shoe(1, seeded(seed + sequence));
    calc.cancel();
    setCards(Array.from({ length: 5 }, () => draw(deck)));
    setSequence((v) => v + 1);
    setHeld([]);
    setPhase('draw');
    setMessage('Select cards to hold, then draw once.');
    setError('');
  }
  function replace() {
    const deck = shoe(1, seeded(seed + sequence + 100000)).filter((c) => !cards.includes(c));
    const next = cards.map((c, i) => (held.includes(i) ? c : draw(deck)));
    const gross = paytables[table][pokerCategory(next)],
      net = stake * (gross - 1);
    setCards(next);
    setBalance((b) => b + net);
    setMessage(
      `${pokerCategories[pokerCategory(next)]}: ${gross}:1 gross return, net ${fmt(net)} units.`,
    );
    setPhase('done');
    calc.cancel();
  }
  return (
    <>
      <section className={s.table}>
        <p className={s.eyebrow}>PLAY · HOLD, DRAW, COMPARE</p>
        <h2>Jacks or Better</h2>
        <fieldset disabled={phase === 'draw'}>
          <div className={s.grid}>
            <label>
              Paytable
              <select
                value={table}
                onChange={(e) => {
                  calc.cancel();
                  setTable(e.target.value as keyof typeof paytables);
                }}
              >
                <option>9/6</option>
                <option>8/5</option>
              </select>
            </label>
            <NumberField label="Stake (virtual units)" value={stake} onChange={setStake} min={1} />
            <NumberField
              label="Replay seed (after reset)"
              value={seed}
              onChange={setSeed}
              max={4294967295}
            />
          </div>
        </fieldset>
        <Cards
          cards={cards}
          held={held}
          onHold={
            phase === 'draw'
              ? (i) => setHeld((h) => (h.includes(i) ? h.filter((v) => v !== i) : [...h, i]))
              : undefined
          }
        />
        <div className={s.actions}>
          <button className={s.primary} disabled={phase === 'draw'} onClick={deal}>
            Deal five cards
          </button>
          <button disabled={phase !== 'draw' || !unique} onClick={replace}>
            Draw replacements
          </button>
          <button
            onClick={() => {
              calc.cancel();
              setBalance(1000);
              setPhase('ready');
              setSequence(0);
              setMessage('Balance and sequence reset.');
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
            ['Cards held', String(held.length)],
            ['Current hand', pokerCategories[pokerCategory(cards)]],
          ]}
        />
      </section>
      <section className={s.panel}>
        <p className={s.eyebrow}>CALCULATE · EVERY POSSIBLE HOLD</p>
        <h2>Find the strongest hold for these five cards</h2>
        <p>
          Compare all 32 hold patterns by enumerating every legal replacement combination from the
          other 47 cards. Discarded cards cannot return.
        </p>
        <details>
          <summary>Edit a hypothetical hand</summary>
          <p>Changing cards leaves play mode and creates a calculation-only scenario.</p>
          <CardEditor
            cards={cards}
            onChange={(c) => {
              setCards(c);
              setHeld([]);
              setPhase('ready');
              calc.cancel();
              setMessage('Hypothetical hand — calculate holds or deal a fresh playable hand.');
            }}
          />
        </details>
        {!unique && <p role="alert">Choose five distinct cards.</p>}
        <div className={s.actions}>
          <button
            className={s.primary}
            disabled={!unique || calc.busy}
            onClick={() => calc.calculate({ kind: 'holds', cards, table })}
          >
            Analyze all 32 holds
          </button>
          {calc.busy && <button onClick={calc.cancel}>Cancel</button>}
        </div>
        <CalculationStatus {...calc} />
        {calc.value && (
          <div
            className={s.scroll}
            tabIndex={0}
            role="region"
            aria-label="Scrollable results table"
          >
            <table>
              <caption>Sorted by expected gross return per unit staked</caption>
              <thead>
                <tr>
                  <th>Hold card positions</th>
                  <th>Gross return</th>
                  <th>Expected net</th>
                  <th>Paying hand</th>
                  <th>Combinations</th>
                  <th>Try</th>
                </tr>
              </thead>
              <tbody>
                {calc.value.map((r) => (
                  <tr key={r.mask}>
                    <td>
                      {cards
                        .map((_, i) => (r.mask & (1 << i) ? i + 1 : null))
                        .filter(Boolean)
                        .join(', ') || 'Discard all'}
                    </td>
                    <td>{fmt(r.expectedReturn)}</td>
                    <td>{fmt(r.expectedReturn - 1)}</td>
                    <td>{pct(r.winChance)}</td>
                    <td>{r.combinations.toLocaleString()}</td>
                    <td>
                      <button
                        disabled={phase !== 'draw'}
                        onClick={() =>
                          setHeld(cards.map((_, i) => i).filter((i) => r.mask & (1 << i)))
                        }
                      >
                        Use hold
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <h3>Selected paytable</h3>
        <div className={s.scroll} tabIndex={0} role="region" aria-label="Scrollable results table">
          <table>
            <thead>
              <tr>
                <th>Hand</th>
                <th>Gross returned / stake</th>
              </tr>
            </thead>
            <tbody>
              {pokerCategories
                .slice(1)
                .reverse()
                .map((label, i) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td>{paytables[table][9 - i]}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className={s.note}>
          Gross return includes the stake: a high pair returns 1×, for zero net. Royal flush returns
          800× at the modeled maximum-credit ratio. This tool compares the current hand; it does not
          claim that the displayed conditional return is the whole game’s return-to-player. No wild
          cards, gamble feature or progressive jackpot.
        </p>
      </section>
      <Experiment key={table} defaults={{ game: 'video-poker', paytable: table }} />
    </>
  );
}
