'use client';

import { useEffect } from 'react';
import {
  configureAnalytics,
  createFirstPartyProvider,
  sendAggregateEvent,
  track,
  analyticsConsentGranted,
  ANALYTICS_CHANGE_EVENT,
  experienceIds,
} from '@insightginie/analytics';
import { publicRouteId } from '@insightginie/seo';

export function PageAnalytics({ pathname, enabled }: { pathname: string; enabled: boolean }) {
  useEffect(() => {
    const routeId = publicRouteId(pathname);
    if (!enabled || !routeId) return;
    let counted = false;
    const start = () => {
      if (!analyticsConsentGranted()) {
        configureAnalytics();
        return;
      }
      configureAnalytics(createFirstPartyProvider(routeId));
      if (counted) return;
      counted = true;
      sendAggregateEvent({ event: 'page_view', route_id: routeId });
      if (pathname === '/' || pathname === '/calc/individual-income-percentile/')
        track('calculator_view', { calculator_id: 'individual-income-percentile' });
      const tool = pathname.split('/')[2];
      if (pathname.startsWith('/tools/') && (experienceIds as readonly string[]).includes(tool))
        track('calculator_view', { calculator_id: tool });
      // Reduce referrer locally to a yes/no classification; never transmit its URL or query.
      try {
        const host = new URL(document.referrer).hostname;
        if (/^(?:www\.)?(?:google\.com|bing\.com|duckduckgo\.com|search\.yahoo\.com)$/.test(host))
          track('organic_landing', {
            calculator_id:
              tool && (experienceIds as readonly string[]).includes(tool)
                ? tool
                : pathname === '/ask/'
                  ? 'ask'
                  : pathname.startsWith('/research/')
                    ? 'research'
                    : 'insights',
          });
      } catch {
        /* Direct visits have no referrer. */
      }
    };
    window.addEventListener(ANALYTICS_CHANGE_EVENT, start);
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.removeEventListener('load', start);
      window.removeEventListener(ANALYTICS_CHANGE_EVENT, start);
      configureAnalytics();
    };
  }, [pathname, enabled]);
  return null;
}
