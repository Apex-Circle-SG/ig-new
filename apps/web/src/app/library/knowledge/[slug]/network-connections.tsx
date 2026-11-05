'use client';

import { useState } from 'react';
import styles from './collection-guide.module.css';

export function NetworkConnections() {
  const [people, setPeople] = useState(6);
  const points = Array.from({ length: people }, (_, i) => ({
    x: 150 + 115 * Math.cos(2 * Math.PI * i / people - Math.PI / 2),
    y: 150 + 115 * Math.sin(2 * Math.PI * i / people - Math.PI / 2),
  }));
  const links = points.flatMap((point, i) => points.slice(i + 1).map((other, j) => <line key={`${i}-${i + j + 1}`} x1={point.x} y1={point.y} x2={other.x} y2={other.y} />));
  const pairs = people * (people - 1) / 2;
  return <div className={styles.network}>
    <label>People in the diagram<select value={people} onChange={(event) => setPeople(Number(event.target.value))}>{Array.from({ length: 12 }, (_, i) => i + 3).map((n) => <option key={n} value={n}>{n} people</option>)}</select></label>
    <p className={styles.connectionCount} aria-live="polite">{people} people · {pairs} possible links</p>
    <svg viewBox="0 0 300 300" role="img" aria-label={`Complete undirected network of ${people} people with ${pairs} possible links`}>
      <g stroke="#b8a9e7" strokeWidth="1.3">{links}</g>
      <g fill="#6551b8" stroke="white" strokeWidth="2">{points.map((point, i) => <circle key={i} cx={point.x} cy={point.y} r="7" />)}</g>
    </svg>
    <p className={styles.meta}>One link per distinct pair, with no self-links. This shows possible connections, not measured business value.</p>
  </div>;
}
