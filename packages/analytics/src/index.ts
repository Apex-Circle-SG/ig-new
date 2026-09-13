export const eventNames = [
  'calculator_view',
  'calculator_started',
  'calculator_completed',
  'calculator_result_shared',
  'related_calculator_clicked',
  'tool_exported',
  'article_engaged',
  'organic_landing',
  'ask_answer_cited',
  'ask_fallback',
  'ask_refusal',
] as const;
export const experienceIds = [
  'individual-income-percentile',
  'ai-workflow-roi',
  'cash-runway',
  'break-even',
  'business-loan',
  'drawdown-recovery',
  'portfolio-concentration',
  'ask',
  'insights',
  'research',
] as const;
export type AnalyticsEvent = (typeof eventNames)[number];
export type SafeProperties = {
  calculator_id: string;
  interaction?: 'form' | 'example' | 'what-if' | 'copy-link';
};
export interface AnalyticsProvider {
  track(event: AnalyticsEvent, properties: SafeProperties): void;
}
let provider: AnalyticsProvider | undefined;
export function configureAnalytics(next?: AnalyticsProvider) {
  provider = next;
}
/** Explicit allowlist: never forward arbitrary objects, income, URLs or user input. */
export function track(event: AnalyticsEvent, properties: SafeProperties) {
  if (!eventNames.includes(event)) return;
  const safe: SafeProperties = {
    calculator_id: (experienceIds as readonly string[]).includes(properties.calculator_id)
      ? properties.calculator_id
      : 'unknown',
  };
  if (['form', 'example', 'what-if', 'copy-link'].includes(properties.interaction ?? ''))
    safe.interaction = properties.interaction;
  try {
    provider?.track(event, safe);
  } catch {
    /* Analytics must never prevent a calculation. */
  }
}
export { createFirstPartyProvider, sendAggregateEvent } from './browser';
export { analyticsConsentGranted, ANALYTICS_COOKIE, ANALYTICS_CHANGE_EVENT } from './consent';
