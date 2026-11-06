export type Inputs = Record<string, string>;
export type Value = string | number | null;
export type Metric = { label: string; value: Value; unit?: string };
export type Table = { title: string; columns: string[]; rows: Value[][] };
export type Chart = {
  title: string;
  labels: string[];
  series: { label: string; values: (number | null)[] }[];
};
export type Result = { metrics: Metric[]; tables: Table[]; charts: Chart[]; notes: string[] };
export const result = (): Result => ({ metrics: [], tables: [], charts: [], notes: [] });
export function number(v: Inputs, key: string, min = -1e12, max = 1e12) {
  const raw = v[key]?.trim();
  if (!raw || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw))
    throw Error(`Enter a number for ${key}.`);
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max)
    throw Error(`${key} must be between ${min} and ${max}.`);
  return n;
}
export const pct = (v: Inputs, key: string, min = 0, max = 100) => number(v, key, min, max) / 100;
export function integer(v: Inputs, key: string, min: number, max: number) {
  const n = number(v, key, min, max);
  if (!Number.isInteger(n)) throw Error(`${key} must be a whole number.`);
  return n;
}
export const optional = (v: Inputs, key: string) => (v[key]?.trim() ? number(v, key) : null);
export function choice(v: Inputs, key: string, options: readonly string[]) {
  if (!options.includes(v[key])) throw Error(`Choose a valid ${key}.`);
  return v[key];
}
export function csv(text: string): string[][] {
  if (text.length > 2_000_000) throw Error('The table exceeds the 2 MB limit.');
  const rows: string[][] = [];
  let row: string[] = [],
    cell = '',
    quoted = false,
    closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (closed && c !== ',' && c !== '\t' && c !== '\n' && c !== '\r' && !/\s/.test(c))
      throw Error('Unexpected characters after a quoted CSV field.');
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted) {
        quoted = false;
        closed = true;
      } else if (!cell.trim() && !closed) quoted = true;
      else throw Error('Quote a complete CSV field.');
    } else if (!quoted && (c === ',' || c === '\t')) {
      row.push(cell.trim());
      cell = '';
      closed = false;
    } else if (!quoted && (c === '\n' || c === '\r')) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
      closed = false;
    } else cell += c;
  }
  if (quoted) throw Error('Close the quoted CSV field.');
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function rows(v: Inputs, key: string, columns: number, min = 1, max = 30) {
  const data = csv(v[key] ?? '');
  if (data.length < min || data.length > max || data.some((r) => r.length !== columns))
    throw Error(`${key}: enter ${min}–${max} rows with ${columns} columns, without a header.`);
  return data;
}
export function cell(raw: string, label: string, min = -1e12, max = 1e12) {
  return number({ [label]: raw }, label, min, max);
}
export function npv(rate: number, flows: number[], start = 1) {
  if (rate <= -1 || !Number.isFinite(rate)) throw Error('Discount rate must exceed −100%.');
  return flows.reduce((sum, f, i) => sum + f / (1 + rate) ** (i + start), 0);
}
// Conventional investment flows have one sign change; don't choose a misleading IRR for other patterns.
export function irr(flows: number[]): number | null {
  const nonzero = flows.filter((x) => x !== 0);
  if (
    flows.length < 2 ||
    flows[0] >= 0 ||
    nonzero.slice(1).some((x) => x < 0) ||
    !nonzero.some((x) => x > 0)
  )
    return null;
  const scale = Math.max(...flows.map(Math.abs));
  const normalized = flows.map((x) => x / scale);
  let lo = -0.999999,
    hi = 1;
  while (npv(hi, normalized, 0) > 0 && hi < 1e6) hi = hi * 2 + 1;
  if (npv(hi, normalized, 0) > 0) return null;
  for (let n = 0; n < 100; n++) {
    const mid = (lo + hi) / 2;
    if (npv(mid, normalized, 0) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
export function csvExport(table: Table) {
  return [table.columns, ...table.rows]
    .map((row) =>
      row
        .map((v) => {
          const s = v == null ? '' : String(v);
          const safe = typeof v === 'string' && /^(?:\s*[=+\-@]|[\t\r\n])/.test(s) ? "'" + s : s;
          return '"' + safe.replaceAll('"', '""') + '"';
        })
        .join(','),
    )
    .join('\r\n');
}

export function formatDealValue(value: Value) {
  if (value === null) return 'Not calculated / not reported';
  if (typeof value !== 'number') return value;
  return new Intl.NumberFormat('en-US', {
    maximumSignificantDigits: 8,
    ...(value !== 0 && Math.abs(value) < 0.00001 ? { notation: 'scientific' as const } : {}),
  }).format(value);
}
