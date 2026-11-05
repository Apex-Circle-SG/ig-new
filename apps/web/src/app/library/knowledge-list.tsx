'use client';

import { useState } from 'react';
import type { KnowledgeArticle } from '../../lib/library';
import styles from './library.module.css';

export function KnowledgeList({ articles }: { articles: KnowledgeArticle[] }) {
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('All topics');
  const topics = Array.from(new Set(articles.map((article) => article.topic)));
  const query = search.trim().toLowerCase();
  const filtered = articles.filter((article) => (topic === 'All topics' || topic === article.topic) && [article.title, article.summary, article.topic, article.group, ...article.sections.flatMap((section) => [section.heading, section.body])].join(' ').toLowerCase().includes(query));
  return <section className={styles.directory} aria-labelledby="knowledge-heading">
    <div className={styles.directoryHeader}>
      <div><div className={styles.eyebrow}>IDEAS WORTH KEEPING</div><h2 id="knowledge-heading">Knowledge</h2><p>Explore notes and guides, one topic at a time.</p></div>
      <label className={styles.search}><span>Search knowledge</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search articles and notes" /></label>
    </div>
    <div className={styles.filters} aria-label="Filter knowledge by topic">{['All topics', ...topics].map((item) => <button key={item} className={item === topic ? styles.active : ''} aria-pressed={item === topic} onClick={() => setTopic(item)}>{item}</button>)}</div>
    <p className={styles.count} aria-live="polite">{filtered.length} {filtered.length === 1 ? 'article' : 'articles'}</p>
    <div className={styles.grid}>{filtered.map((article) => <a className={styles.knowledgeCard} href={`/library/knowledge/${article.slug}/`} key={article.slug}><span>{article.topic} · {article.group}</span><h3>{article.title}</h3><p>{article.summary}</p><strong>Read article →</strong></a>)}</div>
    {filtered.length === 0 && <p className={styles.empty}>No articles found. Try another search or topic.</p>}
  </section>;
}
