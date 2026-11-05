'use client';

import { useState } from 'react';
import type { LibraryTool } from '../../lib/library';
import styles from './library.module.css';

export function LibraryDirectory({ tools }: { tools: LibraryTool[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All topics');
  const [shown, setShown] = useState(24);
  const categories = Array.from(new Set(tools.map((tool) => tool.category)));
  const query = search.trim().toLowerCase();
  const filtered = tools.filter((tool) => (category === 'All topics' || tool.category === category) && `${tool.title} ${tool.category} ${tool.subcategory} ${tool.url}`.toLowerCase().includes(query));
  return (
    <section className={styles.directory} aria-labelledby="tools-heading">
      <div className={styles.directoryHeader}>
        <div><div className={styles.eyebrow}>A COLLECTION OF USEFUL LINKS</div><h2 id="tools-heading">Tools directory</h2><p>Explore resources collected across the web.</p></div>
        <label className={styles.search}><span>Search tools</span><input type="search" placeholder="Search by name, topic or keyword" value={search} onChange={(event) => { setSearch(event.target.value); setShown(24); }} /></label>
      </div>
      <div className={styles.filters} aria-label="Filter tools by topic">
        {['All topics', ...categories].map((topic) => <button key={topic} className={topic === category ? styles.active : ''} aria-pressed={topic === category} onClick={() => { setCategory(topic); setShown(24); }}>{topic}</button>)}
      </div>
      <p className={styles.count} aria-live="polite">{filtered.length} {filtered.length === 1 ? 'resource' : 'resources'}</p>
      <div className={styles.grid}>
        {filtered.slice(0, shown).map((tool) => <a className={styles.card} key={tool.id} href={tool.url} target="_blank" rel="noopener noreferrer"><div className={styles.cardTop}><span>{tool.category}</span><span aria-hidden="true">↗</span></div><h3>{tool.title}</h3><p>{tool.subcategory || 'Resource'}</p><span className={styles.visit}>Visit website <span aria-hidden="true">→</span></span></a>)}
      </div>
      {filtered.length === 0 && <p className={styles.empty}>No resources found. Try another search or topic.</p>}
      {shown < filtered.length && <button className={styles.more} onClick={() => setShown(shown + 24)}>Show more tools</button>}
    </section>
  );
}
