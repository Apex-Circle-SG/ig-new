'use client';

import { useState } from 'react';
import type guides from '../../../../lib/library/business/guides.json';
import styles from './collection-guide.module.css';

type Block = (typeof guides)[number]['sections'][number]['blocks'][number];
type Metric = Extract<Block, { metric: object }>['metric'];

export function MetricDirectory({ entries, readings }: { entries: Metric[]; readings: { slug: string; title: string }[] }) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [domain, setDomain] = useState('');
  const roles = Array.from(new Set(entries.flatMap((entry) => entry.sources.map((source) => source.role)))).sort();
  const domains = Array.from(new Set(entries.map((entry) => entry.domain))).sort();
  const term = query.trim().toLowerCase();
  const filtered = entries.filter((entry) => (!domain || entry.domain === domain)
    && (!role || entry.sources.some((source) => source.role === role))
    && [entry.name, entry.domain, ...entry.sources.flatMap((source) => [source.original, source.role, source.note])].join(' ').toLowerCase().includes(term));
  const occurrences = filtered.reduce((total, entry) => total + entry.sources.filter((source) => !role || source.role === role).length, 0);
  const titles = new Map(readings.map((reading) => [reading.slug, reading.title]));

  return <section id="metric-reference" aria-labelledby="metric-reference-heading">
    <h2 id="metric-reference-heading">Find an executive measure</h2>
    <p>Browse {entries.length} normalized metric names from 314 supplied role entries. Each measure appears once, with its original role associations available below. Similar measures with different scopes remain separate.</p>
    <p>These are names to investigate, not ready-made specifications. Define the method, unit, population and period before using a measure. Related readings provide context; they do not supply an exact formula for every entry.</p>
    <div className={styles.formulaFilters}>
      <label>Search measures<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Metric, role or original wording" /></label>
      <label>Executive role<select value={role} onChange={(event) => setRole(event.target.value)}><option value="">All roles</option>{roles.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Subject<select value={domain} onChange={(event) => setDomain(event.target.value)}><option value="">All subjects</option>{domains.map((item) => <option key={item}>{item}</option>)}</select></label>
    </div>
    <p className={styles.formulaUnits} aria-live="polite">{filtered.length} measures · {occurrences} matching role entries</p>
    {filtered.length === 0 && <p>No matching measures. Clear a filter or try another term.</p>}
    <div className={styles.metricList}>{filtered.map((entry) => <article className={styles.metric} id={`metric-${entry.id}`} key={entry.id}>
      <h3>{entry.name}</h3>
      <p className={styles.formulaUnits}>{entry.domain} · {Array.from(new Set(entry.sources.map((source) => source.role))).join(' · ')}</p>
      <details className={styles.formulaOriginal}>
        <summary>Original wording and role context ({entry.sources.length})</summary>
        <ul data-nosnippet>{entry.sources.map((source) => <li key={source.sourceIndex}>
          <strong>{source.role}</strong>: <q>{source.original}</q>. Source classification: {source.sourceClass.toLowerCase()}.
          {source.note && <p>{source.note}</p>}
        </li>)}</ul>
      </details>
      <p className={styles.metricLinks}>{entry.related.map((slug) => <a key={slug} href={`/library/knowledge/${slug}/`}>{titles.get(slug)} →</a>)}</p>
    </article>)}</div>
  </section>;
}
