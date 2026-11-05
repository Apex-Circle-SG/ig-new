'use client';

import { useState } from 'react';
import type guides from '../../../../lib/library/business/guides.json';
import styles from './collection-guide.module.css';

type Stage = typeof guides[number]['questionStages'][number];

export function SalesQuestionBank({ stages }: { stages: Stage[] }) {
  const [stage, setStage] = useState('all');
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const visible = stages.filter((item) => stage === 'all' || item.id === stage).map((item) => ({
    ...item,
    groups: item.groups.map((group) => ({
      ...group,
      questions: group.questions.filter((question) => `${item.heading} ${group.heading} ${question}`.toLowerCase().includes(query)),
    })).filter((group) => group.questions.length > 0),
  })).filter((item) => item.groups.length > 0);
  const count = visible.reduce((total, item) => total + item.groups.reduce((sum, group) => sum + group.questions.length, 0), 0);
  return <div>
    <div className={styles.bankFilters}>
      <label>Conversation stage<select value={stage} onChange={(event) => setStage(event.target.value)}><option value="all">All stages</option>{stages.map((item) => <option key={item.id} value={item.id}>{item.heading}</option>)}</select></label>
      <label>Search questions<input type="search" placeholder="For example: budget, timeline, integration" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
    </div>
    <p className={styles.meta} aria-live="polite">{count} {count === 1 ? 'prompt' : 'prompts'} shown</p>
    {visible.map((item) => <section className={styles.detail} key={item.id} id={item.id}><h2>{item.heading}</h2>{item.groups.map((group, index) => <div className={styles.questionGroup} key={index}><h3>{group.heading}</h3><ul>{group.questions.map((question) => <li key={question}>{question}</li>)}</ul></div>)}</section>)}
    {count === 0 && <p>No prompts match. Try another search or conversation stage.</p>}
  </div>;
}
