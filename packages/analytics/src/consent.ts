export const ANALYTICS_COOKIE = 'ig_analytics';
export const ANALYTICS_CHANGE_EVENT = 'insightginie:analytics-choice';

/** No browser identifiers. Explicit choice and browser privacy signals govern collection. */
export function analyticsConsentGranted() {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return false;
  if (
    navigator.doNotTrack === '1' ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
  )
    return false;
  return document.cookie.split(';').some((part) => part.trim() === `${ANALYTICS_COOKIE}=allow`);
}
