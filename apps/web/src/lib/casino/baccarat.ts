import { draw, rank } from './cards';
export const baccaratValue = (card: number) => (rank(card) % 10) * (rank(card) < 10 ? 1 : 0);
export const baccaratTotal = (cards: number[]) =>
  cards.reduce((n, c) => n + baccaratValue(c), 0) % 10;
export type BaccaratBet = 'Banker' | 'Player' | 'Tie';
export type BaccaratRule = 'commission' | 'super-six';
export function bankerDraw(total: number, playerThird: number | null): boolean {
  if (total <= 2) return true;
  if (playerThird === null) return total <= 5;
  return total === 3
    ? playerThird !== 8
    : total === 4
      ? playerThird >= 2 && playerThird <= 7
      : total === 5
        ? playerThird >= 4 && playerThird <= 7
        : total === 6
          ? playerThird === 6 || playerThird === 7
          : false;
}
export function baccaratRound(cards: number[]) {
  const player = [draw(cards)],
    banker = [draw(cards)];
  player.push(draw(cards));
  banker.push(draw(cards));
  const steps = [
    `Initial totals: Player ${baccaratTotal(player)}, Banker ${baccaratTotal(banker)}.`,
  ];
  const p = baccaratTotal(player),
    b = baccaratTotal(banker);
  if (p >= 8 || b >= 8) steps.push('Natural 8 or 9: neither hand draws.');
  else {
    let third: number | null = null;
    if (p <= 5) {
      const c = draw(cards);
      player.push(c);
      third = baccaratValue(c);
      steps.push(`Player draws a ${third}-point card because the initial total is 0–5.`);
    } else steps.push('Player stands on 6 or 7.');
    if (bankerDraw(b, third)) {
      banker.push(draw(cards));
      steps.push(
        `Banker draws: initial total ${b}; Player third card ${third === null ? 'not drawn' : third}.`,
      );
    } else
      steps.push(
        `Banker stands: initial total ${b}; Player third card ${third === null ? 'not drawn' : third}.`,
      );
  }
  const pt = baccaratTotal(player),
    bt = baccaratTotal(banker);
  const winner: BaccaratBet = pt > bt ? 'Player' : bt > pt ? 'Banker' : 'Tie';
  return { player, banker, steps, winner, bankerTotal: bt };
}
export function baccaratNet(
  winner: BaccaratBet,
  bet: BaccaratBet,
  bankerTotal: number,
  rule: BaccaratRule,
  tiePayout: number,
) {
  if (winner === 'Tie') return bet === 'Tie' ? tiePayout : 0;
  if (bet !== winner) return -1;
  return bet === 'Banker' ? (rule === 'commission' ? 0.95 : bankerTotal === 6 ? 0.5 : 1) : 1;
}
/** Exact ordered draws without replacement from counts of point values 0..9. */
export function baccaratOdds(counts: number[]) {
  if (
    counts.length !== 10 ||
    counts.some((n) => !Number.isInteger(n) || n < 0 || n > 416) ||
    counts.reduce((a, b) => a + b, 0) < 6
  )
    throw new Error('Provide ten nonnegative point counts with at least six cards.');
  const left = [...counts];
  const result = { Player: 0, Banker: 0, Tie: 0, bankerSix: 0 };
  const initial: number[] = [];
  function settle(p: number, b: number, weight: number) {
    result[p > b ? 'Player' : b > p ? 'Banker' : 'Tie'] += weight;
    if (b > p && b === 6) result.bankerSix += weight;
  }
  function each(total: number, weight: number, fn: (value: number, probability: number) => void) {
    for (let v = 0; v < 10; v++)
      if (left[v]) {
        const probability = (weight * left[v]) / total;
        left[v]--;
        fn(v, probability);
        left[v]++;
      }
  }
  const size = left.reduce((a, b) => a + b, 0);
  function deal(depth: number, weight: number) {
    if (depth < 4) {
      each(size - depth, weight, (v, w) => {
        initial.push(v);
        deal(depth + 1, w);
        initial.pop();
      });
      return;
    }
    const p = (initial[0] + initial[2]) % 10,
      b = (initial[1] + initial[3]) % 10;
    if (p >= 8 || b >= 8) {
      settle(p, b, weight);
      return;
    }
    function bank(pt: number, third: number | null, total: number, w: number) {
      if (bankerDraw(b, third)) each(total, w, (v, bw) => settle(pt, (b + v) % 10, bw));
      else settle(pt, b, w);
    }
    if (p <= 5) each(size - 4, weight, (v, w) => bank((p + v) % 10, v, size - 5, w));
    else bank(p, null, size - 4, weight);
  }
  deal(0, 1);
  return result;
}
export const baccaratCounts = (decks: number) => [16 * decks, ...Array<number>(9).fill(4 * decks)];
