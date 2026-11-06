import { createRoot } from 'react-dom/client';
import { Component, useEffect, useState, type ReactNode } from 'react';
import {
  calculateDeal,
  defaults,
  getDealTool,
  DEAL_FORMULA_VERSION as FORMULA_VERSION,
  type Inputs,
  type Result,
} from '@insightginie/calculators/deals';
import history from '../lib/deal-materials/vwap-example.json';
import { Planner, plannerDefaults } from './planners';
import { ChartView, download, format, notify, ResultsTable } from './shared';
const id = document.documentElement.dataset.tool!;
const tool = getDealTool(id)!;
const initial = tool.kind === 'planner' ? plannerDefaults(id) : defaults(tool);
class Boundary extends Component<{ children: ReactNode; reset: string }, { error: string }> {
  state = { error: '' };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  componentDidUpdate(previous: { reset: string }) {
    if (previous.reset !== this.props.reset && this.state.error) this.setState({ error: '' });
  }
  render() {
    return this.state.error ? (
      <p role="alert">
        {this.state.error} Use Undo last edit or Reset example to restore the editor.
      </p>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const [values, setValues] = useState<Inputs>(initial),
    [previous, setPrevious] = useState(initial),
    [error, setError] = useState(''),
    [result, setResult] = useState<Result | null>(() =>
      tool.kind === 'calculator' ? calculateDeal(id, initial) : null,
    ),
    [calculated, setCalculated] = useState(JSON.stringify(initial)),
    [pins, setPins] = useState<{ name: string; result: Result }[]>([]),
    [name, setName] = useState('My scenario');
  const serialized = JSON.stringify(values),
    stale = serialized !== calculated;
  function update(key: string, value: string) {
    setPrevious(values);
    setValues((v) => ({ ...v, [key]: value }));
  }
  function friendly(message: string) {
    return tool.fields.reduce(
      (s, f) => s.replace(new RegExp('\\b' + f.key + '\\b', 'g'), f.label),
      message,
    );
  }
  async function importScenario(file?: File) {
    if (!file) return;
    try {
      if (file.size > 4000000) throw Error('Scenario is too large (maximum 4 MB).');
      const data = JSON.parse(await file.text());
      if (
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data) ||
        data.toolId !== id ||
        data.version !== FORMULA_VERSION ||
        !data.inputs ||
        Array.isArray(data.inputs) ||
        typeof data.inputs !== 'object'
      )
        throw Error('Choose a scenario exported by this tool and formula version.');
      const next = { ...initial };
      for (const [key, value] of Object.entries(data.inputs)) {
        if (!Object.hasOwn(initial, key) || typeof value !== 'string' || value.length > 2000000)
          throw Error('The scenario contains unsupported fields or values.');
        const field = tool.fields.find((f) => f.key === key);
        if (field?.options && !field.options.some((o) => o.value === value))
          throw Error('The scenario contains an unsupported selection.');
        if (
          id === 'culture-comparison' &&
          /\.[ab]$/.test(key) &&
          !['', '1', '2', '3', '4', '5'].includes(value)
        )
          throw Error('Culture ratings must be unrated or 1–5.');
        const suffix = key.split('.').at(-1)!;
        const plannerOptions: Record<string, string[]> = {
          status: ['Not started', 'Requested', 'Received', 'Reviewed', 'Blocked', 'Not applicable'],
          finding: ['Unknown', 'Open issue', 'Resolved', 'No issue identified'],
          priority: ['Low', 'Medium', 'High'],
          direction: ['higher', 'lower'],
          unit: ['currency', 'FTE', '%', 'percentage points', 'score /5', 'count'],
          group: [
            'Recurring savings',
            'One-off cash release',
            'People',
            'Customers',
            'Project',
            'Other',
          ],
        };
        if (
          tool.kind === 'planner' &&
          plannerOptions[suffix] &&
          !plannerOptions[suffix].includes(value)
        )
          throw Error('The scenario contains an unsupported planner selection.');
        next[key] = value;
      }
      if (tool.kind === 'calculator') calculateDeal(id, next);
      setPrevious(values);
      if (typeof data.name === 'string') setName(data.name.slice(0, 100));
      setValues(next);
      setError('');
    } catch (e) {
      setError(friendly((e as Error).message));
    }
  }
  useEffect(() => {
    const measure = () =>
      window.parent.postMessage(
        {
          channel: 'insightginie:finance:v1',
          toolId: id,
          type: 'resize',
          height: Math.min(5000, Math.max(320, Math.ceil(document.body.scrollHeight + 24))),
        },
        '*',
      );
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener('message', measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('message', measure);
    };
  }, []);
  return (
    <>
      <header>
        <h1>{tool.title}</h1>
        <p>{tool.description}</p>
        <p className="privacy">
          Private workspace · inputs stay in this frame · export to save your work
        </p>
      </header>
      <section className="scenario">
        <label>
          Scenario name
          <input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="actions">
          <button
            onClick={() => {
              download(
                `${id}-scenario.json`,
                JSON.stringify(
                  { version: FORMULA_VERSION, toolId: id, name, inputs: values },
                  null,
                  2,
                ),
              );
              notify(id, 'exported');
            }}
          >
            Export private scenario
          </button>
          <label className="upload">
            Import scenario
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                void importScenario(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          <button
            onClick={() => {
              setPrevious(values);
              setValues(initial);
              setError('');
            }}
          >
            Reset example
          </button>
          <button
            onClick={() => {
              const last = previous;
              setPrevious(values);
              setValues(last);
            }}
          >
            Undo last edit
          </button>
        </div>
        <p>
          Files may contain confidential inputs. Keep exported files private. Reloading clears this
          workspace.
        </p>
      </section>
      {error && <p role="alert">{error}</p>}
      {tool.kind === 'planner' ? (
        <Boundary reset={serialized}>
          <Planner id={id} values={values} update={update} />
        </Boundary>
      ) : (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const next = calculateDeal(id, values);
                setResult(next);
                setCalculated(serialized);
                setError('');
                notify(id, 'completed');
              } catch (e) {
                setError(friendly((e as Error).message));
              }
            }}
            onChange={() => notify(id, 'started')}
          >
            {[...new Set(tool.fields.map((f) => f.group))].map((group, i) => (
              <details key={group} open={i === 0}>
                <summary>{group}</summary>
                <div className="fields">
                  {tool.fields
                    .filter((f) => f.group === group)
                    .map((f) => (
                      <label key={f.key} className={f.kind === 'rows' ? 'wide' : ''}>
                        {f.label}
                        {f.kind === 'select' ? (
                          <select
                            value={values[f.key]}
                            onChange={(e) => update(f.key, e.target.value)}
                          >
                            {f.options!.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        ) : f.kind === 'rows' ? (
                          <textarea
                            rows={4}
                            value={values[f.key]}
                            onChange={(e) => update(f.key, e.target.value)}
                          />
                        ) : (
                          <input
                            type="number"
                            step="any"
                            value={values[f.key]}
                            onChange={(e) => update(f.key, e.target.value)}
                          />
                        )}
                        {f.help && <small>{f.help}</small>}
                      </label>
                    ))}
                </div>
              </details>
            ))}
            {id === 'vwap-volume' && (
              <div className="actions">
                <button
                  type="button"
                  onClick={() => {
                    setPrevious(values);
                    setValues({
                      ...values,
                      observations: history.map((r) => r.join(',')).join('\n'),
                      priceBasis: 'daily-close',
                      volumeMultiplier: '1',
                      sharesOutstanding: '',
                      start: '',
                      end: '',
                    });
                  }}
                >
                  Load all 2,022 historical sample rows
                </button>
                <label>
                  Import local price-volume CSV
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size <= 2000000) update('observations', await file.text());
                      else if (file) setError('CSV must be under 2 MB.');
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            )}
            <button type="submit">Calculate scenario</button>
          </form>
          {stale && <p role="status">Inputs changed. Calculate again to refresh the results.</p>}
          {result && (
            <section aria-label="Calculated results">
              <h2>Scenario results</h2>
              <p>
                {stale
                  ? 'These results belong to the previous calculation.'
                  : 'Results use the current inputs.'}{' '}
                Formula version {FORMULA_VERSION}.
              </p>
              <div className="metrics">
                {result.metrics.map((m) => (
                  <div key={m.label}>
                    <strong>
                      {format(m.value)} {m.unit}
                    </strong>
                    {m.label}
                  </div>
                ))}
              </div>
              {result.notes.map((n, i) => (
                <p key={i} className="note">
                  {n}
                </p>
              ))}
              {result.charts.map((c) => (
                <ChartView key={c.title} chart={c} id={id} />
              ))}
              {result.tables.map((t) => (
                <ResultsTable key={t.title} table={t} id={id} />
              ))}
              <button
                disabled={stale || pins.length >= 3}
                onClick={() =>
                  setPins([...pins, { name: name || `Scenario ${pins.length + 1}`, result }])
                }
              >
                Pin current results for comparison (up to 3)
              </button>
              {pins.length > 0 && (
                <>
                  <ResultsTable
                    id={id}
                    table={{
                      title: 'Pinned scenario comparison',
                      columns: ['Metric', ...pins.map((p) => p.name)],
                      rows: pins[0].result.metrics.map((m, i) => [
                        m.label + (m.unit ? ` (${m.unit})` : ''),
                        ...pins.map((p) => p.result.metrics[i]?.value ?? null),
                      ]),
                    }}
                  />
                  <button onClick={() => setPins([])}>Clear comparisons</button>
                </>
              )}
            </section>
          )}
        </>
      )}
      <footer>
        <p>
          Illustrative educational modelling. Check assumptions, units and source limitations before
          relying on any output. No live market prices or personal recommendations.
        </p>
      </footer>
    </>
  );
}
createRoot(document.getElementById('deal-root')!).render(<App />);
