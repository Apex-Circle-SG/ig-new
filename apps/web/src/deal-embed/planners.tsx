import { useState } from 'react';
import diligence from '../lib/deal-materials/diligence.json';
import culture from '../lib/deal-materials/culture.json';
import { csv, type Inputs, type Table } from '@insightginie/calculators/deals';
import { ChartView, format, ResultsTable } from './shared';
export const statuses = [
  'Not started',
  'Requested',
  'Received',
  'Reviewed',
  'Blocked',
  'Not applicable',
];
const findings = ['Unknown', 'Open issue', 'Resolved', 'No issue identified'];
export const planSections = [
  'Acquisition and corporate strategy alignment',
  'Integration strategy',
  'Value delivery objectives and targets',
  'Integration objectives and measurements',
  'Integration plan and timeline',
  'Plan review and resourcing',
  'People, culture, leadership and retention',
  'Planning-phase communication',
  'Execution, urgent actions, prioritization and post-deal review',
];
const metricSeeds = [
  ['Recurring operating-cost savings', 'currency', 'Recurring savings', '15000000', '25000000'],
  ['Recurring SG&A expense savings', 'currency', 'Recurring savings', '380000', '500000'],
  ['Inventory cash released', 'currency', 'One-off cash release', '80000000', '150000000'],
  ['Headcount reduction', 'FTE', 'People', '', '250'],
  ['Key-customer retention', '%', 'Customers', '98', '98'],
  ['Market-share increase (percentage points)', 'percentage points', 'Customers', '3', '5'],
  ['Key-employee retention', '%', 'People', '96', '93'],
  ['Critical-path milestones on time and budget', '%', 'Project', '100', '100'],
  ['Teams following governance procedures', '%', 'Project', '100', '100'],
  ['Communications rating', 'score /5', 'Project', '4', '4'],
  ['', 'currency', 'Other', '', ''],
  ['', 'currency', 'Other', '', ''],
  ['', 'currency', 'Other', '', ''],
];
export function plannerDefaults(id: string): Inputs {
  const v: Inputs = {
    context: '',
    respondent: '',
    observationDate: '',
    currency: 'USD; full currency units',
    milestones: '',
    additionalRequests: '',
    version: '',
    approvedBy: '',
    revisionNotes: '',
  };
  if (id === 'due-diligence')
    for (const item of diligence)
      for (const [key, value] of Object.entries({
        status: 'Not started',
        finding: 'Unknown',
        owner: '',
        start: '',
        due: '',
        priority: 'Medium',
        evidence: '',
        notes: '',
        predecessor: '',
        completion: '',
        actualStart: '',
        actualFinish: '',
      }))
        v[`${item.id}.${key}`] = value;
  if (id === 'culture-comparison')
    for (const item of culture) {
      v[item.id + '.a'] = '';
      v[item.id + '.b'] = '';
      v[item.id + '.evidence'] = '';
    }
  if (id === 'integration-planner') {
    planSections.forEach((_, i) => {
      v[`plan.${i}`] = '';
    });
    metricSeeds.forEach(([name, unit, group, p100, p365], i) => {
      for (const [key, value] of Object.entries({
        name,
        unit,
        group,
        direction: 'higher',
        tolerance: '0',
        baseline: '',
        plan100: p100,
        actual100: '',
        plan365: p365,
        actual365: '',
      }))
        v[`metric.${i}.${key}`] = value;
    });
  }
  return v;
}
function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (s: string) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    </label>
  );
}
export function metricStatus(
  actual: number | null,
  target: number | null,
  direction: string,
  tolerance: number,
) {
  if (actual === null || target === null) return 'Not reported';
  const gap = direction === 'lower' ? actual - target : target - actual;
  return gap <= 0 ? 'On plan' : gap <= tolerance ? 'Within stated tolerance' : 'Off plan';
}
function numeric(value: string, label: string) {
  if (!value.trim()) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) throw Error(`${label}: enter a finite number or leave blank.`);
  return n;
}
function validDate(value: string) {
  return (
    !value ||
    (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value)
  );
}
export function Planner({
  id,
  values: v,
  update,
}: {
  id: string;
  values: Inputs;
  update: (key: string, value: string) => void;
}) {
  const [query, setQuery] = useState(''),
    [group, setGroup] = useState('All groups'),
    [status, setStatus] = useState('All statuses'),
    [limit, setLimit] = useState(15);
  const text = (key: string, label: string, multiline = false, type = 'text') => (
    <label>
      {label}
      {multiline ? (
        <textarea rows={3} value={v[key] ?? ''} onChange={(e) => update(key, e.target.value)} />
      ) : (
        <input type={type} value={v[key] ?? ''} onChange={(e) => update(key, e.target.value)} />
      )}
    </label>
  );
  const context = (
    <details open>
      <summary>Context and record keeping</summary>
      <div className="fields">
        {text('context', 'Project / organization context', true)}
        {text('respondent', 'Prepared by / respondent')}
        {text('version', 'Plan version')}
        {text('approvedBy', 'Approved by')}
        {text('revisionNotes', 'Revision / approval notes', true)}
        {text('observationDate', 'Observation / review date', false, 'date')}
        {id === 'integration-planner' &&
          text('currency', 'Currency and scale for monetary metrics')}
      </div>
      <p>
        Drafts remain in this private frame. Export a scenario to keep your work before closing or
        reloading.
      </p>
    </details>
  );
  if (id === 'culture-comparison') {
    const groups = [...new Set(culture.map((i) => i.group))];
    const summaries = groups.map((g) => {
      const items = culture.filter((i) => i.group === g),
        pairs = items
          .map((i) => [numeric(v[i.id + '.a'], i.left), numeric(v[i.id + '.b'], i.right)])
          .filter((a): a is number[] => a[0] !== null && a[1] !== null);
      if (pairs.some((a) => a.some((n) => !Number.isInteger(n) || n < 1 || n > 5)))
        throw Error('Culture ratings must be whole numbers from 1 to 5 or unrated.');
      return {
        group: g,
        rated: pairs.length,
        total: items.length,
        gap: pairs.length
          ? pairs.reduce((s, a) => s + Math.abs(a[0] - a[1]), 0) / pairs.length
          : null,
      };
    });
    return (
      <>
        {context}
        <p>
          All 46 source characteristics are retained. The endpoints describe different perceptions;
          higher numbers are not consistently better. Means summarize ordinal gaps arithmetically,
          not culture quality or predicted synergy.
        </p>
        <ChartView
          id={id}
          chart={{
            title: 'Mean absolute gap among rated pairs (0–4)',
            labels: summaries.map((s) => s.group),
            series: [{ label: 'Mean gap', values: summaries.map((s) => s.gap) }],
          }}
        />
        <p>{summaries.reduce((s, a) => s + a.rated, 0)} of 46 pairs rated.</p>
        {groups.map((g) => (
          <details key={g}>
            <summary>
              {g} · {summaries.find((s) => s.group === g)!.rated}/
              {summaries.find((s) => s.group === g)!.total} rated
            </summary>
            {culture
              .filter((i) => i.group === g)
              .map((i) => {
                const a = numeric(v[i.id + '.a'], i.left),
                  b = numeric(v[i.id + '.b'], i.right);
                return (
                  <section className="record" key={i.id}>
                    <h3>
                      {i.left} ↔ {i.right}
                    </h3>
                    <p>
                      1 = {i.left}; 5 = {i.right}.
                    </p>
                    <div className="fields">
                      {['a', 'b'].map((side) => (
                        <label key={side}>
                          Organization {side.toUpperCase()}
                          <select
                            value={v[i.id + '.' + side]}
                            onChange={(e) => update(i.id + '.' + side, e.target.value)}
                          >
                            <option value="">Unrated</option>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                    <p
                      className="gap"
                      style={{
                        borderLeftWidth: a === null || b === null ? 3 : 3 + Math.abs(a - b) * 3,
                      }}
                    >
                      Absolute perception gap:{' '}
                      {a === null || b === null ? 'Unrated' : Math.abs(a - b)}
                    </p>
                    {text(i.id + '.evidence', 'Evidence / discussion note', true)}
                    <p className="muted">
                      {i.source}
                      {i.left.includes('product instruction') &&
                        ' · “Product instruction” is unclear supplied wording; no missing term is guessed.'}
                    </p>
                  </section>
                );
              })}
          </details>
        ))}
        <ResultsTable
          id={id}
          table={{
            title: 'All culture ratings and context',
            columns: [
              'Group',
              'Left endpoint (1)',
              'Right endpoint (5)',
              'A',
              'B',
              'Absolute gap',
              'Evidence',
              'Source',
            ],
            rows: culture.map((i) => {
              const a = numeric(v[i.id + '.a'], i.left),
                b = numeric(v[i.id + '.b'], i.right);
              return [
                i.group,
                i.left,
                i.right,
                a,
                b,
                a === null || b === null ? null : Math.abs(a - b),
                v[i.id + '.evidence'],
                i.source,
              ];
            }),
          }}
        />
      </>
    );
  }
  if (id === 'due-diligence') {
    const filtered = diligence.filter(
        (i) =>
          (!query ||
            (i.title + i.category + v[i.id + '.notes'])
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (group === 'All groups' || i.category === group) &&
          (status === 'All statuses' || v[i.id + '.status'] === status),
      ),
      applicable = diligence.filter((i) => v[i.id + '.status'] !== 'Not applicable'),
      reviewed = applicable.filter((i) => v[i.id + '.status'] === 'Reviewed'),
      issues = diligence.filter((i) => v[i.id + '.finding'] === 'Open issue');
    const table: Table = {
      title: 'Complete diligence working record',
      columns: [
        'Request',
        'Category',
        'Status',
        'Finding',
        'Owner',
        'Start',
        'Due',
        'Priority',
        'Evidence reference',
        'Notes',
        'Predecessor / dependency',
        'Task completion % (separate from evidence review)',
        'Actual start',
        'Actual finish',
        'Source',
      ],
      rows: diligence.map((i) => [
        i.title,
        i.category,
        ...[
          'status',
          'finding',
          'owner',
          'start',
          'due',
          'priority',
          'evidence',
          'notes',
          'predecessor',
          'completion',
          'actualStart',
          'actualFinish',
        ].map((k) => v[i.id + '.' + k]),
        i.sources.join('; '),
      ]),
    };
    const dated = diligence.filter((i) => v[i.id + '.start'] && v[i.id + '.due']);
    const invalid = diligence.filter(
      (i) =>
        !validDate(v[i.id + '.actualStart']) ||
        !validDate(v[i.id + '.actualFinish']) ||
        (v[i.id + '.completion'] !== '' &&
          (Number(v[i.id + '.completion']) < 0 ||
            Number(v[i.id + '.completion']) > 100 ||
            !Number.isFinite(Number(v[i.id + '.completion'])))) ||
        !validDate(v[i.id + '.start']) ||
        !validDate(v[i.id + '.due']) ||
        (v[i.id + '.start'] && v[i.id + '.due'] && v[i.id + '.start'] > v[i.id + '.due']),
    );
    return (
      <>
        {context}
        <div className="metrics">
          <div>
            <strong>
              {applicable.length
                ? `${((reviewed.length / applicable.length) * 100).toFixed(1)}%`
                : 'No applicable tasks'}
            </strong>
            Supplied requests reviewed / applicable
          </div>
          <div>
            <strong>{issues.length}</strong>Open findings
          </div>
          <div>
            <strong>{diligence.length}</strong>Distinct supplied requests
          </div>
        </div>
        <p>
          Received evidence is distinct from reviewed evidence. Completion does not mean the
          transaction has passed diligence. Source lookback periods/jurisdictions are examples;
          tailor the scope and share only information you are authorized to disclose.
        </p>
        {invalid.length > 0 && (
          <p role="alert">
            {invalid.length} request(s) have invalid dates or completion percentages. Correct them
            before relying on the timeline.
          </p>
        )}
        <div className="fields">
          <label>
            Find a request
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(15);
              }}
            />
          </label>
          <Select
            label="Request group"
            value={group}
            options={['All groups', ...new Set(diligence.map((i) => i.category))]}
            onChange={(s) => {
              setGroup(s);
              setLimit(15);
            }}
          />
          <Select
            label="Request status"
            value={status}
            options={['All statuses', ...statuses]}
            onChange={(s) => {
              setStatus(s);
              setLimit(15);
            }}
          />
        </div>
        <p aria-live="polite">
          Showing {Math.min(limit, filtered.length)} of {filtered.length} matching requests.
        </p>
        {filtered.slice(0, limit).map((i) => (
          <details key={i.id}>
            <summary>
              {i.title} · {v[i.id + '.status']}
            </summary>
            <div className="fields">
              <Select
                label="Status"
                value={v[i.id + '.status']}
                options={statuses}
                onChange={(s) => update(i.id + '.status', s)}
              />
              <Select
                label="Finding"
                value={v[i.id + '.finding']}
                options={findings}
                onChange={(s) => update(i.id + '.finding', s)}
              />
              <Select
                label="Priority"
                value={v[i.id + '.priority']}
                options={['Low', 'Medium', 'High']}
                onChange={(s) => update(i.id + '.priority', s)}
              />
              {text(i.id + '.owner', 'Owner')}
              {text(i.id + '.start', 'Start', false, 'date')}
              {text(i.id + '.due', 'Due', false, 'date')}
              {text(i.id + '.evidence', 'Evidence reference (text only)')}
              {text(i.id + '.notes', 'Notes / findings', true)}
              {text(i.id + '.predecessor', 'Predecessor / dependency (reference only)')}
              {text(
                i.id + '.completion',
                'Task completion % (0–100; blank = unreported)',
                false,
                'number',
              )}
              {text(i.id + '.actualStart', 'Actual start', false, 'date')}
              {text(i.id + '.actualFinish', 'Actual finish', false, 'date')}
            </div>
            <p className="muted">
              {i.category} · {i.sources.join('; ')}
            </p>
          </details>
        ))}
        {limit < filtered.length && (
          <button onClick={() => setLimit(limit + 25)}>Show 25 more requests</button>
        )}
        <ResultsTable id={id} table={table} />
        <Timeline
          id={id}
          records={dated.map((i) => ({
            name: i.title,
            start: v[i.id + '.start'],
            due: v[i.id + '.due'],
            owner: v[i.id + '.owner'],
          }))}
        />
        {text(
          'additionalRequests',
          'Additional requests (title, category, owner, start, due, evidence reference)',
          true,
        )}
        <ExtraRequests text={v.additionalRequests} id={id} />
      </>
    );
  }
  const metrics = metricSeeds
    .map((_, i) => {
      const get = (key: string) => v[`metric.${i}.${key}`],
        actual100 = numeric(get('actual100'), '100-day actual'),
        actual365 = numeric(get('actual365'), 'Year-one actual'),
        p100 = numeric(get('plan100'), '100-day target'),
        p365 = numeric(get('plan365'), 'Year-one target'),
        tolerance = numeric(get('tolerance'), 'Tolerance') ?? 0;
      if (tolerance < 0) throw Error('Metric tolerance cannot be negative.');
      if (['%', 'score /5'].includes(get('unit'))) {
        const max = get('unit') === '%' ? 100 : 5;
        if ([actual100, actual365, p100, p365].some((n) => n !== null && (n < 0 || n > max)))
          throw Error(`${get('name')}: values must be between 0 and ${max}.`);
      }
      return {
        i,
        name: get('name'),
        unit: get('unit'),
        group: get('group'),
        baseline: numeric(get('baseline'), 'Baseline'),
        p100,
        actual100,
        p365,
        actual365,
        status100: metricStatus(actual100, p100, get('direction'), tolerance),
        status365: metricStatus(actual365, p365, get('direction'), tolerance),
      };
    })
    .filter((m) => m.name.trim());
  const milestones = csv(v.milestones || '').map((row, i) => {
    if (row.length !== 4) throw Error(`Milestone ${i + 1}: enter title, owner, start, due.`);
    return { name: row[0], owner: row[1], start: row[2], due: row[3] };
  });
  return (
    <>
      {context}
      <p>
        The supplied scorecard’s inconsistent example statuses and mixed FTE/money totals are not
        inherited. Targets below are editable source examples; actuals begin unreported.
        Higher/lower and tolerance must match what the metric measures.
      </p>
      <details>
        <summary>Integration strategy, ownership and review plan</summary>
        {planSections.map((name, i) => text(`plan.${i}`, name, true))}
      </details>
      <div className="metrics">
        {['Recurring savings', 'One-off cash release'].map((g) => {
          const items = metrics.filter((m) => m.unit === 'currency' && m.group === g),
            actuals = items.filter((m) => m.actual100 !== null);
          return (
            <div key={g}>
              <strong>
                {actuals.length
                  ? format(actuals.reduce((s, m) => s + m.actual100!, 0))
                  : 'Not reported'}
              </strong>
              {g} · 100-day actual · {v.currency}
              <p>
                {actuals.length}/{items.length} metrics reported; compatible units only.
              </p>
            </div>
          );
        })}
      </div>
      {metricSeeds.map((_, i) => (
        <details key={i}>
          <summary>{v[`metric.${i}.name`] || `Additional metric ${i - 9}`}</summary>
          <div className="fields">
            {text(`metric.${i}.name`, 'Metric definition / objective')}
            <Select
              label="Unit"
              value={v[`metric.${i}.unit`]}
              options={['currency', 'FTE', '%', 'percentage points', 'score /5', 'count']}
              onChange={(s) => update(`metric.${i}.unit`, s)}
            />
            <Select
              label="Benefit / workstream group"
              value={v[`metric.${i}.group`]}
              options={[
                'Recurring savings',
                'One-off cash release',
                'People',
                'Customers',
                'Project',
                'Other',
              ]}
              onChange={(s) => update(`metric.${i}.group`, s)}
            />
            <label>
              Better direction
              <select
                value={v[`metric.${i}.direction`]}
                onChange={(e) => update(`metric.${i}.direction`, e.target.value)}
              >
                <option value="higher">Higher meets target</option>
                <option value="lower">Lower meets target</option>
              </select>
            </label>
            {['tolerance', 'baseline', 'plan100', 'actual100', 'plan365', 'actual365'].map((k) =>
              text(
                `metric.${i}.${k}`,
                (
                  {
                    tolerance: 'Absolute permitted shortfall (same units)',
                    baseline: 'Baseline (optional)',
                    plan100: '100-day target',
                    actual100: '100-day actual (blank = unreported)',
                    plan365: 'Year-one target',
                    actual365: 'Year-one actual (blank = unreported)',
                  } as Record<string, string>
                )[k]!,
                false,
                'number',
              ),
            )}
          </div>
          <p>
            {metrics.find((m) => m.i === i)?.status100} · 100 days;{' '}
            {metrics.find((m) => m.i === i)?.status365} · year one
          </p>
          {i === 3 && (
            <p>
              The original headcount row mixed unexplained 9,000/10,000/16,000 values with a 250-FTE
              objective; these figures are not guessed into a common unit.
            </p>
          )}
        </details>
      ))}
      <ResultsTable
        id={id}
        table={{
          title: 'Unit-aware integration scorecard',
          columns: [
            'Metric',
            'Unit',
            'Group',
            'Baseline',
            '100-day actual',
            '100-day target',
            '100-day status',
            'Year-one actual',
            'Year-one target',
            'Year-one status',
          ],
          rows: metrics.map((m) => [
            m.name,
            m.unit,
            m.group,
            m.baseline,
            m.actual100,
            m.p100,
            m.status100,
            m.actual365,
            m.p365,
            m.status365,
          ]),
        }}
      />
      {text('milestones', 'Milestones: title, owner, start YYYY-MM-DD, due YYYY-MM-DD', true)}
      <Timeline id={id} records={milestones} />
    </>
  );
}
function ExtraRequests({ text, id }: { text: string; id: string }) {
  if (!text.trim()) return null;
  const rows = csv(text);
  if (rows.some((r) => r.length !== 6))
    return (
      <p role="alert">
        Additional requests need six columns: title, category, owner, start, due, evidence.
      </p>
    );
  return (
    <ResultsTable
      id={id}
      table={{
        title: 'Additional private requests',
        columns: ['Title', 'Category', 'Owner', 'Start', 'Due', 'Evidence'],
        rows,
      }}
    />
  );
}
function Timeline({
  id,
  records,
}: {
  id: string;
  records: { name: string; start: string; due: string; owner: string }[];
}) {
  if (!records.length) return <p>Add start and due dates to create the timeline.</p>;
  const valid = records.filter(
      (r) => validDate(r.start) && validDate(r.due) && r.start && r.due && r.start <= r.due,
    ),
    invalid = records.length - valid.length;
  if (!valid.length)
    return (
      <p role="alert">
        No valid dated milestones. Use ISO dates and a due date at or after the start.
      </p>
    );
  const min = Math.min(...valid.map((r) => Date.parse(r.start))),
    max = Math.max(...valid.map((r) => Date.parse(r.due))),
    span = max - min + 86400000;
  return (
    <section>
      <h2>Timeline</h2>
      {invalid > 0 && (
        <p role="alert">
          {invalid} invalid date range(s) excluded from the visual; correct the underlying records.
        </p>
      )}
      <div className="timeline">
        {valid.slice(0, 40).map((r, i) => (
          <div key={i}>
            <span>
              {r.name} · {r.owner || 'Unassigned'}
            </span>
            <div className="track">
              <span
                style={{
                  marginLeft: `${((Date.parse(r.start) - min) / span) * 100}%`,
                  width: `${Math.max(1, ((Date.parse(r.due) - Date.parse(r.start) + 86400000) / span) * 100)}%`,
                }}
              />
            </div>
            <small>
              {r.start} → {r.due}
            </small>
          </div>
        ))}
      </div>
      <p>
        {valid.length > 40
          ? 'The first 40 dated entries are drawn; the complete timeline is in the table/export.'
          : 'Calendar-day intervals, inclusive; holidays and dependencies are not automatically scheduled.'}
      </p>
      <ResultsTable
        id={id}
        table={{
          title: 'All dated milestones',
          columns: ['Milestone', 'Owner', 'Start', 'Due'],
          rows: records.map((r) => [r.name, r.owner, r.start, r.due]),
        }}
      />
    </section>
  );
}
