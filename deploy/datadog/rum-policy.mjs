/** Review template only. No browser SDK, application ID or client token is supplied. */
export const browserRumPolicy = Object.freeze({
  enabled: false,
  sessionSampleRate: 0,
  sessionReplaySampleRate: 0,
  trackUserInteractions: false,
  trackResources: false,
  trackLongTasks: false,
  trackViewsManually: true,
  defaultPrivacyLevel: 'mask',
});

// Datadog documents that view events cannot be discarded by beforeSend.
// This is only defense in depth for discardable events. Keep the SDK uninitialized.
export function denyBrowserRumEvent() {
  return false;
}
