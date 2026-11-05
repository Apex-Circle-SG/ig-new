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
      <Link href="/library/knowledge/ai-learning-hub/" className={styles.aiFeature}>
        <div><span className={styles.eyebrow}>FEATURED LEARNING HUB</span><h2>Make sense of AI<span>.</span></h2><p>Explore the ideas, mathematics and practical decisions behind AI, one clear guide at a time.</p><strong>Explore the AI learning hub →</strong></div><div className={styles.aiFeatureMark} aria-hidden="true">✳</div>
      </Link>
      <Link href="/library/knowledge/business-management/" className={styles.aiFeature}>
        <div><span className={styles.eyebrow}>BUSINESS &amp; MANAGEMENT</span><h2>From insight to action<span>.</span></h2><p>Explore strategy, competition, leadership and negotiation, with detailed notes and visual explanations.</p><strong>Explore the Business &amp; Management hub →</strong></div><div className={styles.aiFeatureMark} aria-hidden="true">↗</div>
      </Link>
      <KnowledgeList articles={articles} />
      <LibraryDirectory tools={tools} initialCategory={params.tools} />
    </main>
  );
}
