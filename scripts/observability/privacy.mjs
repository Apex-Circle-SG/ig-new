import { ObservabilityError } from './config.mjs';

export const OPERATION_CODES = [
  'ask_answer',
  'ask_refusal',
  'ask_fallback',
  'ask_error',
  'feedback_source',
  'feedback_unclear',
  'feedback_unsafe',
  'ingest_success',
  'ingest_failure',
  'datadog_delivery_failure',
];
export const ROUTE_CATEGORIES = [
  'ask',
  'feedback',
  'calculator',
  'ingest',
  'discovery',
  'operations',
];
export const NEXT_CHECKS = [
  'review_source_coverage',
  'inspect_calculator_checks',
  'check_ingest_status',
  'review_deployment',
  'no_action',
];
export function exactKeys(value, keys) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).every((key) => keys.includes(key))
  );
}
export function validateOperations(value) {
  if (
    !exactKeys(value, ['day', 'counts']) ||
    typeof value.day !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.day)
  )
    throw new ObservabilityError('invalid_operation_aggregate');
  const date = new Date(`${value.day}T00:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value.day ||
    !exactKeys(value.counts, OPERATION_CODES)
  )
    throw new ObservabilityError('invalid_operation_aggregate');
  if (
    Object.values(value.counts).some(
      (count) => !Number.isSafeInteger(count) || count < 0 || count > 1_000_000_000,
    )
  )
    throw new ObservabilityError('invalid_operation_count');
  return {
    day: value.day,
    counts: Object.fromEntries(OPERATION_CODES.map((code) => [code, value.counts[code] ?? 0])),
  };
}
/** Reconstruct at source. Error objects, prompts and request objects are never forwarded. */
export function safeManualSpan(input) {
  if (
    !exactKeys(input, ['category', 'status', 'durationMs']) ||
    !ROUTE_CATEGORIES.includes(input.category) ||
    !['ok', 'error', 'refused'].includes(input.status) ||
    !Number.isFinite(input.durationMs) ||
    input.durationMs < 0 ||
    input.durationMs > 120_000
  )
    throw new ObservabilityError('invalid_manual_span');
  return {
    name: 'insightginie.operation',
    resource: input.category,
    status: input.status,
    durationMs: Math.round(input.durationMs),
  };
}
export function bitsTask(task) {
  if (exactKeys(task, ['kind']) && task.kind === 'synthetic-health')
    return 'Synthetic private health check. Do not use tools or access account data. Return exactly INSIGHTGINIE_READY.';
  if (!exactKeys(task, ['kind', 'aggregate']) || task.kind !== 'aggregate-triage')
    throw new ObservabilityError('unsupported_private_task');
  const aggregate = validateOperations(task.aggregate);
  return `Private operational triage of synthetic or daily aggregate counts only. Do not access account data, use tools, send messages, create tickets or change configuration. Return only a JSON object with keys severity (info|warning|critical), categories (array of supplied counter names), and nextChecks (array from ${NEXT_CHECKS.join('|')}). No prose, values, URLs or identifiers. Counts: ${JSON.stringify(aggregate)}`;
}
export function validateBitsAnswer(task, answer) {
  if (typeof answer !== 'string' || Buffer.byteLength(answer) > 4096)
    throw new ObservabilityError('invalid_private_answer');
  if (task.kind === 'synthetic-health') {
    if (answer.trim() !== 'INSIGHTGINIE_READY')
      throw new ObservabilityError('invalid_private_answer');
    return { marker: 'INSIGHTGINIE_READY' };
  }
  let result;
  try {
    result = JSON.parse(answer);
  } catch {
    throw new ObservabilityError('invalid_private_answer');
  }
  if (
    !exactKeys(result, ['severity', 'categories', 'nextChecks']) ||
    !['info', 'warning', 'critical'].includes(result.severity) ||
    !Array.isArray(result.categories) ||
    result.categories.length > 10 ||
    result.categories.some((code) => !OPERATION_CODES.includes(code)) ||
    !Array.isArray(result.nextChecks) ||
    result.nextChecks.length > 5 ||
    result.nextChecks.some((code) => !NEXT_CHECKS.includes(code))
  )
    throw new ObservabilityError('invalid_private_answer');
  return {
    severity: result.severity,
    categories: [...new Set(result.categories)],
    nextChecks: [...new Set(result.nextChecks)],
  };
}
