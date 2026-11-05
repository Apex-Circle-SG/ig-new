import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getKnowledgeArticles } from '../../../../lib/library';
import styles from '../../library.module.css';
import { SecurityQuestions } from './security-questions';

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
    {article.slug === 'cybersecurity' && <section><h2>Explore cybersecurity</h2><ul><li><Link href="/library/knowledge/cyber-attacks/">Common cyberattacks</Link></li><li><Link href="/library/knowledge/network-spoofing/">Network interception and spoofing</Link></li><li><Link href="/library/knowledge/security-controls/">Security controls and operations</Link></li><li><Link href="/library/knowledge/security-questionnaire/">Security assessment questionnaire</Link></li></ul></section>}
    {article.slug === 'security-questionnaire' && <SecurityQuestions />}
    {article.topic === 'Cybersecurity' && article.slug !== 'cybersecurity' && <p><Link href="/library/knowledge/cybersecurity/">Explore the cybersecurity hub →</Link></p>}
    {article.slug === 'network-spoofing' && <p><Link href="/library/knowledge/networking-osi/">Read the networking and OSI guide →</Link></p>}
    {article.slug === 'security-controls' && <p><Link href="/library/knowledge/api-fundamentals/">Read the API fundamentals guide →</Link></p>}
    {related.length > 0 && <section><h2>Related knowledge</h2><ul>{related.map((item) => <li key={item.slug}><a href={`/library/knowledge/${item.slug}/`}>{item.title}</a></li>)}</ul></section>}
    {article.relatedToolCategory && <section><h2>Related tools</h2><a href={`/library/?tools=${encodeURIComponent(article.relatedToolCategory)}#tools-heading`}>Explore {article.relatedToolCategory} tools →</a></section>}
    <section><h2>Further reading</h2><ul>{article.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a></li>)}</ul></section>
  </article>;
}
