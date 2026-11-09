'use client';
import { useRef, useState } from 'react';
import { draw, seeded, shoe } from '../../../../lib/casino/cards';
import { warRank } from '../../../../lib/casino/table-games';
import { Cards, fmt, Metrics, NumberField } from './shared';
import Experiment from './experiment';
import s from './lab.module.css';
export default function CasinoWar() {
  const [player, setPlayer] = useState<number[]>([]),
    [dealer, setDealer] = useState<number[]>([]),
    [tied, setTied] = useState(false),
    [stake, setStake] = useState(10),
    [seed, setSeed] = useState(42),
    [sequence, setSequence] = useState(0),
    [balance, setBalance] = useState(1000),
    [message, setMessage] = useState('Higher rank wins; aces are high.'),
    [error, setError] = useState(''),
    [warEv, setWarEv] = useState<number | null>(null),
    [policy, setPolicy] = useState(true),
    [tiePayout, setTiePayout] = useState(2);
  const deck = useRef<number[]>([]);
  function deal() {
    if (
      !Number.isInteger(seed) ||
      seed < 0 ||
      seed > 4294967295 ||
      !Number.isFinite(stake) ||
      stake <= 0 ||
      stake * 2 > balance
    ) {
      setError('Use a whole seed and cover two stakes in case of war.');
      return;
    }
    deck.current = shoe(6, seeded(seed + sequence));
    setSequence((v) => v + 1);
    const p = draw(deck.current),
      d = draw(deck.current);
    setPlayer([p]);
    setDealer([d]);
    const net = warRank(p) > warRank(d) ? 1 : warRank(p) < warRank(d) ? -1 : 0;
    setTied(net === 0);
    setError('');
    setWarEv(null);
    if (net) {
      setBalance((v) => v + stake * net);
      setMessage(`Higher card ${net > 0 ? 'wins' : 'loses'}: net ${fmt(stake * net)}.`);
    } else {
      const counts = Array<number>(15).fill(0);
      deck.current.forEach((c) => counts[warRank(c)]++);
      let ev = 0;
      const n = deck.current.length;
      for (let a = 2; a <= 14; a++)
        for (let b = 2; b <= 14; b++) {
          const p = (counts[a] * (counts[b] - (a === b ? 1 : 0))) / (n * (n - 1));
          ev += p * (a === b ? tiePayout : a > b ? 1 : -2);
        }
      setWarEv(ev);
      setMessage('Tie: surrender half the initial stake, or add an equal stake to go to war.');
    }
  }
  function settle(war: boolean) {
    let net = -0.5;
    if (war) {
      draw(deck.current);
      draw(deck.current);
      draw(deck.current);
      const p = draw(deck.current),
        d = draw(deck.current);
      setPlayer((v) => [...v, p]);
      setDealer((v) => [...v, d]);
      net = warRank(p) === warRank(d) ? tiePayout : warRank(p) > warRank(d) ? 1 : -2;
    }
    setBalance((v) => v + stake * net);
    setTied(false);
    setMessage(`${war ? 'War' : 'Surrender'} settled: net ${fmt(stake * net)} units.`);
  }
  return (
    <>
      <section className={s.table}>
        <p className={s.eyebrow}>PLAY · WHAT DOES A TIE COST?</p>
        <fieldset disabled={tied}>
          <div className={s.grid}>
            <label>
              Second tie: war wager net payout
              <select
                value={tiePayout}
                onChange={(e) => {
                  setTiePayout(Number(e.target.value));
                  setWarEv(null);
                }}
              >
                <option value={2}>2:1 (Massachusetts rules)</option>
                <option value={1}>1:1 (comparison variant)</option>
              </select>
            </label>
            <NumberField
              label="Initial stake (virtual units)"
              value={stake}
              onChange={setStake}
              min={1}
            />
            <NumberField
              label="Replay seed (after reset)"
              value={seed}
              onChange={setSeed}
              max={4294967295}
            />
          </div>
        </fieldset>
        <div className={s.split}>
          <div>
            <h2>Your cards</h2>
            <Cards cards={player} />
          </div>
          <div>
            <h2>Dealer cards</h2>
            <Cards cards={dealer} />
          </div>
        </div>
        <div className={s.actions}>
          <button className={s.primary} disabled={tied} onClick={deal}>
            Deal
          </button>
          {tied && (
            <>
              <button onClick={() => settle(false)}>Surrender half</button>
              <button onClick={() => settle(true)}>Go to war</button>
            </>
          )}
          <button
            onClick={() => {
              setTied(false);
              setBalance(1000);
              setSequence(0);
              setPlayer([]);
              setDealer([]);
              setWarEv(null);
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
            ['War exposure', `${fmt(2 * stake)} units`],
          ]}
        />
      </section>
      <section className={s.panel}>
        <h2>Follow the original and additional stake</h2>
        <p>
          On an initial tie, surrender loses half a stake. Going to war adds one equal wager. Three
          cards are burned, then each side receives another card. Win at war: the original wager
          pushes and the extra wager wins, for net +1 initial unit. On a second tie, the original
          wager pushes and the extra wager pays the selected rate. Lose at war: both wagers lose,
          for net −2.
        </p>
        {warEv !== null && (
          <Metrics
            items={[
              ['Surrender net / initial unit', '-0.5'],
              ['War expected net after this tie', fmt(warEv)],
            ]}
          />
        )}
        <p className={s.note}>
          The default second-tie payout is 2:1, matching the linked Massachusetts rules. A 1:1
          comparison variant is available above. The tie calculation enumerates rank pairs remaining
          in the six-deck shoe; unobserved burn cards do not change their marginal probabilities.
          Each new initial deal uses a fresh six-deck shoe.
        </p>
        <label>
          Simulation policy after a tie
          <select value={String(policy)} onChange={(e) => setPolicy(e.target.value === 'true')}>
            <option value="true">Always go to war</option>
            <option value="false">Always surrender</option>
          </select>
        </label>
      </section>
      <Experiment
        key={`${policy}-${tiePayout}`}
        defaults={{ game: 'casino-war', war: policy, warTiePayout: tiePayout }}
      />
    </>
  );
}
