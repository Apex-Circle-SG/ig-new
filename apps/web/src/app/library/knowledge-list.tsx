'use client';

import { useState } from 'react';
import type { KnowledgeArticle } from '../../lib/library';
import { collectionNavigation, collectionContains } from '../../lib/library/collection-navigation';

const topicHubs = new Map([['Artificial intelligence', 'ai-learning-hub'], ...collectionNavigation.filter((root) => !root.parent).map((root) => [root.topic, root.slug] as const)]);
import styles from './library.module.css';

export function KnowledgeList({ articles }: { articles: KnowledgeArticle[] }) {
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('All topics');
  const [group, setGroup] = useState('All subtopics');
  const [collection, setCollection] = useState('');
  const [showAll, setShowAll] = useState(false);
  const business = topic === 'Business & Management';
  const grouped = business || topic === 'Finance & Accounting';
  const areaName = business ? 'business' : 'finance';
  const areaTitle = business ? 'Business' : 'Finance';
  const topicCollections = collectionNavigation.filter((item) => item.parent === topicHubs.get(topic));
  const selectedCollection = collectionNavigation.find((item) => item.slug === (collection || topicHubs.get(topic)));
  const topics = Array.from(new Set(articles.map((article) => article.topic)));
  const query = search.trim().toLowerCase();
  const scoped = articles.filter((article) => (topic === 'All topics' || article.topic === topic) && (!grouped || !collection || collectionContains(collection, article.slug)));
  const visible = grouped && !query && !showAll
    ? scoped.filter((article) => selectedCollection?.members.includes(article.slug))
    : scoped.filter((article) => topic !== 'All topics' || query !== '' || !topicHubs.has(article.topic) || topicHubs.get(article.topic) === article.slug);
  const groups = grouped && !collection ? [] : Array.from(new Set(visible.map((article) => article.group)));
  const filtered = visible.filter((article) => (group === 'All subtopics' || group === article.group) && [article.title, article.summary, article.topic, article.group, ...article.sections.flatMap((section) => [section.heading, section.body])].join(' ').toLowerCase().includes(query));
  const collectionsOnly = filtered.length > 0 && filtered.every((article) => collectionNavigation.some((item) => item.slug === article.slug));
  return <section className={styles.directory} aria-labelledby="knowledge-heading">
    <div className={styles.directoryHeader}>
      <div><div className={styles.eyebrow}>IDEAS WORTH KEEPING</div><h2 id="knowledge-heading">Knowledge</h2><p>Explore notes and guides, one topic at a time.</p></div>
      <label className={styles.search}><span>Search knowledge</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search articles and notes" /></label>
    </div>
    <div className={styles.filters} aria-label="Filter knowledge by topic">{['All topics', ...topics].map((item) => <button key={item} className={item === topic ? styles.active : ''} aria-pressed={item === topic} onClick={() => { setTopic(item); setGroup('All subtopics'); setCollection(''); setShowAll(false); }}>{item}</button>)}</div>
    {grouped && <div className={styles.filters} aria-label={`Browse ${areaName} collections`}>
      <label>{areaTitle} collection <select value={collection} onChange={(event) => { setCollection(event.target.value); setGroup('All subtopics'); setShowAll(false); }}><option value="">Choose a collection</option>{topicCollections.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label>
      <button aria-pressed={!collection && !showAll} onClick={() => { setCollection(''); setGroup('All subtopics'); setShowAll(false); }}>All collections</button>
      <button aria-pressed={showAll} onClick={() => { setCollection(''); setGroup('All subtopics'); setShowAll(true); }}>All {areaName} articles</button>
    </div>}
    {topic !== 'All topics' && groups.length > 0 && <div className={`${styles.filters} ${styles.subcategories}`} aria-label="Filter knowledge by subtopic">{['All subtopics', ...groups].map((item) => <button key={item} className={item === group ? styles.active : ''} aria-pressed={item === group} onClick={() => setGroup(item)}>{item}</button>)}</div>}
    <p className={styles.count} aria-live="polite">{filtered.length} {collectionsOnly ? (filtered.length === 1 ? 'collection' : 'collections') : (filtered.length === 1 ? 'article' : 'articles')}</p>
    <div className={styles.grid}>{filtered.map((article) => <a className={styles.knowledgeCard} href={`/library/knowledge/${article.slug}/`} key={article.slug}><span>{article.topic} · {article.group}</span><h3>{article.title}</h3><p>{article.summary}</p><strong>{collectionNavigation.some((item) => item.slug === article.slug) ? 'Browse collection →' : 'Read article →'}</strong></a>)}</div>
    {filtered.length === 0 && <p className={styles.empty}>No articles found. Try another search or topic.</p>}
  </section>;
}
