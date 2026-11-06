'use client';

import { useState } from 'react';
import type references from '../../../../lib/library/business/academic-references.json';
import styles from './collection-guide.module.css';

type Entry = (typeof references)[number];

export function AcademicReferenceDirectory({ entries, referenceId }: { entries: Entry[]; referenceId?: string }) {
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [theme, setTheme] = useState('');
  const [type, setType] = useState('');
  const [year, setYear] = useState('');
  const [state, setState] = useState('');
  const [reading, setReading] = useState('');
  const [limit, setLimit] = useState(Math.max(12, entries.findIndex((entry) => entry.id === referenceId) + 1));
  const [copied, setCopied] = useState('');
  const [copyError, setCopyError] = useState('');
  const term = query.trim().toLocaleLowerCase();
  const subjects = [...new Set(entries.flatMap((entry) => entry.subjects))].sort();
  const themes = [...new Set(entries.flatMap((entry) => entry.themes))].sort();
  const types = [...new Set(entries.map((entry) => entry.type))].sort();
  const years = [...new Set(entries.map((entry) => entry.year).filter(Boolean))].sort().reverse();
  const states = [...new Set(entries.map((entry) => entry.metadataStatus))].sort();
  const filtered = entries.filter((entry) => (!subject || entry.subjects.includes(subject))
    && (!theme || entry.themes.includes(theme)) && (!type || entry.type === type) && (!year || entry.year === year)
    && (!state || entry.metadataStatus === state) && (!reading || entry.readingStatus === reading)
    && [entry.title, ...entry.authors, entry.year, entry.citation, ...entry.themes].join(' ').toLocaleLowerCase().includes(term));
  function reset() {
    setQuery(''); setSubject(''); setTheme(''); setType(''); setYear(''); setState(''); setReading(''); setLimit(12);
  }
  async function copy(entry: Entry) {
    try {
      await navigator.clipboard.writeText(entry.citation);
      setCopied(entry.id); setCopyError('');
    } catch {
      setCopyError(entry.id); setCopied('');
    }
  }
  return <section id="academic-references" aria-labelledby="academic-reference-heading">
    <h2 id="academic-reference-heading">Find an academic reference</h2>
    <p>These records preserve all 344 populated workbook cells, including split works, duplicates and journal suggestions. Metadata checks identify publications; they do not mean every work was read or a particular claim was verified.</p>
    <div className={styles.formulaFilters}>
      <label>Search academic references<input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setLimit(12); }} placeholder="Title, author, year or keyword" /></label>
      <label>Subject<select value={subject} onChange={(event) => { setSubject(event.target.value); setLimit(12); }}><option value="">All subjects</option>{subjects.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Theme<select value={theme} onChange={(event) => { setTheme(event.target.value); setLimit(12); }}><option value="">All themes</option>{themes.map((item) => <option key={item}>{item}</option>)}</select></label>
    </div>
    <details className={styles.imageDisclosure}><summary>Refine by publication type, year or review status</summary><div className={styles.formulaFilters}>
      <label>Publication type<select value={type} onChange={(event) => { setType(event.target.value); setLimit(12); }}><option value="">All publication types</option>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Publication year<select value={year} onChange={(event) => { setYear(event.target.value); setLimit(12); }}><option value="">All years</option>{years.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Metadata status<select value={state} onChange={(event) => { setState(event.target.value); setLimit(12); }}><option value="">All metadata states</option>{states.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Reading status<select value={reading} onChange={(event) => { setReading(event.target.value); setLimit(12); }}><option value="">All reading states</option><option>Not read</option><option>Abstract reviewed</option></select></label>
    </div></details>
    <button type="button" className={styles.formulaMore} onClick={reset}>Clear reference filters</button>
    <p className={styles.formulaUnits} aria-live="polite">Showing {Math.min(limit, filtered.length)} of {filtered.length} reference records</p>
    {filtered.length === 0 && <p>No references match these filters. Try a broader term or clear the filters.</p>}
    <div className={styles.metricList}>{filtered.slice(0, limit).map((entry) => <article className={styles.metric} id={entry.id} key={entry.id}>
      <h3>{entry.title}</h3><p className={styles.formulaUnits}>{entry.authors.join('; ')}{entry.year && ` · ${entry.year}`} · {entry.type}</p>
      <p><strong>{entry.metadataStatus}</strong> · {entry.readingStatus}</p>
      <p className={styles.formulaUnits}>{entry.themes.join(' · ')}</p>
      <div data-nosnippet={entry.metadataStatus !== 'Metadata checked' ? true : undefined}><p className={styles.referenceCitation}>{entry.citation}</p></div>
      <button type="button" className={styles.formulaMore} onClick={() => copy(entry)}>{copied === entry.id ? 'Reference copied' : 'Copy reference'}</button>
      {copyError === entry.id && <p role="status">Clipboard access is unavailable. Select and copy the reference text above.</p>}
      <p>{entry.note}</p><p className={styles.formulaUnits}>{entry.readingNote} {entry.claimStatus}.</p>
      {entry.url && <p><a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.metadataStatus === 'Metadata checked' ? 'Publication record or version context' : 'Candidate record — check unresolved details'} ↗</a></p>}
      {'url' in entry.verification && entry.verification.url && <p className={styles.formulaUnits}><a href={entry.verification.url} target="_blank" rel="noopener noreferrer">Metadata source: {entry.verification.provider} ↗</a> · Checked {entry.verification.checked}</p>}
      <div className={styles.formulaOriginal} data-nosnippet><details><summary>Original supplied reference{entry.sources.length > 1 ? 's' : ''} and provenance</summary>{entry.sources.map((source) => <div key={`${source.sheet}-${source.cell}`}><p><strong>{source.sheet} · {source.cell}</strong></p><p>{source.original}</p></div>)}</details></div>
    </article>)}</div>
    {limit < filtered.length && <button type="button" className={styles.formulaMore} onClick={() => setLimit(limit + 12)}>Show more references</button>}
    <p className={styles.srOnly} role="status">{copied && 'Reference copied to clipboard.'}</p>
  </section>;
}
