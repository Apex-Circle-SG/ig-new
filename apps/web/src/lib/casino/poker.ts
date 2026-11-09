import { combinations, rank, suit } from './cards';
export const pokerCategories = [
  'Nothing',
  'Jacks or better',
  'Two pair',
  'Three of a kind',
  'Straight',
  'Flush',
  'Full house',
  'Four of a kind',
  'Straight flush',
  'Royal flush',
];
export const paytables = {
  '9/6': [0, 1, 2, 3, 4, 6, 9, 25, 50, 800],
  '8/5': [0, 1, 2, 3, 4, 5, 8, 25, 50, 800],
} as const;
export function pokerCategory(cards: number[]) {
  const rs = cards.map((c) => (rank(c) === 1 ? 14 : rank(c))).sort((a, b) => a - b);
  const counts = new Map<number, number>();
  rs.forEach((r) => counts.set(r, (counts.get(r) ?? 0) + 1));
  const groups = [...counts.values()].sort((a, b) => b - a);
  const flush = cards.every((c) => suit(c) === suit(cards[0]));
  const straight = counts.size === 5 && (rs[4] - rs[0] === 4 || rs.join(',') === '2,3,4,5,14');
  if (straight && flush) return rs[0] === 10 ? 9 : 8;
  if (groups[0] === 4) return 7;
  if (groups[0] === 3 && groups[1] === 2) return 6;
  if (flush) return 5;
  if (straight) return 4;
  if (groups[0] === 3) return 3;
  if (groups[0] === 2 && groups[1] === 2) return 2;
  if ([...counts].some(([r, n]) => n === 2 && r >= 11)) return 1;
  return 0;
}
export function analyzeHolds(cards: number[], paytable: readonly number[]) {
  if (
    cards.length !== 5 ||
    new Set(cards).size !== 5 ||
    cards.some((c) => !Number.isInteger(c) || c < 0 || c > 51)
  )
    throw new Error('Choose five distinct cards.');
  const pool = Array.from({ length: 52 }, (_, i) => i).filter((c) => !cards.includes(c));
  const results = Array.from({ length: 32 }, (_, mask) => {
    const held = cards.filter((_, i) => Boolean(mask & (1 << i)));
    let total = 0,
      count = 0,
      wins = 0;
    combinations(pool, 5 - held.length, (replacement) => {
      const payout = paytable[pokerCategory([...held, ...replacement])];
      total += payout;
      count++;
      if (payout) wins++;
    });
    return { mask, expectedReturn: total / count, combinations: count, winChance: wins / count };
  });
  return results.sort((a, b) => b.expectedReturn - a.expectedReturn);
}
export const threeCategories = [
  'High card',
  'Pair',
  'Flush',
  'Straight',
  'Three of a kind',
  'Straight flush',
];
export function threeRank(cards: number[]) {
  const rs = cards.map((c) => (rank(c) === 1 ? 14 : rank(c))).sort((a, b) => b - a);
  const flush = cards.every((c) => suit(c) === suit(cards[0]));
  const straight = new Set(rs).size === 3 && (rs[0] - rs[2] === 2 || rs.join(',') === '14,3,2');
  let category =
    straight && flush
      ? 5
      : rs[0] === rs[2]
        ? 4
        : straight
          ? 3
          : flush
            ? 2
            : new Set(rs).size === 2
              ? 1
              : 0;
  let kickers = [...rs];
  if (straight && rs[0] === 14 && rs[1] === 3) kickers = [3, 2, 1];
  if (category === 1) {
    const pair = rs[0] === rs[1] ? rs[0] : rs[1];
    kickers = [pair, pair, rs.find((r) => r !== pair)!];
  }
  category = Math.max(0, category);
  return {
    category,
    score: category * 15 ** 3 + kickers[0] * 225 + kickers[1] * 15 + kickers[2],
    qualifies: category > 0 || rs[0] >= 12,
  };
}
export function threeSettle(player: number[], dealer: number[], play: boolean, pairPlus: boolean) {
  const p = threeRank(player),
    d = threeRank(dealer);
  const anteBonus = [0, 0, 0, 1, 4, 5][p.category];
  const antePlay = !play
    ? -1
    : !d.qualifies
      ? 1 + anteBonus
      : p.score > d.score
        ? 2 + anteBonus
        : p.score === d.score
          ? anteBonus
          : -2 + anteBonus;
  const side = pairPlus ? [0, 1, 3, 6, 30, 40][p.category] - (p.category === 0 ? 1 : 0) : 0;
  return {
    net: antePlay + side,
    antePlay,
    side,
    category: threeCategories[p.category],
    dealerQualifies: d.qualifies,
  };
}
