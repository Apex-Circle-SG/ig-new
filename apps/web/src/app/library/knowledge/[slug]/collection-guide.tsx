import Link from 'next/link';
import type { KnowledgeArticle } from '../../../../lib/library';
import guides from '../../../../lib/library/business/guides.json';
import collections from '../../../../lib/library/business/collections.json';
import { SalesQuestionBank } from './sales-question-bank';
import { NetworkConnections } from './network-connections';
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

type Visual = Pick<Guide['figures'][number], 'title' | 'kind' | 'headers' | 'rows' | 'note'>;

function Comparison({ figure }: { figure: Visual }) {
  return <div className={`${styles.tableScroll} ${figure.headers.length === 2 ? styles.compactTable : ''}`} tabIndex={0} role="region" aria-label={`${figure.title}: scrollable comparison`}><table><caption className={styles.srOnly}>{figure.title}</caption><thead><tr>{figure.headers.map((h) => <th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{figure.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th scope="row" key={j}>{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function Figure({ figure }: { figure: Visual }) {
  return <figure className={styles.figure}>
    <figcaption>{figure.title}</figcaption>
    {figure.kind === 'flow' ? <ol className={styles.flow}>{figure.rows.map((row, i) => <li key={i}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{row[0]}</li>)}</ol>
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

export function CollectionGuide({ article, articles }: { article: KnowledgeArticle; articles: KnowledgeArticle[] }) {
  const collection = collectionBySlug.get(article.slug);
  const topicHub = collections.find((item) => item.topicRoot && item.topic === article.topic);
  const guide = guideBySlug.get(article.slug);
  if (!topicHub || (!collection && !guide)) throw new Error(`Missing collection guide: ${article.slug}`);
  const parentCollection = guide?.collection ? collections.find((item) => item.slug === guide.collection) : undefined;
  const related = guide?.related.map((slug) => articles.find((item) => item.slug === slug)).filter((item) => item !== undefined) ?? [];
  const selected = collection ? articles.filter((item) => collection.topicRoot
    ? item.topic === collection.topic && item.slug !== collection.slug && !guideBySlug.get(item.slug)?.collection
    : guideBySlug.get(item.slug)?.collection === collection.slug).map((item) => ({ ...item, format: guideBySlug.get(item.slug)?.format ?? 'guide' })) : [];
  const visuals = guide ? [...guide.figures, ...guide.visuals] : [];
  const chapters = guides.filter((item) => item.collection === 'art-of-war');
  const chapterIndex = chapters.findIndex((item) => item.slug === article.slug);
  const previous = chapters[chapterIndex - 1];
  const next = chapters[chapterIndex + 1];
  const isChapter = guide?.format === 'chapter';
  return <article className={`shell ${styles.page}`}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/library/">Library</Link><span aria-hidden="true">/</span>{article.slug === topicHub.slug ? <span>{article.topic}</span> : <><Link href={guidePath(topicHub.slug)}>{article.topic}</Link><span aria-hidden="true">/</span>{parentCollection ? <Link href={guidePath(parentCollection.slug)}>{parentCollection.title}</Link> : <span>{article.group}</span>}</>}</nav>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>{isChapter ? `THE ART OF WAR · CHAPTER ${chapterIndex + 1} OF 13` : collection ? 'A CONNECTED KNOWLEDGE COLLECTION' : article.group}</p>
      <h1>{article.title}</h1><p className={styles.summary}>{article.summary}</p>
      {guide?.takeaway && <p className={styles.takeaway}><strong>Key takeaway</strong>{guide.takeaway}</p>}
      {collection && <p className={styles.meta}>{selected.length} guides and reading indexes · {collection.groups.length} {collection.groups.length === 1 ? 'section' : 'sections'} · detailed notes and visual explanations</p>}
    </header>
    {collection ? <>
      <section className={styles.start}><h2>Choose a reading path</h2><p>{collection.intro}</p><ol className={styles.journey}>{collection.journey.map((step) => <li key={step.title}><strong>{step.title}</strong>{step.links.map((link) => <Link key={link.slug} href={guidePath(link.slug)}>{link.label}</Link>)}</li>)}</ol></section>
      <nav className={styles.jumpLinks} aria-label="Collection categories">{collection.groups.map((group, i) => <a key={group.name} href={`#category-${i + 1}`}>{group.name}</a>)}</nav>
      <ReadingNotes notes={collection.notes} />
      {collection.groups.map((group, i) => <section className={styles.category} id={`category-${i + 1}`} key={group.name}><p className={styles.eyebrow}>EXPLORE {String(i + 1).padStart(2, '0')}</p><h2>{group.name}</h2><p>{group.description}</p><div className={styles.cards}>{selected.filter((g) => g.group === group.name).map((g) => <Link className={styles.card} href={guidePath(g.slug)} key={g.slug}><h3>{g.title}</h3><p>{g.summary}</p><strong>{g.format === 'chapter' ? 'Read chapter →' : g.format === 'collection' ? 'Browse collection →' : 'Explore guide →'}</strong></Link>)}</div></section>)}
      <footer className={styles.provenance}><h2>Continue exploring</h2>{collections.filter((item) => item.topicRoot && item.slug !== collection.slug).map((item) => <p key={item.slug}><Link href={guidePath(item.slug)}>Explore {item.title} →</Link></p>)}{collection.references.map((reference) => <p key={reference.url}><a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title} ↗</a></p>)}</footer>
    </> : guide && <>
      {!isChapter && <section className={styles.overview} aria-labelledby="overview-heading"><h2 id="overview-heading">At a glance</h2><ol className={styles.flow}>{guide.steps.map((step, i) => <li key={step}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{step}</li>)}</ol><p className={styles.meta}>An editorial reading sequence; individual frameworks are explained in the detailed notes below.</p></section>}
      <div className={styles.layout}>
        <nav className={styles.contents} aria-label="On this page"><strong>On this page</strong><ol>{visuals.length > 0 && <li><a href="#visual-explanations">Visual explanations</a></li>}{guide.notes.length > 0 && <li><a href="#reading-notes">Reading notes &amp; limitations</a></li>}{guide.format === 'questions' ? <li><a href="#question-bank">Browse questions by stage</a></li> : guide.sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.heading}</a></li>)}{guide.interpretation && <li><a href="#reflection">Business reflection</a></li>}<li><a href="#related">Continue exploring</a></li></ol></nav>
        <div className={styles.body}>
          <ReadingNotes notes={guide.notes} />
          {visuals.length > 0 && <section id="visual-explanations"><h2>Visual explanations</h2>{visuals.map((f) => <Figure key={f.title} figure={f} />)}</section>}
          {guide.format === 'questions' ? <section id="question-bank"><h2>Questions for each conversation</h2><SalesQuestionBank stages={guide.questionStages} /></section> : guide.sections.map((s) => <section className={`${styles.detail} ${isChapter ? styles.chapter : ''}`} id={s.id} key={s.id}><h2>{s.heading}</h2>{s.blocks.map((block, i) => <DetailBlock key={i} block={block} caption={s.heading} />)}</section>)}
          {guide.interpretation && <aside id="reflection" className={styles.reflection}><p className={styles.eyebrow}>EDITORIAL INTERPRETATION</p><h2>A business reflection</h2><p>{guide.interpretation}</p></aside>}
          {isChapter && <nav className={styles.chapterNav} aria-label="Chapter navigation">{previous && <Link href={guidePath(previous.slug)}>← Previous: {previous.title}</Link>}{next && <Link href={guidePath(next.slug)}>Next: {next.title} →</Link>}</nav>}
          <section id="related" className={styles.related}><h2>Continue exploring</h2><ul>{related.map((item) => <li key={item.slug}><Link href={guidePath(item.slug)}>{item.title}</Link></li>)}</ul><Link href={guidePath(parentCollection?.slug ?? topicHub.slug)}>Browse {parentCollection?.title ?? article.topic} →</Link></section>
          <footer className={styles.provenance}><h2>About this reading</h2><p>{isChapter ? 'The supplied historical chapter text is retained for study. Identical repeated passages may share one displayed paragraph; all original positions remain mapped. Introductions and business reflections are editorial additions.' : 'Adapted from the supplied study collection. Detailed source statements are retained for study and should be read with the limitations above. Introductions, reading sequences and recreated visuals are editorial additions.'}</p><p>Original documents, paragraph mappings and image provenance are retained in the editorial archive. Missing source detail is identified rather than filled with invented material.</p>{guide.references.map((reference) => <p key={reference.url}>Further reading: <a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title} ↗</a></p>)}</footer>
        </div>
      </div>
    </>}
  </article>;
}
