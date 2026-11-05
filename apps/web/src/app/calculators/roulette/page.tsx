import type { Metadata } from 'next';
import Roulette from './roulette';

export const metadata: Metadata = {
  title: 'Roulette probability simulator',
  description: 'Explore roulette odds and virtual betting strategies with a browser-based probability simulator.',
  alternates: { canonical: '/calculators/roulette/' },
};

export default function RoulettePage() { return <Roulette />; }
