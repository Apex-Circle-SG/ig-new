'use client';

import { useState } from 'react';
import type formulas from '../../../../lib/library/business/accounting-formulas.json';
import styles from './collection-guide.module.css';

type Entry = (typeof formulas)[number];

export function FormulaDirectory({ entries }: { entries: Entry[] }) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState('All review states');
  const [limit, setLimit] = useState(24);
  const term = query.trim().toLowerCase();
  const states = Array.from(new Set(entries.map((entry) => entry.reviewState))).sort();
  const filtered = entries.filter((entry) => (state === 'All review states' || entry.reviewState === state) && [entry.name, entry.expression, entry.units, entry.scope, ...entry.inputs].join(' ').toLowerCase().includes(term)).sort((a, b) => a.name.localeCompare(b.name));
  return <section id="formula-reference" aria-labelledby="formula-reference-heading">
    <h2 id="formula-reference-heading">Find a formula</h2>
    <p>Choose a measure, then follow its link for definitions, assumptions, the original wording and related detail. Repeated source expressions can have different contexts.</p>
    <div className={styles.formulaFilters}>
      <label>Search formulas<input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(24); }} placeholder="Name, input, units or interpretation" /></label>
      <label>Review state<select value={state} onChange={(event) => { setState(event.target.value); setLimit(24); }}><option>All review states</option>{states.map((item) => <option key={item}>{item}</option>)}</select></label>
    </div>
    <p className={styles.formulaUnits} aria-live="polite">Showing {Math.min(limit, filtered.length)} of {filtered.length} source entries</p>
    <div className={styles.formulaList}>{filtered.slice(0, limit).map((entry) => <a className={styles.card} key={entry.id} href={`/library/knowledge/${entry.slug}/#${entry.id}`}><h3>{entry.name}</h3><p>{entry.expression || 'Needs clarification before use'}</p><p>{entry.units} · {entry.reviewState}</p><strong>{entry.guideTitle} →</strong></a>)}</div>
    {filtered.length === 0 && <p>No matching entries. Try another name or review state.</p>}
    {filtered.length > limit && <button className={styles.formulaMore} onClick={() => setLimit(limit + 24)}>Show more formulas</button>}
  </section>;
}
