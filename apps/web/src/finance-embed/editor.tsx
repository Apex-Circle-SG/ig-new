import { useMemo, useState } from 'react';
import * as z from 'zod';
import {
  calculateFinancialTool,
  compareBusinessLoanScenarios,
  formatFinanceValue,
  getFinanceDefaultInputs,
  getFinanceTool,
  type FinanceToolId,
  type FinancialToolResult,
} from '@insightginie/calculators';
import { useHydrated } from '../components/use-hydrated';
const valuesFor = (id: FinanceToolId) =>
  Object.fromEntries(
    Object.entries(getFinanceDefaultInputs(id)).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(', ') : String(value),
    ]),
  );
export function FinanceEditor({ toolId }: { toolId: FinanceToolId }) {
  const tool = getFinanceTool(toolId)!;
  const hydrated = useHydrated();
  const [values, setValues] = useState<Record<string, string>>(() => valuesFor(toolId));
  const [result, setResult] = useState<FinancialToolResult>(() =>
    calculateFinancialTool(toolId, getFinanceDefaultInputs(toolId)),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');
  const [dirty, setDirty] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [snapshot, setSnapshot] = useState<Record<string, number | number[]>>(() =>
    getFinanceDefaultInputs(toolId),
  );
  const [baseline, setBaseline] = useState<Record<string, number | number[]> | null>(null);
  const comparison = useMemo(
    () =>
      toolId === 'business-loan' && baseline
        ? compareBusinessLoanScenarios(baseline, snapshot)
        : null,
    [toolId, baseline, snapshot],
  );
  function calculate() {
    window.parent.postMessage({ channel: 'insightginie:finance:v1', type: 'started', toolId }, '*');
    const inputs: Record<string, number | number[]> = {};
    const bad: Record<string, string> = {};
    for (const field of tool.fields) {
      const text = values[field.key].trim();
      if (field.type === 'holdings') {
        const parts = text.split(/[,\n]/).map((value) => value.trim());
        if (parts.length > 100 || parts.some((value) => !/^\d+(\.\d+)?$/.test(value)))
          bad[field.key] = 'Enter 1–100 nonnegative numbers, separated by commas or new lines.';
        else inputs[field.key] = parts.map(Number);
      } else {
        const cleaned = text.replace(/[$,\s]/g, '');
        if (!/^-?\d+(\.\d+)?$/.test(cleaned))
          bad[field.key] = 'Enter a number using digits and an optional decimal point.';
        else inputs[field.key] = Number(cleaned);
      }
    }
    if (Object.keys(bad).length) {
      setErrors(bad);
      return;
    }
    try {
      const next = calculateFinancialTool(toolId, inputs);
      setResult(next);
      setSnapshot(inputs);
      setErrors({});
      setHasRun(true);
      setDirty(false);
      setStatus('');
      window.parent.postMessage(
        { channel: 'insightginie:finance:v1', type: 'completed', toolId },
        '*',
      );
    } catch (error) {
      if (error instanceof z.ZodError)
        for (const issue of error.issues) bad[String(issue.path[0] ?? 'form')] = issue.message;
      else bad.form = 'These inputs exceed the supported range. Please check them and try again.';
      setErrors(bad);
    }
  }
  function download() {
    window.parent.postMessage(
      { channel: 'insightginie:finance:v1', type: 'exported', toolId },
      '*',
    );
    const rows: (string | number)[][] = [
      ['InsightGinie scenario', tool.title],
      ['Formula version', result.formulaVersion],
      [
        comparison ? 'Current scenario' : 'Scenario',
        'Example inputs are illustrative; this file contains your current calculated inputs.',
      ],
      [],
      ['Input', 'Value'],
    ];
    for (const field of tool.fields)
      rows.push([
        field.label,
        Array.isArray(snapshot[field.key])
          ? (snapshot[field.key] as number[]).join('; ')
          : (snapshot[field.key] as number),
      ]);
    rows.push([], ['Result', 'Value', 'Unit']);
    for (const row of result.rows)
      rows.push([row.label, row.value ?? 'Not reached / undefined', row.format]);
    if (result.schedule) {
      rows.push(
        [],
        [comparison ? `Current scenario: ${result.schedule.caption}` : result.schedule.caption],
        result.schedule.columns.map((column) => column.label),
      );
      for (const row of result.schedule.rows)
        rows.push(
          result.schedule.columns.map((column) => row[column.key] ?? 'Not reached / undefined'),
        );
    }
    if (comparison) {
      rows.push(
        [],
        ['Loan comparison', 'Change = current scenario minus kept scenario'],
        ['Inputs', 'Kept scenario', 'Current scenario', 'Unit'],
      );
      for (const field of tool.fields) {
        const key = field.key as keyof typeof comparison.baselineInputs;
        rows.push([
          field.label,
          comparison.baselineInputs[key],
          comparison.currentInputs[key],
          field.unit ?? '',
        ]);
      }
      rows.push([], ['Result', 'Kept scenario', 'Current scenario', 'Change', 'Unit']);
      for (const row of comparison.rows)
        rows.push([row.label, row.baseline, row.current, row.delta, row.format]);
      rows.push(
        [],
        ['Kept scenario: monthly amortization schedule'],
        comparison.baseline.schedule!.columns.map((column) => column.label),
      );
      for (const row of comparison.baseline.schedule!.rows)
        rows.push(comparison.baseline.schedule!.columns.map((column) => row[column.key] ?? 0));
      rows.push(
        [],
        [comparison.schedule.caption, 'Zero payment and balance after payoff'],
        comparison.schedule.columns.map((column) => column.label),
      );
      for (const row of comparison.schedule.rows)
        rows.push(comparison.schedule.columns.map((column) => row[column.key] ?? 0));
    }
    rows.push(
      [],
      [comparison ? 'Shared assumptions for both scenarios' : 'Assumptions'],
      ...result.assumptions.map((text) => [text]),
      [],
      ['Source', 'URL'],
      ...result.sources.map((source) => [source.name, source.url]),
    );
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `insightginie-${toolId}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(
      `${comparison ? 'Both scenarios' : 'Scenario'} downloaded locally. The file may contain sensitive financial information.`,
    );
  }
  function reset() {
    setValues(valuesFor(toolId));
    setSnapshot(getFinanceDefaultInputs(toolId));
    setResult(calculateFinancialTool(toolId, getFinanceDefaultInputs(toolId)));
    setErrors({});
    setDirty(false);
    setHasRun(false);
    setStatus(
      baseline
        ? 'Example inputs restored for the current scenario. Your kept comparison remains until cleared or reloaded.'
        : 'Example inputs restored.',
    );
  }
  return (
    <div className="finance-tool">
      <section className="finance-inputs" aria-labelledby="inputs-heading">
        <div className="finance-kicker">01 · YOUR ASSUMPTIONS</div>
        <h2 id="inputs-heading">Make the numbers yours.</h2>
        <p className="finance-intro">
          The starting values are an illustration. Enter your own assumptions to compare.
        </p>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            calculate();
          }}
        >
          <div className="finance-fields">
            {tool.fields.map((field) => (
              <div className="finance-field" key={field.key}>
                <label htmlFor={field.key}>
                  {field.label}
                  {field.unit && <span>{field.unit}</span>}
                </label>
                {field.type === 'holdings' ? (
                  <textarea
                    id={field.key}
                    rows={4}
                    value={values[field.key]}
                    disabled={!hydrated}
                    maxLength={2000}
                    onChange={(event) => {
                      setValues({ ...values, [field.key]: event.target.value });
                      setDirty(true);
                    }}
                    aria-invalid={Boolean(errors[field.key])}
                    aria-describedby={`${field.key}-help${errors[field.key] ? ` ${field.key}-error` : ''}`}
                  />
                ) : (
                  <input
                    id={field.key}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    disabled={!hydrated}
                    maxLength={24}
                    value={values[field.key]}
                    onChange={(event) => {
                      setValues({ ...values, [field.key]: event.target.value });
                      setDirty(true);
                    }}
                    aria-invalid={Boolean(errors[field.key])}
                    aria-describedby={`${field.key}-help${errors[field.key] ? ` ${field.key}-error` : ''}`}
                  />
                )}
                <p id={`${field.key}-help`} className="finance-help">
                  {field.help}
                </p>
                {errors[field.key] && (
                  <p id={`${field.key}-error`} className="finance-error" role="alert">
                    {errors[field.key]}
                  </p>
                )}
              </div>
            ))}
          </div>
          {errors.form && (
            <p className="finance-error" role="alert">
              {errors.form}
            </p>
          )}
          <button className="finance-primary" type="submit" disabled={!hydrated}>
            Calculate scenario <span aria-hidden="true">→</span>
          </button>
          <button className="finance-reset" type="button" onClick={reset} disabled={!hydrated}>
            Reset example
          </button>
        </form>
        <p className="finance-private">
          Your inputs and results stay in this isolated browser tool. They are not sent to
          advertisers or analytics.
        </p>
      </section>
      <section className="finance-results" aria-labelledby="results-heading">
        <div className="finance-kicker">02 · {hasRun ? 'YOUR SCENARIO' : 'WORKED EXAMPLE'}</div>
        <h2 id="results-heading">A clearer view.</h2>
        {dirty && (
          <p className="finance-stale" role="status">
            Inputs changed. Calculate again to update the results below.
          </p>
        )}
        <div aria-live="polite" aria-atomic="true" className="finance-primary-result">
          <span>{result.rows[0].label}</span>
          <strong>{formatFinanceValue(result.rows[0].value, result.rows[0].format)}</strong>
          {result.rows[0].detail && <p>{result.rows[0].detail}</p>}
        </div>
        <p className="finance-summary">{result.summary}</p>
        <dl className="finance-result-rows">
          {result.rows.slice(1).map((row) => (
            <div key={row.label}>
              <dt>
                {row.label}
                {row.detail && <small>{row.detail}</small>}
              </dt>
              <dd>{formatFinanceValue(row.value, row.format)}</dd>
            </div>
          ))}
        </dl>
        {result.schedule && (
          <details className="finance-schedule">
            <summary>View the calculation table</summary>
            <div
              className="finance-table-scroll"
              tabIndex={0}
              role="region"
              aria-label={result.schedule.caption}
            >
              <table>
                <caption>{result.schedule.caption}</caption>
                <thead>
                  <tr>
                    {result.schedule.columns.map((column) => (
                      <th scope="col" key={column.key}>
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.rows.map((row, index) => (
                    <tr key={index}>
                      {result.schedule!.columns.map((column, columnIndex) =>
                        columnIndex === 0 ? (
                          <th key={column.key} scope="row">
                            {formatFinanceValue(row[column.key], column.format)}
                          </th>
                        ) : (
                          <td key={column.key}>
                            {formatFinanceValue(row[column.key], column.format)}
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
        {toolId === 'business-loan' && (
          <div className="finance-keep">
            <div className="finance-actions">
              <button
                type="button"
                disabled={!hydrated || dirty}
                onClick={() => {
                  setBaseline({ ...snapshot });
                  setStatus(
                    'Comparison kept in this tool only. Change the inputs and calculate again to compare.',
                  );
                }}
              >
                {baseline ? 'Replace kept comparison' : 'Keep as comparison'}
              </button>
              {baseline && (
                <button
                  type="button"
                  onClick={() => {
                    setBaseline(null);
                    setStatus('Kept comparison cleared.');
                  }}
                >
                  Clear comparison
                </button>
              )}
            </div>
            <p className="finance-help">
              Keep a calculated scenario, then change your assumptions and calculate again. The
              comparison is cleared when you reload or leave this page.
            </p>
          </div>
        )}
        <div className="finance-actions">
          <button type="button" onClick={download} disabled={!hydrated || dirty}>
            {comparison ? 'Download comparison CSV' : 'Download scenario CSV'}
          </button>
          <button type="button" onClick={() => window.print()} disabled={!hydrated || dirty}>
            {comparison ? 'Print comparison' : 'Print scenario'}
          </button>
        </div>
        <p className="finance-help" role="status">
          {status ||
            'Downloads and printouts include the calculated inputs and results. Nothing is uploaded.'}
        </p>
        <div className="finance-assumptions">
          <h3>Assumptions in view</h3>
          <ul>
            {result.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
          <p>
            Formula version {result.formulaVersion}. All rates and values are your assumptions, not
            live market data.
          </p>
          <a
            href={`https://insightginie.com/tools/${toolId}/#methodology`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Methodology and sources ↗
          </a>
        </div>
      </section>
      {comparison && (
        <section className="finance-comparison" aria-labelledby="comparison-heading">
          <div className="finance-kicker">03 · TWO SCENARIOS, ONE MODEL</div>
          <h2 id="comparison-heading">Compare loan scenarios.</h2>
          <p className="finance-intro">
            Change means current scenario minus kept scenario. A lower payment can still mean a
            higher total cost or a longer payoff. The fee is paid separately in both scenarios.
          </p>
          {dirty && (
            <p className="finance-stale" role="status">
              This comparison uses your last calculation. Calculate again to include the edited
              inputs.
            </p>
          )}
          <div
            className="finance-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Loan scenario comparison"
          >
            <table className="finance-comparison-table">
              <caption>Payment, total cost and payoff comparison</caption>
              <thead>
                <tr>
                  <th scope="col">Result</th>
                  <th scope="col">Kept scenario</th>
                  <th scope="col">Current scenario</th>
                  <th scope="col">Change (current − kept)</th>
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row">{row.label}</th>
                    <td>{formatFinanceValue(row.baseline, row.format)}</td>
                    <td>{formatFinanceValue(row.current, row.format)}</td>
                    <td>
                      {row.delta > 0 ? '+' : ''}
                      {formatFinanceValue(row.delta, row.format)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            className="finance-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Inputs for both loan scenarios"
          >
            <table className="finance-comparison-table">
              <caption>Inputs behind both scenarios</caption>
              <thead>
                <tr>
                  <th scope="col">Input</th>
                  <th scope="col">Kept scenario</th>
                  <th scope="col">Current scenario</th>
                </tr>
              </thead>
              <tbody>
                {tool.fields.map((field) => {
                  const key = field.key as keyof typeof comparison.baselineInputs;
                  const format =
                    field.unit === '%'
                      ? 'percent'
                      : field.unit === 'months'
                        ? 'months'
                        : 'currency';
                  return (
                    <tr key={key}>
                      <th scope="row">{field.label}</th>
                      <td>{formatFinanceValue(comparison.baselineInputs[key], format)}</td>
                      <td>{formatFinanceValue(comparison.currentInputs[key], format)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <details className="finance-schedule">
            <summary>Compare amortization by month</summary>
            <p className="finance-help">
              Balances are after each monthly payment. Payment and balance are zero after payoff.
              Separately paid upfront fees are included in total cost above, not these monthly
              payments.
            </p>
            <div
              className="finance-table-scroll"
              tabIndex={0}
              role="region"
              aria-label={comparison.schedule.caption}
            >
              <table>
                <caption>{comparison.schedule.caption}</caption>
                <thead>
                  <tr>
                    {comparison.schedule.columns.map((column) => (
                      <th scope="col" key={column.key}>
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.schedule.rows.map((row, index) => (
                    <tr key={index}>
                      {comparison.schedule.columns.map((column, columnIndex) =>
                        columnIndex === 0 ? (
                          <th key={column.key} scope="row">
                            {formatFinanceValue(row[column.key], column.format)}
                          </th>
                        ) : (
                          <td key={column.key}>
                            {formatFinanceValue(row[column.key], column.format)}
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <p className="finance-help">
            Both scenarios use the fixed-rate, month-end-payment assumptions above and formula
            version {comparison.formulaVersion}. Total borrowing cost is interest plus the upfront
            fee, not APR. This comparison does not assess affordability or recommend a lender.
          </p>
        </section>
      )}
    </div>
  );
}
