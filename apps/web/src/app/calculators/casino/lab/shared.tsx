'use client';
import { useEffect, useRef, useState } from 'react';
import { SiteLink as Link } from '@insightginie/ui';
import { cardName, suit } from '../../../../lib/casino/cards';
import type { Calculation } from './calculation.worker';
import styles from './lab.module.css';
export const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 3 });
export const pct = (n: number) => `${fmt(100 * n)}%`;
export function useCalculation<T>() {
  const worker = useRef<Worker | null>(null);
  const [value, setValue] = useState<T | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => () => worker.current?.terminate(), []);
  function cancel() {
    worker.current?.terminate();
    worker.current = null;
    setValue(null);
    setError('');
    setBusy(false);
  }
  function calculate(request: Calculation) {
    cancel();
    setBusy(true);
    try {
      const w = new Worker(new URL('./calculation.worker.ts', import.meta.url));
      worker.current = w;
      w.onmessage = (e) => {
        setBusy(false);
        setError(e.data.error ?? '');
        setValue(e.data.value ?? null);
        w.terminate();
        worker.current = null;
      };
      w.onerror = () => {
        setBusy(false);
        setError('Calculation could not finish. Try again.');
        w.terminate();
        worker.current = null;
      };
      w.postMessage(request);
    } catch {
      setBusy(false);
      setError('This browser could not start the calculation worker.');
    }
  }
  return { value, busy, error, calculate, cancel };
}
export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 1000000,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        value={Number.isNaN(value) ? '' : value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
      />
    </label>
  );
}
export function Cards({
  cards,
  hidden = false,
  held,
  onHold,
}: {
  cards: number[];
  hidden?: boolean;
  held?: number[];
  onHold?: (index: number) => void;
}) {
  return (
    <div className={styles.cards}>
      {cards.map((c, i) => {
        const content = (
          <>
            <span>{cardName(c)}</span>
            {onHold && <small>{held?.includes(i) ? 'HELD' : 'Tap to hold'}</small>}
          </>
        );
        const cls = `${styles.card} ${suit(c) === 1 || suit(c) === 2 ? styles.red : ''} ${held?.includes(i) ? styles.held : ''}`;
        return onHold ? (
          <button
            className={cls}
            type="button"
            aria-label={`${cardName(c)}, ${held?.includes(i) ? 'held' : 'not held'}`}
            aria-pressed={held?.includes(i) ?? false}
            key={i}
            onClick={() => onHold(i)}
          >
            {content}
          </button>
        ) : (
          <div className={cls} key={i}>
            {content}
          </div>
        );
      })}
      {hidden && (
        <div className={`${styles.card} ${styles.hidden}`} aria-label="Face-down card">
          ?
        </div>
      )}
    </div>
  );
}
export function Dice({ values }: { values: number[] }) {
  return (
    <div className={styles.dice}>
      {values.map((n, i) => (
        <span key={i} aria-label={`Die ${i + 1}: ${n}`}>
          {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][n - 1]}
        </span>
      ))}
    </div>
  );
}
export function Metrics({ items }: { items: [string, string][] }) {
  return (
    <div className={styles.metrics}>
      {items.map(([k, v]) => (
        <div key={k}>
          <span>{k}</span>
          <strong>{v}</strong>
        </div>
      ))}
    </div>
  );
}
export function Chart({ series, labels }: { series: number[][]; labels: string[] }) {
  const all = series.flat(),
    min = Math.min(...all),
    max = Math.max(...all),
    range = Math.max(1, max - min);
  return (
    <figure className={styles.chart}>
      <svg
        viewBox="0 0 640 200"
        role="img"
        aria-label={`Virtual balance paths: ${labels.join(' and ')}. Range ${fmt(min)} to ${fmt(max)}.`}
      >
        {series.map((points, i) => (
          <polyline
            key={i}
            fill="none"
            stroke={i ? '#247b6c' : '#6750c9'}
            strokeWidth="3"
            strokeDasharray={i ? '7 4' : undefined}
            points={points
              .map(
                (v, j) =>
                  `${10 + (j / Math.max(1, points.length - 1)) * 620},${185 - ((v - min) / range) * 170}`,
              )
              .join(' ')}
          />
        ))}
      </svg>
      <figcaption>
        {labels.join(' · ')} — minimum {fmt(min)}, maximum {fmt(max)} virtual units
      </figcaption>
    </figure>
  );
}
export function Distribution({ rows }: { rows: { label: string; probability: number }[] }) {
  return (
    <div className={styles.distribution}>
      {rows.map((r) => (
        <div key={r.label}>
          <span>{r.label}</span>
          <meter
            min={0}
            max={1}
            value={r.probability}
            aria-label={`${r.label}: ${pct(r.probability)}`}
          />
          <strong>{pct(r.probability)}</strong>
        </div>
      ))}
    </div>
  );
}
export function CalculationStatus({ busy, error }: { busy: boolean; error: string }) {
  return (
    <>
      {busy && <p role="status">Calculating in your browser…</p>}
      {error && <p role="alert">{error}</p>}
    </>
  );
}
export function LabFooter() {
  return (
    <p className={styles.related}>
      Explore: <Link href="/calculators/casino/">All casino labs</Link> ·{' '}
      <Link href="/calculators/casino/session-lab/">Compare sessions</Link> ·{' '}
      <Link href="/calculators/casino/expected-value/">Expected value</Link>
    </p>
  );
}
export function CardEditor({
  cards,
  onChange,
}: {
  cards: number[];
  onChange: (cards: number[]) => void;
}) {
  return (
    <div className={styles.grid}>
      {cards.map((card, i) => (
        <label key={i}>
          Card {i + 1}
          <select
            value={card}
            onChange={(e) => onChange(cards.map((c, j) => (i === j ? Number(e.target.value) : c)))}
          >
            {Array.from({ length: 52 }, (_, c) => (
              <option key={c} value={c}>
                {cardName(c)}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
