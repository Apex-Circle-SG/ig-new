import { useState } from 'react';
import type { Chart, Table } from '@insightginie/calculators/deals';
import { csvExport, formatDealValue } from '@insightginie/calculators/deals';
export const format = formatDealValue;
export function notify(toolId: string, type: string) {
  window.parent.postMessage({ channel: 'insightginie:finance:v1', toolId, type }, '*');
}
export function download(name: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ResultsTable({ table, id }: { table: Table; id: string }) {
  const [limit, setLimit] = useState(20);
  return (
    <details className="result-table">
      <summary>
        {table.title} · {table.rows.length} rows
      </summary>
      <div className="table-scroll" role="region" aria-label={table.title} tabIndex={0}>
        <table>
          <caption>{table.title}</caption>
          <thead>
            <tr>
              {table.columns.map((c, i) => (
                <th key={i} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.slice(0, limit).map((row, i) => (
              <tr key={i}>
                {row.map((v, j) =>
                  j === 0 ? (
                    <th scope="row" key={j}>
                      {format(v)}
                    </th>
                  ) : (
                    <td key={j}>{format(v)}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {limit < table.rows.length && (
        <button onClick={() => setLimit(limit + 50)}>Show 50 more rows</button>
      )}
      <button
        onClick={() => {
          download(
            `${id}-${table.title.replace(/[^a-z0-9]/gi, '-').slice(0, 70)}.csv`,
            csvExport(table),
            'text/csv',
          );
          notify(id, 'exported');
        }}
      >
        Export all rows as CSV
      </button>
    </details>
  );
}
export function ChartView({ chart, id }: { chart: Chart; id: string }) {
  const all = chart.series.flatMap((s) => s.values.filter((v): v is number => v !== null)),
    min = Math.min(0, ...all),
    max = Math.max(all.every((v) => v === 0) ? 1 : 0, ...all),
    span = max - min || 1;
  const y = (v: number) => 185 - ((v - min) / span) * 150,
    x = (i: number) => 55 + (i / Math.max(1, chart.labels.length - 1)) * 430;
  const colors = ['#6551b8', '#226b64', '#99445b', '#8b6514'];
  return (
    <figure className="chart">
      <figcaption>{chart.title}</figcaption>
      <svg
        viewBox="0 0 520 240"
        role="img"
        aria-label={`${chart.title}. ${chart.series.map((s) => s.label).join(', ')}. Complete values follow in the expandable table.`}
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <path d={`M55 ${35 + 150 * t} H485`} stroke="#ded7f2" />
            <text x="48" y={39 + 150 * t} textAnchor="end" fontSize="10" fill="#454b62">
              {format(max - span * t)}
            </text>
          </g>
        ))}
        {chart.series.map((s, i) => {
          let active = false;
          const d = s.values
            .map((v, j) => {
              if (v === null) {
                active = false;
                return '';
              }
              const command = active ? 'L' : 'M';
              active = true;
              return `${command}${x(j)} ${y(v)}`;
            })
            .join(' ');
          return (
            <path
              key={s.label}
              d={d}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="2.5"
              strokeDasharray={i % 2 ? '6 3' : undefined}
            />
          );
        })}
        {chart.labels.map((label, i) =>
          i === 0 ||
          i === chart.labels.length - 1 ||
          (chart.labels.length > 4 && i % Math.ceil(chart.labels.length / 4) === 0) ? (
            <text key={i} x={x(i)} y="207" textAnchor="middle" fontSize="9" fill="#454b62">
              {label.length > 14 ? label.slice(0, 14) : label}
            </text>
          ) : null,
        )}
      </svg>
      <p className="legend">
        {chart.series.map((s, i) => (
          <span key={s.label}>
            <span style={{ color: colors[i % colors.length] }}>{i % 2 ? '┄' : '━'}</span> {s.label}
          </span>
        ))}
      </p>
      <ResultsTable
        id={id}
        table={{
          title: chart.title + ' — chart values',
          columns: ['Position', ...chart.series.map((s) => s.label)],
          rows: chart.labels.map((label, i) => [
            label,
            ...chart.series.map((s) => s.values[i] ?? null),
          ]),
        }}
      />
    </figure>
  );
}
