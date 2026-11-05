import { notFound } from 'next/navigation';
import { getKnowledgeArticles } from '../../../../lib/library';
import styles from '../../library.module.css';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = (await getKnowledgeArticles()).find((item) => item.slug === slug);
  return article ? { title: article.title, description: article.summary, alternates: { canonical: `/library/knowledge/${article.slug}/` } } : {};
}

export default async function KnowledgePage({ params }: Props) {
  const { slug } = await params;
  const articles = await getKnowledgeArticles();
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();
  const related = articles.filter((item) => item.slug !== slug && item.topic === article.topic && item.group === article.group).slice(0, 3);
  return <article className={`shell ${styles.article}`}>
    <a href="/library/" className={styles.back}>← Back to Library</a>
    <header><div className={styles.eyebrow}>{article.topic} · {article.group}</div><h1>{article.title}</h1><p className={styles.articleSummary}>{article.summary}</p></header>
    <p className={styles.note}>Adapted from the knowledge collection. Educational information; verify changing details before making decisions.</p>
    <nav className={styles.contents} aria-label="On this page"><strong>On this page</strong><ol>{article.sections.map((section, index) => <li key={section.heading}><a href={`#section-${index + 1}`}>{section.heading}</a></li>)}</ol></nav>
    {article.sections.map((section, index) => <section key={section.heading} id={`section-${index + 1}`}><h2>{section.heading}</h2><p>{section.body}</p></section>)}
    {related.length > 0 && <section><h2>Related knowledge</h2><ul>{related.map((item) => <li key={item.slug}><a href={`/library/knowledge/${item.slug}/`}>{item.title}</a></li>)}</ul></section>}
    {article.relatedToolCategory && <section><h2>Related tools</h2><a href={`/library/?tools=${encodeURIComponent(article.relatedToolCategory)}#tools-heading`}>Explore {article.relatedToolCategory} tools →</a></section>}
    <section><h2>Further reading</h2><ul>{article.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a></li>)}</ul></section>
  </article>;
}
