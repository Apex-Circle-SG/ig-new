import styles from './collection-guide.module.css';

export type RelationshipDiagramData = {
  id: string;
  width: number;
  height: number;
  nodes: { id: string; label: string; lines: string[]; x: number; y: number; width: number; height: number }[];
  edges: { from: string; to: string; path: string; arrow: string; label: string; labelX: number; labelY: number }[];
};

export function RelationshipDiagram({ diagram, title }: { diagram: RelationshipDiagramData; title: string }) {
  const marker = `${diagram.id}-arrow`;
  return <div className={styles.diagramScroll} tabIndex={0} role="region" aria-label={`${title}: scrollable diagram`}>
    <svg viewBox={`0 0 ${diagram.width} ${diagram.height}`} role="img" aria-label={`${title}. Full labels and relationships follow in the comparison table.`}>
      <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#6551b8" /></marker></defs>
      {diagram.edges.map((edge, i) => <g key={i}>
        <path d={edge.path} fill="none" stroke="#6551b8" strokeWidth="2" markerEnd={edge.arrow === 'none' ? undefined : `url(#${marker})`} markerStart={edge.arrow === 'both' ? `url(#${marker})` : undefined} />
        {edge.label && <text x={edge.labelX} y={edge.labelY} textAnchor="middle" paintOrder="stroke" stroke="#f8f6ff" strokeWidth="6" fill="#40345f">{edge.label}</text>}
      </g>)}
      {diagram.nodes.map((node) => <g key={node.id}>
        <rect x={node.x} y={node.y} width={node.width} height={node.height} rx="10" fill="#eee9fc" stroke="#9787cf" />
        <text x={node.x + node.width / 2} y={node.y + (node.height - (node.lines.length - 1) * 23) / 2 + 6} textAnchor="middle" fill="#40345f">
          {node.lines.map((line, i) => <tspan key={i} x={node.x + node.width / 2} dy={i ? 23 : 0}>{line}</tspan>)}
        </text>
      </g>)}
    </svg>
  </div>;
}
