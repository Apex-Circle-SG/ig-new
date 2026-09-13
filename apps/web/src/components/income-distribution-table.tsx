'use client';

import { useState } from 'react';
import type { incomeDistributionRows } from '@insightginie/datasets';

export function IncomeDistributionTable({
  rows,
}: {
  rows: ReturnType<typeof incomeDistributionRows>;
}) {
  const [order, setOrder] = useState('income');
  const sorted = order === 'share' ? [...rows].sort((a, b) => b.share - a.share) : rows;
  return (
    <>
      <label className="table-sort">
        Order public income bands
        <select value={order} onChange={(event) => setOrder(event.target.value)}>
          <option value="income">Income, lowest to highest</option>
          <option value="share">Population share, largest first</option>
        </select>
      </label>
      <div
        className="data-table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Income distribution table"
      >
        <table className="income-data-table">
          <caption>
            US people age 15 and over, including people with no income. Counts are survey estimates.
          </caption>
          <thead>
            <tr>
              <th scope="col">Income band</th>
              <th scope="col">Estimated people</th>
              <th scope="col">Share</th>
              <th scope="col">Cumulative share</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.count.toLocaleString('en-US')}</td>
                <td>{row.share.toFixed(2)}%</td>
                <td>{row.cumulativeShare.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
