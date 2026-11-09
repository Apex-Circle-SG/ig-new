import { describe, it, expect } from 'vitest';
import {
  baccaratCounts,
  baccaratNet,
  baccaratOdds,
  baccaratRound,
  bankerDraw,
} from '../../apps/web/src/lib/casino/baccarat';
import {
  actionEstimates,
  blackjackNet,
  dealerHits,
  dealerOdds,
  hand,
  remainingPoints,
  nextCardBust,
} from '../../apps/web/src/lib/casino/blackjack';
import { cardName, combinations, rank, seeded, shoe } from '../../apps/web/src/lib/casino/cards';
import {
  analyzeHolds,
  paytables,
  pokerCategory,
  threeRank,
  threeSettle,
} from '../../apps/web/src/lib/casino/poker';
import {
  crapsOddsNet,
  settleCrapsContract,
  crapsResolve,
  defaultSlotPays,
  defaultWeights,
  diceOutcomes,
  pointWays,
  sicBets,
  sicNet,
  slotOutcomes,
  warRound,
} from '../../apps/web/src/lib/casino/table-games';
import { portfolioNet } from '../../apps/web/src/lib/casino/portfolio';
import {
  compareSessions,
  referenceReturn,
  simulateSession,
  type ExperimentGame,
  type ExperimentOptions,
} from '../../apps/web/src/lib/casino/experiments';
import { casinoLabs } from '../../apps/web/src/lib/casino/catalogue';
import {
  PUBLIC_INDEXABLE_PATHS,
  isPublicAdvertisingPath,
  isCalculatorPage,
} from '@insightginie/seo';
const c = (r: number, s = 0) => r - 1 + 13 * s;
const options: ExperimentOptions = {
  game: 'baccarat',
  seed: 42,
  rounds: 100,
  bankroll: 1000,
  stake: 10,
  limit: 500,
  stopWin: 0,
  stopLoss: 0,
  runs: 10,
};
describe('casino lab: rules and independently counted outcomes', () => {
  it('shuffles reproducibly and conserves every rank in a multideck shoe', () => {
    const a = shoe(6, seeded(42));
    expect(a).toEqual(shoe(6, seeded(42)));
    expect(a).not.toEqual(shoe(6, seeded(43)));
    expect(a).toHaveLength(312);
    for (let r = 1; r <= 13; r++) expect(a.filter((v) => rank(v) === r)).toHaveLength(24);
    expect(cardName(0)).toBe('A♠');
    expect(cardName(51)).toBe('K♣');
  });
  it('implements every Banker third-card row and Player-stand case', () => {
    const expected = [
      '0123456789',
      '0123456789',
      '0123456789',
      '012345679',
      '234567',
      '4567',
      '67',
      '',
    ];
    for (let b = 0; b <= 7; b++)
      for (let t = 0; t <= 9; t++) expect(bankerDraw(b, t)).toBe(expected[b].includes(String(t)));
    for (let b = 0; b <= 7; b++) expect(bankerDraw(b, null)).toBe(b <= 5);
  });
  it('stops on naturals and settles commission, Super 6 and pushes', () => {
    const deck = [c(5), c(4), c(4), c(4)].reverse();
    const r = baccaratRound(deck);
    expect(r.steps).toHaveLength(2);
    expect(deck).toHaveLength(0);
    expect(r.winner).toBe('Player');
    expect(baccaratNet('Banker', 'Banker', 6, 'commission', 8)).toBe(0.95);
    expect(baccaratNet('Banker', 'Banker', 6, 'super-six', 8)).toBe(0.5);
    expect(baccaratNet('Banker', 'Banker', 7, 'super-six', 8)).toBe(1);
    expect(baccaratNet('Tie', 'Player', 3, 'commission', 8)).toBe(0);
    expect(baccaratNet('Tie', 'Tie', 3, 'commission', 9)).toBe(9);
  });
  it('matches finite eight-deck baccarat probabilities and preserves input counts', () => {
    const counts = baccaratCounts(8),
      copy = [...counts],
      p = baccaratOdds(counts);
    expect(counts).toEqual(copy);
    expect(p.Banker).toBeCloseTo(0.4585974226, 9);
    expect(p.Player).toBeCloseTo(0.4462466093, 9);
    expect(p.Tie).toBeCloseTo(0.095155968, 9);
    expect(p.Banker + p.Player + p.Tie).toBeCloseTo(1, 10);
    expect(p.Player - 0.95 * p.Banker).toBeCloseTo(0.0105790578, 9);
    expect(() => baccaratOdds(Array(10).fill(0))).toThrow();
    expect(() => baccaratOdds([NaN, ...Array(9).fill(4)])).toThrow();
  });
  it('agrees with an independent exhaustive small-shoe baccarat oracle', () => {
    const values = [0, 0, 1, 2, 3, 6, 8, 9],
      counts = Array<number>(10).fill(0);
    values.forEach((v) => counts[v]++);
    const result = { Banker: 0, Player: 0, Tie: 0 };
    let trials = 0;
    function permute(path: number[], remaining: number[]) {
      if (path.length < 6) {
        remaining.forEach((v, i) =>
          permute(
            [...path, v],
            remaining.filter((_, j) => j !== i),
          ),
        );
        return;
      }
      let p = (path[0] + path[2]) % 10,
        b = (path[1] + path[3]) % 10,
        index = 4;
      if (p < 8 && b < 8) {
        let third: number | null = null;
        if (p <= 5) {
          third = path[index++];
          p = (p + third) % 10;
        }
        const should =
          third === null
            ? b <= 5
            : b <= 2 ||
              (b === 3 && third !== 8) ||
              (b === 4 && third >= 2 && third <= 7) ||
              (b === 5 && third >= 4 && third <= 7) ||
              (b === 6 && (third === 6 || third === 7));
        if (should) b = (b + path[index]) % 10;
      }
      result[p > b ? 'Player' : b > p ? 'Banker' : 'Tie']++;
      trials++;
    }
    permute([], values);
    const actual = baccaratOdds(counts);
    for (const key of ['Banker', 'Player', 'Tie'] as const)
      expect(actual[key]).toBeCloseTo(result[key] / trials, 10);
  });
  it('handles soft aces, naturals, split 21 and dealer soft 17', () => {
    expect(hand([c(1), c(6)])).toMatchObject({ total: 17, soft: true });
    expect(hand([c(1), c(6), c(10)])).toMatchObject({ total: 17, soft: false });
    expect(hand([c(1), c(1), c(9)])).toMatchObject({ total: 21, soft: true, natural: false });
    expect(dealerHits([c(1), c(6)], true)).toBe(true);
    expect(dealerHits([c(1), c(6)], false)).toBe(false);
    expect(blackjackNet([c(1), c(10)], [c(10), c(9)], 1.5)).toBe(1.5);
    expect(blackjackNet([c(1), c(10)], [c(10), c(9)], 1.5, true)).toBe(1);
    expect(blackjackNet([c(1), c(10)], [c(1), c(10)], 1.5, true)).toBe(-1);
  });
  it('normalizes finite dealer outcomes and correctly conditions a blackjack peek', () => {
    for (let up = 0; up < 10; up++)
      for (const h17 of [false, true]) {
        const counts = remainingPoints(6, [up, c(10), c(6)]),
          before = dealerOdds(up, counts, h17, false),
          after = dealerOdds(up, counts, h17, true);
        expect(before.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
        expect(after.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
        expect(after[6]).toBe(0);
        const expected = up === 0 ? counts[9] / 309 : up === 9 ? counts[0] / 309 : 0;
        expect(before[6]).toBeCloseTo(expected, 10);
        for (let i = 0; i < 6; i++) expect(after[i]).toBeCloseTo(before[i] / (1 - before[6]), 10);
      }
    expect(() => remainingPoints(1, Array(5).fill(0))).toThrow();
  });
  it('keeps action estimates replayable and late surrender after the peek', () => {
    const rules = { decks: 6, hitSoft17: false, payout: 1.5, surrender: true };
    const a = actionEstimates([c(10), c(6)], c(10), [], rules, true, 42, 1000);
    expect(a).toEqual(actionEstimates([c(10), c(6)], c(10), [], rules, true, 42, 1000));
    expect(a.find((r) => r.action === 'surrender')?.ev).toBe(-0.5);
    expect(
      actionEstimates([c(10), c(6)], c(10), [], rules, false, 42, 100).some(
        (r) => r.action === 'surrender',
      ),
    ).toBe(false);
  });
  it('counts Sic Bo triples, singles, doubles and Small without treating totals as uniform', () => {
    const bet = (id: string) => sicBets.find((b) => b.id === id)!;
    expect(diceOutcomes).toHaveLength(216);
    expect(new Set(diceOutcomes.map((d) => d.join(','))).size).toBe(216);
    expect(diceOutcomes.filter((d) => sicNet(d, bet('small')) > 0)).toHaveLength(105);
    expect(diceOutcomes.filter((d) => sicNet(d, bet('any-triple')) > 0)).toHaveLength(6);
    expect(diceOutcomes.filter((d) => sicNet(d, bet('double-2')) > 0)).toHaveLength(16);
    expect(sicNet([2, 2, 2], bet('small'))).toBe(-1);
    expect(sicNet([2, 2, 2], bet('single-2'))).toBe(3);
    expect(diceOutcomes.reduce((n, d) => n + sicNet(d, bet('small')), 0) / 216).toBeCloseTo(
      -1 / 36,
    );
  });
  it('resolves the Craps state machine and matches line edges from dice counts', () => {
    expect(crapsResolve(12, null, true).net).toBe(0);
    expect(crapsResolve(7, null, false).net).toBe(1);
    expect(crapsResolve(6, null, false)).toMatchObject({ point: 6, net: null });
    expect(crapsResolve(7, 6, true).net).toBe(1);
    expect(crapsResolve(6, 6, true).net).toBe(-1);
    expect(crapsResolve(5, 6, false).net).toBeNull();
    for (const dont of [false, true]) {
      let ev = 0;
      for (let sum = 2; sum <= 12; sum++) {
        const first = crapsResolve(sum, null, dont),
          ways = pointWays(sum);
        ev += (ways / 36) * (first.net ?? (dont ? 6 - ways : ways - 6) / (ways + 6));
      }
      expect(ev).toBeCloseTo(dont ? -3 / 220 : -7 / 495, 10);
      for (const p of [4, 5, 6, 8, 9, 10]) {
        const win = (dont ? 6 : pointWays(p)) / (pointWays(p) + 6);
        expect(
          win * crapsOddsNet(p, dont, true, 10) + (1 - win) * crapsOddsNet(p, dont, false, 10),
        ).toBeCloseTo(0, 10);
      }
    }
  });
  it('ranks every video poker category, including wheel and royal straights', () => {
    const fixtures = [
      [c(2), c(4), c(6), c(8), c(10, 1)],
      [c(11), c(11, 1), c(2), c(4), c(6)],
      [c(2), c(2, 1), c(4), c(4, 1), c(6)],
      [c(3), c(3, 1), c(3, 2), c(5), c(8)],
      [c(1), c(2), c(3), c(4), c(5, 1)],
      [c(2), c(4), c(6), c(8), c(10)],
      [c(3), c(3, 1), c(3, 2), c(5), c(5, 1)],
      [c(2), c(2, 1), c(2, 2), c(2, 3), c(5)],
      [c(1), c(2), c(3), c(4), c(5)],
      [c(1), c(10), c(11), c(12), c(13)],
    ];
    fixtures.forEach((cards, i) => expect(pokerCategory(cards)).toBe(i));
  });
  it('enumerates all 32 video-poker holds and excludes all five original cards from draws', () => {
    const cards = [c(1), c(10), c(11), c(12), c(13)],
      results = analyzeHolds(cards, paytables['9/6']);
    expect(results).toHaveLength(32);
    expect(results[0]).toMatchObject({
      mask: 31,
      expectedReturn: 800,
      combinations: 1,
      winChance: 1,
    });
    expect(results.reduce((s, r) => s + r.combinations, 0)).toBe(2598960);
    expect(results.find((r) => r.mask === 15)?.combinations).toBe(47);
    expect(() => analyzeHolds([0, 0, 2, 3, 4], paytables['9/6'])).toThrow();
  }, 30000);
  it('ranks three-card straights above flushes and accounts for qualification and bonus', () => {
    const straight = [c(1), c(2), c(3, 1)],
      flush = [c(2), c(4), c(8)],
      trips = [c(5), c(5, 1), c(5, 2)];
    expect(threeRank(straight).score).toBeGreaterThan(threeRank(flush).score);
    expect(threeSettle(straight, trips, true, false).net).toBe(-1);
    expect(threeSettle(straight, [c(2), c(4), c(8, 1)], true, false).net).toBe(2);
    expect(threeSettle(trips, flush, false, true).net).toBe(29);
    let count = 0;
    combinations(
      Array.from({ length: 49 }, (_, i) => i),
      3,
      () => count++,
    );
    expect(count).toBe(18424);
  });
  it('accounts for initial wagers and additional war exposure', () => {
    expect(warRound([c(10), c(11)].reverse(), true).net).toBe(-1);
    expect(
      warRound([c(10), c(10, 1), c(2), c(3), c(4), c(12), c(12, 1)].reverse(), true, 1).net,
    ).toBe(1);
    expect(warRound([c(10), c(10, 1)].reverse(), false)).toMatchObject({ net: -0.5, wager: 1 });
    expect(
      warRound([c(10), c(10, 1), c(2), c(3), c(4), c(12), c(12, 1)].reverse(), true),
    ).toMatchObject({ net: 2, wager: 2 });
    expect(
      warRound([c(10), c(10, 1), c(2), c(3), c(4), c(5), c(12)].reverse(), true),
    ).toMatchObject({ net: -2, wager: 2 });
  });
  it('enumerates slot return and overlapping roulette payouts', () => {
    const o = slotOutcomes(defaultWeights, defaultSlotPays);
    expect(o).toHaveLength(125);
    expect(o.reduce((n, r) => n + r.probability, 0)).toBeCloseTo(1, 10);
    const rtp = defaultWeights.reduce((n, w, i) => n + (w / 20) ** 3 * defaultSlotPays[i], 0);
    expect(o.reduce((n, r) => n + r.gross * r.probability, 0)).toBeCloseTo(rtp, 10);
    expect(
      portfolioNet(1, [
        { bet: 'red', number: 0, stake: 10 },
        { bet: 'straight', number: 1, stake: 1 },
      ]),
    ).toEqual([10, 35]);
    expect(
      portfolioNet(
        0,
        [
          { bet: 'red', number: 0, stake: 10 },
          { bet: 'straight', number: 0, stake: 1 },
        ],
        true,
      ),
    ).toEqual([-5, 35]);
    expect(portfolioNet(37, [{ bet: 'black', number: 0, stake: 10 }], false)).toEqual([-10]);
  });
  it('replays all games, conserves settlement counts, and stops at exposure limits', () => {
    for (const game of [
      'baccarat',
      'blackjack',
      'sic-bo',
      'craps',
      'three-card-poker',
      'casino-war',
      'slots',
      'roulette',
      'video-poker',
    ] as ExperimentGame[]) {
      const o = { ...options, game },
        a = simulateSession(o);
      expect(a).toEqual(simulateSession(o));
      expect(a.wins + a.losses + a.pushes).toBe(a.played);
      expect(a.balance).toBeGreaterThanOrEqual(0);
      expect(a.points.at(-1)).toBe(a.balance);
      const compared = compareSessions(o);
      expect(compared).toHaveLength(2);
      expect(compared[0].first).toEqual(a);
    }
    expect(simulateSession({ ...options, limit: 5 }).played).toBe(0);
    expect(simulateSession({ ...options, game: 'casino-war', bankroll: 15 }).played).toBe(0);
    expect(() => simulateSession({ ...options, rounds: NaN })).toThrow();
    expect(() => compareSessions({ ...options, runs: 101 })).toThrow();
    expect(() => simulateSession({ ...options, stake: -1 })).toThrow();
    expect(() => simulateSession({ ...options, seed: NaN })).toThrow();
  });
  it('registers every new lab for sitemap, index and consent-aware advertising', () => {
    for (const lab of casinoLabs) {
      const path = `/calculators/casino/${lab.id}/`;
      expect(PUBLIC_INDEXABLE_PATHS).toContain(path);
      expect(isCalculatorPage(path)).toBe(true);
      expect(isPublicAdvertisingPath(path)).toBe(true);
    }
  });
});

describe('casino lab: conditional risk and theoretical references', () => {
  it('integrates a peek into exact next-card bust risk', () => {
    const player = [c(10), c(6)],
      counts = remainingPoints(6, [...player, c(1)]);
    const n = counts.reduce((a, b) => a + b, 0);
    const bust = counts.slice(5).reduce((a, b) => a + b, 0);
    expect(nextCardBust(player, c(1), counts, false)).toBeCloseTo(bust / n, 10);
    const holeNonBust = counts.slice(0, 5).reduce((a, b) => a + b, 0),
      eligible = n - counts[9];
    const expected =
      (holeNonBust * bust + (eligible - holeNonBust) * (bust - 1)) / (eligible * (n - 1));
    expect(nextCardBust(player, c(1), counts, true)).toBeCloseTo(expected, 10);
    expect(nextCardBust([c(1), c(6)], c(10), remainingPoints(6, [c(1), c(6), c(10)]), true)).toBe(
      0,
    );
  });
  it('keeps reference returns in the correct stake units and avoids claiming optimal-policy returns', () => {
    expect(referenceReturn({ game: 'roulette' })).toBeCloseTo(-1 / 37);
    expect(referenceReturn({ game: 'roulette', rouletteBet: 'two-columns' })).toBeCloseTo(-2 / 37);
    expect(
      referenceReturn({
        game: 'roulette',
        chips: [{ bet: 'red', number: 0, stake: 10 }],
        partage: true,
      }),
    ).toBeCloseTo(-1 / 74);
    expect(referenceReturn({ game: 'sic-bo' })).toBeCloseTo(-1 / 36);
    expect(referenceReturn({ game: 'casino-war', war: false })).toBeCloseTo(-23 / 622);
    expect(referenceReturn({ game: 'casino-war', war: true, warTiePayout: 1 })).toBeCloseTo(
      -0.0288,
      3,
    );
    let weighted = 0;
    const counts = Array<number>(13).fill(24);
    for (let a = 0; a < 13; a++)
      for (let b = 0; b < 13; b++)
        for (let d = 0; d < 13; d++)
          for (let e = 0; e < 13; e++) {
            let ways = 1;
            for (const r of [a, b, d, e]) {
              ways *= counts[r];
              counts[r]--;
            }
            const net = a > b ? 1 : a < b ? -1 : d > e ? 1 : d < e ? -2 : 2;
            weighted += ways * net;
            for (const r of [a, b, d, e]) counts[r]++;
          }
    expect(referenceReturn({ game: 'casino-war', war: true })).toBeCloseTo(
      weighted / (312 * 311 * 310 * 309),
      10,
    );
    expect(referenceReturn({ game: 'blackjack' })).toBeNull();
    expect(referenceReturn({ game: 'video-poker' })).toBeNull();
  });
});

it('keeps Don’t Come odds working while Come odds are off on table come-out', () => {
  expect(settleCrapsContract(7, 6, false, 10, 12, true, null).net).toBe(-10);
  expect(settleCrapsContract(7, 6, true, 10, 12, true, null).net).toBe(20);
  expect(settleCrapsContract(6, 6, true, 10, 12, true, null).net).toBe(-22);
  expect(settleCrapsContract(6, 6, false, 10, 12, true, null).net).toBe(10);
  expect(settleCrapsContract(7, 6, false, 10, 12, true, 8).net).toBe(-22);
});
