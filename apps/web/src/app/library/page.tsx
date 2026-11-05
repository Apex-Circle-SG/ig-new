import type { Metadata } from 'next';
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

export default async function LibraryPage() {
  const [tools, articles] = await Promise.all([getLibraryTools(), getKnowledgeArticles()]);
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
      <KnowledgeList articles={articles} />
      <LibraryDirectory tools={tools} />
    </main>
  );
}
