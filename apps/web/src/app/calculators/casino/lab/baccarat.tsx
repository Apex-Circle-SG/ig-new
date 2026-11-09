'use client';
import { useRef, useState } from 'react';
import { seeded, shoe } from '../../../../lib/casino/cards';
import {
  baccaratCounts,
  baccaratNet,
  baccaratOdds,
  baccaratRound,
  baccaratTotal,
  baccaratValue,
  bankerDraw,
  type BaccaratBet,
  type BaccaratRule,
} from '../../../../lib/casino/baccarat';
import {
  CalculationStatus,
  Cards,
  Distribution,
  fmt,
  Metrics,
  NumberField,
  pct,
  useCalculation,
} from './shared';
import Experiment from './experiment';
import s from './lab.module.css';
export default function Baccarat() {
  const [decks, setDecks] = useState(8),
    [seed, setSeed] = useState(42),
    [bet, setBet] = useState<BaccaratBet>('Banker'),
    [rule, setRule] = useState<BaccaratRule>('commission'),
    [tie, setTie] = useState(8),
    [stake, setStake] = useState(10),
    [balance, setBalance] = useState(1000),
    [round, setRound] = useState<ReturnType<typeof baccaratRound> | null>(null),
    [stage, setStage] = useState(0),
    [settledNet, setSettledNet] = useState(0),
    [left, setLeft] = useState(416),
    [counts, setCounts] = useState(baccaratCounts(8)),
    [p, setP] = useState(4),
    [b, setB] = useState(6),
    [third, setThird] = useState(6),
    [pThird, setPThird] = useState(true),
    [error, setError] = useState('');
  const cards = useRef<number[] | null>(null),
    calc = useCalculation<ReturnType<typeof baccaratOdds>>();
  const active = round !== null && stage < 3;
  function reset() {
    if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
      setError('Use a whole replay seed from 0 to 4,294,967,295.');
      return;
    }
    cards.current = shoe(decks, seeded(seed));
    setRound(null);
    setStage(0);
    setBalance(1000);
    setLeft(cards.current.length);
    setError('');
  }
  function deal() {
    if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
      setError('Use a whole replay seed from 0 to 4,294,967,295.');
      return;
    }
    if (!Number.isFinite(stake) || stake <= 0 || stake > balance || stake > 1e6) {
      setError('Enter a positive stake within your virtual balance.');
      return;
    }
    if (!cards.current) cards.current = shoe(decks, seeded(seed));
    if (cards.current.length < 6) {
      setError('Start a fresh shoe; fewer than six cards remain.');
      return;
    }
    setRound(baccaratRound(cards.current));
    setStage(1);
    setError('');
  }
  function reveal() {
    if (!round) return;
    if (stage === 2) {
      setSettledNet(stake * baccaratNet(round.winner, bet, round.bankerTotal, rule, tie));
      setBalance((v) => v + stake * baccaratNet(round.winner, bet, round.bankerTotal, rule, tie));
      setLeft(cards.current!.length);
    }
    setStage((v) => v + 1);
  }
  const net = settledNet;
  const natural = p >= 8 || b >= 8;
  const draw = !natural && bankerDraw(b, pThird ? third : null);
  return (
    <>
      <section className={s.panel}>
        <div className={s.grid}>
          <label>
            Decks
            <select
              value={decks}
              disabled={active}
              onChange={(e) => {
                const n = Number(e.target.value);
                setDecks(n);
                setCounts(baccaratCounts(n));
                calc.cancel();
                cards.current = null;
                setRound(null);
                setLeft(n * 52);
              }}
            >
              {[1, 6, 8].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <NumberField
            label="Replay seed (new shoe)"
            value={seed}
            onChange={setSeed}
            max={4294967295}
          />
          <label>
            Rules
            <select
              disabled={active}
              value={rule}
              onChange={(e) => setRule(e.target.value as BaccaratRule)}
            >
              <option value="commission">Banker win: 5% commission</option>
              <option value="super-six">Super 6: Banker 6 pays half</option>
            </select>
          </label>
          <label>
            Tie net payout
            <select disabled={active} value={tie} onChange={(e) => setTie(Number(e.target.value))}>
              <option value={8}>8:1</option>
              <option value={9}>9:1</option>
            </select>
          </label>
        </div>
      </section>
      <section className={s.table}>
        <p className={s.eyebrow}>PLAY · A SHOE YOU CAN FOLLOW</p>
        <h2>Deal a hand, reveal each decision</h2>
        <div className={s.actions}>
          {(['Banker', 'Player', 'Tie'] as const).map((v) => (
            <button
              key={v}
              aria-pressed={bet === v}
              className={bet === v ? s.selected : ''}
              disabled={active}
              onClick={() => setBet(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <fieldset disabled={active}>
          <NumberField
            label="Stake (virtual units)"
            value={stake}
            onChange={setStake}
            min={0.01}
            step={0.01}
          />
        </fieldset>
        <div className={s.split}>
          <div>
            <h3>
              Player{' '}
              {round && `· ${baccaratTotal(stage >= 2 ? round.player : round.player.slice(0, 2))}`}
            </h3>
            <Cards cards={round ? (stage >= 2 ? round.player : round.player.slice(0, 2)) : []} />
          </div>
          <div>
            <h3>
              Banker{' '}
              {round && `· ${baccaratTotal(stage >= 3 ? round.banker : round.banker.slice(0, 2))}`}
            </h3>
            <Cards cards={round ? (stage >= 3 ? round.banker : round.banker.slice(0, 2)) : []} />
          </div>
        </div>
        <div className={s.actions}>
          <button className={s.primary} disabled={active || balance < stake} onClick={deal}>
            Deal next hand
          </button>
          {active && (
            <button onClick={reveal}>
              {stage === 1 ? 'Apply Player rule' : 'Apply Banker rule & settle'}
            </button>
          )}
          <button disabled={active} onClick={reset}>
            New shoe & reset balance
          </button>
        </div>
        <div role="status" className={s.outcomeLine}>
          {stage === 3 && round
            ? `${round.winner} · net ${fmt(net)} virtual units`
            : active
              ? 'Reveal each drawing decision to settle the hand.'
              : 'Choose a bet and deal.'}
        </div>
        {error && <p role="alert">{error}</p>}
        <Metrics
          items={[
            ['Virtual balance', fmt(balance)],
            ['Cards after settled hand', String(left)],
            ['Bet', bet],
          ]}
        />
        {round && (
          <ol className={s.steps}>
            {round.steps.slice(0, stage === 1 ? 1 : stage === 2 ? 2 : undefined).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        )}
      </section>
      <section className={s.panel}>
        <p className={s.eyebrow}>EXPLAIN · BANKER’S THIRD CARD</p>
        <h2>Why does Banker draw?</h2>
        <p>
          Totals use only the last digit. Aces count 1; tens and face cards count 0. A natural 8 or
          9 stops both hands before any third card.
        </p>
        <div className={s.grid}>
          <label>
            Player initial total
            <select
              value={p}
              onChange={(e) => {
                const v = Number(e.target.value);
                setP(v);
                setPThird(v <= 5);
              }}
            >
              {Array.from({ length: 10 }, (_, n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Banker initial total
            <select value={b} onChange={(e) => setB(Number(e.target.value))}>
              {Array.from({ length: 10 }, (_, n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Player third-card point
            <select
              disabled={p >= 6}
              value={third}
              onChange={(e) => setThird(Number(e.target.value))}
            >
              {Array.from({ length: 10 }, (_, n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        <p className={s.note}>
          <strong>
            {natural
              ? 'Natural: neither hand draws.'
              : `Player ${p <= 5 ? 'draws' : 'stands'}. Banker ${draw ? 'draws' : 'stands'}.`}
          </strong>{' '}
          {!natural &&
            `Initial Banker total ${b}; ${pThird ? `Player third-card point ${third}` : 'Player has no third card'}.`}
        </p>
        <div className={s.scroll} tabIndex={0} role="region" aria-label="Scrollable results table">
          <table>
            <caption>Banker drawing map — only when neither initial hand is a natural</caption>
            <thead>
              <tr>
                <th>Banker</th>
                <th>No Player draw</th>
                {Array.from({ length: 10 }, (_, v) => (
                  <th key={v}>{v}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }, (_, v) => (
                <tr key={v}>
                  <th>{v}</th>
                  {[null, ...Array.from({ length: 10 }, (_, i) => i)].map((t, i) => (
                    <td
                      key={i}
                      className={
                        !natural && v === b && (pThird ? t === third : t === null)
                          ? s.ruleActive
                          : ''
                      }
                    >
                      {bankerDraw(v, t) ? 'Draw' : 'Stand'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className={s.panel}>
        <p className={s.eyebrow}>CALCULATE · EXACT FINITE SHOE</p>
        <h2>What remains changes the probabilities</h2>
        <p>
          Enter counts by card point, not rank. These calculate the next full hand before any cards
          are dealt. Editing counts creates a hypothetical shoe.
        </p>
        <div className={s.grid}>
          {counts.map((n, i) => (
            <NumberField
              key={i}
              label={`${i === 0 ? '0 (10, J, Q, K)' : i} points remaining`}
              value={n}
              max={416}
              onChange={(v) => {
                calc.cancel();
                setCounts((c) => c.map((x, j) => (j === i ? v : x)));
              }}
            />
          ))}
        </div>
        <div className={s.actions}>
          <button
            onClick={() => {
              calc.cancel();
              setCounts(baccaratCounts(decks));
            }}
          >
            Full {decks}-deck counts
          </button>
          <button
            disabled={active}
            onClick={() => {
              calc.cancel();
              const c = Array<number>(10).fill(0);
              (cards.current ?? shoe(decks, seeded(seed))).forEach(
                (card) => c[baccaratValue(card)]++,
              );
              setCounts(c);
            }}
          >
            Use remaining play shoe
          </button>
          <button
            className={s.primary}
            disabled={calc.busy}
            onClick={() => calc.calculate({ kind: 'baccarat', counts })}
          >
            Calculate exact odds
          </button>
          {calc.busy && <button onClick={calc.cancel}>Cancel</button>}
        </div>
        <CalculationStatus {...calc} />
        {calc.value && (
          <>
            <Distribution
              rows={(['Banker', 'Player', 'Tie'] as const).map((label) => ({
                label,
                probability: calc.value![label],
              }))}
            />
            <Metrics
              items={[
                [
                  'Banker house edge',
                  pct(
                    -(rule === 'commission'
                      ? 0.95 * calc.value.Banker
                      : calc.value.Banker - 0.5 * calc.value.bankerSix) + calc.value.Player,
                  ),
                ],
                ['Player house edge', pct(calc.value.Banker - calc.value.Player)],
                ['Tie house edge', pct(1 - (tie + 1) * calc.value.Tie)],
              ]}
            />
            <p>
              Banker and Player bets push on a tie. Expected net per unit: Banker = winning Banker
              returns − Player wins; Player = Player wins − Banker wins; Tie = {tie} × Tie − (1 −
              Tie). A negative displayed house edge means an advantage for this hypothetical
              composition.
            </p>
          </>
        )}
      </section>
      <Experiment
        key={`${bet}-${rule}-${tie}`}
        defaults={{ game: 'baccarat', baccaratBet: bet, baccaratRule: rule, tiePayout: tie }}
      />
    </>
  );
}
