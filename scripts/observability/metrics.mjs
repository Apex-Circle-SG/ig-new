import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { datadogConfig, ObservabilityError } from './config.mjs';
import { validateOperations, OPERATION_CODES } from './privacy.mjs';
import { atomicJson, readSmallJson, requestJson, withStateLock } from './io.mjs';

export function metricPayload(aggregate, tags, now = Date.now()) {
  const safe = validateOperations(aggregate);
  if (
    !Array.isArray(tags) ||
    tags.length !== 2 ||
    !tags.includes('service:insightginie-web') ||
    !tags.some((tag) => ['env:production', 'env:staging', 'env:development'].includes(tag))
  )
    throw new ObservabilityError('invalid_metric_tags');
  if (safe.day !== new Date(now).toISOString().slice(0, 10))
    throw new ObservabilityError('stale_operation_aggregate');
  return {
    series: OPERATION_CODES.map((code) => ({
      metric: `insightginie.operations.${code}.daily`,
      type: 3,
      points: [{ timestamp: Math.floor(now / 1000), value: safe.counts[code] }],
      tags,
    })),
  };
}

/** Explicit server-only operation. No scheduling or network work occurs on import. */
export async function exportMetrics({
  env = process.env,
  fetcher = fetch,
  now = Date.now,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  if (env.DD_METRICS_ENABLED !== 'true') return { status: 'disabled' };
  const config = datadogConfig(env);
  if (!env.OPERATIONS_DIRECTORY || !path.isAbsolute(env.OPERATIONS_DIRECTORY))
    throw new ObservabilityError('missing_operations_directory');
  return withStateLock(env.OBSERVABILITY_STATE_DIRECTORY, 'metrics', async () => {
    const timestamp = now();
    const statePath = path.join(env.OBSERVABILITY_STATE_DIRECTORY, 'metrics-state.json');
    const state = await readSmallJson(statePath, { lastAttemptAt: 0 }, 1024);
    if (
      Object.keys(state).length !== 1 ||
      !Number.isSafeInteger(state.lastAttemptAt) ||
      state.lastAttemptAt < 0
    )
      throw new ObservabilityError('invalid_metrics_state');
    if (timestamp - state.lastAttemptAt < 300_000) return { status: 'rate_limited' };
    const aggregate = await readSmallJson(
      path.join(env.OPERATIONS_DIRECTORY, `${new Date(timestamp).toISOString().slice(0, 10)}.json`),
      null,
    );
    if (aggregate === null) return { status: 'no_data' };
    const body = JSON.stringify(metricPayload(aggregate, config.tags, timestamp));
    if (Buffer.byteLength(body) > 16_384) throw new ObservabilityError('metric_payload_too_large');
    await atomicJson(statePath, { lastAttemptAt: timestamp });
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await requestJson(fetcher, `${config.origin}/api/v2/series`, {
        method: 'POST',
        headers: config.headers,
        body,
      });
      if (response.status === 202) return { status: 'delivered', series: OPERATION_CODES.length };
      if (attempt === 0 && [429, 502, 503, 504].includes(response.status)) {
        await sleep(1000);
        continue;
      }
      throw new ObservabilityError('metric_delivery_rejected');
    }
    throw new ObservabilityError('metric_delivery_failed');
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    console.log(JSON.stringify(await exportMetrics()));
  } catch (error) {
    console.error(
      JSON.stringify({
        status: 'failed',
        code: error instanceof ObservabilityError ? error.code : 'metric_export_failed',
      }),
    );
    process.exitCode = 1;
  }
}
