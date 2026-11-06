import styles from './collection-guide.module.css';

export type PricePanel = {
  title: string;
  group: string;
  description: string;
  sourcePosition: string;
  paths: { d: string; role: string }[];
  labels: { x: number; y: number; text: string }[];
  candles: { x: number; open: number; close: number; high: number; low: number }[];
};

export function PricePatternGallery({ panels }: { panels: PricePanel[] }) {
  const groups = [...new Set(panels.map((panel) => panel.group))];
  return <div className={styles.patternGallery}>
    <p className={styles.figureNote}>{panels.some((panel) => panel.paths.length || panel.candles.length) ? 'Conceptual sketches, not market observations or tested signals. Purple lines show price; dashed teal lines show reference levels or projections. Filled candle bodies close above their open; outlined bodies close below it. Open a group to compare the shapes.' : 'Open a group to study the source labels and relationships. The complete supplied image below preserves the detailed geometry and annotations; these cards do not substitute an inferred sketch.'}</p>
    {groups.map((group) => <details key={group} className={styles.patternGroup}>
      <summary>{group} · {panels.filter((panel) => panel.group === group).length} illustrations</summary>
      <div className={styles.patternCards}>{panels.filter((panel) => panel.group === group).map((panel) => <div key={panel.sourcePosition} className={styles.patternCard}>
        <h3>{panel.title}</h3>
        {(panel.paths.length > 0 || panel.candles.length > 0) && <svg viewBox="0 0 240 160" role="img" aria-label={`${panel.title}. ${panel.description}`}>
          {panel.paths.map((path, i) => <path key={i} d={path.d} fill="none" stroke={path.role === 'price' ? '#6551b8' : '#226b64'} strokeWidth="2" strokeDasharray={path.role === 'price' ? undefined : '5 4'} />)}
          {panel.candles.map((candle, i) => <g key={i}>
            <path d={`M${candle.x} ${candle.high} V${candle.low}`} fill="none" stroke="#5140b3" strokeWidth="2" />
            <rect x={candle.x - 6} y={Math.min(candle.open, candle.close)} width="12" height={Math.max(2, Math.abs(candle.open - candle.close))} fill={candle.close < candle.open ? '#6551b8' : 'white'} stroke="#5140b3" strokeWidth="2" />
          </g>)}
          {panel.labels.map((label, i) => <text key={i} x={label.x} y={label.y} textAnchor="middle" fill="#40345f" fontSize="11">{label.text}</text>)}
        </svg>}
        <p>{panel.description}</p>
        <p className={styles.figureNote}>Source placement: {panel.sourcePosition}. {panel.paths.length || panel.candles.length ? 'Geometry is redrawn for readability.' : 'Detailed geometry is available in the complete supplied reference below.'}</p>
      </div>)}</div>
    </details>)}
  </div>;
}
