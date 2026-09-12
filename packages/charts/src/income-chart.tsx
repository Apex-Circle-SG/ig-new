type Datum = {
  label: string;
  lower: number | null;
  upper: number | null;
  count: number;
  share: number;
  cumulativeShare: number;
};
export function IncomeChart({
  data,
  income,
  compact = false,
}: {
  data: Datum[];
  income: number;
  compact?: boolean;
}) {
  const max = Math.max(...data.map((d) => d.share), 1);
  return (
    <div className={compact ? 'distribution-chart compact-chart' : 'distribution-chart'}>
      <div className="chart-caption">
        <span>THE INCOME DISTRIBUTION</span>
        <span>
          <i /> Your income band
        </span>
      </div>
      <svg
        viewBox="0 0 540 142"
        role="img"
        aria-label={`Share of US people age 15 and over in each income band. Your income is $${income.toLocaleString('en-US')}. Each bar represents one published band; band widths vary.`}
      >
        <line x1="8" y1="114" x2="532" y2="114" stroke="#dcddea" />
        {data.map((d, i) => {
          const active =
            (d.lower === null || income >= d.lower) && (d.upper === null || income < d.upper);
          const width = 524 / data.length;
          const height = (d.share / max) * 90;
          return (
            <rect
              key={d.label}
              x={8 + i * width + 2}
              y={114 - height}
              width={Math.max(1, width - 4)}
              height={Math.max(1, height)}
              rx="3"
              fill={active ? '#5c48dc' : '#d5cef7'}
            >
              <title>{`${d.label}: ${d.share.toFixed(1)}%${active ? ' — your band' : ''}`}</title>
            </rect>
          );
        })}
        <text x="8" y="136" fill="#62677b" fontSize="11">
          Lower income
        </text>
        <text x="532" y="136" textAnchor="end" fill="#62677b" fontSize="11">
          Higher income →
        </text>
      </svg>
      {!compact && (
        <>
          <p className="chart-note">
            Each bar shows a published income band. Band widths vary; bar height shows population
            share.
          </p>
          <details className="chart-table">
            <summary>View the data as a table</summary>
            <div className="table-scroll">
              <table>
                <caption>Income distribution, percent of people age 15 and over</caption>
                <thead>
                  <tr>
                    <th scope="col">Income band</th>
                    <th scope="col">Population share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d) => (
                    <tr key={d.label}>
                      <th scope="row">{d.label}</th>
                      <td>{d.share.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
