export type Random = () => number;
export const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const rank = (card: number) => (card % 13) + 1;
export const suit = (card: number) => Math.floor(card / 13) % 4;
export const cardName = (card: number) =>
  `${ranks[rank(card) - 1]}${['♠', '♥', '♦', '♣'][suit(card)]}`;
export const point = (card: number) => Math.min(rank(card), 10);
export function seeded(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shoe(decks = 1, random: Random = Math.random): number[] {
  const cards = Array.from({ length: decks * 52 }, (_, i) => i % 52);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
export function draw(cards: number[]): number {
  const card = cards.pop();
  if (card === undefined) throw new Error('Not enough cards remain. Start a fresh shoe.');
  return card;
}
export function combinations<T>(items: T[], size: number, visit: (chosen: T[]) => void) {
  const chosen: T[] = [];
  function step(start: number) {
    if (chosen.length === size) {
      visit(chosen);
      return;
    }
    for (let i = start; i <= items.length - (size - chosen.length); i++) {
      chosen.push(items[i]);
      step(i + 1);
      chosen.pop();
    }
  }
  step(0);
}
export function sample(cards: number[], count: number, random: Random): number[] {
  const pool = [...cards];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
