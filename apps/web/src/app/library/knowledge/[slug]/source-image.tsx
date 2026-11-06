import Image from 'next/image';
import styles from './collection-guide.module.css';

export type SourceImageRecord = {
  id: string;
  preview: string;
  full: string;
  previewWidth: number;
  previewHeight: number;
  creator: string;
  version: string;
  provenance: string;
  summary: string;
  limitations: string;
  alt: string;
  publications: { title: string; url: string }[];
  checked: string;
};

export function SourceImage({ source }: { source: SourceImageRecord }) {
  return <div className={styles.sourceImage}>
    <p className={styles.eyebrow}>SUPPLIED SOURCE ARTWORK · CONTEXTUAL STUDY</p>
    <dl className={styles.definitions}>
      <div><dt>Creator</dt><dd>{source.creator}</dd></div>
      <div><dt>Uploaded edition</dt><dd>{source.version}</dd></div>
      <div><dt>Attribution</dt><dd>{source.provenance}</dd></div>
    </dl>
    <p>{source.summary}</p>
    <p className={styles.sourceCaution}><strong>Evidence note</strong> {source.limitations}</p>
    <details className={styles.imageDisclosure}>
      <summary>View the supplied image and open its full-size version</summary>
      <Image src={source.preview} alt={source.alt} width={source.previewWidth} height={source.previewHeight} unoptimized className={styles.sourcePreview} />
      <p><a href={source.full} target="_blank" rel="noopener noreferrer">Open full-size supplied image ↗</a></p>
      <p className={styles.figureNote}>Use your browser’s image zoom for fine print. The original layout and creator marks are retained; this is a source for examination, not a verified factual diagram.</p>
    </details>
    <div className={styles.imageSources}><strong>Creator sources &amp; evidence context</strong><ul>{source.publications.map((publication) => <li key={publication.url}><a href={publication.url} target="_blank" rel="noopener noreferrer">{publication.title} ↗</a></li>)}</ul><p className={styles.figureNote}>Source links checked {source.checked}. A creator publication establishes attribution; it does not establish that every claim in the image is true.</p></div>
  </div>;
}
