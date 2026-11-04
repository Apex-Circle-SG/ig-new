'use client';

import { useMemo, useState } from 'react';
import { CALCS } from '../../../lib/expanded-calculators';
import styles from '../../../components/finance/finance-tool.module.css';

type Values = Record<string, Record<string, number>>;

function initialValues(): Values {
  const out: Values = {};
  for (const calc of CALCS) {
    out[calc.id] = {};
    for (const input of calc.inputs) out[calc.id][input.key] = input.value;
  }
  return out;
}

function formatResult(output: { format?: string }, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value !== 'number' || !isFinite(value)) return '—';
  if (output.format === 'money') return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (output.format === 'money0') return `$${Math.round(value).toLocaleString('en-US')}`;
  if (output.format === 'percent') return `${value.toFixed(2)}%`;
  if (output.format === 'integer') return Math.round(value).toLocaleString('en-US');
  if (output.format === 'years') return `${value.toFixed(2)} years`;
  if (output.format === 'months') return `${value.toFixed(2)} months`;
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ExpandedCalculators() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [values, setValues] = useState<Values>(initialValues);

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const calc of CALCS) if (!seen.includes(calc.category)) seen.push(calc.category);
    return seen;
  }, []);

  const shownCount = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CALCS.filter((calc) => {
      if (activeCategory !== 'All' && calc.category !== activeCategory) return false;
      if (!q) return true;
      return `${calc.name} ${calc.blurb} ${calc.formula}`.toLowerCase().includes(q);
    }).length;
  }, [query, activeCategory]);

  return (
    <div className={`shell ${styles.page}`}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>YOUR NUMBERS, WITH CONTEXT</div>
        <h1>All calculators — 88 free tools</h1>
        <p>
          Every calculation runs in your browser — no sign-up, no account, and nothing you type is
          sent anywhere. Rates (tax, mortgage, market returns) are inputs you enter, with defaults
          labelled as assumptions — never presented as facts. Census-related tools use band ranges
          only (individual, before-tax, US Census CPS ASEC PINC-11, 2024), never a pinpoint
          percentile the table cannot support. Tax tools are educational only, not tax advice.
        </p>
        <p>
          Showing {shownCount} of {CALCS.length} calculators. The original 8 calculators remain on
          the main <a href="/calculators/">calculators hub</a>.
        </p>
      </header>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="search"
          placeholder="Search calculators…"
          aria-label="Search calculators"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{ flex: '1 1 260px', padding: '0.55rem 0.7rem', fontSize: '1rem' }}
        />
        {['All', ...categories].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            style={{
              padding: '0.35rem 0.8rem',
              cursor: 'pointer',
              fontWeight: activeCategory === category ? 700 : 400,
            }}
          >
            {category}
          </button>
        ))}
      </div>
      {categories.map((category) => {
        if (activeCategory !== 'All' && activeCategory !== category) return null;
        const q = query.trim().toLowerCase();
        const list = CALCS.filter((calc) => {
          if (calc.category !== category) return false;
          if (!q) return true;
          return `${calc.name} ${calc.blurb} ${calc.formula}`.toLowerCase().includes(q);
        });
        if (list.length === 0) return null;
        return (
          <section className={styles.section} key={category}>
            <h2>{category}</h2>
            <div className={styles.grid}>
              {list.map((calc) => {
                let results: Record<string, unknown> = {};
                try {
                  results = calc.compute(values[calc.id] ?? {}) ?? {};
                } catch {
                  results = {};
                }
                return (
                  <div className={styles.card} key={calc.id}>
                    <h2>{calc.name}</h2>
                    <p>{calc.blurb}</p>
                    {calc.inputs.map((input: { key: string; label: string; step?: number; min?: number }) => (
                      <div key={input.key} style={{ margin: '0.5rem 0' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>
                          {input.label}
                        </label>
                        <input
                          type="number"
                          step={input.step ?? 1}
                          min={input.min}
                          value={values[calc.id]?.[input.key] ?? 0}
                          onChange={(event) =>
                            setValues((prev) => ({
                              ...prev,
                              [calc.id]: {
                                ...prev[calc.id],
                                [input.key]: parseFloat(event.target.value) || 0,
                              },
                            }))
                          }
                          style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '1rem' }}
                        />
                      </div>
                    ))}
                    <div style={{ background: '#eef3fb', borderRadius: '8px', padding: '0.6rem 0.8rem', marginTop: '0.7rem' }}>
                      {calc.outputs.map((output: { key: string; label: string; format?: string }) => (
                        <div key={output.key} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                          <span>{output.label}</span>
                          <strong>{formatResult(output, results[output.key])}</strong>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: '0.88rem' }}>
                      <strong>Formula:</strong> {calc.formula}
                    </p>
                    <p style={{ fontSize: '0.88rem' }}>
                      <strong>Limits:</strong> {calc.limits}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      <section className={styles.section}>
        <h2>Coming soon — deliberately not built yet</h2>
        <p>
          Income band checker by age group and income band checker by state are not working
          calculators here, on purpose. They need a published Census breakdown for that exact cut
          before they can give band answers, and no such breakdown has been sourced and checked.
          Building them from the overall individual-income table would invent data.
        </p>
      </section>
    </div>
  );
}
