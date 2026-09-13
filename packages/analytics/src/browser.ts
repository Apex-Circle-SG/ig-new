import { PUBLIC_ROUTE_IDS } from '@insightginie/seo';
import { eventNames, experienceIds, type AnalyticsEvent, type AnalyticsProvider } from './index';
import { analyticsConsentGranted } from './consent';

export type AggregateEvent = {
  route_id: string;
  event: 'page_view' | AnalyticsEvent;
  calculator_id?: (typeof experienceIds)[number];
  interaction?: 'form' | 'example' | 'what-if' | 'copy-link';
};

/** Same-origin counts only: never attach cookies, referrers, URLs or identifiers. */
export function sendAggregateEvent(event: AggregateEvent) {
  if (typeof window === 'undefined' || !analyticsConsentGranted()) return;
  if (!Object.values(PUBLIC_ROUTE_IDS).includes(event.route_id)) return;
  if (event.event !== 'page_view' && !eventNames.includes(event.event)) return;
  if (
    event.event !== 'page_view' &&
    !(experienceIds as readonly (string | undefined)[]).includes(event.calculator_id)
  )
    return;
  const body =
    event.event === 'page_view'
      ? { event: event.event, route_id: event.route_id }
      : {
          event: event.event,
          route_id: event.route_id,
          calculator_id: event.calculator_id,
          ...(['form', 'example', 'what-if', 'copy-link'].includes(event.interaction ?? '')
            ? { interaction: event.interaction }
            : {}),
        };
  void fetch('/api/events/', {
    method: 'POST',
    mode: 'same-origin',
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    cache: 'no-store',
    keepalive: true,
    headers: { 'Content-Type': 'application/json', 'X-InsightGinie-Consent': 'allow' },
    body: JSON.stringify(body),
  }).catch(() => {
    /* Measurement failures must not affect the product. */
  });
}

export function createFirstPartyProvider(
  routeId: string,
  send: (event: AggregateEvent) => void = sendAggregateEvent,
): AnalyticsProvider {
  return {
    track(event, properties) {
      if (!Object.values(PUBLIC_ROUTE_IDS).includes(routeId)) return;
      if (
        !eventNames.includes(event) ||
        !(experienceIds as readonly string[]).includes(properties.calculator_id)
      )
        return;
      const interaction = ['form', 'example', 'what-if', 'copy-link'].includes(
        properties.interaction ?? '',
      )
        ? properties.interaction
        : undefined;
      send({
        route_id: routeId,
        event,
        calculator_id: properties.calculator_id as (typeof experienceIds)[number],
        ...(interaction ? { interaction } : {}),
      });
    },
  };
}
