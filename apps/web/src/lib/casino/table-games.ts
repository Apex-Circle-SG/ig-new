import { draw, rank, type Random } from './cards';
export type SicBet = {
  id: string;
  label: string;
  payout: number;
  kind:
    | 'small'
    | 'big'
    | 'odd'
    | 'even'
    | 'total'
    | 'double'
    | 'triple'
    | 'any-triple'
    | 'single'
    | 'pair';
  a?: number;
  b?: number;
};
export const sicBets: SicBet[] = [
  ...(['small', 'big', 'odd', 'even'] as const).map((kind) => ({
    id: kind,
    label:
      kind === 'small'
        ? 'Small · 4–10'
        : kind === 'big'
          ? 'Big · 11–17'
          : kind === 'odd'
            ? 'Odd (triples lose)'
            : 'Even (triples lose)',
    payout: 1,
    kind,
  })),
  { id: 'any-triple', label: 'Any triple', kind: 'any-triple', payout: 30 },
  ...Array.from({ length: 14 }, (_, i) => ({
    id: `total-${i + 4}`,
    label: `Total ${i + 4}`,
    kind: 'total' as const,
    a: i + 4,
    payout: [50, 18, 14, 12, 8, 6, 6, 6, 6, 8, 12, 14, 18, 50][i],
  })),
  ...Array.from({ length: 6 }, (_, i) => [
    {
      id: `single-${i + 1}`,
      label: `Single ${i + 1}`,
      kind: 'single' as const,
      a: i + 1,
      payout: 1,
    },
    {
      id: `double-${i + 1}`,
      label: `Double ${i + 1}`,
      kind: 'double' as const,
      a: i + 1,
      payout: 8,
    },
    {
      id: `triple-${i + 1}`,
      label: `Triple ${i + 1}`,
      kind: 'triple' as const,
      a: i + 1,
      payout: 150,
    },
  ]).flat(),
  ...Array.from({ length: 6 }, (_, i) =>
    Array.from({ length: 5 - i }, (_, j) => ({
      id: `pair-${i + 1}-${i + j + 2}`,
      label: `${i + 1} + ${i + j + 2}`,
      kind: 'pair' as const,
      a: i + 1,
      b: i + j + 2,
      payout: 5,
    })),
  ).flat(),
];
export const diceOutcomes = Array.from({ length: 216 }, (_, i) => [
  Math.floor(i / 36) + 1,
  (Math.floor(i / 6) % 6) + 1,
  (i % 6) + 1,
]);
export function sicNet(dice: number[], bet: SicBet, payout = bet.payout) {
  const sum = dice.reduce((a, b) => a + b, 0),
    triple = dice.every((v) => v === dice[0]),
    count = dice.filter((v) => v === bet.a).length;
  const win =
    bet.kind === 'small'
      ? sum >= 4 && sum <= 10 && !triple
      : bet.kind === 'big'
        ? sum >= 11 && sum <= 17 && !triple
        : bet.kind === 'odd'
          ? sum % 2 === 1 && !triple
          : bet.kind === 'even'
            ? sum % 2 === 0 && !triple
            : bet.kind === 'total'
              ? sum === bet.a
              : bet.kind === 'double'
                ? count >= 2
                : bet.kind === 'triple'
                  ? count === 3
                  : bet.kind === 'any-triple'
                    ? triple
                    : bet.kind === 'pair'
                      ? dice.includes(bet.a!) && dice.includes(bet.b!)
                      : count > 0;
  return win ? (bet.kind === 'single' ? count * payout : payout) : -1;
}
export const rollDice = (random: Random, count = 2) =>
  Array.from({ length: count }, () => 1 + Math.floor(random() * 6));
export const pointWays = (p: number) => 6 - Math.abs(7 - p);
export function crapsResolve(
  sum: number,
  point: number | null,
  dont: boolean,
): { point: number | null; net: number | null; message: string } {
  if (point === null) {
    if (sum === 7 || sum === 11)
      return { point: null, net: dont ? -1 : 1, message: 'Come-out natural.' };
    if ([2, 3, 12].includes(sum))
      return {
        point: null,
        net: dont ? (sum === 12 ? 0 : 1) : -1,
        message: sum === 12 && dont ? '12 is a push on Don’t Pass.' : 'Come-out craps.',
      };
    return { point: sum, net: null, message: `Point ${sum} established.` };
  }
  if (sum === point || sum === 7)
    return {
      point: null,
      net: (sum === point) !== dont ? 1 : -1,
      message: sum === point ? 'Point made.' : 'Seven out.',
    };
  return { point, net: null, message: `Point ${point} remains. Roll again.` };
}
export function crapsOddsNet(point: number, dont: boolean, won: boolean, stake: number) {
  return won ? stake * (dont ? pointWays(point) / 6 : 6 / pointWays(point)) : -stake;
}
export function warRank(card: number) {
  return rank(card) === 1 ? 14 : rank(card);
}
export function warRound(cards: number[], goWar: boolean, tiePayout = 2) {
  const player = [draw(cards)],
    dealer = [draw(cards)];
  let net =
    warRank(player[0]) > warRank(dealer[0]) ? 1 : warRank(player[0]) < warRank(dealer[0]) ? -1 : 0;
  let wager = 1;
  if (net === 0) {
    if (!goWar) net = -0.5;
    else {
      wager = 2;
      draw(cards);
      draw(cards);
      draw(cards);
      player.push(draw(cards));
      dealer.push(draw(cards));
      net =
        warRank(player[1]) === warRank(dealer[1])
          ? tiePayout
          : warRank(player[1]) > warRank(dealer[1])
            ? 1
            : -2;
    }
  }
  return { player, dealer, net, wager };
}
export const slotSymbols = ['Cherry', 'Lemon', 'Bell', 'Star', 'Seven'];
export const defaultWeights = [6, 5, 4, 3, 2];
export const defaultSlotPays = [5, 8, 15, 30, 100];
export function slotOutcomes(weights: number[], pays: number[]) {
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.flatMap((a, i) =>
    weights.flatMap((b, j) =>
      weights.map((c, k) => ({
        symbols: [i, j, k],
        probability: (a * b * c) / total ** 3,
        gross: i === j && j === k ? pays[i] : 0,
      })),
    ),
  );
}
export function slotSpin(weights: number[], pays: number[], random: Random) {
  const total = weights.reduce((a, b) => a + b, 0);
  const symbols = Array.from({ length: 3 }, () => {
    let n = random() * total;
    for (let i = 0; i < weights.length; i++) {
      n -= weights[i];
      if (n < 0) return i;
    }
    return weights.length - 1;
  });
  return { symbols, gross: symbols.every((n) => n === symbols[0]) ? pays[symbols[0]] : 0 };
}
/** Come odds are off on come-out; Don’t Come lay odds remain working. */
export function settleCrapsContract(
  sum: number,
  point: number | null,
  dont: boolean,
  stake: number,
  odds: number,
  come: boolean,
  tablePoint: number | null,
) {
  const r = crapsResolve(sum, point, dont);
  if (r.net === null) return r;
  const working = !come || dont || tablePoint !== null;
  const oddsNet = odds && r.net !== 0 && working ? crapsOddsNet(point!, dont, r.net > 0, odds) : 0;
  return { ...r, net: stake * r.net + oddsNet };
}
