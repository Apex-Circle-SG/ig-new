'use client';

import { useState } from 'react';
import type { KnowledgeArticle } from '../../lib/library';
import roots from '../../lib/library/business/collection-roots.json';

const topicHubs = new Map([['Artificial intelligence', 'ai-learning-hub'], ...roots.map((root) => [root.topic, root.slug] as const)]);
import styles from './library.module.css';

export function KnowledgeList({ articles }: { articles: KnowledgeArticle[] }) {
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('All topics');
  const [group, setGroup] = useState('All subtopics');
  const topics = Array.from(new Set(articles.map((article) => article.topic)));
  const groups = Array.from(new Set(articles.filter((article) => article.topic === topic).map((article) => article.group)));
  const query = search.trim().toLowerCase();
  const filtered = articles.filter((article) => (topic !== 'All topics' || query !== '' || !topicHubs.has(article.topic) || topicHubs.get(article.topic) === article.slug) && (topic === 'All topics' || topic === article.topic) && (group === 'All subtopics' || group === article.group) && [article.title, article.summary, article.topic, article.group, ...article.sections.flatMap((section) => [section.heading, section.body])].join(' ').toLowerCase().includes(query));
  return <section className={styles.directory} aria-labelledby="knowledge-heading">
    <div className={styles.directoryHeader}>
      <div><div className={styles.eyebrow}>IDEAS WORTH KEEPING</div><h2 id="knowledge-heading">Knowledge</h2><p>Explore notes and guides, one topic at a time.</p></div>
      <label className={styles.search}><span>Search knowledge</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search articles and notes" /></label>
    </div>
    <div className={styles.filters} aria-label="Filter knowledge by topic">{['All topics', ...topics].map((item) => <button key={item} className={item === topic ? styles.active : ''} aria-pressed={item === topic} onClick={() => { setTopic(item); setGroup('All subtopics'); }}>{item}</button>)}</div>
    {topic !== 'All topics' && groups.length > 0 && <div className={`${styles.filters} ${styles.subcategories}`} aria-label="Filter knowledge by subtopic">{['All subtopics', ...groups].map((item) => <button key={item} className={item === group ? styles.active : ''} aria-pressed={item === group} onClick={() => setGroup(item)}>{item}</button>)}</div>}
    <p className={styles.count} aria-live="polite">{filtered.length} {filtered.length === 1 ? 'article' : 'articles'}</p>
    <div className={styles.grid}>{filtered.map((article) => <a className={styles.knowledgeCard} href={`/library/knowledge/${article.slug}/`} key={article.slug}><span>{article.topic} · {article.group}</span><h3>{article.title}</h3><p>{article.summary}</p><strong>Read article →</strong></a>)}</div>
    {filtered.length === 0 && <p className={styles.empty}>No articles found. Try another search or topic.</p>}
  </section>;
}
