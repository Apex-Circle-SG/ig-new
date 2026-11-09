import { hits, payoutFor, type Bet } from './roulette';
export type RouletteChip = { bet: Bet; number: number; stake: number };
export function portfolioNet(pocket: number, chips: RouletteChip[], partage = false) {
  return chips.map((c) => {
    if (partage && pocket === 0 && ['red', 'black', 'odd', 'even', 'low', 'high'].includes(c.bet))
      return -c.stake / 2;
    const won = hits(pocket, c.bet, c.number);
    return c.bet === 'two-columns'
      ? won
        ? c.stake
        : -2 * c.stake
      : won
        ? c.stake * payoutFor(c.bet)
        : -c.stake;
  });
}
