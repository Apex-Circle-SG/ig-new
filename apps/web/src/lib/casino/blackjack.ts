import { draw, point, rank, sample, seeded } from './cards';
export type BlackjackRules = {
  hitSoft17: boolean;
  payout: number;
  surrender: boolean;
  decks: number;
};
export function hand(cards: number[]) {
  let total = cards.reduce((s, c) => s + point(c), 0);
  const soft = cards.some((c) => rank(c) === 1) && total + 10 <= 21;
  if (soft) total += 10;
  return { total, soft, natural: cards.length === 2 && total === 21 };
}
export function dealerHits(cards: number[], hitSoft17: boolean) {
  const h = hand(cards);
  return h.total < 17 || (h.total === 17 && h.soft && hitSoft17);
}
export function blackjackNet(player: number[], dealer: number[], payout: number, split = false) {
  const p = hand(player),
    d = hand(dealer);
  if (p.total > 21) return -1;
  if (d.natural) return p.natural && !split ? 0 : -1;
  if (p.natural && !split) return payout;
  return d.total > 21 || p.total > d.total ? 1 : p.total === d.total ? 0 : -1;
}
export function remainingPoints(decks: number, known: number[]) {
  const counts = [4 * decks, ...Array<number>(8).fill(4 * decks), 16 * decks];
  for (const c of known)
    if (--counts[point(c) - 1] < 0) throw new Error('Known cards exceed the selected shoe.');
  return counts;
}
/** Dealer recursion is finite-shoe exact; peek conditions only the hole-card draw. */
export function dealerOdds(up: number, counts: number[], hitSoft17: boolean, peek: boolean) {
  if (
    counts.length !== 10 ||
    counts.some((n) => !Number.isInteger(n) || n < 0) ||
    counts.reduce((a, b) => a + b, 0) < 16
  )
    throw new Error('Leave at least 16 unknown cards.');
  const memo = new Map<string, number[]>();
  function walk(hard: number, aces: number, left: number[]): number[] {
    const soft = aces > 0 && hard + 10 <= 21,
      total = hard + (soft ? 10 : 0);
    if (total > 21) return [0, 0, 0, 0, 0, 1, 0];
    if (total >= 17 && !(total === 17 && soft && hitSoft17)) {
      const out = Array<number>(7).fill(0);
      out[total - 17] = 1;
      return out;
    }
    const key = `${hard}:${aces}:${left.join(',')}`;
    const cached = memo.get(key);
    if (cached) return cached;
    const n = left.reduce((a, b) => a + b, 0),
      out = Array<number>(7).fill(0);
    for (let i = 0; i < 10; i++)
      if (left[i]) {
        const p = left[i] / n;
        left[i]--;
        const child = walk(hard + i + 1, aces + (i === 0 ? 1 : 0), left);
        left[i]++;
        child.forEach((v, j) => (out[j] += p * v));
      }
    memo.set(key, out);
    return out;
  }
  const upPoint = point(up),
    left = [...counts],
    out = Array<number>(7).fill(0);
  const excluded = peek ? (upPoint === 1 ? 9 : upPoint === 10 ? 0 : -1) : -1;
  const n = left.reduce((a, b) => a + b, 0) - (excluded >= 0 ? left[excluded] : 0);
  if (!n) throw new Error('No hole card remains after the peek condition.');
  for (let i = 0; i < 10; i++)
    if (left[i] && i !== excluded) {
      const p = left[i] / n;
      left[i]--;
      if (upPoint + i + 1 === 11 && (upPoint === 1 || i === 0)) out[6] += p;
      else
        walk(upPoint + i + 1, (upPoint === 1 ? 1 : 0) + (i === 0 ? 1 : 0), left).forEach(
          (v, j) => (out[j] += p * v),
        );
      left[i]++;
    }
  return out;
}
export type BlackjackAction = 'stand' | 'hit' | 'double' | 'split' | 'surrender';
export function blackjackActions(
  cards: number[],
  rules: BlackjackRules,
  split = false,
): BlackjackAction[] {
  const actions: BlackjackAction[] = ['stand', 'hit'];
  if (cards.length === 2) {
    actions.push('double');
    if (!split && point(cards[0]) === point(cards[1])) actions.push('split');
    if (!split && rules.surrender) actions.push('surrender');
  }
  return actions;
}
/** Common random cards per action; continuation stands on hard 17 / soft 18, not optimal strategy. */
export function actionEstimates(
  player: number[],
  up: number,
  removed: number[],
  rules: BlackjackRules,
  peek: boolean,
  seed: number,
  trials = 6000,
) {
  const counts = remainingPoints(rules.decks, [...player, up, ...removed]);
  const pool = counts.flatMap((n, i) => Array<number>(n).fill(i === 9 ? 9 : i));
  // Rank-index representatives preserve point values; suits do not affect blackjack.
  const actions = blackjackActions(player, rules).filter((a) => a !== 'surrender' || peek);
  const excludedPoint = peek ? (point(up) === 1 ? 10 : point(up) === 10 ? 1 : 0) : 0;
  if (excludedPoint && pool.every((c) => point(c) === excludedPoint))
    throw new Error('No eligible hole card remains.');
  return actions.map((action) => {
    if (action === 'surrender') return { action, ev: -0.5, se: 0, trials };
    const random = seeded(seed);
    let sum = 0,
      square = 0;
    for (let t = 0; t < trials; t++) {
      let cards = sample(pool, Math.min(40, pool.length), random);
      const excluded = peek ? (point(up) === 1 ? 10 : point(up) === 10 ? 1 : 0) : 0;
      while (excluded && point(cards[0]) === excluded)
        cards = sample(pool, Math.min(40, pool.length), random);
      cards.reverse();
      const dealer = [up, draw(cards)];
      let net = 0;
      if (hand(dealer).natural) {
        net = blackjackNet(player, dealer, rules.payout);
        sum += net;
        square += net * net;
        continue;
      }
      const hands =
        action === 'split'
          ? [
              [player[0], draw(cards)],
              [player[1], draw(cards)],
            ]
          : [[...player]];
      const wagers = hands.map(() => (action === 'double' ? 2 : 1));
      hands.forEach((h) => {
        if (action === 'double') h.push(draw(cards));
        else if (action !== 'stand' && !(action === 'split' && point(player[0]) === 1)) {
          if (action === 'hit') h.push(draw(cards));
          while (hand(h).total < (hand(h).soft ? 18 : 17)) h.push(draw(cards));
        }
      });
      if (!hand(dealer).natural)
        while (dealerHits(dealer, rules.hitSoft17)) dealer.push(draw(cards));
      hands.forEach(
        (h, i) => (net += wagers[i] * blackjackNet(h, dealer, rules.payout, action === 'split')),
      );
      sum += net;
      square += net * net;
    }
    const ev = sum / trials;
    return { action, ev, se: Math.sqrt(Math.max(0, square / trials - ev * ev) / trials), trials };
  });
}
/** Marginal next-card risk, integrating over a hidden hole card and any peek exclusion. */
export function nextCardBust(player: number[], up: number, counts: number[], peek: boolean) {
  const n = counts.reduce((a, b) => a + b, 0),
    excluded = peek ? (point(up) === 1 ? 9 : point(up) === 10 ? 0 : -1) : -1;
  const eligible = n - (excluded >= 0 ? counts[excluded] : 0);
  let risk = 0;
  if (n < 2 || eligible <= 0) throw new Error('Not enough eligible cards remain.');
  for (let hole = 0; hole < 10; hole++)
    if (hole !== excluded && counts[hole])
      for (let card = 0; card < 10; card++) {
        if (hand([...player, card]).total > 21)
          risk += ((counts[hole] / eligible) * (counts[card] - (card === hole ? 1 : 0))) / (n - 1);
      }
  return risk;
}
