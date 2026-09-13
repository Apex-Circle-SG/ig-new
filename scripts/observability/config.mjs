const sites = new Set([
  'datadoghq.com',
  'us3.datadoghq.com',
  'us5.datadoghq.com',
  'datadoghq.eu',
  'ap1.datadoghq.com',
  'ap2.datadoghq.com',
  'uk1.datadoghq.com',
  'ddog-gov.com',
  'us2.ddog-gov.com',
]);
const aliases = {
  US1: 'datadoghq.com',
  US3: 'us3.datadoghq.com',
  US5: 'us5.datadoghq.com',
  EU: 'datadoghq.eu',
  EU1: 'datadoghq.eu',
  AP1: 'ap1.datadoghq.com',
  AP2: 'ap2.datadoghq.com',
  UK1: 'uk1.datadoghq.com',
  US1FED: 'ddog-gov.com',
  US2FED: 'us2.ddog-gov.com',
};
export class ObservabilityError extends Error {
  constructor(code) {
    super(code);
    this.name = 'ObservabilityError';
    this.code = code;
  }
}
export function datadogSite(env) {
  const normalize = (value) =>
    value ? (aliases[value.toUpperCase()] ?? value.toLowerCase()) : undefined;
  const site = normalize(env.DD_SITE);
  const alias = normalize(env.DD_REGION);
  if (site && alias && site !== alias)
    throw new ObservabilityError('conflicting_region_configuration');
  const selected = site ?? alias ?? 'datadoghq.com';
  if (!sites.has(selected)) throw new ObservabilityError('unsupported_datadog_region');
  return selected;
}
export function datadogConfig(env, requireApplicationKey = false) {
  const site = datadogSite(env);
  if (!env.DD_API_KEY || (requireApplicationKey && !env.DD_APP_KEY))
    throw new ObservabilityError('missing_datadog_keys');
  const environment = env.DD_ENV ?? 'production';
  if (!['production', 'staging', 'development'].includes(environment))
    throw new ObservabilityError('invalid_environment_tag');
  if (env.DD_SERVICE && env.DD_SERVICE !== 'insightginie-web')
    throw new ObservabilityError('invalid_service_tag');
  return {
    site,
    origin: `https://api.${site}`,
    headers: {
      'DD-API-KEY': env.DD_API_KEY,
      ...(requireApplicationKey ? { 'DD-APPLICATION-KEY': env.DD_APP_KEY } : {}),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    tags: ['service:insightginie-web', `env:${environment}`],
  };
}
export function requiredPositiveInteger(value, code, maximum = 1_000_000) {
  if (!/^\d+$/.test(value ?? '')) throw new ObservabilityError(code);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum)
    throw new ObservabilityError(code);
  return parsed;
}
export function configuredUuid(value, code) {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value ?? ''))
    throw new ObservabilityError(code);
  return value;
}
