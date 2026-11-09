'use client';
import dynamic from 'next/dynamic';
import type { CasinoLabId } from '../../../../lib/casino/catalogue';
const labs = {
  baccarat: dynamic(() => import('./baccarat')),
  blackjack: dynamic(() => import('./blackjack')),
  'sic-bo': dynamic(() => import('./sic-bo')),
  craps: dynamic(() => import('./craps')),
  'video-poker': dynamic(() => import('./video-poker')),
  'three-card-poker': dynamic(() => import('./three-card-poker')),
  'casino-war': dynamic(() => import('./casino-war')),
  slots: dynamic(() => import('./slots')),
  'session-lab': dynamic(() => import('./session-lab')),
};
export default function CasinoLab({ id }: { id: CasinoLabId }) {
  const Lab = labs[id];
  return <Lab />;
}
