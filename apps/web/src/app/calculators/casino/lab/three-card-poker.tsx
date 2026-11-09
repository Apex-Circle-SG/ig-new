'use client';
import { useState } from 'react';
import { combinations, draw, seeded, shoe } from '../../../../lib/casino/cards';
import { threeCategories, threeRank, threeSettle } from '../../../../lib/casino/poker';
import { CardEditor, Cards, fmt, Metrics, NumberField } from './shared';
import Experiment from './experiment';
import s from './lab.module.css';
export default function ThreeCardPoker() {
  const [player, setPlayer] = useState([11, 5, 3]),
    [dealer, setDealer] = useState<number[]>([]),
    [side, setSide] = useState(false),
    [stake, setStake] = useState(10),
    [seed, setSeed] = useState(42),
    [sequence, setSequence] = useState(0),
    [balance, setBalance] = useState(1000),
    [active, setActive] = useState(false),
    [message, setMessage] = useState('Deal to play; edit cards to analyze a hypothetical hand.'),
    [error, setError] = useState(''),
    [analysis, setAnalysis] = useState<{
      ev: number;
      qualify: number;
      win: number;
      count: number;
    } | null>(null);
  const unique = new Set(player).size === 3;
  function deal() {
    if (
      !Number.isInteger(seed) ||
      seed < 0 ||
      seed > 4294967295 ||
      !Number.isFinite(stake) ||
      stake <= 0 ||
      stake * (side ? 3 : 2) > balance
    ) {
      setError('Enter a whole seed and cover the potential Ante, Play and side stakes.');
      return;
    }
    const deck = shoe(1, seeded(seed + sequence));
    setPlayer([draw(deck), draw(deck), draw(deck)]);
    setDealer([draw(deck), draw(deck), draw(deck)]);
    setSequence((v) => v + 1);
    setActive(true);
    setAnalysis(null);
    setMessage('Choose Play (add one Ante) or Fold.');
    setError('');
  }
  function settle(play: boolean) {
    const r = threeSettle(player, dealer, play, side);
    setBalance((v) => v + stake * r.net);
    setActive(false);
    setMessage(
      `${play ? 'Play' : 'Fold'} · ${r.category}. Dealer ${r.dealerQualifies ? 'qualifies' : 'does not qualify'}. Ante/Play net ${fmt(stake * r.antePlay)}${side ? `, Pair Plus net ${fmt(stake * r.side)}` : ''}.`,
    );
  }
  function analyze() {
    let sum = 0,
      qualify = 0,
      win = 0,
      count = 0;
    const pool = Array.from({ length: 52 }, (_, i) => i).filter((c) => !player.includes(c));
    combinations(pool, 3, (d) => {
      count++;
      sum += threeSettle(player, d, true, false).net;
      if (threeRank(d).qualifies) qualify++;
      if (threeRank(player).score > threeRank(d).score) win++;
    });
    setAnalysis({ ev: sum / count, qualify: qualify / count, win: win / count, count });
  }
  return (
    <>
      <section className={s.table}>
        <p className={s.eyebrow}>PLAY · ANTE, PLAY & PAIR PLUS</p>
        <fieldset disabled={active}>
          <div className={s.grid}>
            <NumberField label="Ante (virtual units)" value={stake} onChange={setStake} min={1} />
            <NumberField
              label="Replay seed (after reset)"
              value={seed}
              onChange={setSeed}
              max={4294967295}
            />
            <label>
              Pair Plus side bet
              <select value={String(side)} onChange={(e) => setSide(e.target.value === 'true')}>
                <option value="false">None</option>
                <option value="true">One additional Ante</option>
              </select>
            </label>
          </div>
        </fieldset>
        <h2>Your cards · {threeCategories[threeRank(player).category]}</h2>
        <Cards cards={player} />
        <h3>Dealer</h3>
        <Cards cards={active ? [] : dealer} hidden={active} />
        <div className={s.actions}>
          <button className={s.primary} disabled={active} onClick={deal}>
            Deal three cards
          </button>
          <button disabled={!active} onClick={() => settle(true)}>
            Play
          </button>
          <button disabled={!active} onClick={() => settle(false)}>
            Fold
          </button>
          <button
            onClick={() => {
              setActive(false);
              setSequence(0);
              setBalance(1000);
              setDealer([]);
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
            ['Dealer qualification', 'Queen high or better'],
          ]}
        />
      </section>
      <section className={s.panel}>
        <p className={s.eyebrow}>CALCULATE · PLAY OR FOLD?</p>
        <h2>Compare every possible dealer hand</h2>
        <fieldset disabled={active}>
          <CardEditor
            cards={player}
            onChange={(c) => {
              setPlayer(c);
              setAnalysis(null);
              setDealer([]);
            }}
          />
        </fieldset>
        {!unique && <p role="alert">Choose three distinct cards.</p>}
        <div className={s.actions}>
          <button disabled={!unique || active} onClick={analyze}>
            Enumerate dealer hands
          </button>
        </div>
        {analysis && (
          <Metrics
            items={[
              ['Play expected net / Ante', fmt(analysis.ev)],
              ['Fold net / Ante', '-1'],
              ['Dealer qualifies', `${fmt(100 * analysis.qualify)}%`],
              ['Dealer hands', String(analysis.count)],
            ]}
          />
        )}
        <p>
          The Play comparison includes Ante bonus and excludes Pair Plus, which settles
          independently. Dealer fails to qualify: Ante wins 1:1, Play pushes. Qualifying dealer:
          both main wagers win, lose or push by hand comparison. Ante bonus pays on a played
          straight (1:1), trips (4:1) or straight flush (5:1), even when the dealer beats it.
        </p>
        <div className={s.scroll} tabIndex={0} role="region" aria-label="Scrollable results table">
          <table>
            <caption>Illustrative Pair Plus net payouts</caption>
            <thead>
              <tr>
                <th>Pair</th>
                <th>Flush</th>
                <th>Straight</th>
                <th>Trips</th>
                <th>Straight flush</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {[1, 3, 6, 30, 40].map((n) => (
                  <td key={n}>{n}:1</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className={s.note}>
          In three-card poker a straight beats a flush; A–2–3 is the lowest straight. Fold loses
          Ante, but this lab settles Pair Plus independently of that decision. Check the actual
          table’s side-bet and fold rules.
        </p>
      </section>
      <Experiment defaults={{ game: 'three-card-poker' }} />
    </>
  );
}
