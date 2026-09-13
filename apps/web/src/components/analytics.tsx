'use client';

import { useEffect } from 'react';
import {
  configureAnalytics,
  createFirstPartyProvider,
  sendAggregateEvent,
  track,
} from '@insightginie/analytics';
import { publicRouteId } from '@insightginie/seo';

export function PageAnalytics({ pathname, enabled }: { pathname: string; enabled: boolean }) {
  useEffect(() => {
    const routeId = publicRouteId(pathname);
    if (!enabled || !routeId) return;
    const start = () => {
      configureAnalytics(createFirstPartyProvider(routeId));
      sendAggregateEvent({ event: 'page_view', route_id: routeId });
      if (pathname === '/' || pathname === '/calc/individual-income-percentile/')
        track('calculator_view', { calculator_id: 'individual-income-percentile' });
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.removeEventListener('load', start);
      configureAnalytics();
    };
  }, [pathname, enabled]);
  return null;
}
