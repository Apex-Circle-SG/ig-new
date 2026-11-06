import { acquisition } from './acquisition';
import { debtCapacity } from './debt';
import { lbo } from './lbo';
import { valuation } from './valuation';
import { saas } from './saas';
import { vwap } from './vwap';
import type { Inputs, Result } from './common';
export * from './common';
export * from './definitions';
export const DEAL_FORMULA_VERSION = '2026-11-06.1';
const models: Record<string, (inputs: Inputs) => Result> = {
  'acquisition-impact': acquisition,
  'debt-capacity': debtCapacity,
  'lbo-recapitalization': lbo,
  'valuation-workbench': valuation,
  'saas-scale': saas,
  'vwap-volume': vwap,
};
export function calculateDeal(id: string, inputs: Inputs): Result {
  if (!Object.hasOwn(models, id)) throw Error('Unknown financial model.');
  const out = models[id](inputs);
  const check = (v: unknown) => {
    if (typeof v === 'number' && !Number.isFinite(v))
      throw Error(
        'These assumptions overflow the calculation. Reduce the scale/rates and inspect the methodology.',
      );
  };
  out.metrics.forEach((m) => check(m.value));
  out.tables.forEach((t) => t.rows.forEach((r) => r.forEach(check)));
  out.charts.forEach((c) => c.series.forEach((s) => s.values.forEach(check)));
  return out;
}
