'use client';
import { useState, useSyncExternalStore } from 'react';
import { SiteLink as Link } from '@insightginie/ui';
import styles from './opportunities.module.css';
const KEY = 'insightginie-saved-opportunities-v1';
type Saved = { id: string; title: string; organization: string };
function snapshot() {
  try {
    return localStorage.getItem(KEY) || '[]';
  } catch {
    return '[]';
  }
}
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('ig:saved', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('ig:saved', callback);
  };
}
function records(raw: string): Saved[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter((item): item is Saved =>
            Boolean(
              item &&
                typeof item.id === 'string' &&
                /^[a-zA-Z0-9_-]{1,200}$/.test(item.id) &&
                typeof item.title === 'string' &&
                typeof item.organization === 'string',
            ),
          )
          .slice(0, 100)
      : [];
  } catch {
    return [];
  }
}
function save(items: Saved[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 100)));
  window.dispatchEvent(new Event('ig:saved'));
}
export function SaveOpportunity({ item }: { item: Saved }) {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '[]');
  const saved = records(raw);
  const exists = saved.some((entry) => entry.id === item.id);
  const [message, setMessage] = useState('');
  return (
    <div className={styles.links}>
      <button
        type="button"
        aria-pressed={exists}
        className={styles.saveButton}
        onClick={() => {
          try {
            save(exists ? saved.filter((entry) => entry.id !== item.id) : [item, ...saved]);
            setMessage(exists ? 'Removed from this browser.' : 'Saved in this browser.');
          } catch {
            setMessage('Your browser could not save this item.');
          }
        }}
      >
        {exists ? 'Saved ✓' : 'Save for later'}
      </button>
      <Link href="/opportunities/saved/">Your saved roles</Link>
      <span aria-live="polite" className={styles.muted}>
        {message}
      </span>
    </div>
  );
}
export function SavedOpportunities() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '[]');
  const saved = records(raw);
  return saved.length ? (
    <div className={styles.grid}>
      {saved.map((item) => (
        <article className={styles.card} key={item.id}>
          <span className={styles.badge}>Saved on this browser</span>
          <h2>
            <Link href={`/opportunities/${item.id}/`}>{item.title}</Link>
          </h2>
          <p>{item.organization}</p>
          <SaveOpportunity item={item} />
        </article>
      ))}
    </div>
  ) : (
    <div className={styles.empty}>
      <h2>No saved roles yet.</h2>
      <p>Open a role and choose “Save for later”. Your list stays in this browser.</p>
      <Link href="/opportunities/">Browse opportunities →</Link>
    </div>
  );
}
