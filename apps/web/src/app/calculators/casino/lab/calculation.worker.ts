import { baccaratOdds } from '../../../../lib/casino/baccarat';
import {
  actionEstimates,
  dealerOdds,
  remainingPoints,
  nextCardBust,
  type BlackjackRules,
} from '../../../../lib/casino/blackjack';
import { analyzeHolds, paytables } from '../../../../lib/casino/poker';
import { compareSessions, type ExperimentOptions } from '../../../../lib/casino/experiments';
export type Calculation =
  | { kind: 'baccarat'; counts: number[] }
  | { kind: 'holds'; cards: number[]; table: keyof typeof paytables }
  | {
      kind: 'blackjack';
      player: number[];
      up: number;
      removed: number[];
      rules: BlackjackRules;
      peek: boolean;
      seed: number;
    }
  | { kind: 'sessions'; options: ExperimentOptions };
self.onmessage = (event: MessageEvent<Calculation>) => {
  try {
    const q = event.data;
    const value =
      q.kind === 'baccarat'
        ? baccaratOdds(q.counts)
        : q.kind === 'holds'
          ? analyzeHolds(q.cards, paytables[q.table])
          : q.kind === 'sessions'
            ? compareSessions(q.options)
            : {
                nextBust: nextCardBust(
                  q.player,
                  q.up,
                  remainingPoints(q.rules.decks, [...q.player, q.up, ...q.removed]),
                  q.peek,
                ),
                dealer: dealerOdds(
                  q.up,
                  remainingPoints(q.rules.decks, [...q.player, q.up, ...q.removed]),
                  q.rules.hitSoft17,
                  q.peek,
                ),
                actions: actionEstimates(q.player, q.up, q.removed, q.rules, q.peek, q.seed),
              };
    self.postMessage({ value });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Calculation failed.' });
  }
};
