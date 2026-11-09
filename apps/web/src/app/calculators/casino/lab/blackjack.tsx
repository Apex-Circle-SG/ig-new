'use client';
import { useRef, useState } from 'react';
import { draw, point, ranks, seeded, shoe } from '../../../../lib/casino/cards';
import {
  actionEstimates,
  blackjackActions,
  blackjackNet,
  dealerHits,
  hand,
  type BlackjackAction,
  type BlackjackRules,
} from '../../../../lib/casino/blackjack';
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
type PlayedHand = { cards: number[]; stake: number; split: boolean; done: boolean };
function parseRanks(text: string) {
  const tokens = text
    .toUpperCase()
    .split(/[\s,]+/)
    .filter(Boolean);
  return tokens.map((token) => {
    const n = ranks.map((r) => r.toUpperCase()).indexOf(token);
    if (n < 0) throw new Error(`Unknown card: ${token}. Use A, 2–10, J, Q or K.`);
    return n;
  });
}
export default function Blackjack() {
  const [rules, setRules] = useState<BlackjackRules>({
      decks: 6,
      hitSoft17: false,
      payout: 1.5,
      surrender: true,
    }),
    [seed, setSeed] = useState(42),
    [stake, setStake] = useState(10),
    [balance, setBalance] = useState(1000),
    [hands, setHands] = useState<PlayedHand[]>([]),
    [dealer, setDealer] = useState<number[]>([]),
    [active, setActive] = useState(-1),
    [remaining, setRemaining] = useState(312),
    [message, setMessage] = useState('Choose rules and deal a hand.'),
    [error, setError] = useState(''),
    [playerText, setPlayerText] = useState('10, 6'),
    [up, setUp] = useState(9),
    [removedText, setRemovedText] = useState(''),
    [peek, setPeek] = useState(true);
  const deck = useRef<number[] | null>(null),
    calc = useCalculation<{
      nextBust: number;
      dealer: number[];
      actions: ReturnType<typeof actionEstimates>;
    }>();
  const playing = active >= 0;
  function configure(next: BlackjackRules) {
    calc.cancel();
    setRules(next);
    setRemaining(next.decks * 52);
    deck.current = null;
    setHands([]);
    setDealer([]);
  }
  function settle(next: PlayedHand[], d: number[]) {
    if (next.some((h) => hand(h.cards).total <= 21 && h.stake > 0) && !hand(d).natural)
      while (dealerHits(d, rules.hitSoft17)) d.push(draw(deck.current!));
    const net = next.reduce(
      (n, h) =>
        n +
        (h.stake === 0 ? -stake / 2 : h.stake * blackjackNet(h.cards, d, rules.payout, h.split)),
      0,
    );
    setBalance((b) => b + net);
    setDealer(d);
    setHands(next);
    setActive(-1);
    setRemaining(deck.current!.length);
    setMessage(
      `Round settled: ${net >= 0 ? '+' : ''}${fmt(net)} virtual units. Dealer ${hand(d).total}.`,
    );
  }
  function deal() {
    if (
      !Number.isFinite(stake) ||
      stake <= 0 ||
      stake > balance ||
      stake > 1e6 ||
      !Number.isInteger(seed) ||
      seed < 0 ||
      seed > 4294967295
    ) {
      setError('Enter a positive stake within your balance and a whole replay seed.');
      return;
    }
    if (!deck.current || deck.current.length < 40) deck.current = shoe(rules.decks, seeded(seed));
    const p = [draw(deck.current)],
      d = [draw(deck.current)];
    p.push(draw(deck.current));
    d.push(draw(deck.current));
    const next = [{ cards: p, stake, split: false, done: false }];
    setError('');
    setHands(next);
    setDealer(d);
    setRemaining(deck.current.length);
    if (hand(p).natural || hand(d).natural) settle(next, d);
    else {
      setActive(0);
      setMessage('Your turn. Dealer has checked for blackjack when showing an ace or ten.');
    }
  }
  function act(action: BlackjackAction) {
    if (!playing || !deck.current) return;
    const next = hands.map((h) => ({ ...h, cards: [...h.cards] })),
      h = next[active];
    const committed = next.reduce((n, h) => n + h.stake, 0);
    if ((action === 'split' || action === 'double') && committed + h.stake > balance) {
      setError('Your balance cannot cover the additional stake.');
      return;
    }
    setError('');
    if (action === 'surrender') {
      h.stake = 0;
      h.done = true;
    }
    if (action === 'stand') h.done = true;
    if (action === 'hit') {
      h.cards.push(draw(deck.current));
      if (hand(h.cards).total >= 21) h.done = true;
    }
    if (action === 'double') {
      h.stake *= 2;
      h.cards.push(draw(deck.current));
      h.done = true;
    }
    if (action === 'split') {
      const a = h.cards[0],
        b = h.cards[1],
        aces = point(a) === 1;
      next.splice(
        active,
        1,
        { cards: [a, draw(deck.current)], stake: h.stake, split: true, done: aces },
        { cards: [b, draw(deck.current)], stake: h.stake, split: true, done: aces },
      );
    }
    next.forEach((h) => {
      if (hand(h.cards).total >= 21) h.done = true;
    });
    setRemaining(deck.current.length);
    const index = next.findIndex((h) => !h.done);
    if (index < 0) settle(next, [...dealer]);
    else {
      setHands(next);
      setActive(index);
    }
  }
  function analyze() {
    try {
      const p = parseRanks(playerText),
        removed = parseRanks(removedText);
      if (p.length < 2 || p.length > 10 || hand(p).total >= 21)
        throw new Error('Enter 2–10 player cards totalling less than 21.');
      calc.calculate({ kind: 'blackjack', player: p, up, removed, rules, peek, seed: 42 });
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <section className={s.panel}>
        <fieldset disabled={playing}>
          <div className={s.grid}>
            <label>
              Decks
              <select
                value={rules.decks}
                onChange={(e) => configure({ ...rules, decks: Number(e.target.value) })}
              >
                {[1, 6, 8].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              Dealer soft 17
              <select
                value={String(rules.hitSoft17)}
                onChange={(e) => configure({ ...rules, hitSoft17: e.target.value === 'true' })}
              >
                <option value="false">Stand (S17)</option>
                <option value="true">Hit (H17)</option>
              </select>
            </label>
            <label>
              Blackjack payout
              <select
                value={rules.payout}
                onChange={(e) => configure({ ...rules, payout: Number(e.target.value) })}
              >
                <option value={1.5}>3:2</option>
                <option value={1.2}>6:5</option>
              </select>
            </label>
            <label>
              Late surrender
              <select
                value={String(rules.surrender)}
                onChange={(e) => configure({ ...rules, surrender: e.target.value === 'true' })}
              >
                <option value="true">Allowed</option>
                <option value="false">Not offered</option>
              </select>
            </label>
            <NumberField label="Stake (virtual units)" value={stake} onChange={setStake} min={1} />
            <NumberField
              label="Replay seed (new shoe)"
              value={seed}
              onChange={setSeed}
              max={4294967295}
            />
          </div>
        </fieldset>
      </section>
      <section className={s.table}>
        <p className={s.eyebrow}>PLAY · MAKE THE DECISION</p>
        <h2>Dealer {dealer.length > 0 && !playing ? `· ${hand(dealer).total}` : ''}</h2>
        <Cards cards={playing ? dealer.slice(0, 1) : dealer} hidden={playing} />
        <div className={s.split}>
          {hands.map((h, i) => (
            <div key={i}>
              <h3>
                {hands.length > 1 ? `Hand ${i + 1}` : 'Your hand'} ·{' '}
                {hand(h.cards).soft ? 'soft' : 'hard'} {hand(h.cards).total}
                {playing && i === active ? ' · Your turn' : ''}
              </h3>
              <Cards cards={h.cards} />
              <p>
                {fmt(h.stake)} units committed{h.split ? ' · split hand' : ''}
                {hand(h.cards).total > 21 ? ' · bust' : ''}
              </p>
            </div>
          ))}
        </div>
        <div className={s.actions}>
          <button className={s.primary} disabled={playing || balance < stake} onClick={deal}>
            Deal hand
          </button>
          {playing &&
            blackjackActions(hands[active].cards, rules, hands[active].split).map((action) => (
              <button key={action} onClick={() => act(action)}>
                {action[0].toUpperCase() + action.slice(1)}
              </button>
            ))}
          <button
            disabled={playing}
            onClick={() => {
              deck.current = null;
              setRemaining(rules.decks * 52);
              setBalance(1000);
              setHands([]);
              setDealer([]);
              setMessage('Balance reset. Next deal starts a fresh shoe.');
            }}
          >
            Reset balance & shoe
          </button>
        </div>
        <p role="status" className={s.outcomeLine}>
          {message}
        </p>
        <Metrics
          items={[
            ['Virtual balance', fmt(balance)],
            ['Cards remaining', String(remaining)],
          ]}
        />
        <p className={s.note}>
          US hole-card peek; one split into two hands; double any initial two cards, including after
          splitting. Split aces receive one card each; split 21 pays 1:1. No insurance or
          resplitting. Surrender is available only on the original two-card hand after a successful
          dealer peek. A shoe is refreshed below 40 cards.
        </p>
      </section>
      <section className={s.panel}>
        <p className={s.eyebrow}>CALCULATE · THE DEALER’S HIDDEN CARD</p>
        <h2>Inspect a hand before choosing</h2>
        <p>
          This independent calculator uses the rules above. Enter known ranks from the selected
          shoe; the hidden dealer card remains unknown.
        </p>
        <div className={s.grid}>
          <label>
            Your cards (comma-separated)
            <input
              value={playerText}
              onChange={(e) => {
                calc.cancel();
                setPlayerText(e.target.value);
              }}
              placeholder="A, 6"
            />
          </label>
          <label>
            Dealer upcard
            <select
              value={up}
              onChange={(e) => {
                calc.cancel();
                setUp(Number(e.target.value));
              }}
            >
              {ranks.map((r, i) => (
                <option key={r} value={i}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label>
            Other exposed/removed cards
            <input
              value={removedText}
              onChange={(e) => {
                calc.cancel();
                setRemovedText(e.target.value);
              }}
              placeholder="Optional: 2, J, 5"
            />
          </label>
          <label>
            Dealer blackjack check
            <select
              value={String(peek)}
              onChange={(e) => {
                calc.cancel();
                setPeek(e.target.value === 'true');
              }}
            >
              <option value="true">Checked: no dealer blackjack</option>
              <option value="false">Before check</option>
            </select>
          </label>
        </div>
        <div className={s.actions}>
          <button className={s.primary} disabled={calc.busy} onClick={analyze}>
            Calculate dealer & actions
          </button>
          {calc.busy && <button onClick={calc.cancel}>Cancel</button>}
        </div>
        {error && <p role="alert">{error}</p>}
        <CalculationStatus {...calc} />
        {calc.value && (
          <>
            <Metrics items={[['Bust on your next card', pct(calc.value.nextBust)]]} />
            <h3>Exact dealer distribution</h3>
            <Distribution
              rows={['17', '18', '19', '20', '21 (not blackjack)', 'Bust', 'Blackjack'].map(
                (label, i) => ({ label, probability: calc.value!.dealer[i] }),
              )}
            />
            <h3>Sampled action comparison</h3>
            <div
              className={s.scroll}
              tabIndex={0}
              role="region"
              aria-label="Scrollable results table"
            >
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Expected net / original unit</th>
                    <th>Approx. 95% sampling margin</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.value.actions.map((a) => (
                    <tr key={a.action}>
                      <th>{a.action}</th>
                      <td>{fmt(a.ev)}</td>
                      <td>±{fmt(1.96 * a.se)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <p className={s.note}>
          Dealer probabilities enumerate draws without replacement. Action returns use 6,000 seeded
          samples per action, followed by a fixed policy: stand on hard 17 or soft 18. They are{' '}
          <strong>not an optimal basic-strategy chart</strong>; small differences may be sampling
          noise. Before a dealer peek, surrender is excluded because it is not yet available.
        </p>
      </section>
      <Experiment
        key={`${rules.hitSoft17}-${rules.payout}`}
        defaults={{ game: 'blackjack', soft17: rules.hitSoft17, blackjackPayout: rules.payout }}
      />
    </>
  );
}
