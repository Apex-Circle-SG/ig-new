import Link from 'next/link';
import entries from '../../../../lib/library/business/academic-references.json';
import styles from './collection-guide.module.css';

const byId = new Map(entries.map((entry) => [entry.id, entry]));

export function AcademicReadingList({ ids }: { ids: string[] }) {
  return <ul className={styles.academicReadings}>{ids.map((id) => {
    const entry = byId.get(id);
    if (!entry) throw new Error(`Unknown academic reference: ${id}`);
    return <li key={id}><Link href={`/library/knowledge/academic-reference-catalogue/?reference=${id}#${id}`}>{entry.title}</Link>
      <p>{entry.authors.join('; ')}{entry.year && ` · ${entry.year}`} · {entry.type}</p>
      <p>{entry.metadataStatus} · {entry.readingStatus} · {entry.claimStatus}</p>
    </li>;
  })}</ul>;
}
