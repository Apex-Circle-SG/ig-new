import { datadogSite, ObservabilityError } from './config.mjs';
import { safeManualSpan } from './privacy.mjs';

/** Optional SDK adapter. It imports/installs no SDK and is never loaded by the web app. */
export function configureManualApm(tracer, env = process.env) {
  if (env.DD_APM_ENABLED !== 'true') return undefined;
  if (!['production', 'staging', 'development'].includes(env.DD_ENV ?? 'production'))
    throw new ObservabilityError('invalid_environment_tag');
  datadogSite(env); // The local Agent, configured separately, owns the site destination.
  return tracer.init({
    service: 'insightginie-web',
    env: env.DD_ENV ?? 'production',
    plugins: false,
    logInjection: false,
    runtimeMetrics: false,
    profiling: false,
    clientIpEnabled: false,
    sampleRate: 0.05,
  });
}
export function recordManualSpan(tracer, input, now = Date.now()) {
  const safe = safeManualSpan(input);
  const span = tracer.startSpan(safe.name, {
    startTime: now - safe.durationMs,
    tags: { 'resource.name': safe.resource, 'operation.status': safe.status },
  });
  if (safe.status === 'error') {
    span.setTag('error', true);
    span.setTag('error.type', 'OperationalFailure');
    span.setTag('error.message', 'A categorized operation failed.');
  }
  span.finish(now);
}
