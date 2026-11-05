'use client';

import { useState } from 'react';
import type { LibraryTool } from '../../lib/library';
import styles from './library.module.css';

export function LibraryDirectory({ tools, initialCategory }: { tools: LibraryTool[]; initialCategory?: string }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory && tools.some((tool) => tool.category === initialCategory) ? initialCategory : 'All topics');
  const [subcategory, setSubcategory] = useState('All subcategories');
  const [shown, setShown] = useState(24);
  const categories = Array.from(new Set(tools.map((tool) => tool.category)));
  const subcategories = Array.from(new Set(tools.filter((tool) => tool.category === category).map((tool) => tool.subcategory || 'Uncategorized')));
  const query = search.trim().toLowerCase();
  const filtered = tools.filter((tool) => (category === 'All topics' || tool.category === category) && (subcategory === 'All subcategories' || (tool.subcategory || 'Uncategorized') === subcategory) && `${tool.title} ${tool.category} ${tool.subcategory} ${tool.url}`.toLowerCase().includes(query));
  return (
    <section className={styles.directory} aria-labelledby="tools-heading">
      <div className={styles.directoryHeader}>
        <div><div className={styles.eyebrow}>A COLLECTION OF USEFUL LINKS</div><h2 id="tools-heading">Tools directory</h2><p>Explore resources collected across the web.</p></div>
        <label className={styles.search}><span>Search tools</span><input type="search" placeholder="Search by name, topic or keyword" value={search} onChange={(event) => { setSearch(event.target.value); setShown(24); }} /></label>
      </div>
      <div className={styles.filters} aria-label="Filter tools by topic">
        {['All topics', ...categories].map((topic) => <button key={topic} className={topic === category ? styles.active : ''} aria-pressed={topic === category} onClick={() => { setCategory(topic); setSubcategory('All subcategories'); setShown(24); }}>{topic}</button>)}
      </div>
      {category !== 'All topics' && subcategories.length > 0 && (
        <div className={`${styles.filters} ${styles.subcategories}`} aria-label="Filter tools by subcategory">
          {['All subcategories', ...subcategories].map((item) => <button key={item} className={item === subcategory ? styles.active : ''} aria-pressed={item === subcategory} onClick={() => { setSubcategory(item); setShown(24); }}>{item}</button>)}
        </div>
      )}
      <p className={styles.count} aria-live="polite">{filtered.length} {filtered.length === 1 ? 'resource' : 'resources'}</p>
      <div className={styles.grid}>
        {filtered.slice(0, shown).map((tool) => <a className={styles.card} key={tool.id} href={tool.url} target="_blank" rel="noopener noreferrer"><span>{tool.title}</span><span className={styles.domain}>{tool.url.replace(/^https?:\/\//i, '')}</span></a>)}
      </div>
      {filtered.length === 0 && <p className={styles.empty}>No resources found. Try another search or topic.</p>}
      {shown < filtered.length && <button className={styles.more} onClick={() => setShown(shown + 24)}>Show more tools</button>}
    </section>
  );
}
