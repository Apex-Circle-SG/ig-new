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
  const article = (await getKnowledgeArticles()).find((item) => item.slug === slug);
  if (!article) notFound();
  return <article className={`shell ${styles.article}`}>
    <a href="/library/" className={styles.back}>← Back to Library</a>
    <header><div className={styles.eyebrow}>{article.topic} · {article.group}</div><h1>{article.title}</h1><p className={styles.articleSummary}>{article.summary}</p></header>
    <p className={styles.note}>Adapted from the Web3 knowledge collection. Educational information; verify changing details before making decisions.</p>
    {article.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2><p>{section.body}</p></section>)}
    <section><h2>Further reading</h2><ul>{article.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a></li>)}</ul></section>
  </article>;
}
