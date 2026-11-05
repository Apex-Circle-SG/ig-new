'use client';

import { useState } from 'react';
import groups from '../../../../lib/library/security-questions.json';
import styles from '../../library.module.css';

export function SecurityQuestions() {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const filtered = groups.map((group) => ({ ...group, questions: group.questions.filter((question) => `${group.title} ${question.id} ${question.text}`.toLowerCase().includes(query)) })).filter((group) => group.questions.length);
  const count = filtered.reduce((total, group) => total + group.questions.length, 0);
  return <section aria-labelledby="questions-heading">
    <h2 id="questions-heading">Assessment questions</h2>
    <p>Search locally; no answers are collected or submitted on this page. Consider who owns each control, what evidence exists and what needs follow-up.</p>
    <label className={styles.search}><span>Search questions</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by topic or question" /></label>
    <p aria-live="polite">{count} {count === 1 ? 'question' : 'questions'}</p>
    {filtered.map((group) => <details key={group.title} open={Boolean(query)}><summary>{group.title} ({group.questions.length})</summary><ol>{group.questions.map((question) => <li key={question.id}><strong>{question.id}</strong> {question.text}</li>)}</ol></details>)}
    {count === 0 && <p>No questions found. Try another search.</p>}
  </section>;
}
