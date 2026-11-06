import type { Metadata } from 'next';
import Link from 'next/link';
import { getKnowledgeArticles, getLibraryTools } from '../../lib/library';
import { KnowledgeList } from './knowledge-list';
import { LibraryDirectory } from './directory';
import styles from './library.module.css';

export const metadata: Metadata = {
  title: 'Library | InsightGinie',
  description: 'Explore a growing collection of tools and knowledge for work, business, finance and more.',
  alternates: { canonical: '/library/' },
};

export const dynamic = 'force-dynamic';

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ tools?: string }> }) {
  const [tools, articles, params] = await Promise.all([getLibraryTools(), getKnowledgeArticles(), searchParams]);
  return (
    <main className={`shell ${styles.page}`}>
      <header className={styles.hero}>
        <div className={styles.eyebrow}>THE INSIGHTGINIE LIBRARY</div>
        <h1>Good ideas deserve<br />a place to grow<span>.</span></h1>
        <p>A growing collection of useful knowledge and tools for making, managing and understanding more.</p>
        <div className={styles.heroStats}><strong>{tools.length} tools</strong><span>Across {new Set(tools.map((tool) => tool.category)).size} topics</span><span>{articles.length} knowledge articles</span></div>
      </header>
      <section className={styles.intro} aria-labelledby="explore-heading">
        <div><div className={styles.eyebrow}>EXPLORE THE LIBRARY</div><h2 id="explore-heading">A little something for every curious mind.</h2></div>
        <p>Explore knowledge and practical resources. More topics will join the library as the collection grows.</p>
      </section>
      <section className={styles.hubs} aria-labelledby="learning-hubs-heading"><h2 id="learning-hubs-heading">Choose a learning hub</h2><div className={styles.grid}>{['ai-learning-hub', 'business-management', 'finance-accounting', 'communication-personal-development', 'project-management', 'process-improvement', 'problem-solving', 'beliefs-mysteries'].map((slug) => {
        const hub = articles.find((article) => article.slug === slug);
        return hub && <Link className={styles.knowledgeCard} href={`/library/knowledge/${hub.slug}/`} key={hub.slug}><span>{hub.topic}</span><h3>{hub.title}</h3><p>{hub.summary}</p><strong>Explore collection →</strong></Link>;
      })}</div></section>
      <KnowledgeList articles={articles} />
      <LibraryDirectory tools={tools} initialCategory={params.tools} />
    </main>
  );
}
