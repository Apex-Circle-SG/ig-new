import Link from 'next/link';
import type { KnowledgeArticle } from '../../../../lib/library';
import guides from '../../../../lib/library/business/guides.json';
import styles from './business-guide.module.css';

type Guide = typeof guides[number];
type Block = Guide['sections'][number]['blocks'][number];
const hubPath = '/library/knowledge/business-management/';
const groups = [
  ['Strategy foundations', 'Understand the choices, assumptions and levels of strategy.'],
  ['Markets & competition', 'Read the environment, identify rivals and choose a position.'],
  ['Resources & advantage', 'Examine the capabilities and activities behind customer value.'],
  ['Growth & innovation', 'Explore new products, markets and ways to develop the business.'],
  ['Decisions & execution', 'Evaluate options, allocate resources and measure progress.'],
  ['Leadership & organizational change', 'Build teams and support the organizational work of change.'],
  ['Negotiation', 'Prepare, create options and reach workable agreements.'],
  ['Productivity & priorities', 'Turn goals into focused work and a manageable workflow.'],
];

function DetailBlock({ block, caption }: { block: Block; caption: string }) {
  if (block.kind === 'table' && 'rows' in block) {
    return <div className={styles.tableScroll} tabIndex={0} role="region" aria-label={`${caption}: scrollable comparison`}>
      <table><caption>{caption} — detailed comparison</caption>{'headers' in block && <thead><tr>{block.headers?.map((header) => <th scope="col" key={header}>{header}</th>)}</tr></thead>}<tbody>{block.rows?.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => {
        const isHeader = !('headers' in block) && ri === 0 && cell.length === 1 && cell[0].length < 85;
        const content = cell.map((text, i) => <p key={i}>{text}</p>);
        return isHeader ? <th key={ci} scope="col">{content}</th> : <td key={ci}>{content}</td>;
      })}</tr>)}</tbody></table>
    </div>;
  }
  if (block.kind === 'definition' && 'term' in block && 'text' in block) return <dl className={styles.definitions}><div><dt>{block.term}</dt><dd>{block.text}</dd></div></dl>;
  if (block.kind === 'heading' && 'text' in block) return <h3>{block.text}</h3>;
  if (block.kind === 'list' && 'items' in block) return <ul>{block.items?.map((item, i) => <li key={i}>{item}</li>)}</ul>;
  return 'text' in block ? <p>{block.text}</p> : null;
}

function Figure({ figure }: { figure: Guide['figures'][number] }) {
  return <figure className={styles.figure}>
    <figcaption>{figure.title}</figcaption>
    {figure.kind === 'flow' ? <ol className={styles.flow}>{figure.rows.map((row, i) => <li key={i}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{row[0]}</li>)}</ol>
      : figure.kind === 'matrix' ? <div className={styles.tableScroll} tabIndex={0} role="region" aria-label={`${figure.title}: scrollable matrix`}><table><caption className={styles.srOnly}>{figure.title}</caption><thead><tr>{figure.headers.map((h) => <th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{figure.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th scope="row" key={j}>{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>
        : <dl className={styles.definitions}>{figure.rows.map((row, i) => <div key={i}><dt>{row[0]}</dt><dd>{row[1]}</dd></div>)}</dl>}
    {figure.note && <p className={styles.figureNote}>{figure.note}</p>}
  </figure>;
}

const references: Record<string, { title: string; url: string }> = {
  'portfolio-bcg': { title: 'BCG: the growth–share matrix', url: 'https://www.bcg.com/about/overview/our-history/growth-share-matrix' },
  'eos-operating-system': { title: 'EOS Worldwide: the six components', url: 'https://www.eosworldwide.com/eos-model' },
  'blue-ocean': { title: 'Blue Ocean Strategy: the four actions framework', url: 'https://www.blueoceanstrategy.com/tools/four-actions-framework/' },
  'change-kotter': { title: 'Kotter: the eight-step process and its evolution', url: 'https://www.kotterinc.com/methodology/8-steps/' },
};

export function BusinessGuide({ article, articles }: { article: KnowledgeArticle; articles: KnowledgeArticle[] }) {
  const isHub = article.slug === 'business-management';
  const guide = guides.find((item) => item.slug === article.slug);
  if (!isHub && !guide) throw new Error(`Missing business guide: ${article.slug}`);
  const related = guide?.related.map((slug) => articles.find((item) => item.slug === slug)).filter((item) => item !== undefined) ?? [];
  const reference = references[article.slug];
  return <article className={`shell ${styles.page}`}>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/library/">Library</Link><span aria-hidden="true">/</span>{isHub ? <span>Business &amp; Management</span> : <><Link href={hubPath}>Business &amp; Management</Link><span aria-hidden="true">/</span><span>{article.group}</span></>}</nav>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>{isHub ? 'A BUSINESS & MANAGEMENT KNOWLEDGE HUB' : article.group}</p>
      <h1>{article.title}</h1><p className={styles.summary}>{article.summary}</p>
      {guide && <p className={styles.takeaway}><strong>Key takeaway</strong>{guide.takeaway}</p>}
      {isHub && <p className={styles.meta}>{guides.length} guides · 8 connected sections · detailed notes and visual explanations</p>}
    </header>
    {isHub ? <>
      <section className={styles.start}><h2>Start with the decision you need to make</h2><ol className={styles.journey}>
        <li><strong>Understand the situation</strong><Link href="/library/knowledge/strategic-audit/">Audit the business</Link><Link href="/library/knowledge/pestle-analysis/">Read the environment</Link><Link href="/library/knowledge/five-forces/">Assess industry pressures</Link></li>
        <li><strong>Choose a direction</strong><Link href="/library/knowledge/competitive-positioning/">Choose a competitive position</Link><Link href="/library/knowledge/growth-ansoff/">Explore growth options</Link><Link href="/library/knowledge/strategy-evaluation/">Evaluate the choices</Link></li>
        <li><strong>Make it happen</strong><Link href="/library/knowledge/change-kotter/">Build support for change</Link><Link href="/library/knowledge/balanced-scorecard/">Define measures</Link><Link href="/library/knowledge/okr-goals/">Turn goals into outcomes</Link></li>
      </ol></section>
      <nav className={styles.jumpLinks} aria-label="Business categories">{groups.map(([name], i) => <a key={name} href={`#category-${i + 1}`}>{name}</a>)}</nav>
      {groups.map(([name, description], i) => <section className={styles.category} id={`category-${i + 1}`} key={name}><p className={styles.eyebrow}>EXPLORE {String(i + 1).padStart(2, '0')}</p><h2>{name}</h2><p>{description}</p><div className={styles.cards}>{guides.filter((g) => g.group === name).map((g) => <Link className={styles.card} href={`/library/knowledge/${g.slug}/`} key={g.slug}><h3>{g.title}</h3><p>{g.summary}</p><strong>Explore guide →</strong></Link>)}</div></section>)}
      <aside className={styles.editorial}><h2>How to read this collection</h2><p>These guides organize a supplied management-study collection. Detailed prompts, examples and checklists accompany the summaries. Original diagram content is rebuilt as readable comparisons and steps.</p><p>Historical company examples are identified as teaching material. Incomplete entries, conflicting labels and unavailable diagram content are disclosed on the relevant pages. A rendering-error image contains no recoverable strategy-canvas data.</p><p>For related material, explore <Link href="/library/knowledge/ai-business-scenarios/">business analytics and scenario planning</Link> and <Link href="/library/knowledge/ai-adoption-operating-model/">adopting AI</Link>.</p></aside>
    </> : guide && <>
      <section className={styles.overview} aria-labelledby="overview-heading"><h2 id="overview-heading">At a glance</h2><ol className={styles.flow}>{guide.steps.map((step, i) => <li key={step}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{step}</li>)}</ol><p className={styles.meta}>An editorial reading sequence; individual frameworks are explained in the detailed notes below.</p></section>
      <div className={styles.layout}>
        <nav className={styles.contents} aria-label="On this page"><strong>On this page</strong><ol>{guide.figures.length > 0 && <li><a href="#visual-explanations">Visual explanations</a></li>}{guide.notes.length > 0 && <li><a href="#reading-notes">Reading notes &amp; limitations</a></li>}{guide.sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.heading}</a></li>)}<li><a href="#related">Continue exploring</a></li></ol></nav>
        <div className={styles.body}>
          {guide.figures.length > 0 && <section id="visual-explanations"><h2>Visual explanations</h2>{guide.figures.map((f) => <Figure key={f.image} figure={f} />)}</section>}
          {guide.notes.length > 0 && <aside className={styles.editorial} id="reading-notes"><h2>Reading notes &amp; limitations</h2><ul>{guide.notes.map((note) => <li key={note}>{note}</li>)}</ul></aside>}
          {guide.sections.map((s) => <section className={styles.detail} id={s.id} key={s.id}><h2>{s.heading}</h2>{s.blocks.map((block, i) => <DetailBlock key={i} block={block} caption={s.heading} />)}</section>)}
          <section id="related" className={styles.related}><h2>Continue exploring</h2><ul>{related.map((item) => <li key={item.slug}><Link href={`/library/knowledge/${item.slug}/`}>{item.title}</Link></li>)}</ul><Link href={hubPath}>Browse all Business &amp; Management guides →</Link></section>
          <footer className={styles.provenance}><h2>About these notes</h2><p>Adapted from the supplied management-study collection. Detailed source statements are retained for study; historical examples and unsupported claims should be read with the limitations above. Introductions, reading sequences and recreated visuals are editorial additions.</p><p>Original documents, paragraph mappings and image provenance are retained in the editorial archive. Missing source detail is identified rather than filled with invented material.</p>{reference && <p>Further reading: <a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title} ↗</a></p>}</footer>
        </div>
      </div>
    </>}
  </article>;
}
