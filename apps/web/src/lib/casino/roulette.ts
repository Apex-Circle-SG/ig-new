export type Bet =
  | 'red'
  | 'black'
  | 'even'
  | 'odd'
  | 'low'
  | 'high'
  | 'dozen1'
  | 'dozen2'
  | 'dozen3'
  | 'column1'
  | 'column2'
  | 'column3'
  | 'two-columns'
  | 'straight'
  | 'split'
  | 'street'
  | 'corner'
  | 'six-line';
type Spin = { number: string; stake: number; net: number; balance: number };
export type Run = {
  history: Spin[];
  points: number[];
  final: number;
  spins: number;
  turnover: number;
  peak: number;
  maxDrawdown: number;
  reason: string;
  frequencies: number[];
};
export const red = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const bets: { value: Bet; label: string }[] = [
  { value: 'red', label: 'Red' },
  { value: 'black', label: 'Black' },
  { value: 'even', label: 'Even' },
  { value: 'odd', label: 'Odd' },
  { value: 'low', label: '1–18' },
  { value: 'high', label: '19–36' },
  { value: 'dozen1', label: 'First dozen' },
  { value: 'dozen2', label: 'Second dozen' },
  { value: 'dozen3', label: 'Third dozen' },
  { value: 'column1', label: 'First column' },
  { value: 'column2', label: 'Second column' },
  { value: 'column3', label: 'Third column' },
  { value: 'two-columns', label: 'First and second columns' },
  { value: 'straight', label: 'Single number' },
  { value: 'split', label: 'Split (horizontal pair)' },
  { value: 'street', label: 'Street (row of three)' },
  { value: 'corner', label: 'Corner (four)' },
  { value: 'six-line', label: 'Six line (two rows)' },
];

export function hits(n: number, bet: Bet, number: number) {
  if (['straight', 'split', 'street', 'corner', 'six-line'].includes(bet))
    return coveredNumbers(bet, number).includes(n);
  if (n <= 0 || n > 36) return false;
  switch (bet) {
    case 'red':
      return red.has(n);
    case 'black':
      return !red.has(n);
    case 'even':
      return n % 2 === 0;
    case 'odd':
      return n % 2 === 1;
    case 'low':
      return n <= 18;
    case 'high':
      return n >= 19;
    case 'dozen1':
      return n <= 12;
    case 'dozen2':
      return n >= 13 && n <= 24;
    case 'dozen3':
      return n >= 25;
    case 'column1':
      return n % 3 === 1;
    case 'column2':
      return n % 3 === 2;
    case 'column3':
      return n % 3 === 0;
    case 'two-columns':
      return n % 3 !== 0;
  }
}
export function play(
  wheel: number,
  bet: Bet,
  number: number,
  base: number,
  initial: number,
  limit: number,
  target: number,
  loss: number,
  spins: number,
  progression: boolean,
): Run {
  let balance = initial,
    stake = base,
    peak = initial,
    maxDrawdown = 0,
    turnover = 0,
    count = 0,
    reason = 'Spin limit reached';
  const frequencies = Array.from({ length: wheel }, () => 0);
  const history: Spin[] = [],
    points = [initial],
    units = bet === 'two-columns' ? 2 : 1;
  const payout = payoutFor(bet);
  for (let i = 0; i < spins; i++) {
    if (stake > limit) {
      reason = 'Next stake exceeds the table limit';
      break;
    }
    if (stake * units > balance) {
      reason = 'Balance cannot cover the next bet';
      break;
    }
    const n = Math.floor(Math.random() * wheel),
      won = hits(n, bet, number),
      net = bet === 'two-columns' ? (won ? stake : -2 * stake) : won ? stake * payout : -stake;
    frequencies[n]++;
    balance += net;
    turnover += stake * units;
    count++;
    peak = Math.max(peak, balance);
    maxDrawdown = Math.max(maxDrawdown, peak - balance);
    history.push({ number: n === 37 ? '00' : String(n), stake: stake * units, net, balance });
    if (history.length > 30) history.shift();
    if (i % Math.max(1, Math.ceil(spins / 200)) === 0 || i === spins - 1) points.push(balance);
    if (target > 0 && balance - initial >= target) {
      reason = 'Profit target reached';
      break;
    }
    if (loss > 0 && initial - balance >= loss) {
      reason = 'Loss limit reached';
      break;
    }
    stake = progression && !won ? stake * 2 : base;
  }
  if (points[points.length - 1] !== balance) points.push(balance);
  return {
    history,
    points,
    final: balance,
    spins: count,
    turnover,
    peak,
    maxDrawdown,
    reason,
    frequencies,
  };
}

export function anchors(bet: Bet, wheel: number): number[] {
  return Array.from({ length: wheel }, (_, i) => i).filter(
    (n) =>
      bet === 'straight' ||
      (n > 0 &&
        n <= 36 &&
        (bet === 'split'
          ? n % 3 !== 0
          : bet === 'corner'
            ? n % 3 !== 0 && n <= 32
            : bet === 'six-line'
              ? n % 3 === 1 && n <= 31
              : n % 3 === 1)),
  );
}
export function coveredNumbers(bet: Bet, anchor: number): number[] {
  switch (bet) {
    case 'straight':
      return [anchor];
    case 'split':
      return [anchor, anchor + 1];
    case 'street':
      return [anchor, anchor + 1, anchor + 2];
    case 'corner':
      return [anchor, anchor + 1, anchor + 3, anchor + 4];
    case 'six-line':
      return Array.from({ length: 6 }, (_, i) => anchor + i);
    default:
      return [];
  }
}
export function payoutFor(bet: Bet): number {
  switch (bet) {
    case 'straight':
      return 35;
    case 'split':
      return 17;
    case 'street':
      return 11;
    case 'corner':
      return 8;
    case 'six-line':
      return 5;
    default:
      return bet.startsWith('dozen') || bet.startsWith('column') ? 2 : 1;
  }
}
