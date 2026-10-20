import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteLink as Link } from '@insightginie/ui';
import { siteIsIndexable } from '@insightginie/seo';
import { catalog, type Idea } from '../../../lib/opportunities';
import { CatalogUnavailable } from '../../../components/opportunity-navigation';
import styles from '../../../components/opportunities.module.css';
async function ideaFor(id: string) {
  const data = await catalog<{ items: Idea[] }>('/v1/ideas');
  return { data, idea: data?.items.find((item) => item.id === id) };
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { idea } = await ideaFor(id);
  return {
    title: idea ? `${idea.title}: a business experiment` : 'Business experiment',
    description: idea?.description,
    alternates: { canonical: `/ideas/${id}/` },
    robots: { index: Boolean(idea) && siteIsIndexable(), follow: true },
  };
}
export default async function IdeaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, idea } = await ideaFor(id);
  if (!data)
    return (
      <div className={`shell ${styles.page}`}>
        <CatalogUnavailable />
      </div>
    );
  if (!idea) notFound();
  return (
    <div className={`shell ${styles.page}`}>
      <article className={styles.detail}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/ideas/">Idea lab</Link> / {idea.category}
        </nav>
        <span className={styles.eyebrow}>{idea.category} · Unvalidated concept</span>
        <h1>{idea.title}</h1>
        <p>{idea.description}</p>
        <aside className={styles.notice}>{idea.caveat}</aside>
        <h2>Who might buy it?</h2>
        <p>{idea.buyer}. This is a customer hypothesis to test, not evidence of existing demand.</p>
        <h2>Your first experiment</h2>
        <p>{idea.experiment}</p>
        <h2>How you could deliver it</h2>
        <p>{idea.delivery}</p>
        <h2>What you bring</h2>
        <p>{idea.startup}</p>
        <div className={styles.tags}>
          {idea.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
        <h2>What would make it worth continuing?</h2>
        <p>
          A real customer paying for a clearly scoped delivery is stronger evidence than compliments
          or social likes. Record your time, direct costs, revisions and customer feedback. Repeat
          the experiment before spending on a larger product.
        </p>
        <h2>What could go wrong?</h2>
        <p>
          Customers may not value the offer enough to pay. Delivery or acquisition may take longer
          than expected. Check rights to supplied materials, be clear about scope and avoid
          promising an outcome you cannot control.
        </p>
        <p>
          <Link className={styles.primary} href="/opportunities/">
            Explore existing paid roles →
          </Link>
        </p>
        <p>
          <Link href="/ideas/">← More ideas to test</Link>
        </p>
      </article>
    </div>
  );
}
