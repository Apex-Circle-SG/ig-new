import Link from 'next/link';
import type { KnowledgeArticle } from '../../../../lib/library';
import guides from '../../../../lib/library/business/guides.json';
import collections from '../../../../lib/library/business/collections.json';
import { collectionPath, primaryCollection } from '../../../../lib/library/collection-navigation';
import formulaEntries from '../../../../lib/library/business/accounting-formulas.json';
import { FormulaReference } from './formula-reference';
import { FormulaDirectory } from './formula-directory';
import { MetricDirectory } from './metric-directory';
import { SalesQuestionBank } from './sales-question-bank';
import { NetworkConnections } from './network-connections';
import { SourceImage, type SourceImageRecord } from './source-image';
import { RelationshipDiagram, type RelationshipDiagramData } from './relationship-diagram';
import { AcademicReadingList } from './academic-reading-list';
import { AcademicReferenceDirectory } from './academic-reference-directory';
import academicReferences from '../../../../lib/library/business/academic-references.json';
import { PricePatternGallery, type PricePanel } from './price-pattern-gallery';
import { TranscribedSource, type Transcription } from './transcribed-source';
import styles from './collection-guide.module.css';

type Guide = typeof guides[number];
type Block = Guide['sections'][number]['blocks'][number];
const guidePath = (slug: string) => `/library/knowledge/${slug}/`;
const guideBySlug = new Map(guides.map((guide) => [guide.slug, guide]));
const collectionBySlug = new Map(collections.map((collection) => [collection.slug, collection]));

export function isCollectionArticle(slug: string) {
  return guideBySlug.has(slug) || collectionBySlug.has(slug);
}

function DetailBlock({ block, caption }: { block: Block; caption: string }) {
  if (block.kind === 'bilingual' && 'pairs' in block && block.pairs) return <div className={styles.bilingual}>{block.pairs.map((pair, i) => <p lang="en" key={i}>{pair.english}</p>)}<details><summary>Read this section in the Chinese original</summary>{block.pairs.map((pair, i) => <p lang="zh-Hans" key={i}>{pair.original}</p>)}</details></div>;
  if (block.kind === 'resources' && 'resources' in block && block.resources) return <ul>{block.resources.map(resource => <li key={resource.href}><a href={resource.href}>{resource.label} →</a></li>)}</ul>;
  if (block.kind === 'academic-readings' && 'referenceIds' in block && block.referenceIds) return <AcademicReadingList ids={block.referenceIds} />;
  if (block.kind === 'reading-links' && 'links' in block && block.links) return <ul>{block.links.map((link) => <li key={link.slug}><Link href={guidePath(link.slug)}>{link.label} →</Link></li>)}</ul>;
  if (block.kind === 'review' && 'review' in block && block.review) return <div className={styles.referenceEntry}>
    <p><strong>{block.review.status}</strong></p>
    {block.review.paragraphs.map((text, i) => <p key={i}>{text}</p>)}
    <p className={styles.figureNote}>Editorial review: {block.review.date}. Scope and remaining uncertainties are described above.</p>
    {block.review.references.length > 0 && <ul>{block.review.references.map((reference) => <li key={reference.url}><a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title} ↗</a></li>)}</ul>}
    <div className={styles.formulaOriginal} data-nosnippet><details><summary>Original study notes — includes historical or unverified claims</summary>
      {block.review.original.map((text, i) => <p key={i}>{text}</p>)}
    </details></div>
  </div>;
  if (block.kind === 'metric' || block.kind === 'metric-source-headings') return null;
  if (block.kind === 'formula' && 'formula' in block && block.formula) return <FormulaReference formula={block.formula} />;
  if (block.kind === 'ritual' && 'text' in block && typeof block.text === 'string') {
    const separator = block.text.indexOf(' - ');
    const hasSpeaker = separator > 0 && separator < 24;
    return <p className={block.text.startsWith('(') ? styles.stageDirection : styles.ritualLine}>{hasSpeaker ? <><strong>{block.text.slice(0, separator)}</strong>{' — '}{block.text.slice(separator + 3)}</> : block.text}</p>;
  }
  if (block.kind === 'table' && 'rows' in block) {
    return <><p className={styles.tableHint}>Scroll sideways if needed to see every column.</p><div className={styles.tableScroll} tabIndex={0} role="region" aria-label={`${caption}: scrollable comparison`}>
      <table><caption>{caption} — detailed comparison</caption>{'headers' in block && <thead><tr>{block.headers?.map((header) => <th scope="col" key={header}>{header}</th>)}</tr></thead>}<tbody>{block.rows?.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => {
        const isHeader = !('headers' in block) && ri === 0 && cell.length === 1 && cell[0].length < 85;
        const content = cell.map((text, i) => <p key={i}>{text}</p>);
        return isHeader ? <th key={ci} scope="col">{content}</th> : <td key={ci}>{content}</td>;
      })}</tr>)}</tbody></table>
    </div></>;
  }
  if (block.kind === 'reference' && 'term' in block && 'paragraphs' in block) return <div className={styles.referenceEntry}><h3>{block.term}</h3>{block.paragraphs?.map((text, i) => <p key={i}>{text}</p>)}</div>;
  if (block.kind === 'definition' && 'term' in block && 'text' in block) return <dl className={styles.definitions}><div><dt>{block.term}</dt><dd>{block.text}</dd></div></dl>;
  if (block.kind === 'heading' && 'text' in block) return <h3>{block.text}</h3>;
  if (block.kind === 'list' && 'items' in block) return <ul>{block.items?.map((item, i) => <li key={i}>{item}</li>)}</ul>;
  return 'text' in block ? <p>{block.text}</p> : null;
}

type Visual = Pick<Guide['figures'][number], 'title' | 'kind' | 'headers' | 'rows' | 'note'> & {
  sourceImage?: SourceImageRecord;
  transcription?: Transcription;
  diagram?: RelationshipDiagramData;
  gallery?: PricePanel[];
  plot?: { xLabel: string; yLabel: string; lines: { label: string; path: string }[] };
  grid?: { xLabel: string; yLabel: string; points: { x: number; y: number; label: string }[] };
};

function Comparison({ figure }: { figure: Visual }) {
  const table = <><p className={styles.tableHint}>Scroll sideways if needed to see every column.</p><div className={`${styles.tableScroll} ${figure.headers.length === 2 ? styles.compactTable : ''}`} tabIndex={0} role="region" aria-label={`${figure.title}: scrollable comparison`}><table><caption className={styles.srOnly}>{figure.title}</caption><thead><tr>{figure.headers.map((h) => <th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{figure.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th scope="row" key={j}>{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div></>;
  return (figure.diagram || figure.gallery) && figure.rows.length > 6
    ? <details className={styles.imageDisclosure}><summary>Read all diagram labels and relationships</summary>{table}</details>
    : table;
}

function Figure({ figure }: { figure: Visual }) {
  return <figure className={styles.figure}>
    <figcaption>{figure.title}</figcaption>
    {figure.transcription && <TranscribedSource data={figure.transcription} />}
    {figure.gallery && <PricePatternGallery panels={figure.gallery} />}
    {figure.diagram && <><p className={styles.figureNote}>Scroll sideways if needed to explore the diagram. The comparison below contains its full text and relationships.</p><RelationshipDiagram diagram={figure.diagram} title={figure.title} /></>}
    {figure.grid && <svg className={styles.managementGrid} viewBox="0 0 360 330" role="img" aria-label={`${figure.title}. Horizontal axis: ${figure.grid.xLabel}; vertical axis: ${figure.grid.yLabel}. Both run from 1 to 9. The five positions and their descriptions follow in the table.`}>
      {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${65 + i * 28} 25 V277 M65 ${25 + i * 28} H317`} fill="none" stroke="#d3caed" />)}
      {figure.grid.points.map((point) => <g key={point.label}>
        <circle cx={65 + (point.x - 0.5) * 28} cy={25 + (9.5 - point.y) * 28} r="13" fill="#eee9fc" stroke="#6551b8" />
        <text x={65 + (point.x - 0.5) * 28} y={29 + (9.5 - point.y) * 28} textAnchor="middle" fill="#40345f" fontSize="10">{point.label}</text>
      </g>)}
      <text x="191" y="308" textAnchor="middle">{figure.grid.xLabel} →</text>
      <text x="20" y="151" transform="rotate(-90 20 151)" textAnchor="middle">{figure.grid.yLabel} →</text>
    </svg>}
    {figure.plot && <>
      <svg className={styles.conceptualPlot} viewBox="0 0 500 220" role="img" aria-label={`${figure.title}. Conceptual, unscaled curves: ${figure.plot.lines.map((line) => line.label).join('; ')}. ${figure.plot.yLabel} against ${figure.plot.xLabel}.`}>
        <path d="M40 25 V205 H465" fill="none" stroke="currentColor" />
        {figure.plot.lines.map((line, i) => <path key={line.label} d={line.path} fill="none" stroke={i === 0 ? '#6551b8' : '#226b64'} strokeWidth="3" strokeDasharray={i === 0 ? undefined : '7 4'} />)}
      </svg>
      <p className={styles.figureNote}>Vertical axis: {figure.plot.yLabel}. Horizontal axis: {figure.plot.xLabel}.</p>
      <p className={styles.figureNote}>{figure.plot.lines.map((line, i) => `${i === 0 ? 'Solid purple' : 'Dashed teal'}: ${line.label}`).join(' · ')}. Conceptual and unscaled.</p>
    </>}
    {figure.sourceImage ? (figure.transcription ? <details className={styles.imageDisclosure}><summary>View the source scan, attribution and review notes</summary><SourceImage source={figure.sourceImage} /></details> : <SourceImage source={figure.sourceImage} />) : figure.kind === 'flow' ? <ol className={styles.flow}>{figure.rows.map((row, i) => <li key={i}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{row[0]}</li>)}</ol>
      : figure.kind === 'matrix' ? <Comparison figure={figure} />
        : figure.kind === 'network' ? <><NetworkConnections /><Comparison figure={figure} /></>
          : figure.kind === 'dots' ? <svg className={styles.dots} viewBox="0 0 220 220" role="img" aria-label={figure.note}>{figure.rows.flatMap((row, ri) => row.map((dot, ci) => <circle key={`${ri}-${ci}`} cx={35 + ci * 150 / (row.length - 1)} cy={35 + ri * 150 / (figure.rows.length - 1)} r="12" fill={dot === 'filled' ? '#6551b8' : 'white'} stroke="#6551b8" strokeWidth="2" />))}</svg>
            : <dl className={styles.definitions}>{figure.rows.map((row, i) => <div key={i}><dt>{row[0]}</dt><dd>{row[1]}</dd></div>)}</dl>}
    {figure.note && <p className={styles.figureNote}>{figure.note}</p>}
  </figure>;
}

function ReadingNotes({ notes }: { notes: string[] }) {
  return notes.length > 0 && <aside className={styles.editorial} id="reading-notes"><h2>Reading notes &amp; limitations</h2><ul>{notes.map((note) => <li key={note}>{note}</li>)}</ul></aside>;
}

export function CollectionGuide({ article, articles, referenceId }: { article: KnowledgeArticle; articles: KnowledgeArticle[]; referenceId?: string }) {
  const collection = collectionBySlug.get(article.slug);
  const topicHub = collections.find((item) => item.topicRoot && item.topic === article.topic);
  const guide = guideBySlug.get(article.slug);
  if (!topicHub || (!collection && !guide)) throw new Error(`Missing collection guide: ${article.slug}`);
  const parentCollection = primaryCollection(article.slug);
  const ancestors = collectionPath(article.slug);
  const related = guide?.related.map((slug) => articles.find((item) => item.slug === slug)).filter((item) => item !== undefined) ?? [];
  const selected = collection ? articles.filter((item) => primaryCollection(item.slug)?.slug === collection.slug).map((item) => ({ ...item, format: guideBySlug.get(item.slug)?.format ?? 'guide' })) : [];
  const groups = collection?.groups.filter((group) => selected.some((item) => item.group === group.name)) ?? [];
  const isGateway = collection && selected.every((item) => item.format === 'collection');
  const readingPath = collection && <section className={styles.start}><h2>Choose a reading path</h2><p>{collection.intro}</p><ol className={styles.journey}>{collection.journey.map((step) => <li key={step.title}><strong>{step.title}</strong>{step.links.map((link) => <Link key={link.slug} href={guidePath(link.slug)}>{link.label}</Link>)}</li>)}</ol></section>;
  const relatedCollections = collection?.relatedCollections.length
    ? collections.filter((item) => collection.relatedCollections.some((slug) => slug === item.slug))
    : collections.filter((item) => item.topicRoot && item.slug !== collection?.slug);
  const visuals = guide ? [...guide.figures, ...guide.visuals] : [];
  const metrics = guide?.sections.flatMap((section) => section.blocks.flatMap((block) => 'metric' in block && block.metric ? [block.metric] : [])) ?? [];
  const metricReadings = articles.filter((item) => metrics.some((metric) => metric.related.includes(item.slug))).map(({ slug, title }) => ({ slug, title }));
  const visualHeading = visuals.some((visual) => 'transcription' in visual && visual.transcription) ? 'Working prompts & source reference' : visuals.some((visual) => 'sourceImage' in visual) ? 'Source images & attribution' : 'Visual explanations';
  const isRitual = guide?.format === 'ritual';
  const chapters = guides.filter((item) => item.collection === (isRitual ? 'freemasonry' : 'art-of-war') && item.format === (isRitual ? 'ritual' : 'chapter'));
  const chapterIndex = chapters.findIndex((item) => item.slug === article.slug);
  const previous = chapters[chapterIndex - 1];
  const next = chapters[chapterIndex + 1];
  const isChapter = guide?.format === 'chapter';
  return <article className={`shell ${styles.page}`}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/library/">Library</Link>{ancestors.map((ancestor) => <span key={ancestor.slug}><span aria-hidden="true"> / </span><Link href={guidePath(ancestor.slug)}>{ancestor.title}</Link></span>)}<span aria-hidden="true">/</span><span aria-current="page">{article.title}</span></nav>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>{isRitual ? `FREEMASONRY · READING ${chapterIndex + 1} OF ${chapters.length}` : isChapter ? `THE ART OF WAR · CHAPTER ${chapterIndex + 1} OF 13` : collection ? 'A CONNECTED KNOWLEDGE COLLECTION' : article.group}</p>
      <h1>{article.title}</h1><p className={styles.summary}>{article.summary}</p>
      {guide?.takeaway && <p className={styles.takeaway}><strong>Key takeaway</strong>{guide.takeaway}</p>}
      {collection && <p className={styles.meta}>{selected.length} {isGateway ? 'subject collections' : 'guides and reading indexes'} · {groups.length} {groups.length === 1 ? 'section' : 'sections'} · detailed notes and visual explanations</p>}
    </header>
    {collection ? <>
      {!isGateway && readingPath}
      {!isGateway && <nav className={styles.jumpLinks} aria-label="Collection categories">{groups.map((group, i) => <a key={group.name} href={`#category-${i + 1}`}>{group.name}</a>)}</nav>}
      {!isGateway && <ReadingNotes notes={collection.notes} />}
      {groups.map((group, i) => <section className={styles.category} id={`category-${i + 1}`} key={group.name}><p className={styles.eyebrow}>EXPLORE {String(i + 1).padStart(2, '0')}</p><h2>{group.name}</h2><p>{group.description}</p><div className={styles.cards}>{selected.filter((g) => g.group === group.name).map((g) => <Link className={styles.card} href={guidePath(g.slug)} key={g.slug}><h3>{g.title}</h3><p>{g.summary}</p><strong>{g.format === 'chapter' ? 'Read chapter →' : g.format === 'collection' ? 'Browse collection →' : 'Explore guide →'}</strong></Link>)}</div></section>)}
      {isGateway && readingPath}
      {isGateway && <ReadingNotes notes={collection.notes} />}
      <footer className={styles.provenance}><h2>Continue exploring</h2>{parentCollection && <p><Link href={guidePath(parentCollection.slug)}>Back to {parentCollection.title} →</Link></p>}{relatedCollections.map((item) => <p key={item.slug}><Link href={guidePath(item.slug)}>Explore {item.title} →</Link></p>)}{collection.references.map((reference) => <p key={reference.url}><a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title} ↗</a></p>)}</footer>
    </> : guide && <>
      {!isChapter && guide.steps.length > 0 && <section className={styles.overview} aria-labelledby="overview-heading"><h2 id="overview-heading">At a glance</h2><ol className={styles.flow}>{guide.steps.map((step, i) => <li key={step}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{step}</li>)}</ol><p className={styles.meta}>An editorial reading sequence; individual frameworks are explained in the detailed notes below.</p></section>}
      <div className={styles.layout}>
        <nav className={styles.contents} aria-label="On this page"><strong>On this page</strong><ol>{guide.format === 'formula-index' && <li><a href="#formula-reference">Formula reference</a></li>}{guide.format === 'metric-index' && <li><a href="#metric-reference">Executive measures</a></li>}{visuals.length > 0 && <li><a href="#visual-explanations">{visualHeading}</a></li>}{guide.notes.length > 0 && <li><a href="#reading-notes">Reading notes &amp; limitations</a></li>}{guide.format === 'reference-index' && <li><a href="#academic-references">Find an academic reference</a></li>}{guide.format === 'questions' ? <li><a href="#question-bank">Browse questions by stage</a></li> : guide.sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.heading}</a></li>)}{guide.interpretation && <li><a href="#reflection">Business reflection</a></li>}<li><a href="#related">Continue exploring</a></li></ol></nav>
        <div className={styles.body}>
          <ReadingNotes notes={guide.notes} />
          {guide.format === 'formula-index' && <FormulaDirectory entries={formulaEntries} />}
          {guide.format === 'reference-index' && <AcademicReferenceDirectory key={referenceId ?? 'catalogue'} entries={academicReferences} referenceId={referenceId} />}
          {guide.format === 'metric-index' && <MetricDirectory entries={metrics} readings={metricReadings} />}
          {visuals.length > 0 && <section id="visual-explanations"><h2>{visualHeading}</h2>{visuals.map((f) => <Figure key={f.title} figure={f} />)}</section>}
          {guide.format === 'questions' ? <section id="question-bank"><h2>Questions for each conversation</h2><SalesQuestionBank stages={guide.questionStages} /></section> : guide.sections.map((s) => <section className={`${styles.detail} ${isChapter ? styles.chapter : ''}`} id={s.id} key={s.id}><h2>{s.heading}</h2>{s.blocks.map((block, i) => <DetailBlock key={i} block={block} caption={s.heading} />)}</section>)}
          {guide.interpretation && <aside id="reflection" className={styles.reflection}><p className={styles.eyebrow}>EDITORIAL INTERPRETATION</p><h2>A business reflection</h2><p>{guide.interpretation}</p></aside>}
          {(isChapter || isRitual) && <nav className={styles.chapterNav} aria-label="Chapter navigation">{previous && <Link href={guidePath(previous.slug)}>← Previous: {previous.title}</Link>}{next && <Link href={guidePath(next.slug)}>Next: {next.title} →</Link>}</nav>}
          <section id="related" className={styles.related}><h2>Continue exploring</h2><ul>{related.map((item) => <li key={item.slug}><Link href={guidePath(item.slug)}>{item.title}</Link></li>)}</ul><Link href={guidePath(parentCollection?.slug ?? topicHub.slug)}>Browse {parentCollection?.title ?? article.topic} →</Link></section>
          <footer className={styles.provenance}><h2>About this reading</h2><p>{isRitual ? 'The supplied ritual text is retained in full, in its original sequence, including repeated passages, abbreviations, blanks and stage directions. Introductions and reading aids are editorial additions. This is an undated supplied version, not an authenticated universal ritual.' : isChapter ? 'The supplied historical chapter text is retained for study. Identical repeated passages may share one displayed paragraph; all original positions remain mapped. Introductions and business reflections are editorial additions.' : 'Adapted from the supplied study collection. Detailed source statements are retained for study and should be read with the limitations above. Introductions, reading sequences and recreated visuals are editorial additions.'}</p><p>Original documents, paragraph mappings and image provenance are retained in the editorial archive. Missing source detail is identified rather than filled with invented material.</p>{guide.references.map((reference) => <p key={reference.url}>Further reading: <a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title} ↗</a></p>)}</footer>
        </div>
      </div>
    </>}
  </article>;
}
