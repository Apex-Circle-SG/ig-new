import { draw, rank, seeded, shoe, type Random } from './cards';
import {
  baccaratRound,
  baccaratNet,
  baccaratOdds,
  baccaratCounts,
  type BaccaratBet,
  type BaccaratRule,
} from './baccarat';
import { blackjackNet, dealerHits, hand } from './blackjack';
import { paytables, pokerCategory, threeRank, threeSettle } from './poker';
import {
  crapsResolve,
  rollDice,
  sicBets,
  sicNet,
  slotSpin,
  slotOutcomes,
  defaultWeights,
  defaultSlotPays,
  warRound,
} from './table-games';
import { portfolioNet, type RouletteChip } from './portfolio';
import { hits, payoutFor, type Bet } from './roulette';
export type ExperimentGame =
  | 'baccarat'
  | 'blackjack'
  | 'sic-bo'
  | 'craps'
  | 'three-card-poker'
  | 'casino-war'
  | 'slots'
  | 'roulette'
  | 'video-poker';
export type ExperimentOptions = {
  game: ExperimentGame;
  seed: number;
  rounds: number;
  bankroll: number;
  stake: number;
  limit: number;
  stopWin: number;
  stopLoss: number;
  runs: number;
  baccaratBet?: BaccaratBet;
  baccaratRule?: BaccaratRule;
  tiePayout?: number;
  sicBet?: string;
  sicPayout?: number;
  wheel?: number;
  rouletteBet?: Bet;
  rouletteNumber?: number;
  weights?: number[];
  pays?: number[];
  dont?: boolean;
  war?: boolean;
  warTiePayout?: number;
  soft17?: boolean;
  blackjackPayout?: number;
  chips?: RouletteChip[];
  partage?: boolean;
  paytable?: keyof typeof paytables;
};
function outcome(o: ExperimentOptions, random: Random, cards: number[]) {
  if (o.game === 'baccarat') {
    const r = baccaratRound(cards);
    return {
      net: baccaratNet(
        r.winner,
        o.baccaratBet ?? 'Banker',
        r.bankerTotal,
        o.baccaratRule ?? 'commission',
        o.tiePayout ?? 8,
      ),
      wager: 1,
      label: r.winner,
    };
  }
  if (o.game === 'sic-bo') {
    const dice = rollDice(random, 3),
      bet = sicBets.find((b) => b.id === o.sicBet) ?? sicBets[0];
    return { net: sicNet(dice, bet, o.sicPayout ?? bet.payout), wager: 1, label: dice.join(' + ') };
  }
  if (o.game === 'roulette' && o.chips?.length) {
    const n = Math.floor(random() * (o.wheel ?? 37)),
      total = o.chips.reduce((s, c) => s + c.stake * (c.bet === 'two-columns' ? 2 : 1), 0);
    return {
      net: portfolioNet(n, o.chips, o.partage).reduce((a, b) => a + b, 0) / total,
      wager: 1,
      label: n === 37 ? '00' : String(n),
    };
  }
  if (o.game === 'roulette') {
    const n = Math.floor(random() * (o.wheel ?? 37)),
      bet = o.rouletteBet ?? 'red',
      win = hits(n, bet, o.rouletteNumber ?? 0);
    return {
      net: bet === 'two-columns' ? (win ? 1 : -2) : win ? payoutFor(bet) : -1,
      wager: bet === 'two-columns' ? 2 : 1,
      label: n === 37 ? '00' : String(n),
    };
  }
  if (o.game === 'slots') {
    const r = slotSpin(o.weights ?? defaultWeights, o.pays ?? defaultSlotPays, random);
    return { net: r.gross - 1, wager: 1, label: r.symbols.join(' · ') };
  }
  if (o.game === 'casino-war') {
    const r = warRound(shoe(6, random), o.war ?? true, o.warTiePayout ?? 2);
    return { ...r, label: r.wager === 2 ? 'War' : 'Initial deal' };
  }
  if (o.game === 'craps') {
    let p: number | null = null;
    for (;;) {
      const dice = rollDice(random),
        r = crapsResolve(dice[0] + dice[1], p, o.dont ?? false);
      p = r.point;
      if (r.net !== null) return { net: r.net, wager: 1, label: r.message };
    }
  }
  if (o.game === 'video-poker') {
    const deck = shoe(1, random),
      player = Array.from({ length: 5 }, () => draw(deck));
    const counts = new Map<number, number>();
    player.forEach((c) => counts.set(rank(c), (counts.get(rank(c)) ?? 0) + 1));
    const made = pokerCategory(player);
    const next =
      made >= 2
        ? player
        : player.map((c) =>
            (counts.get(rank(c)) ?? 0) >= 2 || rank(c) === 1 || rank(c) >= 11 ? c : draw(deck),
          );
    return {
      net: paytables[o.paytable ?? '9/6'][pokerCategory(next)] - 1,
      wager: 1,
      label: 'Simple hold policy',
    };
  }
  if (o.game === 'three-card-poker') {
    cards = shoe(1, random);
    const player = [draw(cards), draw(cards), draw(cards)],
      dealer = [draw(cards), draw(cards), draw(cards)],
      r = threeRank(player);
    const play = r.category > 0 || r.score >= 12 * 225 + 6 * 15 + 4;
    return {
      net: threeSettle(player, dealer, play, false).net,
      wager: play ? 2 : 1,
      label: play ? 'Play' : 'Fold',
    };
  }
  const player = [draw(cards)],
    dealer = [draw(cards)];
  player.push(draw(cards));
  dealer.push(draw(cards));
  if (!hand(player).natural && !hand(dealer).natural)
    while (hand(player).total < (hand(player).soft ? 18 : 17)) player.push(draw(cards));
  if (hand(player).total <= 21 && !hand(dealer).natural)
    while (dealerHits(dealer, o.soft17 ?? false)) dealer.push(draw(cards));
  return {
    net: blackjackNet(player, dealer, o.blackjackPayout ?? 1.5),
    wager: 1,
    label: `${hand(player).total} vs ${hand(dealer).total}`,
  };
}
export type SessionResult = ReturnType<typeof simulateSession>;
export function simulateSession(o: ExperimentOptions, progression = false) {
  if (!Number.isInteger(o.seed) || o.seed < 0 || o.seed > 4294967295)
    throw new Error('Replay seed must be a whole number from 0 to 4,294,967,295.');
  if (
    ![o.seed, o.rounds, o.bankroll, o.stake, o.limit, o.stopWin, o.stopLoss].every(
      Number.isFinite,
    ) ||
    !Number.isInteger(o.rounds) ||
    o.rounds < 1 ||
    o.rounds > 10000 ||
    o.stake <= 0 ||
    o.bankroll <= 0 ||
    o.limit <= 0 ||
    o.stopWin < 0 ||
    o.stopLoss < 0 ||
    [o.stake, o.bankroll, o.limit, o.stopWin, o.stopLoss].some((n) => n > 1e6)
  )
    throw new Error('Use positive amounts up to 1,000,000 and 1–10,000 whole rounds.');
  const random = seeded(o.seed);
  let cards = shoe(8, random),
    balance = o.bankroll,
    peak = balance,
    drawdown = 0,
    turnover = 0,
    stake = o.stake,
    wins = 0,
    losses = 0,
    pushes = 0,
    played = 0,
    reason = 'Round limit reached';
  const points = [balance],
    history: { round: number; label: string; net: number; balance: number }[] = [];
  for (let i = 0; i < o.rounds; i++) {
    const reserve =
      (o.game === 'casino-war' && o.war !== false) ||
      o.game === 'three-card-poker' ||
      (o.game === 'roulette' && !o.chips?.length && o.rouletteBet === 'two-columns')
        ? 2
        : 1;
    if (stake * reserve > o.limit) {
      reason = 'Next potential round stake exceeds table limit';
      break;
    }
    if (stake * reserve > balance) {
      reason = 'Balance cannot cover next round’s potential stake';
      break;
    }
    if (cards.length < 52) cards = shoe(8, random);
    const r = outcome(o, random, cards),
      net = r.net * stake;
    balance += net;
    turnover += stake * r.wager;
    played++;
    peak = Math.max(peak, balance);
    drawdown = Math.max(drawdown, peak - balance);
    if (net > 0) wins++;
    else if (net < 0) losses++;
    else pushes++;
    history.push({ round: played, label: r.label, net, balance });
    if (history.length > 20) history.shift();
    if (i % Math.max(1, Math.ceil(o.rounds / 200)) === 0) points.push(balance);
    if (o.stopWin && balance - o.bankroll >= o.stopWin) {
      reason = 'Profit target reached';
      break;
    }
    if (o.stopLoss && o.bankroll - balance >= o.stopLoss) {
      reason = 'Loss limit reached';
      break;
    }
    stake = progression ? (net < 0 ? stake * 2 : net > 0 ? o.stake : stake) : o.stake;
  }
  points.push(balance);
  return { balance, drawdown, turnover, played, reason, points, history, wins, losses, pushes };
}
export function compareSessions(o: ExperimentOptions) {
  if (!Number.isInteger(o.runs) || o.runs < 1 || o.runs > 100)
    throw new Error('Use 1–100 sessions.');
  return [false, true].map((progression) => {
    const sessions = Array.from({ length: o.runs }, (_, i) =>
      simulateSession({ ...o, seed: (o.seed + i) >>> 0 }, progression),
    );
    const sorted = sessions.map((r) => r.balance).sort((a, b) => a - b);
    return {
      progression,
      first: sessions[0],
      mean: sorted.reduce((a, b) => a + b, 0) / o.runs,
      low: sorted[Math.floor((o.runs - 1) * 0.1)],
      high: sorted[Math.floor((o.runs - 1) * 0.9)],
      profitable: sessions.filter((r) => r.balance > o.bankroll).length,
      insufficient: sessions.filter((r) => r.reason.startsWith('Balance')).length,
    };
  });
}
/** Full-shoe/independent-round reference; not a conditional prediction after stopping. */
export function referenceReturn(
  o: Partial<ExperimentOptions> & Pick<ExperimentOptions, 'game'>,
): number | null {
  if (o.game === 'roulette') {
    const wheel = o.wheel ?? 37;
    if (o.chips?.length) {
      const total = o.chips.reduce((s, c) => s + c.stake * (c.bet === 'two-columns' ? 2 : 1), 0);
      return (
        Array.from({ length: wheel }, (_, n) =>
          portfolioNet(n, o.chips!, o.partage).reduce((a, b) => a + b, 0),
        ).reduce((a, b) => a + b, 0) /
        (wheel * total)
      );
    }
    return ((36 - wheel) / wheel) * (o.rouletteBet === 'two-columns' ? 2 : 1);
  }
  if (o.game === 'sic-bo') {
    const bet = sicBets.find((b) => b.id === o.sicBet) ?? sicBets[0];
    return (
      Array.from({ length: 216 }, (_, i) => [
        Math.floor(i / 36) + 1,
        (Math.floor(i / 6) % 6) + 1,
        (i % 6) + 1,
      ]).reduce((s, d) => s + sicNet(d, bet, o.sicPayout ?? bet.payout), 0) / 216
    );
  }
  if (o.game === 'craps') return o.dont ? -3 / 220 : -7 / 495;
  if (o.game === 'slots')
    return (
      slotOutcomes(o.weights ?? defaultWeights, o.pays ?? defaultSlotPays).reduce(
        (s, r) => s + r.probability * r.gross,
        0,
      ) - 1
    );
  if (o.game === 'baccarat') {
    const p = baccaratOdds(baccaratCounts(8));
    return o.baccaratBet === 'Player'
      ? p.Player - p.Banker
      : o.baccaratBet === 'Tie'
        ? (o.tiePayout ?? 8) * p.Tie - (1 - p.Tie)
        : (o.baccaratRule === 'super-six' ? p.Banker - 0.5 * p.bankerSix : 0.95 * p.Banker) -
          p.Player;
  }
  if (o.game === 'casino-war') {
    const tie = 23 / 311;
    const warTie = (12 * 24 * 23 + 22 * 21) / (310 * 309);
    return tie * (o.war === false ? -0.5 : -0.5 + (0.5 + (o.warTiePayout ?? 2)) * warTie);
  }
  return null;
}
